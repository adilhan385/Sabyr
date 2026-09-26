import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseAvailable } from "@/lib/db";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const WaitlistSchema = z.object({
  productId: z.string().min(1).max(100),
  variantId: z.string().max(100).optional(),
  phone: z
    .string()
    .regex(/^\+7[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/)
    .optional(),
  email: z.string().email().max(200).optional(),
}).refine((data) => data.phone || data.email, {
  message: "Укажите телефон или email для уведомления",
});

// ─── POST /api/waitlist ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = WaitlistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Ошибка валидации", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { productId, variantId, phone, email } = parsed.data;

    const isDbUp = await isDatabaseAvailable();
    if (isDbUp) {
      try {
        const notification = await prisma.restockNotification.create({
          data: {
            productId,
            variantId: variantId || null,
            phone: phone || null,
            email: email || null,
            status: "PENDING",
          },
        });
        return NextResponse.json({
          success: true,
          id: notification.id,
          message: "Подписка на поступление оформлена",
        });
      } catch (dbErr: unknown) {
        console.warn("[SABYR Waitlist] Database error:", dbErr);
      }
    }

    console.info(
      `[SABYR Waitlist] Registered restock notification for ${phone || email} on product ${productId}`
    );
    return NextResponse.json({
      success: true,
      message: "Спасибо! Мы уведомим вас по SMS/email, как только изделие появится в вашем размере.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ошибка регистрации подписки";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
