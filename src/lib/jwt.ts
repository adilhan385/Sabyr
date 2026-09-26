/**
 * SABYR JWT helpers
 * Signs / verifies session tokens via jose (Edge-compatible).
 */
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET ?? "sabyr-super-secret-jwt-key-change-in-production-min32chars";
const secret = new TextEncoder().encode(JWT_SECRET);

export const SESSION_COOKIE = "sabyr-session";
export const SESSION_DURATION_SEC = 60 * 60 * 24 * 30; // 30 days

export interface JWTPayload {
  sub: string;          // user.id
  role: "CUSTOMER" | "ADMIN";
  phone?: string;
  email?: string;
  name?: string;
}

export async function signSessionToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SEC}s`)
    .setIssuer("sabyr.kz")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: "sabyr.kz" });
    return {
      sub: payload.sub as string,
      role: payload["role"] as "CUSTOMER" | "ADMIN",
      phone: payload["phone"] as string | undefined,
      email: payload["email"] as string | undefined,
      name: payload["name"] as string | undefined,
    };
  } catch {
    return null;
  }
}
