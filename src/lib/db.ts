import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString =
    process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/sabyr";
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
// Cache reset: isDatabaseAvailable() re-checks on every cold start (module reload
// in dev) by NOT caching across Node module reloads, but caches within the same
// request cycle to avoid repeated queries.

let _isConnected: boolean | null = null;

export async function isDatabaseAvailable(): Promise<boolean> {
  // Return cached value within the same server process lifetime
  if (_isConnected !== null) return _isConnected;

  if (!process.env.DATABASE_URL) {
    console.info("[SABYR DB] Running in mock/local mode: DATABASE_URL not set.");
    _isConnected = false;
    return false;
  }

  try {
    await prisma.$queryRaw`SELECT "isBlocked" FROM "users" LIMIT 1`;
    _isConnected = true;
    console.info("[SABYR DB] Connected to SABYR Neon PostgreSQL.");
    return true;
  } catch (err) {
    _isConnected = false;
    console.warn(
      "[SABYR DB] Running in fallback mode: PostgreSQL unreachable or wrong DATABASE_URL schema.",
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

/** Force re-check on next call (e.g. after config changes in dev) */
export function resetDbStatusCache(): void {
  _isConnected = null;
}
