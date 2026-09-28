import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OrderService } from "@/lib/services/order";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import { requireAdmin, getSession } from "@/lib/auth";

// ─── Zod Schemas ───────────────────────────────────────────────────────────────

const OrderItemSchema = z.object({
  productId: z.string().min(1).max(100),
  variantId: z.string().max(100).optional(),
  name: z.string().min(1).max(200),
  // price is in KZT (tenge) — converted to tiyn on the server via toTiyn()
  price: z.number().positive().max(100_000_000),
  quantity: z.number().int().positive().max(100),
  color: z.string().max(50).default("Стандартный"),
  size: z.string().max(10).default("M"),
});

const CustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(6, "Укажите корректный номер телефона (+7...)").max(30),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
});

const CreateOrderSchema = z.object({
  customer: CustomerSchema,
  items: z.array(OrderItemSchema).min(1, "Корзина пуста").max(50),
  deliveryType: z.enum(["COURIER", "PICKUP", "POSTAL"]).default("COURIER"),
  paymentMethod: z
    .enum([
      "KASPI_QR",
      "CARD_CLOUDPAYMENTS",
      "CREDIT_CARD",
      "CASH_ON_DELIVERY",
      "CASH",
      "BANK_TRANSFER",
    ])
    .default("KASPI_QR"),
  // All monetary values received from client in KZT (tenge)
  subtotal: z.number().min(0).max(100_000_000),
  discount: z.number().min(0).max(100_000_000).default(0),
  bonusUsed: z.number().int().min(0).default(0),
  promoCode: z.string().max(50).optional(),
  promoDiscount: z.number().min(0).max(100_000_000).default(0),
  giftCardCode: z.string().max(60).optional(),
  giftCardAmount: z.number().min(0).max(100_000_000).default(0),
  deliveryCost: z.number().min(0).max(50_000).default(0),
  total: z.number().min(0).max(100_000_000),
  notes: z.string().max(1000).optional().default(""),
  marketingConsent: z.boolean().optional().default(false),
});

// ─── GET /api/orders (Admin only) ─────────────────────────────────────────────

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
      const orders = await prisma.order.findMany({
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
          address: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({
        success: true,
        source: "database",
        orders: orders.map((o: (typeof orders)[number]) => ({
          id: o.id,
          number: o.orderNumber,
          customer: o.user?.name || "Покупатель",
          phone: o.user?.phone || "",
          date: o.createdAt.toLocaleDateString("ru-RU"),
          rawStatus: o.status,
          status:
            o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "PROCESSING"
              ? "В обработке"
              : o.status === "SHIPPED"
              ? "В пути"
              : o.status === "DELIVERED"
              ? "Доставлен"
              : o.status === "CANCELLED"
              ? "Отменён"
              : o.status,
          trackingNumber: o.trackingNumber || "",
          total: Math.round(o.total / 100), // convert tiyn to KZT for admin UI
          payment:
            o.paymentMethod === "KASPI_QR"
              ? "Kaspi QR"
              : o.paymentMethod === "CARD_CLOUDPAYMENTS"
              ? "Банковская карта"
              : "При получении",
          itemsCount: o.items.length,
        })),
      });

    } catch (dbErr) {
      console.warn("[SABYR Orders API] Error fetching orders from DB:", dbErr);
    }
  }

  // Local fallback orders (empty until real orders are placed)
  return NextResponse.json({
    success: true,
    source: "local-fallback",
    orders: [],
  });
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Ошибка валидации данных заказа",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      customer,
      items,
      deliveryType,
      paymentMethod,
      subtotal,
      discount,
      bonusUsed,
      promoCode,
      promoDiscount,
      giftCardCode,
      giftCardAmount,
      deliveryCost,
      total,
      notes,
    } = parsed.data;

    // Server-side sanity check: total must roughly match subtotal - discount + deliveryCost
    const expectedTotal = Math.max(0, subtotal - discount + deliveryCost);
    if (Math.abs(total - expectedTotal) > 1) {
      return NextResponse.json(
        { success: false, error: "Несоответствие суммы заказа. Обновите страницу и попробуйте снова." },
        { status: 400 }
      );
    }

    const session = await getSession(req);

    // Delegate execution to OrderService (atomic transaction & payment gateway setup)
    const result = await OrderService.createOrder({
      userId: session?.user.id,
      customer: {
        ...customer,
        email: customer.email?.trim() || session?.user.email || undefined,
      },
      items,
      deliveryType,
      paymentMethod,
      subtotal,
      discount,
      bonusUsed,
      promoCode,
      promoDiscount,
      giftCardCode,
      giftCardAmount,
      deliveryCost,
      total,
      notes,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ошибка создания заказа";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

