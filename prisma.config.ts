import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

// Load .env.local first (Next.js convention), fallback to .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  datasource: {
    // Use direct (non-pooler) URL for Prisma CLI (db push / migrate)
    // At runtime, Next.js uses DATABASE_URL (pooler) from .env.local
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/sabyr",
  },
});

