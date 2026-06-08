import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// DATABASE_URL が未設定なら null。content.ts はこの場合 markdown フォールバックに切り替える。
const databaseUrl = process.env.DATABASE_URL;

export const hasDb = Boolean(databaseUrl);

// Neon HTTP ドライバ + Drizzle。サーバーレスでコネクションプール不要。
export const db = databaseUrl
  ? drizzle(neon(databaseUrl), { schema })
  : (null as unknown as ReturnType<typeof drizzle>);

export { schema };
