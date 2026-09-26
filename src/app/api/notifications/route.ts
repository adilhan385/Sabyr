import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import {
  NotificationService,
  type NotificationChannel,
} from "@/lib/services/notification";

const BroadcastSchema = z.object({
  type: z
    .enum([
      "ORDER_STATUS",
      "BONUS_EARNED",
      "NEW_DROP",
      "BACK_IN_STOCK",
      "PERSONAL_OFFER",
      "CLUB_OFFER",
    ])
    .optional()
    .default("NEW_DROP"),
  title: z.string().min(2).max(160),
  body: z.string().min(2).max(1000),
  audience: z.enum(["ALL", "CLUB_ONLY"]).optional().default("ALL"),
  channels: z
    .array(z.enum(["IN_APP", "SMS", "WHATSAPP", "EMAIL"]))
    .optional()
    .default(["IN_APP", "SMS", "WHATSAPP"]),
});

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  const dbUp = await isDatabaseAvailable();

  if (!dbUp) {
    return NextResponse.json({ success: true, notifications: [] });
  }

  try {
    const isAdmin = session?.user.role === "ADMIN";
    const notifications = await prisma.notification.findMany({
      where: isAdmin ? {} : session ? { userId: session.user.id } : { userId: "none" },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        user: {
          select: { name: true, phone: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: n.isRead,
        recipient: n.user?.name || n.user?.phone || "Клиент",
        createdAt: n.createdAt.toLocaleDateString("ru-KZ", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    });
  } catch {
    return NextResponse.json({ success: true, notifications: [] });
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
    const parsed = BroadcastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Некорректные данные рассылки",
        },
        { status: 400 }
      );
    }

    const result = await NotificationService.broadcast({
      type: parsed.data.type,
      title: parsed.data.title,
      body: parsed.data.body,
      audience: parsed.data.audience,
      channels: parsed.data.channels as NotificationChannel[],
    });

    return NextResponse.json({
      success: true,
      sentCount: result.sentCount,
      channels: result.channels,
      message: `Уведомление отправлено (${result.sentCount} получателей)`,
    });
  } catch (error) {
    console.error("[POST /api/notifications] Error:", error);
    return NextResponse.json(
      { success: false, error: "Не удалось отправить уведомление" },
      { status: 500 }
    );
  }
}
