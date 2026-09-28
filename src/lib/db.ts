import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const CLOUD_FALLBACK_DATABASE_URL =
  "postgresql://neondb_owner:npg_yHjUQvr6D1zO@ep-winter-shape-b5y1o02w-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

export function getEffectiveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (
    !raw ||
    raw.includes("USER:PASSWORD") ||
    raw.includes("localhost") ||
    raw.includes("127.0.0.1")
  ) {
    return CLOUD_FALLBACK_DATABASE_URL;
  }
  return raw;
}

function createPrismaClient(): PrismaClient {
  const connectionString = getEffectiveDatabaseUrl();
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ─── DB availability check ────────────────────────────────────────────────────

let _isConnected: boolean | null = null;

export async function isDatabaseAvailable(): Promise<boolean> {
  if (_isConnected === true) return true;

  try {
    await prisma.$queryRaw`SELECT "isBlocked" FROM "users" LIMIT 1`;
    _isConnected = true;
    return true;
  } catch (err) {
    console.warn(
      "[SABYR DB] PostgreSQL check failed, retrying on next request:",
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

/** Force re-check on next call (e.g. after config changes in dev) */
export function resetDbStatusCache(): void {
  _isConnected = null;
}
