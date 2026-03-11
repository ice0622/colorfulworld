import { config } from "@/config";
import { wisp } from "@/lib/wisp";
import type { MetadataRoute } from "next";
import urlJoin from "url-join";
import { fetchActiveTagsAndCounts } from "@/lib/tagUtils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const postResult = await wisp.getPosts({ limit: 1000 });
  const posts = postResult.posts.map((post) => ({
    url: urlJoin(config.baseUrl, "blog", post.slug),
    lastModified: new Date(post.updatedAt),
    priority: 0.8,
  }));

  const { tags: activeTags } = await fetchActiveTagsAndCounts();
  const tags = activeTags.map((tag) => ({
    url: urlJoin(config.baseUrl, "tag", tag.name),
    lastModified: new Date(),
    priority: 0.8,
  }));

  const staticPaths = [
    { path: "/", priority: 1.0 },
    { path: "/blog", priority: 0.9 },
    { path: "/tag", priority: 0.8 },
    { path: "/about", priority: 0.9 },
  ];

  const staticRoutes = staticPaths.map((page) => ({
    url: urlJoin(config.baseUrl, page.path),
    lastModified: new Date(),
    priority: page.priority,
  }));

  return [
    ...staticRoutes,
    ...posts,
    ...tags,
  ];
}
