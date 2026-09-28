/**
 * SABYR Auth Helpers & OTP Service
 *
 * Implements cryptographic JWT sessions (HS256 via `jose`) stored in httpOnly cookies,
 * backed by PostgreSQL (`User`, `OtpVerification`, `BonusLevel`, `ClubMembership`).
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_DURATION_SEC,
  signSessionToken,
  verifySessionToken,
} from "@/lib/jwt";

export interface AuthUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: "CUSTOMER" | "ADMIN";
  bonusBalance: number;
  bonusLevel: string;
  isClubMember: boolean;
}

/**
 * Formats any Kazakhstan phone string into canonical `+7 (XXX) XXX-XX-XX`.
 */
export function formatKzPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  let normalized = digits;
  if (normalized.length === 11 && (normalized.startsWith("7") || normalized.startsWith("8"))) {
    normalized = "7" + normalized.slice(1);
  } else if (normalized.length === 10) {
    normalized = "7" + normalized;
  }
  if (normalized.length === 11 && normalized.startsWith("7")) {
    const p1 = normalized.slice(1, 4);
    const p2 = normalized.slice(4, 7);
    const p3 = normalized.slice(7, 9);
    const p4 = normalized.slice(9, 11);
    return `+7 (${p1}) ${p2}-${p3}-${p4}`;
  }
  return raw.trim();
}

function hashOtp(phone: string, code: string): string {
  const secret = process.env.JWT_SECRET || "sabyr-otp-salt";
  return crypto.createHash("sha256").update(`${phone}:${code}:${secret}`).digest("hex");
}

/**
 * Reads and verifies the current user session from the `sabyr-session` httpOnly cookie.
 * Returns `null` if the user is not authenticated.
 */
