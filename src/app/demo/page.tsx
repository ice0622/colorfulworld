import { PostIndexList } from "@/components/PostIndexList";
import { config } from "@/config";
import { getPosts } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Index (demo)",
  // デモのうちは検索エンジンに載せない
  robots: { index: false, follow: false },
};

const Page = async () => {
  const { posts } = await getPosts({ limit: "all" });

  return (
    <div className="mb-20">
      {/* ヘッダー部：サイト名 ＋ 一言紹介 */}
      <header className="mb-8 px-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {config.blog.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          旅・技術・日常の記録。
        </p>
      </header>

      <PostIndexList posts={posts} />
    </div>
  );
};

export default Page;
