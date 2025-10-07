import { MetadataRoute } from "next";
import { wisp } from "../lib/wisp";
import { config } from "@/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const result = await wisp.getPosts({ limit: 100 });

  const posts = result.posts.map((post) => ({
    url: `${config.baseUrl}/blog/${post.slug}`,
    lastModified: post.publishedAt || new Date(),
  }));

  return [
    {
      url: config.baseUrl,
      lastModified: new Date(),
    },
    ...posts,
  ];
}