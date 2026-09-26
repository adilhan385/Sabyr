import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseAvailable } from "@/lib/db";

// ─── Zod Schema ────────────────────────────────────────────────────────────────

const PromoCheckSchema = z.object({
  code: z.string().min(1).max(50).transform((s) => s.trim().toUpperCase()),
  subtotal: z.number().positive("Сумма должна быть положительной"),
});

// Hard-coded fallback promo codes (dev/demo only)
// TODO: Remove once PromoCode DB table is seeded and managed via admin panel
const FALLBACK_PROMOS: Record<string, { discount: number; description: string }> = {
  SABYR10: { discount: 10, description: "Скидка 10% на новую коллекцию" },
  CLUB15: { discount: 15, description: "Привилегия участника SABYR CLUB" },
  WELCOME20: { discount: 20, description: "Приветственный промокод" },
};

// ─── POST /api/promo/check ─────────────────────────────────────────────────────
// Validates a promo code and returns the discount percentage.
// Used by the cart/checkout pages before submitting the order.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PromoCheckSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Неверный запрос", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { code, subtotal } = parsed.data;

    // 1. Try database first
    const isDbUp = await isDatabaseAvailable();
    if (isDbUp) {
      try {
        const promoRecord = await prisma.promoCode.findFirst({
          where: {
            code,
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        });

        if (promoRecord) {
          // Check usage limit
          if (promoRecord.maxUses !== null && promoRecord.usedCount >= promoRecord.maxUses) {
            return NextResponse.json({
              success: false,
              error: "Лимит использований данного промокода исчерпан",
            });
          }

          // minOrderAmount is stored in tiyn (1 KZT = 100 tiyn)
          const minOrderTiyn = promoRecord.minOrderAmount ?? 0;
          const subtotalTiyn = subtotal * 100;
          if (subtotalTiyn < minOrderTiyn) {
            return NextResponse.json({
              success: false,
              error: `Промокод действует только от ${(minOrderTiyn / 100).toLocaleString("ru")} ₸`,
            });
          }

          const discountAmount = promoRecord.type === "PERCENTAGE"
            ? Math.round(subtotal * (promoRecord.value / 100))
            : Math.min(Math.round(promoRecord.value / 100), subtotal); // fixed amount in tiyn → KZT

          return NextResponse.json({
            success: true,
            code: promoRecord.code,
            discountType: promoRecord.type,
            discountPercent: promoRecord.type === "PERCENTAGE" ? promoRecord.value : null,
            discountAmount,
            description: `Скидка ${promoRecord.type === "PERCENTAGE" ? `${promoRecord.value}%` : `${Math.round(promoRecord.value / 100)} ₸`}`,
          });
        }

      } catch (dbErr) {
        console.warn("[SABYR] Promo DB lookup failed, falling back to local list:", dbErr);
      }
    }

    // 2. Fallback to hardcoded list
    const fallback = FALLBACK_PROMOS[code];
    if (fallback) {
      const discountAmount = Math.round(subtotal * (fallback.discount / 100));
      return NextResponse.json({
        success: true,
        code,
        discountType: "PERCENT",
        discountPercent: fallback.discount,
        discountAmount,
        description: fallback.description,
        source: "local", // indicates this came from fallback — useful for debugging
      });
    }

    return NextResponse.json(
      { success: false, error: "Промокод не найден или истёк срок действия" },
      { status: 404 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ошибка проверки промокода";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