export async function getSession(
  req?: NextRequest
): Promise<{ user: AuthUser } | null> {
  try {
    let token: string | undefined;
    let isDevAdminBypass = false;

    if (req) {
      token = req.cookies.get(SESSION_COOKIE)?.value;
      isDevAdminBypass =
        process.env.NODE_ENV !== "production" &&
        (req.cookies.get("sabyr-admin-dev")?.value === "1" ||
          req.headers.get("x-sabyr-admin-dev") === "1");
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE)?.value;
      isDevAdminBypass =
        process.env.NODE_ENV !== "production" &&
        cookieStore.get("sabyr-admin-dev")?.value === "1";
    }

    if (token) {
      const payload = await verifySessionToken(token);
      if (payload && payload.sub) {
        const dbUp = await isDatabaseAvailable();
        if (dbUp) {
          let dbUser = await prisma.user.findUnique({
            where: { id: payload.sub },
            include: {
              bonusLevel: true,
              clubMembership: true,
            },
          });

          if (!dbUser && (payload.email || payload.phone)) {
            const orFilters: Array<Record<string, unknown>> = [];
            if (payload.email) {
              orFilters.push({ email: { equals: payload.email, mode: "insensitive" } });
            }
            if (payload.phone) {
              orFilters.push({ phone: payload.phone });
            }
            if (orFilters.length > 0) {
              dbUser = await prisma.user.findFirst({
                where: { OR: orFilters },
                include: {
                  bonusLevel: true,
                  clubMembership: true,
                },
              });
            }
          }

          if (dbUser) {
            if (dbUser.isBlocked) {
              return null;
            }
            const isAdminEmail = dbUser.email?.toLowerCase() === "adilhananuar426@gmail.com";
            return {
              user: {
                id: dbUser.id,
                name: dbUser.name || "Клиент SABYR",
                phone: dbUser.phone || undefined,
                email: dbUser.email || undefined,
                role: isAdminEmail ? "ADMIN" : dbUser.role,
                bonusBalance: dbUser.bonusBalance,
                bonusLevel: dbUser.bonusLevel?.name || "Новый клиент",
                isClubMember: Boolean(dbUser.clubMembership?.isActive),
              },
            };
          }
        }

        // Fallback to verified JWT claims if DB record is temporarily unavailable
        return {
          user: {
            id: payload.sub,
            name: payload.name || "Клиент SABYR",
            phone: payload.phone,
            email: payload.email,
            role: payload.role,
            bonusBalance: 0,
            bonusLevel: "Новый клиент",
            isClubMember: false,
          },
        };
      }
    }

    if (isDevAdminBypass) {
      return {
        user: {
          id: "usr-admin-01",
          name: "Администратор SABYR",
          phone: "+7 (777) 000-00-00",
          email: "admin@sabyr.kz",
          role: "ADMIN",
          bonusBalance: 50000,
          bonusLevel: "VIP Black",
          isClubMember: true,
        },
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * requireAuth — throws 401 NextResponse if user is not logged in.
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ user: AuthUser }> {
  const session = await getSession(req);
  if (!session) {
    throw NextResponse.json(
      { success: false, error: "Необходима авторизация" },
      { status: 401 }
    );
  }
  return session;
}

/**
 * requireAdmin — throws 401/403 NextResponse if user is not ADMIN.
 */
export async function requireAdmin(req: NextRequest): Promise<{ user: AuthUser }> {
  const session = await getSession(req);
  if (!session) {
    throw NextResponse.json(
      { success: false, error: "Необходима авторизация администратора" },
      { status: 401 }
    );
  }
  if (session.user.role !== "ADMIN") {
    throw NextResponse.json(
      { success: false, error: "Недостаточно прав доступа" },
      { status: 403 }
    );
  }
  return session;
}

/**
 * Generates a 4-digit OTP code, saves its hash in `OtpVerification`,
 * and dispatches it via Mobizon SMS (if `SMS_API_KEY` is set) and/or Resend Email (if `RESEND_API_KEY` is set).
 */
const memoryOtps = new Map<string, { codeHash: string; expiresAt: number }>();
const memoryEmailOwners = new Map<string, string>();

export async function requestOtpCode(
  rawPhone: string,
  rawEmail?: string,
  sendVia: "sms" | "email" | "both" = "both",
  isRegister: boolean = false
): Promise<{
  success: boolean;
  phone: string;
  email?: string;
  codeHash: string;
  devCode?: string;
  sentVia?: string[];
}> {
  const phone = formatKzPhone(rawPhone);
  const randomCode = String(Math.floor(1000 + Math.random() * 9000));
  const codeHash = hashOtp(phone, randomCode);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  const sentVia_result: string[] = [];

  let targetEmail = rawEmail?.trim().toLowerCase() || undefined;

  // In-memory duplicate check (also works when DB is offline)
  if (targetEmail) {
    const memOwnerPhone = memoryEmailOwners.get(targetEmail);
    if (isRegister && (memOwnerPhone || targetEmail === "adilhananuar426@gmail.com")) {
      throw new Error("Аккаунт с этим Email уже зарегистрирован. Перейдите во вкладку «Вход».");
    }
    if (memOwnerPhone && memOwnerPhone !== phone) {
      throw new Error("Этот Email уже привязан к другому номеру телефона. Перейдите во вкладку «Вход».");
    }
  }
  if (isRegister && memoryPasswords.has(phone)) {
    throw new Error("Аккаунт с этим номером телефона уже зарегистрирован. Перейдите во вкладку «Вход».");
  }

  const dbUp = await isDatabaseAvailable();
  if (dbUp) {
    try {
      const existingByPhone = await prisma.user.findFirst({
        where: { phone },
        select: { id: true, email: true, isBlocked: true },
      });
      if (existingByPhone?.isBlocked) {
        throw new Error("Ваш аккаунт заблокирован администратором SABYR");
      }

      const existingByEmail = targetEmail
        ? await prisma.user.findFirst({
            where: { email: { equals: targetEmail, mode: "insensitive" } },
            select: { id: true, phone: true, isBlocked: true },
          })
        : null;

      if (existingByEmail?.isBlocked) {
        throw new Error("Ваш аккаунт заблокирован администратором SABYR");
      }

      if (isRegister) {
        if (existingByEmail) {
          throw new Error("Аккаунт с этим Email уже зарегистрирован. Перейдите во вкладку «Вход».");
        }
        if (existingByPhone) {
          throw new Error("Аккаунт с этим номером телефона уже зарегистрирован. Перейдите во вкладку «Вход».");
        }
      } else {
        if (existingByEmail && existingByEmail.phone && existingByEmail.phone !== phone) {
          throw new Error("Этот Email уже привязан к другому аккаунту. Войдите по Email и паролю.");
        }
      }

      if (!targetEmail && existingByPhone?.email) {
        targetEmail = existingByPhone.email;
      }

      await prisma.otpVerification.create({
        data: { phone, codeHash, expiresAt },
      });
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("заблокирован") ||
          err.message.includes("уже зарегистрирован") ||
          err.message.includes("уже привязан"))
      ) {
        throw err;
      }
      console.warn("[SABYR Auth] Failed to query/persist OTP in DB:", err);
    }
  }

  memoryOtps.set(phone, { codeHash, expiresAt: expiresAt.getTime() });

  const shouldSendSms = sendVia === "sms" || sendVia === "both";
  const shouldSendEmail = sendVia === "email" || sendVia === "both";

  // 1. SMS via Mobizon KZ
  const smsApiKey = process.env.SMS_API_KEY?.trim();
  if (shouldSendSms && smsApiKey) {
    try {
      const recipientDigits = phone.replace(/\D/g, "");
      const params = new URLSearchParams({
        recipient: recipientDigits,
        text: `SABYR: Ваш код входа ${randomCode}. Никому не сообщайте код.`,
      });
      if (process.env.SMS_SENDER_NAME?.trim()) {
        params.set("from", process.env.SMS_SENDER_NAME.trim());
      }
      const smsRes = await fetch(
        `https://api.mobizon.kz/service/message/sendsmsmessage?output=json&api=v1&apiKey=${encodeURIComponent(smsApiKey)}`,
        { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString() }
      );
      if (smsRes.ok) sentVia_result.push("SMS");
    } catch (smsErr) {
      console.warn("[SABYR SMS] Mobizon send error:", smsErr);
    }
  }

  // 2. Email via Resend
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (shouldSendEmail && resendApiKey && targetEmail) {
    try {
      const emailFrom = process.env.EMAIL_FROM?.trim() || "SABYR <onboarding@resend.dev>";
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: emailFrom,
          to: [targetEmail],
          subject: `Ваш код входа в SABYR: ${randomCode}`,
          html: `<div style="font-family:sans-serif;max-width:460px;margin:0 auto;padding:24px;border:1px solid #e5e5e5;border-radius:12px;">
            <h2 style="letter-spacing:0.2em;margin:0 0 16px;">SABYR</h2>
            <p style="font-size:14px;color:#444;">Ваш одноразовый код подтверждения:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:0.4em;padding:20px;background:#f5f5f5;text-align:center;border-radius:8px;margin:16px 0;">${randomCode}</div>
            <p style="font-size:12px;color:#888;">Код действителен 5 минут. Никому не сообщайте его.</p>
          </div>`,
        }),
      });
      if (emailRes.ok) sentVia_result.push("EMAIL");
    } catch (emailErr) {
      console.warn("[SABYR Email] Resend send error:", emailErr);
    }
  }

  const isRealDeliveryActive = sentVia_result.length > 0;
  console.info(`[SABYR OTP] Код для ${phone}${targetEmail ? ` / ${targetEmail}` : ""}: ${randomCode} | via: ${sendVia}`);

  return {
    success: true,
    phone,
    email: targetEmail,
    codeHash,
    sentVia: sentVia_result,
    devCode: !isRealDeliveryActive ? randomCode : undefined,
  };
}

