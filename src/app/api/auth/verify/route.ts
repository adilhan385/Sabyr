import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginWithPhone, loginWithPassword, setSessionCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const VerifyOtpSchema = z.object({
  phone: z.string().min(10).max(25),
  code: z.string().length(4, "Код должен состоять из 4 цифр"),
  name: z.string().max(100).optional(),
  email: z.string().email("Введите корректный email адрес"),
  password: z.string().min(4).max(100).optional().or(z.literal("")),
  acceptedTerms: z.literal(true, {
    message: "Необходимо согласиться с Условиями использования",
  }),
});

const PasswordLoginSchema = z.object({
  mode: z.literal("password"),
  identifier: z.string().min(3, "Введите ваш Email или номер телефона"),
  password: z.string().min(4, "Введите пароль"),
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

    if (body?.mode === "password") {
      const parsedPwd = PasswordLoginSchema.safeParse(body);
      if (!parsedPwd.success) {
        const firstErr = parsedPwd.error.issues[0]?.message;
        return NextResponse.json(
          {
            success: false,
            error: firstErr || "Введите корректный Email/телефон и пароль",
          },
          { status: 400 }
        );
      }

      const pwdResult = await loginWithPassword(
        parsedPwd.data.identifier,
        parsedPwd.data.password
      );

      if (!pwdResult.success || !pwdResult.token || !pwdResult.user) {
        return NextResponse.json(
          {
            success: false,
            error: pwdResult.error || "Неверный логин или пароль",
          },
          { status: 401 }
        );
      }

      const res = NextResponse.json({
        success: true,
        user: pwdResult.user,
      });

      return setSessionCookie(res, pwdResult.token);
    }

    const parsed = VerifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Проверьте введённый номер, Email и 4-значный код",
        },
        { status: 400 }
      );
    }

    const { phone, code, name, email, password } = parsed.data;
    const cookieCodeHash = req.cookies.get("sabyr-otp-hash")?.value;
    const result = await loginWithPhone(
      phone,
      code,
      name,
      email || undefined,
      cookieCodeHash,
      password || undefined
    );

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
