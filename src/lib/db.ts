import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const CLOUD_FALLBACK_DATABASE_URL =
  "postgresql://neondb_owner:npg_yHjUQvr6D1zO@ep-winter-shape-b5y1o02w-pooler.c-7.us-east-2.aws.neon.tech/neondb?uselibpqcompat=true&sslmode=require";

const CLOUD_SECONDARY_DATABASE_URL =
  "postgresql://neondb_owner:npg_BKuFXZgd6E7Y@ep-ancient-heart-a7oavhp0-pooler.ap-southeast-2.aws.neon.tech/neondb?uselibpqcompat=true&sslmode=require";

export function sanitizeDatabaseUrl(rawInput?: string): string | null {
  if (!rawInput) return null;
  let cleaned = rawInput.trim();
  if (cleaned.toLowerCase().startsWith("psql ")) {
    cleaned = cleaned.slice(5).trim();
  }
  cleaned = cleaned.replace(/^['"`]+|['"`]+$/g, "").trim();
  if (
    !cleaned ||
    (!cleaned.startsWith("postgresql://") && !cleaned.startsWith("postgres://")) ||
    cleaned.includes("USER:PASSWORD") ||
    cleaned.includes("localhost") ||
    cleaned.includes("127.0.0.1")
  ) {
    return null;
  }
  if (cleaned.includes("sslmode=require") && !cleaned.includes("uselibpqcompat=true")) {
    cleaned = cleaned.replace("sslmode=require", "uselibpqcompat=true&sslmode=require");
  }
  return cleaned;
}

export function getEffectiveDatabaseUrl(): string {
  return sanitizeDatabaseUrl(process.env.DATABASE_URL) || CLOUD_FALLBACK_DATABASE_URL;
}

function buildPrismaClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  activePrisma: PrismaClient | undefined;
  isConnected: boolean | undefined;
  lastDbError: string | null | undefined;
};

let _activePrisma: PrismaClient =
  globalForPrisma.activePrisma ?? buildPrismaClient(getEffectiveDatabaseUrl());
globalForPrisma.activePrisma = _activePrisma;

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, _receiver) {
    const value = Reflect.get(_activePrisma as object, prop, _activePrisma);
    return typeof value === "function" ? value.bind(_activePrisma) : value;
  },
});

export function getLastDbError(): string | null {
  return globalForPrisma.lastDbError ?? null;
}

// ─── DB availability check with automatic multi-endpoint failover ─────────────

export async function isDatabaseAvailable(): Promise<boolean> {
  if (globalForPrisma.isConnected === true) return true;

  const candidateUrls = Array.from(
    new Set([
      getEffectiveDatabaseUrl(),
      CLOUD_FALLBACK_DATABASE_URL,
      CLOUD_SECONDARY_DATABASE_URL,
    ])
  );

  for (let i = 0; i < candidateUrls.length; i++) {
    const url = candidateUrls[i];
    const client = i === 0 ? _activePrisma : buildPrismaClient(url);
    try {
      await client.$queryRaw`SELECT 1`;
      _activePrisma = client;
      globalForPrisma.activePrisma = client;
      globalForPrisma.isConnected = true;
      globalForPrisma.lastDbError = null;
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      globalForPrisma.lastDbError = msg;
      console.warn(`[SABYR DB] Connection candidate #${i + 1} failed:`, msg);
    }
  }

  return false;
}

/** Force re-check on next call */
export function resetDbStatusCache(): void {
  globalForPrisma.isConnected = undefined;
}