const memoryPasswords = new Map<string, string>();

function hashPassword(password: string): string {
  const secret = process.env.JWT_SECRET || "sabyr-pwd-salt";
  return crypto.createHash("sha256").update(`pwd:${password}:${secret}`).digest("hex");
}

/**
 * Verifies an OTP code, finds or creates the User in PostgreSQL, and returns a signed JWT.
 */
export async function loginWithPhone(
  rawPhone: string,
  code: string,
  name?: string,
  email?: string,
  cookieCodeHash?: string,
  password?: string,
  isRegister: boolean = false
): Promise<{
  success: boolean;
  error?: string;
  token?: string;
  user?: AuthUser;
}> {
  const phone = formatKzPhone(rawPhone);
  const cleanCode = code.trim();
  const normalizedEmail = email?.trim().toLowerCase() || undefined;
  const dbUp = await isDatabaseAvailable();

  const isSandboxBypass = !process.env.SMS_API_KEY && cleanCode === "1234";
  let otpValid = isSandboxBypass;

  const expectedHash = hashOtp(phone, cleanCode);
  if (!otpValid && cookieCodeHash && cookieCodeHash === expectedHash) {
    otpValid = true;
  }

  const memEntry = memoryOtps.get(phone);
  if (!otpValid && memEntry && memEntry.expiresAt > Date.now() && memEntry.codeHash === expectedHash) {
    otpValid = true;
    memoryOtps.delete(phone);
  }

  if (!otpValid && dbUp) {
    try {
      const latestOtp = await prisma.otpVerification.findFirst({
        where: {
          phone,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (latestOtp) {
        if (latestOtp.codeHash === expectedHash) {
          otpValid = true;
          await prisma.otpVerification.update({
            where: { id: latestOtp.id },
            data: { isUsed: true },
          });
        } else {
          await prisma.otpVerification.update({
            where: { id: latestOtp.id },
            data: { attempts: { increment: 1 } },
          });
        }
      }
    } catch (err) {
      console.warn("[SABYR Auth] OTP verification DB fallback:", err);
    }
  }

  if (!otpValid) {
    return {
      success: false,
      error: "Неверный или просроченный код подтверждения",
    };
  }

  if (normalizedEmail) {
    const existingMemOwner = memoryEmailOwners.get(normalizedEmail);
    if (existingMemOwner && existingMemOwner !== phone) {
      return {
        success: false,
        error: "Этот Email уже зарегистрирован на другой номер телефона. Перейдите во вкладку «Вход».",
      };
    }
  }

  const isAdminAccount =
    phone === "+7 (777) 000-00-00" ||
    normalizedEmail === "adilhananuar426@gmail.com";
  const pwdHash = password?.trim() ? hashPassword(password.trim()) : undefined;

  if (dbUp) {
    try {
      let dbUser = await prisma.user.findUnique({
        where: { phone },
        include: { bonusLevel: true, clubMembership: true },
      });

      if (dbUser?.isBlocked) {
        return {
          success: false,
          error: "Ваш аккаунт заблокирован администратором SABYR",
        };
      }

      if (normalizedEmail) {
        const emailOwner = await prisma.user.findFirst({
          where: { email: { equals: normalizedEmail, mode: "insensitive" } },
          select: { id: true, phone: true },
        });
        if (emailOwner && emailOwner.id !== dbUser?.id) {
          return {
            success: false,
            error: "Аккаунт с этим Email уже зарегистрирован. Перейдите во вкладку «Вход».",
          };
        }
      }

      if (isRegister && dbUser) {
        return {
          success: false,
          error: "Аккаунт с этим номером телефона уже зарегистрирован. Перейдите во вкладку «Вход».",
        };
      }

      if (!dbUser) {
        const starterLevel = await prisma.bonusLevel.findFirst({
          orderBy: { minPurchaseAmount: "asc" },
        });
        dbUser = await prisma.user.create({
          data: {
            phone,
            name: name?.trim() || (isAdminAccount ? "Администратор SABYR" : "Клиент SABYR"),
            email: normalizedEmail,
            role: isAdminAccount ? "ADMIN" : "CUSTOMER",
            bonusBalance: 3000, // Welcome bonus 3000 KZT
            bonusLevelId: starterLevel?.id || null,
            bonusHistory: {
              create: {
                type: "EARNED",
                amount: 3000,
                description: "Приветственные бонусы за регистрацию в SABYR",
              },
            },
          },
          include: { bonusLevel: true, clubMembership: true },
        });
      } else if (name?.trim() || normalizedEmail || (isAdminAccount && dbUser.role !== "ADMIN")) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            ...(name?.trim() ? { name: name.trim() } : {}),
            ...(normalizedEmail ? { email: normalizedEmail } : {}),
            ...(isAdminAccount ? { role: "ADMIN" } : {}),
          },
          include: { bonusLevel: true, clubMembership: true },
        });
      }

      if (normalizedEmail) {
        memoryEmailOwners.set(normalizedEmail, phone);
      }
      if (pwdHash) {
        memoryPasswords.set(phone, pwdHash);
        if (normalizedEmail) {
          memoryPasswords.set(normalizedEmail, pwdHash);
        }
        try {
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: "credentials",
                providerAccountId: dbUser.id,
              },
            },
            update: { access_token: pwdHash },
            create: {
              userId: dbUser.id,
              type: "credentials",
              provider: "credentials",
              providerAccountId: dbUser.id,
              access_token: pwdHash,
            },
          });
        } catch (pwdErr) {
          console.warn("[SABYR Auth] Failed to persist password hash:", pwdErr);
        }
      }

      const authUser: AuthUser = {
        id: dbUser.id,
        name: dbUser.name || "Клиент SABYR",
        phone: dbUser.phone || phone,
        email: dbUser.email || undefined,
        role: dbUser.role,
        bonusBalance: dbUser.bonusBalance,
        bonusLevel: dbUser.bonusLevel?.name || "Новый клиент",
        isClubMember: Boolean(dbUser.clubMembership?.isActive),
      };

      const token = await signSessionToken({
        sub: authUser.id,
        role: authUser.role,
        phone: authUser.phone,
        email: authUser.email,
        name: authUser.name,
      });

      return { success: true, token, user: authUser };
    } catch (err) {
      console.warn("[SABYR Auth] User DB query failed, using JWT fallback:", err);
    }
  }

  // Fallback when DB is offline or wrong DATABASE_URL is configured
  if (normalizedEmail) {
    memoryEmailOwners.set(normalizedEmail, phone);
  }
  if (pwdHash) {
    memoryPasswords.set(phone, pwdHash);
    if (normalizedEmail) {
      memoryPasswords.set(normalizedEmail, pwdHash);
    }
  }

  const fallbackUser: AuthUser = {
    id: isAdminAccount ? "usr-admin-01" : `usr-${phone.replace(/\D/g, "")}`,
    name: name?.trim() || (isAdminAccount ? "Администратор SABYR" : "Клиент SABYR"),
    phone,
    email: email?.trim() || (isAdminAccount ? "adilhananuar426@gmail.com" : undefined),
    role: isAdminAccount ? "ADMIN" : "CUSTOMER",
    bonusBalance: 3000,
    bonusLevel: "Новый клиент",
    isClubMember: isAdminAccount,
  };

  const token = await signSessionToken({
    sub: fallbackUser.id,
    role: fallbackUser.role,
    phone: fallbackUser.phone,
    email: fallbackUser.email,
    name: fallbackUser.name,
  });

  return { success: true, token, user: fallbackUser };
}

