import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { toTiyn, toKzt } from "@/lib/utils";

const CreateGiftCardSchema = z.object({
  amount: z.number().int().min(10000, "Минимальный номинал 10 000 ₸").max(2000000),
  recipientName: z.string().min(1, "Укажите имя получателя").max(100),
  recipientEmail: z.string().email("Некорректный email получателя"),
  senderName: z.string().max(100).optional(),
  greetingMessage: z.string().max(500).optional(),
});

function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const block = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `SABYR-${block()}-${block()}`;
}

export async function GET() {
  const dbUp = await isDatabaseAvailable();
  if (dbUp) {
    try {
      const cards = await prisma.giftCard.findMany({
        include: { owner: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return NextResponse.json({
        success: true,
        giftCards: cards.map((c) => ({
          id: c.id,
          code: c.code,
          amount: toKzt(c.amount),
          balance: toKzt(c.balance),
          ownerName: c.owner?.name || "Подарочный",
          expiresAt: c.expiresAt
            ? c.expiresAt.toLocaleDateString("ru-RU")
            : "Бессрочно",
          isActive: c.isActive && c.balance > 0,
        })),
      });
    } catch (err) {
      console.warn("[SABYR GiftCards GET] DB error:", err);
    }
  }

  return NextResponse.json({
    success: true,
    giftCards: [
      {
        id: "gc-1",
        code: "SABYR-GIFT-8942-2026",
        amount: 50000,
        balance: 50000,
        ownerName: "Айгерим Касымова",
        expiresAt: "31.12.2027",
        isActive: true,
      },
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateGiftCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Проверьте номинал и данные получателя" },
        { status: 400 }
      );
    }

    const { amount, recipientName, recipientEmail } = parsed.data;
    const session = await getSession(req);
    const code = generateGiftCardCode();
    const amountTiyn = toTiyn(amount);
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Valid for 12 months

    const dbUp = await isDatabaseAvailable();
    if (dbUp) {
      try {
        const created = await prisma.giftCard.create({
          data: {
            code,
            amount: amountTiyn,
            balance: amountTiyn,
            ownerId: session?.user.id || null,
            expiresAt,
            isActive: true,
          },
        });

        console.info(
          `[SABYR GiftCard] Created gift card ${created.code} (${amount} KZT) for ${recipientName} <${recipientEmail}>`
        );

        return NextResponse.json({
          success: true,
          giftCard: {
            id: created.id,
            code: created.code,
            amount: toKzt(created.amount),
            balance: toKzt(created.balance),
            expiresAt: created.expiresAt?.toLocaleDateString("ru-RU") || "12 месяцев",
          },
        });
      } catch (err) {
        console.warn("[SABYR GiftCards POST] DB error, returning fallback:", err);
      }
    }

    return NextResponse.json({
      success: true,
      giftCard: {
        id: `gc-${Date.now()}`,
        code,
        amount,
        balance: amount,
        expiresAt: expiresAt.toLocaleDateString("ru-RU"),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ошибка выпуска сертификата";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
