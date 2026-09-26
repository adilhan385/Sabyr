import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const SettingsPayloadSchema = z.object({
  scope: z.enum(["site", "club"]).default("site"),
  entries: z.record(z.string(), z.string()),
});

export async function GET() {
  const dbUp = await isDatabaseAvailable();
  if (!dbUp) {
    return NextResponse.json({
      success: true,
      site: {},
      club: {},
    });
  }

  try {
    const [siteRows, clubRows] = await Promise.all([
      prisma.siteSettings.findMany(),
      prisma.clubSettings.findMany(),
    ]);

    const site: Record<string, string> = {};
    for (const r of siteRows) site[r.key] = r.value;

    const club: Record<string, string> = {};
    for (const r of clubRows) club[r.key] = r.value;

    return NextResponse.json({
      success: true,
      site,
      club,
    });
  } catch {
    return NextResponse.json({
      success: true,
      site: {},
      club: {},
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
      const { scope, entries } = parsed.data;
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/settings] Error:", error);
    return NextResponse.json({ success: false, error: "Ошибка сохранения настроек" }, { status: 500 });
  }
}
