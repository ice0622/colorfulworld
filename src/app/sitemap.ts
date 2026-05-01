// app/sitemap.ts (これ1つだけを app/ 直下に置く)

import { config } from "@/config";
import { getPosts } from "@/lib/content";
import type { MetadataRoute } from "next";
import urlJoin from "url-join";
// TagList.tsx と共通化したロジックをインポート
import { fetchActiveTagsAndCounts } from "@/lib/tagUtils"; // ※前回作成した共通ファイル

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // --- 1. CMSから動的データを取得 (記事とタグ) ---

  // 記事 (Post) を取得
  const postResult = await getPosts({ limit: 1000 }); // 全件取得
  const posts = postResult.posts.map((post) => ({
    url: urlJoin(config.baseUrl, "blog", post.slug),
    lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
    priority: 0.8,
  }));

  // タグ (Tag) を取得 (★ TagList.tsx と同じ共通ロジックを使用)
  // wisp.getTags() から変更
  const { tags: activeTags } = await fetchActiveTagsAndCounts();

  const tags = activeTags.map((tag) => ({
    url: urlJoin(config.baseUrl, "tag", tag.name),
    lastModified: new Date(), // タグページの最終更新日は（必要ならCMSから取得）
    priority: 0.8,
  }));

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
    lastModified: new Date(),
    priority: page.priority,
  }));

  // --- 3. すべてを合体して返す ---
  return [
    ...staticRoutes,
    ...posts,
    ...tags, // これで「実際に使われているタグ」だけがサイトマップに含まれます
  ];
}