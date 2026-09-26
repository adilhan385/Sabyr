import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginWithPhone, setSessionCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const VerifyOtpSchema = z.object({
  phone: z.string().min(10).max(25),
  code: z.string().length(4, "Код должен состоять из 4 цифр"),
  name: z.string().max(100).optional(),
  email: z.string().email("Введите корректный email адрес"),
  acceptedTerms: z.literal(true, {
    message: "Необходимо согласиться с Условиями использования",
  }),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit("auth-verify", ip, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Превышено количество попыток. Попробуйте через минуту.",
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

    const parsed = VerifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Проверьте введённый номер и 4-значный код",
        },
        { status: 400 }
      );
    }

    const { phone, code, name, email } = parsed.data;
    const cookieCodeHash = req.cookies.get("sabyr-otp-hash")?.value;
    const result = await loginWithPhone(phone, code, name, email || undefined, cookieCodeHash);

    if (!result.success || !result.token || !result.user) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Неверный код подтверждения",
        },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      success: true,
      user: result.user,
    });
    res.cookies.delete("sabyr-otp-hash");

    return setSessionCookie(res, result.token);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ошибка авторизации";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
