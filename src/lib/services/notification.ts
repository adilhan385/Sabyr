import { prisma, isDatabaseAvailable } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export type NotificationChannel = "IN_APP" | "SMS" | "WHATSAPP" | "EMAIL";

export interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  channels?: NotificationChannel[];
  data?: Record<string, string | number | boolean | null>;
}

export interface BroadcastNotificationParams {
  type: NotificationType;
  title: string;
  body: string;
  audience: "ALL" | "CLUB_ONLY";
  channels?: NotificationChannel[];
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Принят в обработку",
  CONFIRMED: "Подтверждён",
  PROCESSING: "В сборке в ателье",
  SHIPPED: "Отправлен курьерской службой",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
  REFUNDED: "Возврат оформлен",
};

export class NotificationService {
  /**
   * Sends a notification to a single user and persists it in PostgreSQL.
   */
  static async sendToUser(params: SendNotificationParams) {
    const channels = params.channels ?? ["IN_APP", "SMS"];
    const dbUp = await isDatabaseAvailable();

    console.info(
      `[SABYR Notification] -> user=${params.userId} channels=[${channels.join(",")}] title="${params.title}"`
    );

    if (!dbUp) {
      return {
        id: `ntf-${Date.now()}`,
        ...params,
        createdAt: new Date().toISOString(),
      };
    }

    try {
      const record = await prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          body: params.body,
          data: {
            ...(params.data ?? {}),
            channels,
          },
        },
      });
      return record;
    } catch (error) {
      console.error("[NotificationService.sendToUser] Error:", error);
      return null;
    }
  }

  /**
   * Broadcasts a notification to all users or SABYR CLUB members.
   */
  static async broadcast(params: BroadcastNotificationParams) {
    const channels = params.channels ?? ["IN_APP", "SMS", "WHATSAPP"];
    const dbUp = await isDatabaseAvailable();

    if (!dbUp) {
      return { sentCount: 1, channels };
    }

    const users = await prisma.user.findMany({
      where:
        params.audience === "CLUB_ONLY"
          ? {
              clubMembership: {
                is: { isActive: true },
              },
            }
          : {},
      select: { id: true, phone: true, email: true, name: true },
    });

    if (users.length === 0) {
      return { sentCount: 0, channels };
    }

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: params.type,
        title: params.title,
        body: params.body,
        data: {
          audience: params.audience,
          channels,
        },
      })),
    });

    console.info(
      `[SABYR Broadcast] Sent "${params.title}" to ${users.length} users via [${channels.join(", ")}]`
    );

    return {
      sentCount: users.length,
      channels,
    };
  }

  /**
   * Helper triggered when an admin updates an order's status or tracking number.
   */
  static async notifyOrderStatusChange(params: {
    userId: string;
    orderNumber: string;
    status: string;
    trackingNumber?: string | null;
  }) {
    const statusLabel = ORDER_STATUS_LABELS[params.status] || params.status;
    const trackingSuffix = params.trackingNumber
      ? ` Трек-номер: ${params.trackingNumber}.`
      : "";

    return this.sendToUser({
      userId: params.userId,
      type: "ORDER_STATUS",
      title: `Статус заказа ${params.orderNumber}: ${statusLabel}`,
      body: `Ваш заказ ${params.orderNumber} переведён в статус «${statusLabel}».${trackingSuffix}`,
      channels: ["IN_APP", "SMS", "WHATSAPP"],
      data: {
        orderNumber: params.orderNumber,
        status: params.status,
        trackingNumber: params.trackingNumber ?? null,
      },
    });
  }
}
