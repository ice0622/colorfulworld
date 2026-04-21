import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkHtml from "remark-html";
import type {
  Post,
  GetPostsResult,
  GetPostResult,
  GetRelatedPostsResult,
  Tag,
} from "@/types/content";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

// ----------------------------------------
// ファイル一覧取得（_template.md を除外）
// ----------------------------------------
function getPostFilenames(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"));
}

// ----------------------------------------
// Markdownファイル → Post 変換
// （includContent: true のときだけ本文をHTMLに変換）
// ----------------------------------------
async function parsePostFile(
  filename: string,
  includeContent = false
): Promise<Post | null> {
  const filePath = path.join(POSTS_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  // slug が未設定のファイルはスキップ
  if (!data.slug) return null;

  const tags: Post["tags"] = Array.isArray(data.tags)
    ? data.tags
      .filter(Boolean)
      .map((t: string) => ({ id: t, name: t }))
    : [];

  const metaTags: string[] = Array.isArray(data.metaTags)
    ? data.metaTags.filter(Boolean)
    : [];

  let htmlContent = "";
  if (includeContent) {
    const processed = await remark()
      .use(remarkGfm)
      .use(remarkBreaks)
      .use(remarkHtml, { sanitize: false })
      .process(content);
    htmlContent = processed.toString();
  }

  const coverImage: string | null = data.coverImage || null;

  return {
    id: data.slug,
    number: data.number ?? 0,
    slug: data.slug,
    title: data.title || "",
    description: data.description || "",
    content: htmlContent,
    image: coverImage,
    coverImage,
    tags,
    publishedAt: data.date || null,
    createdAt: data.date || new Date().toISOString(),
    updatedAt: data.updated || null,
    featured: data.featured ?? false,
    draft: data.draft ?? false,
    location: data.location || "",
    metaTags,
    author: null,
  };
}

// ----------------------------------------
// getPosts
// ----------------------------------------
export async function getPosts(options?: {
  limit?: number | "all";
  page?: number;
  tags?: string[];
  locationSlug?: string;
  includeDrafts?: boolean;
}): Promise<GetPostsResult> {
  const { limit = 6, page = 1, tags, locationSlug, includeDrafts = false } = options ?? {};

  const filenames = getPostFilenames();
  const allPosts = (
    await Promise.all(filenames.map((f) => parsePostFile(f, false)))
  ).filter((p): p is Post => p !== null);

  // 下書き除外（本番では draft: true を非表示）
  const filtered = allPosts.filter((p) => {
    if (!includeDrafts && p.draft) return false;
    // locationSlug による絞り込み（post.location に slug が含まれるかチェック）
    if (locationSlug) {
      return p.location?.toLowerCase().includes(locationSlug.toLowerCase()) ?? false;
    }
    if (tags && tags.length > 0) {
      return tags.some((t) => p.tags.some((pt) => pt.name === t));
    }
    return true;
  });

  // 日付降順ソート
  const sorted = filtered.sort((a, b) => {
    const dateA = new Date(a.publishedAt || a.createdAt).getTime();
    const dateB = new Date(b.publishedAt || b.createdAt).getTime();
    return dateB - dateA;
  });

  if (limit === "all") {
    return {
      posts: sorted,
      pagination: {
        page: 1,
        limit: "all",
        totalPages: 1,
        nextPage: null,
        prevPage: null,
      },
    };
  }

  const totalPages = Math.ceil(sorted.length / limit);
  const start = (page - 1) * limit;
  const paginatedPosts = sorted.slice(start, start + limit);

  return {
    posts: paginatedPosts,
    pagination: {
      page,
      limit,
      totalPages,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
  };
}

// ----------------------------------------
// getPost（記事詳細：本文HTMLを含む）
// ----------------------------------------
export async function getPost(slug: string): Promise<GetPostResult> {
  const filenames = getPostFilenames();

  for (const filename of filenames) {
    const filePath = path.join(POSTS_DIR, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    if (data.slug === slug) {
      const post = await parsePostFile(filename, true);
      return { post };
    }
  }

  return { post: null };
}

// ----------------------------------------
// getRelatedPosts（同じタグを持つ記事を取得）
// ----------------------------------------
export async function getRelatedPosts(options: {
  slug: string;
  limit?: number;
}): Promise<GetRelatedPostsResult> {
  const { slug, limit = 3 } = options;

  const current = await getPost(slug);
  if (!current.post) return { posts: [] };

  const currentTagNames = current.post.tags.map((t) => t.name);

  const { posts: allPosts } = await getPosts({ limit: "all" });

  const related = allPosts
    .filter((p) => p.slug !== slug)
    .filter((p) => p.tags.some((t) => currentTagNames.includes(t.name)))
    .slice(0, limit);

  return { posts: related };
}

// ----------------------------------------
// getTags（全タグと記事数）
// ----------------------------------------
export async function getTags(): Promise<{
  tags: Tag[];
  counts: Record<string, number>;
}> {
  const { posts } = await getPosts({ limit: "all" });

  const countsMap: Record<string, number> = {};
  const tagsMap: Map<string, Tag> = new Map();

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      if (!tagsMap.has(tag.id)) {
        tagsMap.set(tag.id, { id: tag.id, name: tag.name });
      }
      countsMap[tag.id] = (countsMap[tag.id] || 0) + 1;
    });
  });

  return {
    tags: Array.from(tagsMap.values()),
    counts: countsMap,
  };
}
