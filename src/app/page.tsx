import { Footer } from "@/components/Footer";
import HomeHero from "@/components/HomeHero";
import { config } from "@/config";
import { getPosts } from "@/lib/content";
import { POST_LOCATIONS } from "@/lib/locations";
import type { Post } from "@/types/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "旅・技術・日常をつづる個人ブログ。Web開発の知見や海外旅行の記録を発信しています。",
  alternates: {
    canonical: config.baseUrl,
  },
};

const Page = async () => {
  // 全ロケーションの代表記事をサーバーサイドで一括取得（クライアントAPIコールをゼロにする）
  const locationPostsEntries = await Promise.all(
    POST_LOCATIONS.map(async (loc) => {
      const result = await getPosts({ locationSlug: loc.slug, limit: 1 });
      return [loc.slug, result.posts[0] ?? null] as [string, Post | null];
    })
  );
  const locationPosts = Object.fromEntries(locationPostsEntries) as Record<string, Post | null>;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 items-center justify-center">
        <HomeHero locationPosts={locationPosts} />
      </main>

      <div className="container mx-auto px-5">
        <Footer />
      </div>
    </div>
  );
};

export default Page;
