import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { getLiveCatalogProducts } from "@/lib/productsStore";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getSession } from "@/lib/auth";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import { ProductItem } from "@/data/products";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const MAX_BASE64_BYTES = 8 * 1024 * 1024;

const StylistRequestSchema = z.object({
  userPhotoBase64: z.string().max(MAX_BASE64_BYTES, "Фото слишком большое").optional(),
  photoMetrics: z
    .object({
      brightness: z.number().optional(),
      contrast: z.number().optional(),
      warmth: z.number().optional(),
    })
    .optional(),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL"]).optional(),
  occasion: z.string().max(100).optional(),
  style: z.string().max(100).optional(),
  palette: z.string().max(100).optional(),
  query: z.string().max(500).optional(),
});

export interface CuratedOutfit {
  id: string;
  rank: number;
  title: string;
  badge: string;
  matchScore: number;
  rationale: string;
  stylingTip: string;
  items: ProductItem[];
}

function buildCuratedTopOutfits(
  catalog: ProductItem[],
  metrics?: { brightness?: number; contrast?: number; warmth?: number }
) {
  const byId = (id: string) => catalog.find((p) => p.id === id);
  const byCategory = (cat: string) =>
    catalog.find((p) => p.category.toLowerCase().includes(cat.toLowerCase()));

  const blackSuit = byId("sabyr-1") || byCategory("костюм") || catalog[0];
  const greySuit = byId("sabyr-2") || catalog[1] || catalog[0];
  const zipSet = byId("sabyr-3") || byCategory("комплект") || catalog[2] || catalog[0];
  const lightSuit = byId("sabyr-4") || catalog[3] || catalog[0];
  const whitePolo = byId("sabyr-5") || byCategory("футболк") || catalog[4] || catalog[0];
  const printTee = byId("sabyr-6") || catalog[5] || whitePolo;
  const whiteShirt = byId("sabyr-7") || byCategory("рубашк") || catalog[6] || whitePolo;
  const widePants = byId("sabyr-8") || byCategory("брюк") || catalog[7] || catalog[0];

  const isWarmLight = (metrics?.warmth ?? 12) > 18 && (metrics?.brightness ?? 120) > 135;
  const isHighContrast = (metrics?.contrast ?? 48) >= 45;

  const appearanceProfile = {
    colorType: isWarmLight
      ? "Тёплый благородный типаж (Warm Cashmere & Stone)"
      : isHighContrast
      ? "Выразительный контрастный типаж (Deep Onyx & Graphite)"
      : "Сбалансированный универсальный типаж (Architectural Neutral)",
    contrastLevel: isHighContrast
      ? "Высокий контраст внешности — идеально держит чёткие чёрные и белоснежные линии"
      : "Мягкий благородный контраст — превосходно раскрывается в графитовых, молочных и фактурных тонах",
    bestPalette: isWarmLight
      ? "Молочно-бежевый камень, белый хлопок, глубокий графит и терракотовый акцент"
      : "Глубокий матовый чёрный, графитовый меланж, оптический белый и терракотовый принт",
    silhouetteAdvice:
      "Структурированный плечевой пояс пиджаков SABYR в сочетании с брюками свободного кроя с защипами создаёт уверенную вертикаль",
    recommendedSize: "M / L (полная размерная сетка S – 3XL)",
  };

  const outfits: CuratedOutfit[] = [
    {
      id: "top-outfit-1",
      rank: 1,
      title: isWarmLight
        ? "Топ-1: Архитектурная светлая классика «The New Classic»"
        : "Топ-1: Статусный монохром «Quiet Luxury»",
      badge: "Выбор AI №1 под ваш типаж",
      matchScore: 99,
      rationale: isWarmLight
        ? "Светлый костюм SABYR в сочетании с базовым белым поло идеально подсвечивает тон кожи на вашем фото и создаёт дорогой расслабленный силуэт."
        : "Двубортный чёрный костюм в паре с фактурным белым поло формирует безупречный контраст у лица и подчёркивает линию плеч на вашем фото.",
      stylingTip:
        "Носите пиджак расстёгнутым поверх белого поло для динамичного дневного образа или застегните на пуговицы для статусного выхода.",
      items: Array.from(
        new Set([isWarmLight ? lightSuit : blackSuit, whitePolo].filter(Boolean))
      ) as ProductItem[],
    },
    {
      id: "top-outfit-2",
      rank: 2,
      title: "Топ-2: Интеллектуальный тейлоринг в графите",
      badge: "Деловой и вечерний фаворит",
      matchScore: 97,
      rationale:
        "Серый классический костюм и белоснежная рубашка из плотного поплина работают на любую деловую встречу или торжество, а дополнительные чёрные брюки с защипами позволяют менять низ.",
      stylingTip:
        "Расстегните верхнюю пуговицу рубашки без галстука — плотный воротник SABYR держит форму самостоятельно.",
      items: Array.from(
        new Set([greySuit, whiteShirt, widePants].filter(Boolean))
      ) as ProductItem[],
    },
    {
      id: "top-outfit-3",
      rank: 3,
      title: "Топ-3: Городской минимализм с культурным кодом SABYR",
      badge: "Современный кэжуал на каждый день",
      matchScore: 95,
      rationale:
        "Повседневный комплект на молнии поверх футболки с авторским терракотовым принтом шанырака создаёт стильный многослойный образ с характером.",
      stylingTip:
        "Расстегните куртку на молнии наполовину, чтобы графичный этно-принт футболки работал главным визуальным акцентом образа.",
      items: Array.from(
        new Set([zipSet, printTee, isWarmLight ? blackSuit : lightSuit].filter(Boolean))
      ) as ProductItem[],
    },
  ];

  return { appearanceProfile, outfits };
}

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
          error: "AI-Стилист по фото доступен только резидентам закрытого клуба SABYR CLUB.",
        },
        { status: 403 }
      );
    }
  }

  // Rate limit: 15 requests per minute per IP
  const ip = getClientIp(req);
  const rl = checkRateLimit("ai-stylist", ip, 15, 60_000);
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

    const { userPhotoBase64, photoMetrics, query } = parsed.data;

    // Load live catalog database (including items added by admin)
    const allProducts = await getLiveCatalogProducts();
    const availableCatalog =
      allProducts.filter((p) => p.variants.some((v) => v.stock > 0)).length > 0
        ? allProducts.filter((p) => p.variants.some((v) => v.stock > 0))
        : allProducts;

    const fallbackCurated = buildCuratedTopOutfits(availableCatalog, photoMetrics);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        source: "sabyr-vision-curated",
        appearanceProfile: fallbackCurated.appearanceProfile,
        outfits: fallbackCurated.outfits,
        items: fallbackCurated.outfits[0]?.items || availableCatalog.slice(0, 3),
        rationale:
          fallbackCurated.outfits[0]?.rationale ||
          "Топ-образы подобраны из всей коллекции SABYR по анализу вашего фото.",
      });
    }

    // Call Gemini API via @google/genai with the user's photo
    try {
      const ai = new GoogleGenAI({ apiKey });
      const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

      const catalogPrompt = availableCatalog.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        color: p.variants?.[0]?.color || "",
        description: p.aiDescription || p.description,
      }));

      const promptText = `
Вы — персональный VIP AI-стилист мужского бренда одежды SABYR (Алматы / Астана).
Клиент сфотографировал себя (или загрузил своё фото), чтобы вы БЕЗ лишних анкет сами проанализировали его внешность (цветотип, контрастность, пропорции плеч, общую харизму) и из ВСЕХ вещей каталога SABYR собрали для него 3 лучших готовых ТОП-ОБРАЗА.
${query ? `Дополнительный комментарий клиента: "${query}"` : ""}

Полный каталог одежды SABYR (используйте ТОЛЬКО точные id из этого списка):
${JSON.stringify(catalogPrompt, null, 2)}

Сформируйте 3 разноплановых топ-образа (в каждом образе от 2 до 3 сочетающихся между собой вещей, например: пиджак/костюм + поло или рубашка, либо комплект на молнии + футболка с принтом + брюки).

Верните ответ СТРОГО в формате JSON без markdown-разметки:
{
  "appearanceProfile": {
    "colorType": "Определённый по фото цветотип и контрастность клиента",
    "contrastLevel": "Описание контрастности внешности",
    "bestPalette": "Какие оттенки из коллекции SABYR идут клиенту больше всего",
    "silhouetteAdvice": "Рекомендация по крою и линии плеча",
    "recommendedSize": "M / L (полная размерная сетка S – 3XL)"
  },
  "outfits": [
    {
      "id": "top-1",
      "rank": 1,
      "title": "Топ-1: Название главного образа",
      "badge": "Выбор AI №1 (99% совпадение)",
      "matchScore": 99,
      "rationale": "Почему именно это сочетание вещей идеально подходит человеку на фото",
      "stylingTip": "Практический совет, как носить этот образ",
      "productIds": ["sabyr-1", "sabyr-5"]
    },
    {
      "id": "top-2",
      "rank": 2,
      "title": "Топ-2: Название второго образа",
      "badge": "Деловой и статусный выход",
      "matchScore": 97,
      "rationale": "Объяснение выбора под внешность клиента",
      "stylingTip": "Совет по стилизации",
      "productIds": ["sabyr-2", "sabyr-7", "sabyr-8"]
    },
    {
      "id": "top-3",
      "rank": 3,
      "title": "Топ-3: Название третьего образа",
      "badge": "Городской минимализм",
      "matchScore": 95,
      "rationale": "Объяснение выбора",
      "stylingTip": "Совет по стилизации",
      "productIds": ["sabyr-3", "sabyr-6"]
    }
  ]
}
`;

      const contents: Array<string | { inlineData: { data: string; mimeType: string } }> = [
        promptText,
      ];

      if (userPhotoBase64 && typeof userPhotoBase64 === "string") {
        const match = userPhotoBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match && match[1].startsWith("image/")) {
          contents.push({
            inlineData: {
              mimeType: match[1],
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

      const parsedOutfits: CuratedOutfit[] = Array.isArray(geminiParsed.outfits)
        ? geminiParsed.outfits
            .map((o: Record<string, unknown>, idx: number) => {
              const ids = Array.isArray(o.productIds) ? (o.productIds as string[]) : [];
              const items = ids
                .map((id) => availableCatalog.find((p) => p.id === id))
                .filter(Boolean) as ProductItem[];
              const finalItems =
                items.length > 0
                  ? items
                  : fallbackCurated.outfits[idx]?.items || availableCatalog.slice(0, 2);
              return {
                id: String(o.id || `top-${idx + 1}`),
                rank: idx + 1,
                title: String(o.title || fallbackCurated.outfits[idx]?.title || `Топ-${idx + 1}`),
                badge: String(o.badge || fallbackCurated.outfits[idx]?.badge || "Выбор AI"),
                matchScore: Number(o.matchScore) || 99 - idx * 2,
                rationale: String(
                  o.rationale || fallbackCurated.outfits[idx]?.rationale || ""
                ),
                stylingTip: String(
                  o.stylingTip || fallbackCurated.outfits[idx]?.stylingTip || ""
                ),
                items: finalItems,
              };
            })
            .slice(0, 3)
        : fallbackCurated.outfits;

      const finalOutfits = parsedOutfits.length > 0 ? parsedOutfits : fallbackCurated.outfits;

      return NextResponse.json({
        success: true,
        source: "gemini-ai",
        appearanceProfile: geminiParsed.appearanceProfile || fallbackCurated.appearanceProfile,
        outfits: finalOutfits,
        items: finalOutfits[0]?.items || availableCatalog.slice(0, 3),
        rationale: finalOutfits[0]?.rationale || "Персональная подборка топ-образов по вашему фото.",
      });
    } catch (geminiErr) {
      console.warn("[SABYR AI Stylist] Gemini call failed, using photo-metrics curated outfits:", geminiErr);
      return NextResponse.json({
        success: true,
        source: "sabyr-vision-curated",
        appearanceProfile: fallbackCurated.appearanceProfile,
        outfits: fallbackCurated.outfits,
        items: fallbackCurated.outfits[0]?.items || availableCatalog.slice(0, 3),
        rationale: fallbackCurated.outfits[0]?.rationale,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка генерации образов";
    console.error("[SABYR AI Stylist Error]:", error);
    const fallbackProducts = await getLiveCatalogProducts();
    const fallbackCurated = buildCuratedTopOutfits(fallbackProducts);
    return NextResponse.json({
      success: true,
      error: message,
      appearanceProfile: fallbackCurated.appearanceProfile,
      outfits: fallbackCurated.outfits,
      items: fallbackCurated.outfits[0]?.items || fallbackProducts.slice(0, 3),
      rationale: fallbackCurated.outfits[0]?.rationale,
    });
  }
}