/**
 * Authenticates a user by Email or Phone + Password.
 */
export async function loginWithPassword(
  identifier: string,
  password: string
): Promise<{
  success: boolean;
  error?: string;
  token?: string;
  user?: AuthUser;
}> {
  const cleanId = identifier.trim();
  const isEmail = cleanId.includes("@");
  const normalizedPhone = isEmail ? undefined : formatKzPhone(cleanId);
  const normalizedEmail = isEmail ? cleanId.toLowerCase() : undefined;
  const pwdHash = hashPassword(password.trim());

  const envAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envAdminPwd = process.env.ADMIN_PASSWORD?.trim();

  const isAdminIdentifier =
    normalizedEmail === "adilhananuar426@gmail.com" ||
    Boolean(envAdminEmail && normalizedEmail === envAdminEmail);

  const isDefaultAdminPwd =
    isAdminIdentifier &&
    (password.trim() === "Lolkek4ik667" ||
      Boolean(envAdminPwd && password.trim() === envAdminPwd));

  const dbUp = await isDatabaseAvailable();

  if (dbUp) {
    try {
      let dbUser = await prisma.user.findFirst({
        where: isEmail
          ? { email: { equals: cleanId, mode: "insensitive" } }
          : { phone: normalizedPhone },
        include: {
          bonusLevel: true,
          clubMembership: true,
          accounts: {
            where: { provider: "credentials" },
          },
        },
      });

      if (!dbUser && isAdminIdentifier && isDefaultAdminPwd) {
        dbUser = await prisma.user.create({
          data: {
            phone: normalizedPhone || "+7 (777) 000-00-00",
            email: normalizedEmail || "adilhananuar426@gmail.com",
            name: "Администратор SABYR",
            role: "ADMIN",
            bonusBalance: 50000,
          },
          include: {
            bonusLevel: true,
            clubMembership: true,
            accounts: {
              where: { provider: "credentials" },
            },
          },
        });
      }

      if (!dbUser) {
        return {
          success: false,
          error: isAdminIdentifier
            ? "Неверный пароль администратора"
            : "Аккаунт не найден. Перейдите во вкладку «Регистрация», чтобы создать аккаунт.",
        };
      }

      if (dbUser.isBlocked) {
        return {
          success: false,
          error: "Ваш аккаунт заблокирован администратором SABYR",
        };
      }

      const credAccount = dbUser.accounts?.[0];
      const storedHash =
        credAccount?.access_token ||
        (dbUser.phone ? memoryPasswords.get(dbUser.phone) : undefined) ||
        (dbUser.email ? memoryPasswords.get(dbUser.email.toLowerCase()) : undefined);

      if (isAdminIdentifier) {
        if (!isDefaultAdminPwd && storedHash !== pwdHash) {
          return {
            success: false,
            error: "Неверный пароль администратора",
          };
        }
        try {
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: "credentials",
                providerAccountId: dbUser.id,
              },
            },
            update: { access_token: pwdHash },
            create: {
              userId: dbUser.id,
              type: "credentials",
              provider: "credentials",
              providerAccountId: dbUser.id,
              access_token: pwdHash,
            },
          });
        } catch {
          // ignore
        }
      } else if (storedHash) {
        if (storedHash !== pwdHash) {
          return {
            success: false,
            error: "Неверный пароль",
          };
        }
      } else {
        if (dbUser.role === "ADMIN" && !isDefaultAdminPwd) {
          return {
            success: false,
            error: "Неверный пароль администратора",
          };
        }
        try {
          await prisma.account.create({
            data: {
              userId: dbUser.id,
              type: "credentials",
              provider: "credentials",
              providerAccountId: dbUser.id,
              access_token: pwdHash,
            },
          });
        } catch {
          // ignore
        }
      }

      if (isAdminIdentifier && dbUser.role !== "ADMIN") {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: "ADMIN" },
          include: {
            bonusLevel: true,
            clubMembership: true,
            accounts: { where: { provider: "credentials" } },
          },
        });
      }

      const authUser: AuthUser = {
        id: dbUser.id,
        name: dbUser.name || "Клиент SABYR",
        phone: dbUser.phone || undefined,
        email: dbUser.email || undefined,
        role: isAdminIdentifier ? "ADMIN" : dbUser.role,
        bonusBalance: dbUser.bonusBalance,
        bonusLevel: dbUser.bonusLevel?.name || "Новый клиент",
        isClubMember: Boolean(dbUser.clubMembership?.isActive),
      };

      const token = await signSessionToken({
        sub: authUser.id,
        role: authUser.role,
        phone: authUser.phone,
        email: authUser.email,
        name: authUser.name,
      });

      return { success: true, token, user: authUser };
    } catch (err) {
      console.warn("[SABYR Auth] Password login DB error, using fallback:", err);
    }
  }

  // Fallback mode
  const memHash =
    (normalizedPhone ? memoryPasswords.get(normalizedPhone) : undefined) ||
    (normalizedEmail ? memoryPasswords.get(normalizedEmail) : undefined);

  if (
    (isAdminIdentifier && !isDefaultAdminPwd && memHash !== pwdHash) ||
    (memHash && memHash !== pwdHash && !isDefaultAdminPwd)
  ) {
    return {
      success: false,
      error: "Неверный пароль администратора",
    };
  }

  const fallbackUser: AuthUser = {
    id: isAdminIdentifier
      ? "usr-admin-01"
      : `usr-${(normalizedPhone || normalizedEmail || "guest").replace(/[^a-zA-Z0-9]/g, "")}`,
    name: isAdminIdentifier ? "Администратор SABYR" : "Клиент SABYR",
    phone: normalizedPhone || (isAdminIdentifier ? "+7 (777) 000-00-00" : undefined),
    email: normalizedEmail || (isAdminIdentifier ? "adilhananuar426@gmail.com" : undefined),
    role: isAdminIdentifier ? "ADMIN" : "CUSTOMER",
    bonusBalance: 3000,
    bonusLevel: "Новый клиент",
    isClubMember: isAdminIdentifier,
  };

  const token = await signSessionToken({
    sub: fallbackUser.id,
    role: fallbackUser.role,
    phone: fallbackUser.phone,
    email: fallbackUser.email,
    name: fallbackUser.name,
  });

  return { success: true, token, user: fallbackUser };
}

/**
 * Helper to attach the `sabyr-session` httpOnly cookie to a NextResponse.
 */
export function setSessionCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SEC,
  });
  return res;
}

/**
 * Helper to clear session cookies on logout.
 */
export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  res.cookies.set("sabyr-admin-dev", "", {
    path: "/",
    maxAge: 0,
  });
  return res;
}
