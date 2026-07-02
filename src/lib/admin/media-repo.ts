// 画像ライブラリ（media テーブル）の読み書き。
// 画像の source of truth。アップロード時に1行追加し、ライブラリからの再利用・ソフト削除を担う。
import { and, desc, eq, isNull, lt } from "drizzle-orm";
import { db, hasDb } from "@/db/client";
import { media } from "@/db/schema";
import type { MediaRow } from "@/db/schema";

// クライアント（ピッカー/一覧）に渡す最小形。blur はプレースホルダ表示に使う。
export type MediaItem = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  blur: string | null;
  filename: string | null;
  createdAt: string;
};

function toItem(r: MediaRow): MediaItem {
  return {
    id: r.id,
    url: r.url,
    width: r.width,
    height: r.height,
    blur: r.blur,
    filename: r.filename,
    createdAt: r.createdAt.toISOString(),
  };
}

export type InsertMediaInput = {
  url: string;
  pathname: string | null;
  filename: string | null;
  mime: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  blur: string | null;
  source?: "blob" | "local";
};

// アップロード成功時に1行追加。URL 一意なので重複はスキップ（無害）。
export async function insertMedia(input: InsertMediaInput): Promise<void> {
  if (!hasDb) return;
  await db
    .insert(media)
    .values({ ...input, source: input.source ?? "blob" })
    .onConflictDoNothing({ target: media.url });
}

// ライブラリ一覧（新しい順）。createdAt カーソルで「もっと読む」に対応。
export async function listMedia(opts?: {
  limit?: number;
  before?: string; // この createdAt(ISO) より古いものを返す
}): Promise<MediaItem[]> {
  if (!hasDb) return [];
  const limit = Math.min(Math.max(opts?.limit ?? 60, 1), 200);
  const notDeleted = isNull(media.deletedAt);
  const where = opts?.before
    ? and(notDeleted, lt(media.createdAt, new Date(opts.before)))
    : notDeleted;
  const rows = await db
    .select()
    .from(media)
    .where(where)
    .orderBy(desc(media.createdAt))
    .limit(limit);
  return rows.map(toItem);
}

// ソフト削除：一覧から隠すだけ。Blob 実体・URL は残す。
export async function softDeleteMedia(id: string): Promise<void> {
  if (!hasDb) return;
  await db.update(media).set({ deletedAt: new Date() }).where(eq(media.id, id));
}
