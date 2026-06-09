import fs from "fs";
import path from "path";
import { unstable_cache } from "next/cache";
import { and, arrayContains, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type {
  Post,
  PostCategory,
  GetPostsResult,
  GetPostResult,
  GetRelatedPostsResult,
  Tag,
} from "@/types/content";
import { db, hasDb } from "@/db/client";
import { posts as postsTable, tags as tagsTable, postTags } from "@/db/schema";
import type { PostRow } from "@/db/schema";
import { markdownToHtml, parsePostFrontmatter } from "@/lib/postParse";

// markdownToHtml はプレビューAPI等でも使うため再エクスポート
export { markdownToHtml };

// ============================================================
// 共通：行/パース結果 → Post 変換
// ============================================================
function rowToPost(
  row: PostRow,
  tagList: { id: string; name: string }[],
  html = ""
): Post {
  return {
    id: row.slug,
    number: row.number,
    slug: row.slug,
    title: row.title,
    description: row.description,
    content: html,
    image: row.coverImage,
    coverImage: row.coverImage,
    tags: tagList,
    category: row.category as PostCategory,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: (row.createdAt ?? new Date()).toISOString(),
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    featured: row.featured,
    draft: row.draft,
    location: row.location,
    metaTags: row.metaTags,
    author: null,
  };
}

// ============================================================
// DB 実装
// ============================================================
// 並び順：COALESCE(published_at, created_at) DESC, number DESC
const ORDER_DATE = sql`coalesce(${postsTable.publishedAt}, ${postsTable.createdAt})`;

async function tagsForPosts(
  ids: string[]
): Promise<Record<string, { id: string; name: string }[]>> {
  if (ids.length === 0) return {};
  const rows = await db
    .select({
      postId: postTags.postId,
      id: tagsTable.id,
      name: tagsTable.name,
    })
    .from(postTags)
    .innerJoin(tagsTable, eq(postTags.tagId, tagsTable.id))
    .where(inArray(postTags.postId, ids));

  const map: Record<string, { id: string; name: string }[]> = {};
  for (const r of rows) {
    (map[r.postId] ??= []).push({ id: r.id, name: r.name });
  }
  return map;
}

async function getPostsDb(options?: {
  limit?: number | "all";
  page?: number;
  tags?: string[];
  locationSlug?: string;
  includeDrafts?: boolean;
}): Promise<GetPostsResult> {
  const { limit = 6, page = 1, tags, locationSlug, includeDrafts = false } =
    options ?? {};

  const conds = [];
  if (!includeDrafts) conds.push(eq(postsTable.draft, false));
  // location 指定が tags より優先（現状の短絡を踏襲）
  if (locationSlug) {
    conds.push(arrayContains(postsTable.location, [locationSlug.toLowerCase()]));
  } else if (tags && tags.length > 0) {
    const sub = db
      .select({ pid: postTags.postId })
      .from(postTags)
      .where(inArray(postTags.tagId, tags));
    conds.push(inArray(postsTable.id, sub));
  }
  const where = conds.length ? and(...conds) : undefined;

  const baseRows = await db
    .select()
    .from(postsTable)
    .where(where)
    .orderBy(desc(ORDER_DATE), desc(postsTable.number));

  const total = baseRows.length;

  let pageRows: PostRow[];
  let pagination: GetPostsResult["pagination"];

  if (limit === "all") {
    pageRows = baseRows;
    pagination = {
      page: 1,
      limit: "all",
      totalPages: 1,
      nextPage: null,
      prevPage: null,
    };
  } else {
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    pageRows = baseRows.slice(start, start + limit);
    pagination = {
      page,
      limit,
      totalPages,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };
  }

  const tagMap = await tagsForPosts(pageRows.map((r) => r.id));
  return {
    posts: pageRows.map((r) => rowToPost(r, tagMap[r.id] ?? [])),
    pagination,
  };
}

async function getPostDb(slug: string): Promise<GetPostResult> {
  const rows = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.slug, slug))
    .limit(1);
  const row = rows[0];
  if (!row) return { post: null };

  const tagMap = await tagsForPosts([row.id]);
  const html = await markdownToHtml(row.bodyMd);
  return { post: rowToPost(row, tagMap[row.id] ?? [], html) };
}

