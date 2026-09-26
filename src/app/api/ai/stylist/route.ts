import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { getLiveCatalogProducts } from "@/lib/productsStore";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getSession } from "@/lib/auth";

import { prisma, isDatabaseAvailable } from "@/lib/db";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const StylistRequestSchema = z.object({
  occasion: z.string().max(100).optional(),
  style: z.string().max(100).optional(),
  palette: z.string().max(100).optional(),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL"]).optional(),
  query: z.string().max(500).optional(),
});

// ─── POST /api/ai/stylist ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let requireClub = true;
  try {
    if (await isDatabaseAvailable()) {
      const setting = await prisma.clubSettings.findUnique({ where: { key: "ai_club_only" } });
      if (setting && setting.value === "false") {
        requireClub = false;
      }
    }
  } catch {
    // default to true
  }

  // Exclusive to SABYR CLUB members and Admins
  if (requireClub) {
    const session = await getSession(req);
    if (!session || (!session.user.isClubMember && session.user.role !== "ADMIN")) {
      return NextResponse.json(
        {
          success: false,
          error: "AI-Стилист и AI-Подбор доступны только резидентам закрытого клуба SABYR CLUB.",
        },
        { status: 403 }
      );
    }
  }

  // Rate limit: 10 requests per minute per IP
  const ip = getClientIp(req);
  const rl = checkRateLimit("ai-stylist", ip, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Слишком много запросов. Пожалуйста, подождите немного.",
        resetMs: rl.resetMs,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rl.resetMs),
          "Retry-After": String(Math.ceil((rl.resetMs - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const parsed = StylistRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Ошибка валидации", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { occasion, style, palette, size, query } = parsed.data;

    const apiKey = process.env.GEMINI_API_KEY;

    // Load live catalog database (including items added by admin)
    const allProducts = await getLiveCatalogProducts();
    const availableCatalog = allProducts.filter((p) =>
      p.variants.some((v) => v.stock > 0)
    );

    if (!apiKey) {
      // Graceful intelligent fallback when no Gemini key is set yet
      let matching = availableCatalog.slice(0, 3);
      if (occasion === "wedding" || occasion === "party") {
        matching = availableCatalog.filter(
          (p) =>
            p.occasionTags.some((t) => t.toLowerCase().includes("свадьб") || t.toLowerCase().includes("вечер")) ||
            p.category === "Платья"
        );
      } else if (occasion === "business" || occasion === "interview") {
        matching = availableCatalog.filter(
          (p) =>
            p.occasionTags.some((t) => t.toLowerCase().includes("дел") || t.toLowerCase().includes("офис")) ||
            p.category.includes("Пиджаки")
        );
      }

      if (matching.length === 0) matching = availableCatalog.slice(0, 3);

      return NextResponse.json({
        success: true,
        source: "sabyr-curated-engine",
        items: matching,
        rationale:
          "Образ составлен куратором SABYR с акцентом на архитектурный крой и премиальные пропорции силуэта. Все изделия в наличии в каталоге.",
      });
    }

    // Call Gemini API via @google/genai
    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const catalogPrompt = availableCatalog.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      description: p.aiDescription || p.description,
      occasions: p.occasionTags,
      styles: p.styleTags,
    }));

    const prompt = `
Вы — персональный VIP-стилист премиального казахстанского fashion-бренда SABYR.
Клиент ищет образ для: "${occasion || "любое событие"}".
Желаемый стиль: "${style || "любой"}".
Цветовая палитра: "${palette || "любая"}".
Размер: "${size || "любой"}".
Дополнительные пожелания клиента: "${query || "нет"}".

ВАЖНЕЙШЕЕ ПРАВИЛО: Вы должны выбрать от 2 до 4 товаров ИСКЛЮЧИТЕЛЬНО из следующего каталога SABYR (используйте только точные id):
${JSON.stringify(catalogPrompt, null, 2)}

Верните ответ СТРОГО в формате JSON без markdown-разметки:
{
  "selectedProductIds": ["id1", "id2"],
  "rationale": "Краткое экспертное объяснение стилиста на русском языке, почему именно эти вещи идеально дополняют друг друга и подходят под запрос клиента."
}
`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const geminiParsed = JSON.parse(cleanJson);

    const selectedIds: string[] = Array.isArray(geminiParsed.selectedProductIds)
      ? geminiParsed.selectedProductIds
      : [];

    const selectedProducts = availableCatalog.filter((p) =>
      selectedIds.includes(p.id)
    );

    return NextResponse.json({
      success: true,
      source: "gemini-ai",
      items: selectedProducts.length > 0 ? selectedProducts : availableCatalog.slice(0, 3),
      rationale: geminiParsed.rationale || "Эксклюзивный капсульный ансамбль SABYR, подобранный по вашим критериям.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка генерации образа";
    console.error("[SABYR AI Stylist Error]:", error);
    const fallbackProducts = await getLiveCatalogProducts();
    return NextResponse.json({
      success: false,
      error: message,
      items: fallbackProducts.slice(0, 3),
      rationale: "Подобрана базовая капсула из бестселлеров SABYR.",
    });
  }
}
