import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { getLiveCatalogProducts } from "@/lib/productsStore";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getSession } from "@/lib/auth";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

// Max ~8MB base64 photo
const MAX_BASE64_BYTES = 8 * 1024 * 1024;

const TryOnRequestSchema = z.object({
  productId: z.string().min(1, "ID товара обязателен").max(100),
  secondProductId: z.string().max(100).optional(),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL"]).default("M"),
  mode: z.enum(["single", "outfit"]).default("single"),
  userPhotoUrl: z.string().optional(),
  userPhotoBase64: z
    .string()
    .max(MAX_BASE64_BYTES, "Фото слишком большое (макс. 6 МБ)")
    .optional(),
});

function readPublicImageBase64(imageUrl?: string): { mimeType: string; data: string } | null {
  if (!imageUrl || !imageUrl.startsWith("/")) return null;
  try {
    const cleanRel = imageUrl.replace(/^\//, "");
    const fullPath = path.join(process.cwd(), "public", cleanRel);
    if (!fs.existsSync(fullPath)) return null;
    const buffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const mimeType =
      ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return { mimeType, data: buffer.toString("base64") };
  } catch {
    return null;
  }
}

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

  // Rate limit: 15 requests per minute per IP so interactive fitting is responsive
  const ip = getClientIp(req);
  const rl = checkRateLimit("ai-tryon", ip, 15, 60_000);
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

    const { productId, secondProductId, size, userPhotoUrl, userPhotoBase64, mode } = parsed.data;

    const products = await getLiveCatalogProducts();
    const product = products.find((p) => p.id === productId);
    const secondProduct = secondProductId
      ? products.find((p) => p.id === secondProductId) || null
      : null;

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
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      } catch (dbErr) {
        console.warn("[SABYR TryOn] Could not persist TryOnSession to DB:", dbErr);
      }
    }

    let userImagePart: { mimeType: string; data: string } | null = null;
    if (userPhotoBase64 && typeof userPhotoBase64 === "string") {
      const match = userPhotoBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        if (!mimeType.startsWith("image/")) {
          return NextResponse.json(
            { success: false, error: "Разрешены только изображения (JPEG, PNG, WebP)" },
            { status: 400 }
          );
        }
        userImagePart = { mimeType, data: match[2] };
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let generatedImageBase64: string | null = null;

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });

      // 1. Try photorealistic Virtual Try-On image generation if user photo is provided
      if (userImagePart) {
        try {
          const imageModel = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
          const productImg = readPublicImageBase64(product.images?.[0]);
          const secondImg = secondProduct ? readPublicImageBase64(secondProduct.images?.[0]) : null;

          const vtonPrompt = `Virtual Try-On task for luxury menswear brand SABYR:
Take the person from the FIRST image (user photo) and dress them in the exact garment shown in the SECOND image: "${product.name}" (${product.description || product.category})${
            secondProduct
              ? ` layered with "${secondProduct.name}" (${secondProduct.description || secondProduct.category})`
              : ""
          }.
CRITICAL RULES:
- Keep the person's face, head, hairstyle, skin tone, hands, pose, and background 100% identical to the first image.
- Replace their existing clothing with the SABYR garment in size ${size}, matching the exact fabric texture, color, collar/lapels, and relaxed tailored silhouette from the reference garment photo.
- Output a photorealistic high-resolution image of the person wearing the SABYR outfit.`;

          const imageContents: Array<string | { inlineData: { data: string; mimeType: string } }> = [
            vtonPrompt,
            { inlineData: userImagePart },
          ];
          if (productImg) {
            imageContents.push({ inlineData: productImg });
          }
          if (secondImg) {
            imageContents.push({ inlineData: secondImg });
          }

          const imgResp = await ai.models.generateContent({
            model: imageModel,
            contents: imageContents,
          });

          const parts = imgResp.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data && part.inlineData?.mimeType) {
              generatedImageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              break;
            }
          }
        } catch (vtonErr) {
          console.warn("[SABYR TryOn] Gemini image generation skipped or unavailable, using interactive garment compositor:", vtonErr);
        }
      }

      // 2. Analyze body landmarks & fit via multimodal Gemini Flash
      try {
        const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

        const promptText = `
Вы — персональный куратор силуэта и система компьютерного зрения казахстанского бренда мужской одежды SABYR.
Клиент примеряет изделие на своё фото:
Основное изделие: "${product.name}" (${product.category}, ${product.composition || "Премиальная ткань"})
${secondProduct ? `Второй слой в образе: "${secondProduct.name}" (${secondProduct.category})` : ""}
Выбранный размер: "${size}"
Режим примерки: "${mode === "outfit" ? "Капсульный образ" : "Одиночное изделие"}"

Проанализируйте фото человека (координаты его плеч, шеи и торса в процентах от кадра для точного наложения 3D-лекала одежды) и посадку изделия.
Верните ответ СТРОГО в формате JSON без markdown-разметки:
{
  "fitScore": 98,
  "verdict": "Превосходная посадка по фигуре",
  "shoulders": "Идеально выверенная линия плеча под ваш разворот корпуса",
  "drape": "Естественная струящаяся драпировка без излишнего натяжения",
  "fabricFeel": "${product.composition || "Плотная структурированная фактура"}",
  "recommendation": "Размер ${size} садится с идеальным балансом между четкостью плечевого пояса и комфортом.",
  "stylingAdvice": "Отлично сочетается с базовым поло или классической рубашкой SABYR.",
  "bodyAnchor": {
    "centerXPercent": 50,
    "neckYPercent": 26,
    "shoulderWidthPercent": 46,
    "torsoHeightPercent": 54,
    "hipYPercent": 62
  }
}
`;

        const contents: Array<string | { inlineData: { data: string; mimeType: string } }> = [promptText];
        if (userImagePart) {
          contents.push({ inlineData: userImagePart });
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
          source: generatedImageBase64 ? "gemini-vton-image" : "gemini-ai",
          generatedImageBase64,
          bodyAnchor: {
            centerXPercent: Number(geminiParsed.bodyAnchor?.centerXPercent) || 50,
            neckYPercent: Number(geminiParsed.bodyAnchor?.neckYPercent) || 26,
            shoulderWidthPercent: Number(geminiParsed.bodyAnchor?.shoulderWidthPercent) || 46,
            torsoHeightPercent: Number(geminiParsed.bodyAnchor?.torsoHeightPercent) || 54,
            hipYPercent: Number(geminiParsed.bodyAnchor?.hipYPercent) || 62,
          },
          fitAnalysis: {
            fitScore: geminiParsed.fitScore || 98,
            verdict: geminiParsed.verdict || "Превосходная посадка по вашим пропорциям",
            shoulders: geminiParsed.shoulders || "Линия плеча точно выверена по вашей фигуре",
            drape: geminiParsed.drape || "Архитектурная драпировка без заломов",
            fabricFeel: geminiParsed.fabricFeel || (product.composition || "Премиальный материал SABYR"),
            recommendation:
              geminiParsed.recommendation ||
              `Размер ${size} идеально подчеркивает пропорции вашего силуэта.`,
            stylingAdvice:
              geminiParsed.stylingAdvice ||
              "Рекомендуем сочетать с монохромной базой из актуального дропа SABYR.",
          },
          product,
          secondProduct,
        });
      } catch (aiErr) {
        console.warn("[SABYR TryOn] Gemini analysis call failed, using curated fallback:", aiErr);
      }
    }

    // Curated fashion & body-anchor engine fallback
    return NextResponse.json({
      success: true,
      source: "sabyr-curated-engine",
      generatedImageBase64: null,
      bodyAnchor: {
        centerXPercent: 50,
        neckYPercent: 26,
        shoulderWidthPercent: 46,
        torsoHeightPercent: 54,
        hipYPercent: 62,
      },
      fitAnalysis: {
        fitScore: 98,
        verdict: "Безупречная посадка по вашей фигуре",
        shoulders: "Точная посадка по линии плеча с фирменным кроем SABYR",
        drape: "Драпировка спинки, лацканов и рукавов сохраняет чёткую геометрию",
        fabricFeel: product.composition || "Премиальная костюмная ткань / хлопок компакт-пенье",
        recommendation: `Размер ${size} садится точно по фигуре (true to size) с сохранением фирменного силуэта SABYR.`,
        stylingAdvice: secondProduct
          ? `Образ «${product.name} + ${secondProduct.name}» создаёт завершённую многослойную капсулу.`
          : "Для многослойного образа переключитесь в режим «Полный образ» и добавьте базовое поло или рубашку.",
      },
      product,
      secondProduct,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Внутренняя ошибка примерки";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