async function getRelatedPostsDb(options: {
  slug: string;
  limit?: number;
}): Promise<GetRelatedPostsResult> {
  const { slug, limit = 3 } = options;

  const current = await db
    .select({ id: postsTable.id })
    .from(postsTable)
    .where(eq(postsTable.slug, slug))
    .limit(1);
  if (!current[0]) return { posts: [] };

  const tagIdRows = await db
    .select({ tagId: postTags.tagId })
    .from(postTags)
    .where(eq(postTags.postId, current[0].id));
  const tagIds = tagIdRows.map((r) => r.tagId);
  if (tagIds.length === 0) return { posts: [] };

  // 同じタグを持つ他の公開記事
  const sub = db
    .select({ pid: postTags.postId })
    .from(postTags)
    .where(inArray(postTags.tagId, tagIds));

  const rows = await db
    .select()
    .from(postsTable)
    .where(
      and(
        eq(postsTable.draft, false),
        ne(postsTable.slug, slug),
        inArray(postsTable.id, sub)
      )
    )
    .orderBy(desc(ORDER_DATE), desc(postsTable.number))
    .limit(limit);

  const tagMap = await tagsForPosts(rows.map((r) => r.id));
  return { posts: rows.map((r) => rowToPost(r, tagMap[r.id] ?? [])) };
}

async function getTagsDb(): Promise<{
  tags: Tag[];
  counts: Record<string, number>;
}> {
  // 公開記事に紐づくタグのみ・公開記事数でカウント（現状準拠）
  const rows = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      count: sql<number>`count(${postTags.postId})::int`,
    })
    .from(tagsTable)
    .innerJoin(postTags, eq(postTags.tagId, tagsTable.id))
    .innerJoin(postsTable, eq(postsTable.id, postTags.postId))
    .where(eq(postsTable.draft, false))
    .groupBy(tagsTable.id, tagsTable.name);

  const tags: Tag[] = [];
  const counts: Record<string, number> = {};
  for (const r of rows) {
    tags.push({ id: r.id, name: r.name });
    counts[r.id] = r.count;
  }
  return { tags, counts };
}

// ============================================================
// markdown フォールバック実装（DATABASE_URL 未設定時）
// content/posts/*.md をそのまま読む（移行前 / 退避路）
// ============================================================
const POSTS_DIR = path.join(process.cwd(), "content/posts");

function getPostFilenames(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"));
}

function parsedToPost(
  raw: string,
  html = ""
): Post | null {
  const p = parsePostFrontmatter(raw);
  if (!p) return null;
  return {
    id: p.slug,
    number: p.number,
    slug: p.slug,
    title: p.title,
    description: p.description,
    content: html,
    image: p.coverImage,
    coverImage: p.coverImage,
    tags: p.tags.map((t) => ({ id: t, name: t })),
    category: p.category,
    publishedAt: p.publishedAt,
    createdAt: p.publishedAt || new Date().toISOString(),
    updatedAt: p.updatedAt,
    featured: p.featured,
    draft: p.draft,
    location: p.location,
    metaTags: p.metaTags,
    author: null,
  };
}

function allMarkdownPosts(): Post[] {
  const out: Post[] = [];
  for (const f of getPostFilenames()) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), "utf-8");
    const post = parsedToPost(raw);
    if (post) out.push(post);
  }
  return out.sort((a, b) => {
    const da = new Date(a.publishedAt || a.createdAt).getTime();
    const dbt = new Date(b.publishedAt || b.createdAt).getTime();
    if (dbt !== da) return dbt - da;
    return b.number - a.number;
  });
}

