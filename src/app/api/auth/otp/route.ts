import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestOtpCode } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const OtpRequestSchema = z.object({
  phone: z
    .string()
    .min(10, "Введите корректный номер телефона")
    .max(25, "Слишком длинный номер"),
  email: z.string().email("Введите корректный email адрес"),
  sendVia: z.enum(["sms", "email"]).default("email"),
  acceptedTerms: z.literal(true, {
    message: "Необходимо согласиться с Условиями использования",
  }),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit("auth-otp", ip, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Слишком много запросов кода. Подождите минуту.",
        resetMs: rl.resetMs,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    if (body?.acceptedTerms !== true) {
      return NextResponse.json(
        {
          success: false,
          error: "Для входа и регистрации необходимо согласиться с Условиями использования",
        },
        { status: 400 }
      );
    }

    const parsed = OtpRequestSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message;
      return NextResponse.json(
        { success: false, error: firstError || "Проверьте правильность данных" },
        { status: 400 }
      );
    }

    const result = await requestOtpCode(
      parsed.data.phone,
      parsed.data.email,
      parsed.data.sendVia
    );

    const res = NextResponse.json({
      success: true,
      phone: result.phone,
      email: result.email,
      sendVia: parsed.data.sendVia,
      devCode: result.devCode,
      sentVia: result.sentVia,
      message:
        parsed.data.sendVia === "email"
          ? `Код отправлен на ${result.email}`
          : `Код отправлен на номер ${result.phone}`,
    });

    res.cookies.set("sabyr-otp-hash", result.codeHash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 300,
    });

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ошибка отправки кода";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
