// app/sitemap.ts (これ1つだけを app/ 直下に置く)

import { config } from "@/config";
import { getPosts } from "@/lib/content";
import type { MetadataRoute } from "next";
import urlJoin from "url-join";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // --- 1. CMSから動的データを取得 (記事とタグ) ---

  // 記事 (Post) を取得
  const postResult = await getPosts({ limit: 1000 }); // 全件取得
  const posts = postResult.posts.map((post) => ({
    url: urlJoin(config.baseUrl, "blog", post.slug),
    lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
    priority: 0.8,
    // cover 画像を画像サイトマップに含める（絶対URL化）。Blob は既に絶対、ルート相対は baseUrl 前置。
    images: post.image
      ? [post.image.startsWith("http") ? post.image : urlJoin(config.baseUrl, post.image)]
      : undefined,
  }));

  // タグ (Tag) の一覧ページは noindex, follow 方針にしたためサイトマップから除外。
  // （一覧ページ自体は検索対象にせず、記事本文に評価を集中させる）

  // --- 2. 固定ページ (Static) を定義 ---

  // (トップ, /blog一覧, /tag一覧, /about などを全部ここにまとめる)
  const staticPaths = [
    { path: "/", priority: 1.0 },           // トップページ
    { path: "/blog", priority: 0.9 },       // ブログ一覧
    { path: "/tag", priority: 0.8 },        // タグ一覧
    { path: "/about", priority: 0.9 },      // aboutページ
  ];

  const staticRoutes = staticPaths.map((page) => ({
    url: urlJoin(config.baseUrl, page.path),
    // lastModified は省略（上記タグと同様、固定値/現在時刻は lastmod の信頼性を損なう）
    priority: page.priority,
  }));

  // --- 3. すべてを合体して返す ---
  return [
    ...staticRoutes,
    ...posts,
  ];
}