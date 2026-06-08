import type { Config } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

// CLI 実行時に .env.local / .env から DATABASE_URL を読む
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