async function getPostsMd(options?: {
  limit?: number | "all";
  page?: number;
  tags?: string[];
  locationSlug?: string;
  includeDrafts?: boolean;
}): Promise<GetPostsResult> {
  const { limit = 6, page = 1, tags, locationSlug, includeDrafts = false } =
    options ?? {};
  const filtered = allMarkdownPosts().filter((p) => {
    if (!includeDrafts && p.draft) return false;
    if (locationSlug) return p.location.includes(locationSlug.toLowerCase());
    if (tags && tags.length > 0)
      return tags.some((t) => p.tags.some((pt) => pt.name === t));
    return true;
  });

  if (limit === "all") {
    return {
      posts: filtered,
      pagination: { page: 1, limit: "all", totalPages: 1, nextPage: null, prevPage: null },
    };
  }
  const totalPages = Math.ceil(filtered.length / limit);
  const start = (page - 1) * limit;
  return {
    posts: filtered.slice(start, start + limit),
    pagination: {
      page,
      limit,
      totalPages,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
  };
}

async function getPostMd(slug: string): Promise<GetPostResult> {
  for (const f of getPostFilenames()) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), "utf-8");
    const parsed = parsePostFrontmatter(raw);
    if (parsed?.slug === slug) {
      const html = await markdownToHtml(parsed.bodyMd);
      return { post: parsedToPost(raw, html) };
    }
  }
  return { post: null };
}

async function getRelatedPostsMd(options: {
  slug: string;
  limit?: number;
}): Promise<GetRelatedPostsResult> {
  const { slug, limit = 3 } = options;
  const { post: current } = await getPostMd(slug);
  if (!current) return { posts: [] };
  const currentTagNames = current.tags.map((t) => t.name);
  const all = allMarkdownPosts();
  const related = all
    .filter((p) => p.slug !== slug)
    .filter((p) => p.tags.some((t) => currentTagNames.includes(t.name)))
    .slice(0, limit);
  return { posts: related };
}

async function getTagsMd(): Promise<{ tags: Tag[]; counts: Record<string, number> }> {
  const posts = allMarkdownPosts().filter((p) => !p.draft);
  const counts: Record<string, number> = {};
  const tagsMap = new Map<string, Tag>();
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      if (!tagsMap.has(tag.id)) tagsMap.set(tag.id, { id: tag.id, name: tag.name });
      counts[tag.id] = (counts[tag.id] || 0) + 1;
    });
  });
  return { tags: Array.from(tagsMap.values()), counts };
}

// ============================================================
// 公開 API（シグネチャ不変）— DB あれば DB、無ければ markdown
// DB 読み出しは unstable_cache でタグ付け：
//  - 公開時の revalidateTag で即時無効化（操作したデプロイ）
//  - revalidate 秒で時間経過後に自動再検証（別環境で編集した場合の追従）
// ============================================================
const REVALIDATE_SECONDS = 60;

export async function getPosts(options?: {
  limit?: number | "all";
  page?: number;
  tags?: string[];
  locationSlug?: string;
  includeDrafts?: boolean;
}): Promise<GetPostsResult> {
  if (!hasDb) return getPostsMd(options);
  const cached = unstable_cache(
    () => getPostsDb(options),
    ["getPosts", JSON.stringify(options ?? {})],
    { tags: ["posts"], revalidate: REVALIDATE_SECONDS }
  );
  return cached();
}

export async function getPost(slug: string): Promise<GetPostResult> {
  if (!hasDb) return getPostMd(slug);
  const cached = unstable_cache(() => getPostDb(slug), ["getPost", slug], {
    tags: ["posts", `post:${slug}`],
    revalidate: REVALIDATE_SECONDS,
  });
  return cached();
}

export async function getRelatedPosts(options: {
  slug: string;
  limit?: number;
}): Promise<GetRelatedPostsResult> {
  if (!hasDb) return getRelatedPostsMd(options);
  const cached = unstable_cache(
    () => getRelatedPostsDb(options),
    ["getRelatedPosts", JSON.stringify(options)],
    { tags: ["posts"], revalidate: REVALIDATE_SECONDS }
  );
  return cached();
}

export async function getTags(): Promise<{
  tags: Tag[];
  counts: Record<string, number>;
}> {
  if (!hasDb) return getTagsMd();
  const cached = unstable_cache(() => getTagsDb(), ["getTags"], {
    tags: ["posts", "tags"],
    revalidate: REVALIDATE_SECONDS,
  });
  return cached();
}
