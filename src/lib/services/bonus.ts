/**
 * SABYR Luxury Fashion — Bonus & Loyalty Service
 *
 * Implements the 4-tier loyalty system and automatic SABYR CLUB qualification:
 * - Level 1: Новый клиент (0 ₸) — 3% cashback
 * - Level 2: Silver (100 000 ₸) — 5% cashback
 * - Level 3: Gold (300 000 ₸) — 7% cashback
 * - Level 4: VIP Black (500 000 ₸) — 10% cashback + automatic SABYR CLUB membership
 *
 * Rules:
 * - 1 bonus point = 1 KZT
 * - Up to 30% of order subtotal can be paid with bonus points
 */

import { Prisma } from "@prisma/client";
import { toKzt } from "@/lib/utils";

const CLUB_AUTO_THRESHOLD_TIYN = 50_000_000; // 500 000 KZT in tiyn

export interface ProcessOrderBonusParams {
  userId: string;
  orderId: string;
  orderNumber: string;
  subtotalKzt: number;
  paidTotalTiyn: number;
  requestedBonusUsed: number;
}

export interface ProcessOrderBonusResult {
  actualBonusUsed: number;
  earnedBonuses: number;
  newLevelName: string;
  clubAutoActivated: boolean;
}

export class BonusService {
  /**
   * Executes inside a `prisma.$transaction` during order creation:
   * 1. Validates and deducts spent bonuses (max 30% of subtotal, capped by user balance).
   * 2. Credits cashback bonuses according to the user's current tier (or 10% if active Club member).
   * 3. Recalculates cumulative spend, upgrades `BonusLevel`, and auto-activates `ClubMembership` at >= 500 000 ₸.
   */
  public static async processOrderLoyalty(
    tx: Prisma.TransactionClient,
    params: ProcessOrderBonusParams
  ): Promise<ProcessOrderBonusResult> {
    const user = await tx.user.findUnique({
      where: { id: params.userId },
      include: {
        bonusLevel: true,
        clubMembership: true,
      },
    });

    if (!user) {
      return {
        actualBonusUsed: 0,
        earnedBonuses: 0,
        newLevelName: "Новый клиент",
        clubAutoActivated: false,
      };
    }

    // 1. Clamp bonus deduction to max 30% of subtotal and user's actual balance
    const maxAllowedBonus = Math.min(
      user.bonusBalance,
      Math.floor(params.subtotalKzt * 0.3)
    );
    const actualBonusUsed = Math.max(
      0,
      Math.min(params.requestedBonusUsed, maxAllowedBonus)
    );

    if (actualBonusUsed > 0) {
      await tx.bonusTransaction.create({
        data: {
          userId: user.id,
          type: "SPENT",
          amount: -actualBonusUsed,
          description: `Оплата бонусами заказа #${params.orderNumber}`,
          orderId: params.orderId,
        },
      });
    }

    // 2. Determine cashback rate (Club members get at least 10% or their tier percent)
    const basePercent = user.bonusLevel?.bonusPercent ?? 3.0;
    const effectivePercent = user.clubMembership?.isActive
      ? Math.max(basePercent, 10.0)
      : basePercent;

    const paidTotalKzt = toKzt(params.paidTotalTiyn);
    const earnedBonuses = Math.max(
      0,
      Math.round((paidTotalKzt * effectivePercent) / 100)
    );

    if (earnedBonuses > 0) {
      await tx.bonusTransaction.create({
        data: {
          userId: user.id,
          type: "EARNED",
          amount: earnedBonuses,
          description: `Кешбэк ${effectivePercent}% за заказ #${params.orderNumber} (срок 6 мес.)`,
          orderId: params.orderId,
        },
      });
    }

    // 3. Recalculate cumulative spend & tier
    const ordersAgg = await tx.order.aggregate({
      where: {
        userId: user.id,
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      _sum: { total: true },
    });

    const totalSpentTiyn = ordersAgg._sum.total ?? params.paidTotalTiyn;

    const levels = await tx.bonusLevel.findMany({
      orderBy: { minPurchaseAmount: "desc" },
    });

    const matchedLevel = levels.find(
      (lvl) => totalSpentTiyn >= lvl.minPurchaseAmount
    );

    await tx.user.update({
      where: { id: user.id },
      data: {
        bonusBalance: Math.max(0, user.bonusBalance - actualBonusUsed + earnedBonuses),
        ...(matchedLevel ? { bonusLevelId: matchedLevel.id } : {}),
      },
    });

    // 4. Auto-join SABYR CLUB if cumulative spend >= 500 000 KZT
    let clubAutoActivated = false;
    if (totalSpentTiyn >= CLUB_AUTO_THRESHOLD_TIYN && !user.clubMembership?.isActive) {
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      await tx.clubMembership.upsert({
        where: { userId: user.id },
        update: {
          isActive: true,
          plan: "ANNUAL",
          endDate: oneYearLater,
        },
        create: {
          userId: user.id,
          isActive: true,
          plan: "ANNUAL",
          endDate: oneYearLater,
        },
      });
      clubAutoActivated = true;
    }

    return {
      actualBonusUsed,
      earnedBonuses,
      newLevelName: matchedLevel?.name || user.bonusLevel?.name || "Новый клиент",
      clubAutoActivated,
    };
  }
}
