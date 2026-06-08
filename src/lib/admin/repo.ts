// 管理画面用の DB 書き込み/読み出し（content.ts は公開側の読み出し専用なので分離）
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { posts, tags as tagsTable, postTags } from "@/db/schema";
import type { PostRow } from "@/db/schema";
import { deriveCategory } from "@/lib/postParse";
import { locationQueryToSlug } from "@/lib/locations";

const ORDER_DATE = sql`coalesce(${posts.publishedAt}, ${posts.createdAt})`;

export type AdminListItem = {
  id: string;
  slug: string;
  title: string;
  draft: boolean;
  featured: boolean;
  category: string;
  publishedAt: string | null;
  tags: string[];
};

export type AdminPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  bodyMd: string;
  coverImage: string | null;
  location: string[];
  metaTags: string[];
  tags: string[];
  featured: boolean;
  draft: boolean;
  publishedAt: string | null;
};

async function tagNamesByPost(ids: string[]): Promise<Record<string, string[]>> {
  if (ids.length === 0) return {};
  const rows = await db
    .select({ postId: postTags.postId, name: tagsTable.name })
    .from(postTags)
    .innerJoin(tagsTable, eq(postTags.tagId, tagsTable.id))
    .where(inArray(postTags.postId, ids));
  const map: Record<string, string[]> = {};
  for (const r of rows) (map[r.postId] ??= []).push(r.name);
  return map;
}

export async function listAllPosts(): Promise<AdminListItem[]> {
  const rows = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.draft), desc(ORDER_DATE), desc(posts.number));
  const tagMap = await tagNamesByPost(rows.map((r) => r.id));
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    draft: r.draft,
    featured: r.featured,
    category: r.category,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    tags: tagMap[r.id] ?? [],
  }));
}

export async function getAdminPost(id: string): Promise<AdminPost | null> {
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  const row = rows[0] as PostRow | undefined;
  if (!row) return null;
  const tagMap = await tagNamesByPost([row.id]);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    bodyMd: row.bodyMd,
    coverImage: row.coverImage,
    location: row.location,
    metaTags: row.metaTags,
    tags: tagMap[row.id] ?? [],
    featured: row.featured,
    draft: row.draft,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
  };
}

async function replaceTags(postId: string, tagNames: string[]) {
  for (const name of tagNames) {
    await db.insert(tagsTable).values({ id: name, name }).onConflictDoNothing();
  }
  await db.delete(postTags).where(eq(postTags.postId, postId));
  if (tagNames.length > 0) {
    await db
      .insert(postTags)
      .values(tagNames.map((name) => ({ postId, tagId: name })))
      .onConflictDoNothing();
  }
}

export type UpsertInput = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  bodyMd: string;
  coverImage: string | null;
  tags: string[];
  location: string[]; // 人間入力（保存時に slug 化）
  metaTags: string[];
  publishedAt: string | null;
  featured: boolean;
};

export async function upsertPost(
  input: UpsertInput
): Promise<{ id: string; slug: string }> {
  const location = input.location
    .map((l) => locationQueryToSlug(l.trim()))
    .filter(Boolean);
  const category = deriveCategory(input.tags, location.length > 0);
  const publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;

  const common = {
    slug: input.slug,
    title: input.title,
    description: input.description,
    bodyMd: input.bodyMd,
    coverImage: input.coverImage,
    category,
    location,
    metaTags: input.metaTags,
    featured: input.featured,
    publishedAt,
  };

  if (input.id) {
    const [row] = await db
      .update(posts)
      .set({ ...common, updatedAt: new Date() })
      .where(eq(posts.id, input.id))
      .returning({ id: posts.id, slug: posts.slug });
    await replaceTags(input.id, input.tags);
    return row;
  }

  const [row] = await db
    .insert(posts)
    .values({ ...common, draft: true, createdAt: publishedAt ?? new Date() })
    .returning({ id: posts.id, slug: posts.slug });
  await replaceTags(row.id, input.tags);
  return row;
}

// 公開/非公開トグル。slug を返す（revalidate 用）
export async function setPublished(
  id: string,
  published: boolean
): Promise<string | undefined> {
  const cur = await db
    .select({ publishedAt: posts.publishedAt, slug: posts.slug })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);
  if (!cur[0]) return undefined;

  const set: Record<string, unknown> = { draft: !published, updatedAt: new Date() };
  if (published && !cur[0].publishedAt) set.publishedAt = new Date();
  await db.update(posts).set(set).where(eq(posts.id, id));
  return cur[0].slug;
}

export async function deletePost(id: string): Promise<string | undefined> {
  const [row] = await db
    .delete(posts)
    .where(eq(posts.id, id))
    .returning({ slug: posts.slug });
  return row?.slug;
}

// slug 重複チェック（編集中の自分自身は除外）
export async function slugExists(slug: string, exceptId?: string): Promise<boolean> {
  const rows = await db
    .select({ id: posts.id })
    .from(posts)
    .where(
      exceptId
        ? and(eq(posts.slug, slug), sql`${posts.id} <> ${exceptId}`)
        : eq(posts.slug, slug)
    )
    .limit(1);
  return rows.length > 0;
}
