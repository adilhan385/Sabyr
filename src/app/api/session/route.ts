import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import { toKzt } from "@/lib/utils";

const ORDER_STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING: {
    label: "Принят",
    color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300",
  },
  CONFIRMED: {
    label: "Подтверждён",
    color: "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300",
  },
  PROCESSING: {
    label: "В обработке",
    color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300",
  },
  SHIPPED: {
    label: "В пути",
    color: "text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300",
  },
  DELIVERED: {
    label: "Доставлен",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  CANCELLED: {
    label: "Отменён",
    color: "text-neutral-600 bg-neutral-100 border-neutral-300 dark:bg-neutral-900 dark:text-neutral-400",
  },
  REFUNDED: {
    label: "Возврат",
    color: "text-neutral-600 bg-neutral-100 border-neutral-300 dark:bg-neutral-900 dark:text-neutral-400",
  },
};

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  COURIER: "Курьерская доставка SABYR Express",
  PICKUP: "Самовывоз из бутика",
  POSTAL: "Доставка по Казахстану (Казпочта / СДЭК)",
};

export async function GET(req: NextRequest) {
  try {
    // Only use real `sabyr-session` cookie for client account session (not admin dev bypass)
    const hasSessionCookie = Boolean(req.cookies.get("sabyr-session")?.value);
    if (!hasSessionCookie) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const dbUp = await isDatabaseAvailable();
    if (!dbUp) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.user.id,
          name: session.user.name,
          phone: session.user.phone || "",
          email: session.user.email || "",
          role: session.user.role,
          bonusBalance: session.user.bonusBalance,
          bonusLevel: {
            name: session.user.bonusLevel,
            percent: 5,
            currentPurchases: 150000,
            nextLevelAt: 300000,
            privileges: [
              "5% кешбэк бонусами с каждого заказа",
              "Бесплатная курьерская доставка от 20 000 ₸",
            ],
          },
          clubMembership: {
            isActive: session.user.isClubMember,
            tier: session.user.isClubMember ? "SABYR BLACK VIP" : "Нет членства",
            validUntil: session.user.isClubMember ? "15.01.2027" : "",
          },
          bonusHistory: [],
          orders: [],
          addresses: [],
          giftCards: [],
        },
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        bonusLevel: true,
        clubMembership: true,
        bonusHistory: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        addresses: {
          orderBy: { isDefault: "desc" },
        },
        giftCards: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        },
        orders: {
          include: {
            address: true,
            items: {
              include: {
                product: {
                  include: {
                    images: { orderBy: { order: "asc" }, take: 1 },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const allLevels = await prisma.bonusLevel.findMany({
      orderBy: { minPurchaseAmount: "asc" },
    });

    const totalSpentTiyn = dbUser.orders
      .filter((o) => o.status !== "CANCELLED" && o.status !== "REFUNDED")
      .reduce((acc, o) => acc + o.total, 0);
    const currentPurchasesKzt = toKzt(totalSpentTiyn);

    const currentLevel =
      dbUser.bonusLevel ||
      allLevels[0] || {
        name: "Новый клиент",
        bonusPercent: 3,
        minPurchaseAmount: 0,
        privileges: ["Кешбэк 3% бонусами", "Бесплатная доставка от 30 000 ₸"],
      };

    const nextLevel = allLevels.find(
      (lvl) => lvl.minPurchaseAmount > totalSpentTiyn
    );
    const nextLevelAtKzt = nextLevel
      ? toKzt(nextLevel.minPurchaseAmount)
      : Math.max(currentPurchasesKzt, 500000);

    const rawPrivileges = Array.isArray(currentLevel.privileges)
      ? (currentLevel.privileges as string[])
      : ["Кешбэк 3% бонусами", "Бесплатная доставка от 30 000 ₸"];

    const formattedOrders = dbUser.orders.map((ord) => {
      const statusMeta = ORDER_STATUS_META[ord.status] || ORDER_STATUS_META.PENDING;
      const totalKzt = toKzt(ord.total);
      const earned = Math.round((totalKzt * currentLevel.bonusPercent) / 100);

      return {
        id: ord.id,
        orderNumber: ord.orderNumber,
        date: new Date(ord.createdAt).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        status: statusMeta.label,
        statusColor: statusMeta.color,
        trackingNumber: ord.trackingNumber || "Ожидает присвоения",
        deliveryCity: ord.address?.city || "Алматы",
        deliveryAddress: ord.address?.street || "Бутик SABYR",
        deliveryType: DELIVERY_TYPE_LABELS[ord.deliveryType] || "Курьер",
        items: ord.items.map((it) => ({
          name: it.product.name,
          color: it.color,
          size: it.size,
          quantity: it.quantity,
          price: toKzt(it.price),
          image:
            it.product.images[0]?.url ||
            "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80",
        })),
        total: totalKzt,
        bonusesEarned: earned,
      };
    });

    const formattedBonusHistory = dbUser.bonusHistory.map((bh) => ({
      id: bh.id,
      type: bh.type,
      amount: bh.amount,
      description: bh.description,
      date: new Date(bh.createdAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    }));

    const formattedAddresses = dbUser.addresses.map((addr) => ({
      id: addr.id,
      title: addr.title || "Адрес доставки",
      city: addr.city,
      street: addr.street,
      isDefault: addr.isDefault,
    }));

    const formattedGiftCards = dbUser.giftCards.map((gc) => ({
      id: gc.id,
      code: gc.code,
      amount: toKzt(gc.amount),
      balance: toKzt(gc.balance),
      expiresAt: gc.expiresAt
        ? new Date(gc.expiresAt).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "Бессрочно",
      isUsed: gc.balance <= 0,
    }));

    return NextResponse.json({
      authenticated: true,
      user: {
        id: dbUser.id,
        name: dbUser.name || "Клиент SABYR",
        phone: dbUser.phone || "",
        email: dbUser.email || "",
        role: dbUser.role,
        bonusBalance: dbUser.bonusBalance,
        bonusLevel: {
          name: currentLevel.name,
          percent: currentLevel.bonusPercent,
          currentPurchases: currentPurchasesKzt,
          nextLevelAt: nextLevelAtKzt,
          privileges: rawPrivileges,
        },
        clubMembership: {
          isActive: Boolean(dbUser.clubMembership?.isActive),
          tier: dbUser.clubMembership?.isActive ? "SABYR BLACK VIP" : "Нет членства",
          validUntil: dbUser.clubMembership?.endDate
            ? new Date(dbUser.clubMembership.endDate).toLocaleDateString("ru-RU")
            : "Бессрочно",
        },
        bonusHistory: formattedBonusHistory,
        orders: formattedOrders,
        addresses: formattedAddresses,
        giftCards: formattedGiftCards,
      },
    });
  } catch (err: unknown) {
    console.error("[SABYR Session API Error]:", err);
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}
