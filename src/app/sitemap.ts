// app/sitemap.ts (これ1つだけを app/ 直下に置く)

import { config } from "@/config";
import { wisp } from "@/lib/wisp";
import type { MetadataRoute } from "next";
import urlJoin from "url-join"; // urlJoinも忘れずにインポート

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // --- 1. CMSから動的データを取得 (記事とタグ) ---

  // 記事 (Post) を取得
  const postResult = await wisp.getPosts({ limit: 1000 }); // 念のため件数を多く
  const posts = postResult.posts.map((post) => ({
    url: urlJoin(config.baseUrl, "blog", post.slug),
    lastModified: new Date(post.updatedAt),
    priority: 0.8,
  }));

  // タグ (Tag) を取得
  const tagResult = await wisp.getTags();
  const tags = tagResult.tags.map((tag) => ({
    url: urlJoin(config.baseUrl, "tag", tag.name),
    lastModified: new Date(),
    priority: 0.8,
  }));

  // --- 2. 固定ページ (Static) を定義 ---

  // (トップ, /blog一覧, /tag一覧, /about などを全部ここにまとめる)
  const staticPaths = [
    { path: "/", priority: 1.0 },           // トップページ
    { path: "/blog", priority: 0.9 },       // ブログ一覧
    { path: "/tag", priority: 0.8 },        // タグ一覧
    { path: "/about", priority: 0.9 },      // (app/static/sitemap.ts から持ってきた)
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
    ...tags,
  ];
}