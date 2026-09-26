import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, formatKzPhone } from "@/lib/auth";
import { prisma, isDatabaseAvailable } from "@/lib/db";

const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Имя слишком короткое").max(100).optional(),
  email: z.string().email("Некорректный email").optional().or(z.literal("")),
  phone: z.string().min(10).max(25).optional(),
});

export async function PATCH(req: NextRequest) {
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
    const parsed = UpdateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Проверьте корректность данных профиля" },
        { status: 400 }
      );
    }

    const { name, email, phone } = parsed.data;
    const dbUp = await isDatabaseAvailable();

    if (dbUp) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(email !== undefined ? { email: email.trim() || null } : {}),
          ...(phone !== undefined ? { phone: formatKzPhone(phone) } : {}),
        },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: updated.id,
          name: updated.name || "",
          email: updated.email || "",
          phone: updated.phone || "",
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: name ?? user.name,
        email: email ?? user.email ?? "",
        phone: phone ? formatKzPhone(phone) : user.phone ?? "",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ошибка сохранения профиля";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
