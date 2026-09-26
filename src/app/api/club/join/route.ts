import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ClubPlan } from "@prisma/client";

const JoinClubSchema = z.object({
  plan: z.enum(["ANNUAL", "MONTHLY"]).default("ANNUAL"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = JoinClubSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Некорректный тариф подписки" },
        { status: 400 }
      );
    }

    const session = await getSession(req);
    const plan = parsed.data.plan as ClubPlan;
    const endDate = new Date();
    if (plan === "ANNUAL") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const dbUp = await isDatabaseAvailable();
    if (dbUp && session?.user.id) {
      const membership = await prisma.clubMembership.upsert({
        where: { userId: session.user.id },
        update: {
          isActive: true,
          plan,
          endDate,
        },
        create: {
          userId: session.user.id,
          isActive: true,
          plan,
          endDate,
        },
      });

      // Upgrade user to VIP Black (10% cashback)
      await prisma.user.update({
        where: { id: session.user.id },
        data: { bonusLevelId: "bl-4" },
      });

      return NextResponse.json({
        success: true,
        membership: {
          id: membership.id,
          plan: membership.plan,
          validUntil: membership.endDate?.toLocaleDateString("ru-RU") || "",
          isActive: membership.isActive,
        },
      });
    }

    return NextResponse.json({
      success: true,
      membership: {
        id: `cm-${Date.now()}`,
        plan,
        validUntil: endDate.toLocaleDateString("ru-RU"),
        isActive: true,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ошибка подключения к SABYR CLUB";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
