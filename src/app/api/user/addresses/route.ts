import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma, isDatabaseAvailable } from "@/lib/db";

const CreateAddressSchema = z.object({
  title: z.string().min(1).max(50).default("Дом"),
  city: z.string().min(2, "Укажите город").max(100),
  street: z.string().min(3, "Укажите улицу и дом").max(250),
  isDefault: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  let user;
  try {
    const session = await requireAuth(req);
    user = session.user;
  } catch (authErr) {
    if (authErr instanceof NextResponse) return authErr;
    return NextResponse.json({ success: false, error: "Необходима авторизация" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = CreateAddressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Заполните город и улицу" },
        { status: 400 }
      );
    }

    const { title, city, street, isDefault } = parsed.data;
    const dbUp = await isDatabaseAvailable();

    if (dbUp) {
      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      const created = await prisma.address.create({
        data: {
          userId: user.id,
          title,
          city,
          street,
          isDefault,
        },
      });

      return NextResponse.json({
        success: true,
        address: {
          id: created.id,
          title: created.title || "Дом",
          city: created.city,
          street: created.street,
          isDefault: created.isDefault,
        },
      });
    }

    return NextResponse.json({
      success: true,
      address: {
        id: `addr-${Date.now()}`,
        title,
        city,
        street,
        isDefault,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ошибка добавления адреса";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  let user;
  try {
    const session = await requireAuth(req);
    user = session.user;
  } catch (authErr) {
    if (authErr instanceof NextResponse) return authErr;
    return NextResponse.json({ success: false, error: "Необходима авторизация" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID адреса обязателен" }, { status: 400 });
    }

    const dbUp = await isDatabaseAvailable();
    if (dbUp) {
      await prisma.address.deleteMany({
        where: { id, userId: user.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ошибка удаления адреса";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
