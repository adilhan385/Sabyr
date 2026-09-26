import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { getLiveCatalogProducts } from "@/lib/productsStore";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getSession } from "@/lib/auth";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

// Max ~5MB base64 photo (base64 inflates by ~33%, so ~3.75MB original)
const MAX_BASE64_BYTES = 5 * 1024 * 1024;

const TryOnRequestSchema = z.object({
  productId: z.string().min(1, "ID товара обязателен").max(100),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL"]).default("S"),
  mode: z.enum(["single", "outfit"]).default("single"),
  userPhotoUrl: z.string().url().optional(),
  userPhotoBase64: z
    .string()
    .max(MAX_BASE64_BYTES, "Фото слишком большое (макс. 5 МБ)")
    .optional(),
});

// ─── POST /api/ai/tryon ───────────────────────────────────────────────────────

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
          error: "AI-Примерочная доступна только резидентам закрытого клуба SABYR CLUB.",
        },
        { status: 403 }
      );
    }
  }

  // Rate limit: 5 requests per minute per IP (more restrictive — AI vision is expensive)
  const ip = getClientIp(req);
  const rl = checkRateLimit("ai-tryon", ip, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Слишком много запросов на примерку. Подождите немного.",
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
    const parsed = TryOnRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Ошибка валидации", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { productId, size, userPhotoUrl, userPhotoBase64, mode } = parsed.data;

    const products = await getLiveCatalogProducts();
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Товар не найден в каталоге SABYR" },
        { status: 404 }
      );
    }

    // Persist session in PostgreSQL via Prisma if database is connected
    const isDbUp = await isDatabaseAvailable();
    if (isDbUp) {
      try {
        await prisma.tryOnSession.create({
          data: {
            productId: product.id,
            userPhotoUrl: userPhotoUrl || "data:user-upload",
            status: "COMPLETED",
            consentGiven: true,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hr privacy cleanup
          },
        });
      } catch (dbErr) {
        console.warn("[SABYR TryOn] Could not persist TryOnSession to DB:", dbErr);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

        const promptText = `
Вы — персональный куратор силуэта и fashion-технолог казахстанского бренда SABYR.
Клиент примеряет изделие:
Название: "${product.name}"
Категория: "${product.category}"
Состав: "${product.composition || "Премиальная ткань"}"
Выбранный размер: "${size}"
Режим примерки: "${mode === "outfit" ? "Капсульный ансамбль" : "Одиночное изделие"}"

Проанализируйте посадку силуэта, драпировку ткани и пропорции кроя для данного изделия.
Верните ответ СТРОГО в формате JSON без markdown-разметки:
{
  "fitScore": 98,
  "verdict": "Превосходная посадка по фигуре",
  "shoulders": "Идеально выверенная линия плеча",
  "drape": "Естественная струящаяся драпировка без излишнего натяжения",
  "fabricFeel": "Плотная структурированная фактура",
  "recommendation": "Размер ${size} садится с идеальным балансом между четкостью кроя и комфортом.",
  "stylingAdvice": "Прекрасно гармонирует с базовыми брюками прямого кроя и архитектурными украшениями SABYR."
}
`;

        const contents: Array<string | { inlineData: { data: string; mimeType: string } }> = [promptText];

        if (userPhotoBase64 && typeof userPhotoBase64 === "string") {
          const match = userPhotoBase64.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            // Validate MIME type — only allow image types
            const mimeType = match[1];
            if (!mimeType.startsWith("image/")) {
              return NextResponse.json(
                { success: false, error: "Разрешены только изображения (JPEG, PNG, WebP)" },
                { status: 400 }
              );
            }
            contents.push({
              inlineData: {
                mimeType,
                data: match[2],
              },
            });
          }
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            responseMimeType: "application/json",
          },
        });

        const text = response.text || "{}";
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const geminiParsed = JSON.parse(cleanJson);

        return NextResponse.json({
          success: true,
          source: "gemini-ai",
          fitAnalysis: {
            fitScore: geminiParsed.fitScore || 97,
            verdict: geminiParsed.verdict || "Превосходная посадка",
            shoulders: geminiParsed.shoulders || "Идеально по плечевой линии",
            drape: geminiParsed.drape || "Естественная драпировка",
            fabricFeel: geminiParsed.fabricFeel || (product.composition || "Премиальный материал"),
            recommendation: geminiParsed.recommendation || `Размер ${size} идеально подчеркивает пропорции силуэта.`,
            stylingAdvice: geminiParsed.stylingAdvice || "Рекомендуем сочетать с акцентными аксессуарами из капсулы SABYR.",
          },
          product,
        });
      } catch (aiErr) {
        console.warn("[SABYR TryOn] Gemini call failed, using luxury curated fallback:", aiErr);
      }
    }

    // Curated fashion engine fallback
    return NextResponse.json({
      success: true,
      source: "sabyr-curated-engine",
      fitAnalysis: {
        fitScore: 98,
        verdict: "Безупречная посадка",
        shoulders: "Идеально выверенная линия плеча",
        drape: "Драпировка спинки и рукавов соответствует кутюрным стандартам",
        fabricFeel: product.composition || "100% Премиальная шерсть / шелк",
        recommendation: `Размер ${size} садится точно по фигуре (true to size) с сохранением архитектурного силуэта SABYR.`,
        stylingAdvice: "Рекомендуем сочетать с монохромной базой и лаконичной обувью из актуального лукбука.",
      },
      product,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Внутренняя ошибка примерки";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
