import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import { toKzt } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth";

const UpdateCustomerSchema = z.object({
  userId: z.string().min(1),
  bonusDelta: z.number().int().optional(),
  toggleClub: z.boolean().optional(),
  toggleBlock: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (authError) {
    if (authError instanceof NextResponse) return authError;
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  const dbUp = await isDatabaseAvailable();
  if (!dbUp) {
    return NextResponse.json({ success: true, customers: [] });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: "usr-01" },
      },
      include: {
        bonusLevel: true,
        clubMembership: true,
        orders: {
          where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
          select: { total: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const customers = users.map((u) => {
      const totalSpentTiyn = u.orders.reduce((sum, o) => sum + o.total, 0);
      return {
        id: u.id,
        name: u.name || "Клиент SABYR",
        phone: u.phone || "—",
        email: u.email || "",
        role: u.role,
        isBlocked: Boolean(u.isBlocked),
        level: u.bonusLevel?.name || "Level 1 — Starter",
        bonusBalance: u.bonusBalance,
        club: Boolean(u.clubMembership?.isActive),
        ordersCount: u.orders.length,
        totalSpent: toKzt(totalSpentTiyn),
      };
    });

    return NextResponse.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("[GET /api/admin/customers] Error:", error);
    return NextResponse.json({ success: true, customers: [] });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (authError) {
    if (authError instanceof NextResponse) return authError;
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = UpdateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Некорректные данные" }, { status: 400 });
    }

    const { userId, bonusDelta, toggleClub, toggleBlock } = parsed.data;

    if (typeof bonusDelta === "number" && bonusDelta !== 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          bonusBalance: { increment: bonusDelta },
        },
      });
      await prisma.bonusTransaction.create({
        data: {
          userId,
          type: bonusDelta > 0 ? "MANUAL_ADD" : "MANUAL_DEDUCT",
          amount: bonusDelta,
          description:
            bonusDelta > 0
              ? "Начисление бонусов администратором"
              : "Списание бонусов администратором",
        },
      });
    }

    if (toggleClub) {
      const existing = await prisma.clubMembership.findUnique({ where: { userId } });
      if (existing) {
        await prisma.clubMembership.update({
          where: { userId },
          data: { isActive: !existing.isActive },
        });
      } else {
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        await prisma.clubMembership.create({
          data: {
            userId,
            isActive: true,
            plan: "ANNUAL",
            endDate,
          },
        });
      }
    }

    if (toggleBlock) {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { isBlocked: true, role: true },
      });
      if (targetUser) {
        await prisma.user.update({
          where: { id: userId },
          data: { isBlocked: !targetUser.isBlocked },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/customers] Error:", error);
    return NextResponse.json({ success: false, error: "Ошибка обновления клиента" }, { status: 500 });
  }
}
