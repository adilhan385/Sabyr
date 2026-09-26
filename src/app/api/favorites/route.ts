import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma, isDatabaseAvailable } from "@/lib/db";

const FavoriteSchema = z.object({
  productId: z.string().min(1).max(100),
});

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ success: true, items: [] });
  }

  const dbUp = await isDatabaseAvailable();
  if (dbUp) {
    try {
      const favs = await prisma.favorite.findMany({
        where: { userId: session.user.id },
        select: { productId: true },
      });
      return NextResponse.json({
        success: true,
        items: favs.map((f) => f.productId),
      });
    } catch {
      return NextResponse.json({ success: true, items: [] });
    }
  }

  return NextResponse.json({ success: true, items: [] });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ success: true, synced: false });
  }

  try {
    const body = await req.json();
    const parsed = FavoriteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "ID товара обязателен" }, { status: 400 });
    }

    const dbUp = await isDatabaseAvailable();
    if (dbUp) {
      await prisma.favorite.upsert({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId: parsed.data.productId,
          },
        },
        update: {},
        create: {
          userId: session.user.id,
          productId: parsed.data.productId,
        },
      });
    }

    return NextResponse.json({ success: true, synced: true });
  } catch {
    return NextResponse.json({ success: true, synced: false });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ success: true, synced: false });
  }

  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ success: false, error: "ID товара обязателен" }, { status: 400 });
    }

    const dbUp = await isDatabaseAvailable();
    if (dbUp) {
      await prisma.favorite.deleteMany({
        where: {
          userId: session.user.id,
          productId,
        },
      });
    }

    return NextResponse.json({ success: true, synced: true });
  } catch {
    return NextResponse.json({ success: true, synced: false });
  }
}
