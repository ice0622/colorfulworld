import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

// 記事本体。本文は raw markdown を body_md に保存し、読み出し時に HTML 化する。
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: integer("number").notNull().default(0), // 連番（並びのタイブレーク）
    slug: text("slug").notNull().unique(), // Post.id と Post.slug
    title: text("title").notNull().default(""),
    seoTitle: text("seo_title"), // 検索語入りの <title>/OG タイトル（未入力なら title にフォールバック）
    description: text("description").notNull().default(""),
    bodyMd: text("body_md").notNull().default(""), // 生 markdown
    coverImage: text("cover_image"), // coverImage / image（同値）
    camera: text("camera"), // 撮影データ（作例）: カメラ
    lens: text("lens"), // 撮影データ（作例）: レンズ
    filmStock: text("film_stock"), // 撮影データ（作例）: フィルム銘柄
    category: text("category").notNull().default("daily"), // trip|tech|daily（書き込み時に確定）
    featured: boolean("featured").notNull().default(false),
    draft: boolean("draft").notNull().default(true), // 公開 = draft=false
    location: text("location").array().notNull().default([]), // slug 済み
    metaTags: text("meta_tags").array().notNull().default([]),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (t) => ({
    // 一覧の主クエリ経路：公開判定 → 日付降順 → 連番降順
    listIdx: index("posts_list_idx").on(t.draft, t.publishedAt, t.number),
  })
);

// タグ（id=name、現状の {id:name, name:name} に合わせる）
export const tags = pgTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

// 記事⇔タグの中間テーブル
export const postTags = pgTable(
  "post_tags",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.tagId] }),
    tagIdx: index("post_tags_tag_idx").on(t.tagId),
  })
);

export type PostRow = typeof posts.$inferSelect;
export type NewPostRow = typeof posts.$inferInsert;
export type TagRow = typeof tags.$inferSelect;
