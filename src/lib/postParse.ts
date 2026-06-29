// frontmatter パースと markdown→HTML を一元化する共有モジュール。
// content.ts（md フォールバック）・移行スクリプト・プレビューAPI が共用し、
// レンダリングの parity を保証する。
// ※ tsx スクリプトからも読むため、内部 import は相対パスにする。
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkHtml from "remark-html";
import { locationQueryToSlug } from "./locations";

export type PostCategory = "trip" | "tech" | "daily";

// tags（TRIP / TECH / LIFE）からカテゴリを導出する。
// 該当タグが無ければ location の有無でフォールバック（あり=旅 / なし=日常）。
export function deriveCategory(
  tagNames: string[],
  hasLocation: boolean
): PostCategory {
  const upper = tagNames.map((t) => t.toUpperCase());
  if (upper.includes("TRIP")) return "trip";
  if (upper.includes("TECH")) return "tech";
  if (upper.includes("LIFE")) return "daily";
  return hasLocation ? "trip" : "daily";
}

// 生 markdown → HTML（content.ts と同一パイプライン。getPost / プレビューで共用）
export async function markdownToHtml(md: string): Promise<string> {
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkHtml, { sanitize: false })
    .process(md);
  return processed.toString();
}

// 正規化済みのパース結果（DB 行 / Post への橋渡し）
export type ParsedPost = {
  slug: string;
  number: number;
  title: string;
  description: string;
  bodyMd: string; // 生 markdown（HTML 化前）
  coverImage: string | null;
  category: PostCategory;
  featured: boolean;
  draft: boolean;
  location: string[]; // slug 済み
  metaTags: string[];
  tags: string[]; // タグ名
  seoTitle: string | null; // 検索語入りの <title>/OG タイトル（無ければ title）
  camera: string | null; // 撮影データ: カメラ
  lens: string | null; // 撮影データ: レンズ
  filmStock: string | null; // 撮影データ: フィルム銘柄
  publishedAt: string | null; // frontmatter `date`
  updatedAt: string | null; // frontmatter `updated`
};

// frontmatter 文字列 → ParsedPost。slug 未設定なら null（現状の挙動を踏襲）。
export function parsePostFrontmatter(raw: string): ParsedPost | null {
  const { data, content } = matter(raw);
  if (!data.slug) return null;

  const tags: string[] = Array.isArray(data.tags)
    ? data.tags.filter(Boolean).map((t: unknown) => String(t))
    : [];

  const metaTags: string[] = Array.isArray(data.metaTags)
    ? data.metaTags.filter(Boolean).map((t: unknown) => String(t))
    : [];

  const location: string[] = Array.isArray(data.location)
    ? data.location
        .map((l: string) => locationQueryToSlug(String(l).trim()))
        .filter(Boolean)
    : typeof data.location === "string" && data.location.trim()
      ? [locationQueryToSlug(data.location.trim())]
      : [];

  return {
    slug: data.slug,
    number: data.number ?? 0,
    title: data.title || "",
    seoTitle: data.seoTitle || null,
    description: data.description || "",
    bodyMd: content,
    coverImage: data.coverImage || null,
    camera: data.camera || null,
    lens: data.lens || null,
    filmStock: data.filmStock || null,
    category: deriveCategory(tags, location.length > 0),
    featured: data.featured ?? false,
    draft: data.draft ?? false,
    location,
    metaTags,
    tags,
    publishedAt: data.date || null,
    updatedAt: data.updated || null,
  };
}
