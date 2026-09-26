import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({
    success: true,
    message: "Вы вышли из аккаунта",
  });
  return clearSessionCookie(res);
}
