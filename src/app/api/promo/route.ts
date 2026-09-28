import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// ─── Zod Schemas ───────────────────────────────────────────────────────────────

const CreatePromoSchema = z.object({
  code: z
    .string()
    .min(2, "Код должен содержать не менее 2 символов")
    .max(50)
    .transform((s) => s.trim().toUpperCase()),
  type: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  value: z.number().int().positive("Значение скидки должно быть положительным"),
  maxUses: z.number().int().positive().nullable().optional(),
  minOrderAmount: z.number().int().min(0).nullable().optional(), // in KZT from form, converted to tiyn
  expiresAt: z.string().datetime().nullable().optional(),
});

const DeletePromoSchema = z.object({
  id: z.string().min(1, "ID промокода обязателен"),
});

// ─── GET /api/promo ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (authError) {
    if (authError instanceof NextResponse) return authError;
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  const isDbUp = await isDatabaseAvailable();
  if (isDbUp) {
    try {
      const dbPromos = await prisma.promoCode.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({
        success: true,
        source: "database",
        promos: dbPromos.map((p) => ({
          id: p.id,
          code: p.code,
          discount: p.type === "PERCENTAGE" ? `${p.value}%` : `${Math.round(p.value / 100)} ₸`,
          type: p.type,
          uses: p.usedCount,
          maxUses: p.maxUses,
          active: p.isActive,
          expiresAt: p.expiresAt?.toISOString() || null,
        })),
      });
    } catch (dbErr) {
      console.warn("[SABYR Promo API] DB fetch failed, using fallback:", dbErr);
    }
  }

  return NextResponse.json({
    success: true,
    source: "fallback",
    promos: [],
  });
}

// ─── POST /api/promo ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (authError) {
    if (authError instanceof NextResponse) return authError;
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = CreatePromoSchema.safeParse({
      ...body,
      value: Number(body?.value),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Ошибка валидации промокода", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { code, type, value, maxUses, minOrderAmount, expiresAt } = parsed.data;
    const storedValue = type === "PERCENTAGE" ? value : value * 100;

    const isDbUp = await isDatabaseAvailable();
    if (isDbUp) {
      try {
        const created = await prisma.promoCode.upsert({
          where: { code },
          update: {
            type,
            value: storedValue,
            maxUses: maxUses || null,
            minOrderAmount: minOrderAmount ? minOrderAmount * 100 : 0,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            isActive: true,
          },
          create: {
            code,
            type,
            value: storedValue,
            maxUses: maxUses || null,
            minOrderAmount: minOrderAmount ? minOrderAmount * 100 : 0,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            isActive: true,
            categoryIds: [],
            productIds: [],
          },
        });

        return NextResponse.json({
          success: true,
          promo: {
            id: created.id,
            code: created.code,
            discount:
              created.type === "PERCENTAGE"
                ? `${created.value}%`
                : `${Math.round(created.value / 100)} ₸`,
            type: created.type,
            uses: created.usedCount,
            maxUses: created.maxUses,
            active: created.isActive,
          },
        });
      } catch (dbErr: unknown) {
        const message = dbErr instanceof Error ? dbErr.message : "Ошибка базы данных";
        return NextResponse.json({ success: false, error: message }, { status: 400 });
      }
    }

    // Local fallback creation
    const newPromo = {
      id: `promo-${Date.now()}`,
      code,
      discount: `${value}%`,
      type,
      uses: 0,
      maxUses: maxUses || 100,
      active: true,
    };

    return NextResponse.json({ success: true, promo: newPromo });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ошибка создания промокода";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── DELETE /api/promo ────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (authError) {
    if (authError instanceof NextResponse) return authError;
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const parsed = DeletePromoSchema.safeParse({ id: searchParams.get("id") });

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "ID обязателен" }, { status: 400 });
    }

    const { id } = parsed.data;
    const isDbUp = await isDatabaseAvailable();
    if (isDbUp) {
      try {
        await prisma.promoCode.update({
          where: { id },
          data: { isActive: false },
        });
      } catch {
        // Fallback OK
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ошибка удаления промокода";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
