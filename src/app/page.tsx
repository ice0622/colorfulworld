import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PostIndexList } from "@/components/PostIndexList";
import { config } from "@/config";
import { getPosts } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "旅・技術・日常をつづる個人ブログ。Web開発の知見や海外旅行の記録を発信しています。",
  alternates: {
    canonical: config.baseUrl,
  },
};

const Page = async () => {
  const { posts } = await getPosts({ limit: "all" });

  return (
    <>
      <Header />
      <div className="mb-20 pt-6 sm:pt-10">
        <h1 className="sr-only">{config.blog.name}</h1>

        <PostIndexList posts={posts} />

        <Footer />
      </div>
    </>
  );
};

export default Page;
