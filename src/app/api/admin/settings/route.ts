import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toKzt, toTiyn } from "@/lib/utils";

const DEFAULT_SITE_SETTINGS: Record<string, string> = {
  hero_badge: "Астана • Доставка по Казахстану",
  hero_title: "Первое впечатление без слов.",
  hero_subtitle:
    "Современная повседневная одежда. Лаконичный крой, плотные премиальные ткани и комфорт на каждый день.",
  hero_image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=2000&q=85",
  announcement_enabled: "false",
  announcement_text: "Закрытый клуб SABYR CLUB • Эксклюзивный доступ к AI-Стилисту и закрытым дропам",
  free_delivery_threshold: "30000",
  courier_delivery_cost: "2000",
  contact_phone: "+7 (775) 183-52-99",
  contact_whatsapp: "https://wa.me/77751835299",
  contact_instagram: "https://www.instagram.com/sabyr.wear",
  brand_city: "г. Астана, Казахстан",
  max_bonus_pay_percent: "30",
};

const DEFAULT_CLUB_SETTINGS: Record<string, string> = {
  annual_price: "99 000 ₸",
  monthly_price: "12 000 ₸",
  welcome_deposit: "25 000 ₸",
  cashback_percent: "10",
  ai_club_only: "true",
  club_subtitle:
    "Закрытый клуб для тех, кто разделяет философию осознанной роскоши, безупречного кроя и эксклюзивного сервиса.",
};

const DEFAULT_BONUS_LEVELS = [
  { id: "bl-1", name: "Level 1 — Starter", minSpend: 0, percent: 3 },
  { id: "bl-2", name: "Level 2 — Silver", minSpend: 100000, percent: 5 },
  { id: "bl-3", name: "Level 3 — Gold", minSpend: 300000, percent: 7 },
  { id: "bl-4", name: "Level 4 — VIP Black", minSpend: 500000, percent: 10 },
];

const SettingsPayloadSchema = z.object({
  scope: z.enum(["site", "club", "bonus"]).default("site"),
  entries: z.record(z.string(), z.string()).optional(),
  bonusLevels: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        minSpend: z.number().min(0),
        percent: z.number().min(0).max(100),
      })
    )
    .optional(),
});

export async function GET() {
  const dbUp = await isDatabaseAvailable();
  if (!dbUp) {
    return NextResponse.json({
      success: true,
      site: DEFAULT_SITE_SETTINGS,
      club: DEFAULT_CLUB_SETTINGS,
      bonusLevels: DEFAULT_BONUS_LEVELS,
    });
  }

  try {
    const [siteRows, clubRows, bonusRows] = await Promise.all([
      prisma.siteSettings.findMany(),
      prisma.clubSettings.findMany(),
      prisma.bonusLevel.findMany({ orderBy: { minPurchaseAmount: "asc" } }),
    ]);

    const site: Record<string, string> = { ...DEFAULT_SITE_SETTINGS };
    for (const r of siteRows) site[r.key] = r.value;

    const club: Record<string, string> = { ...DEFAULT_CLUB_SETTINGS };
    for (const r of clubRows) club[r.key] = r.value;

    const bonusLevels =
      bonusRows.length > 0
        ? bonusRows.map((b) => ({
            id: b.id,
            name: b.name,
            minSpend: toKzt(b.minPurchaseAmount),
            percent: b.bonusPercent,
          }))
        : DEFAULT_BONUS_LEVELS;

    return NextResponse.json({
      success: true,
      site,
      club,
      bonusLevels,
    });
  } catch {
    return NextResponse.json({
      success: true,
      site: DEFAULT_SITE_SETTINGS,
      club: DEFAULT_CLUB_SETTINGS,
      bonusLevels: DEFAULT_BONUS_LEVELS,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (authError) {
    if (authError instanceof NextResponse) return authError;
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = SettingsPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Некорректные настройки" }, { status: 400 });
    }

    const dbUp = await isDatabaseAvailable();
    if (dbUp) {
      const { scope, entries, bonusLevels } = parsed.data;

      if (scope === "bonus" && Array.isArray(bonusLevels)) {
        for (let i = 0; i < bonusLevels.length; i++) {
          const lvl = bonusLevels[i];
          const lvlId = lvl.id || `bl-${i + 1}`;
          await prisma.bonusLevel.upsert({
            where: { id: lvlId },
            update: {
              name: lvl.name,
              minPurchaseAmount: toTiyn(lvl.minSpend),
              bonusPercent: lvl.percent,
            },
            create: {
              id: lvlId,
              name: lvl.name,
              minPurchaseAmount: toTiyn(lvl.minSpend),
              bonusPercent: lvl.percent,
              privileges: [`Кешбэк ${lvl.percent}% бонусами`],
            },
          });
        }
      } else if (entries) {
        for (const [key, value] of Object.entries(entries)) {
          if (scope === "club") {
            await prisma.clubSettings.upsert({
              where: { key },
              update: { value },
              create: { key, value },
            });
          } else {
            await prisma.siteSettings.upsert({
              where: { key },
              update: { value },
              create: { key, value },
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/settings] Error:", error);
    return NextResponse.json({ success: false, error: "Ошибка сохранения настроек" }, { status: 500 });
  }
}
