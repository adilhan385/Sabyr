import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NotificationService } from "@/lib/services/notification";
import type { OrderStatus } from "@prisma/client";

const UpdateOrderSchema = z.object({
  status: z.string().min(1).max(50).optional(),
  trackingNumber: z.string().max(120).optional(),
});

function resolveOrderStatus(input: string): OrderStatus {
  const normalized = input.trim();
  const map: Record<string, OrderStatus> = {
    "В обработке": "PROCESSING",
    "В пути": "SHIPPED",
    "Доставлен": "DELIVERED",
    "Отменён": "CANCELLED",
    "Возврат": "REFUNDED",
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    PROCESSING: "PROCESSING",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
    REFUNDED: "REFUNDED",
  };
  return map[normalized] || "PROCESSING";
}

function formatStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "PENDING":
    case "CONFIRMED":
    case "PROCESSING":
      return "В обработке";
    case "SHIPPED":
      return "В пути";
    case "DELIVERED":
      return "Доставлен";
    case "CANCELLED":
      return "Отменён";
    case "REFUNDED":
      return "Возврат";
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
  } catch (authError) {
    if (authError instanceof NextResponse) return authError;
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const parsed = UpdateOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Некорректные данные обновления заказа" },
      { status: 400 }
    );
  }

  const nextStatus = parsed.data.status
    ? resolveOrderStatus(parsed.data.status)
    : undefined;
  const nextTracking = parsed.data.trackingNumber;

  const dbUp = await isDatabaseAvailable();
  if (!dbUp) {
    return NextResponse.json({
      success: true,
      order: {
        id,
        rawStatus: nextStatus || "PROCESSING",
        status: formatStatusLabel(nextStatus || "PROCESSING"),
        trackingNumber: nextTracking || "",
      },
    });
  }

  try {
    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(nextStatus ? { status: nextStatus } : {}),
        ...(nextTracking !== undefined ? { trackingNumber: nextTracking } : {}),
      },
    });

    if (nextStatus) {
      await NotificationService.notifyOrderStatusChange({
        userId: updated.userId,
        orderNumber: updated.orderNumber,
        status: updated.status,
        trackingNumber: updated.trackingNumber,
      });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: updated.id,
        number: updated.orderNumber,
        rawStatus: updated.status,
        status: formatStatusLabel(updated.status),
        trackingNumber: updated.trackingNumber || "",
      },
    });
  } catch (error) {
    console.error("[PATCH /api/orders/[id]] Error:", error);
    return NextResponse.json(
      { success: false, error: "Не удалось обновить статус заказа" },
      { status: 500 }
    );
  }
}
