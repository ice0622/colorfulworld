"use client";
import { config } from "@/config";
import { Rss } from "lucide-react";
import Link from "next/link";
import { FunctionComponent, useEffect, useState } from "react";
import { DarkModeToggle } from "./DarkModeToggle";
import { Button } from "./ui/button";

// タグ型
interface Tag {
  id: string;
  name: string;
  description?: string | null;
}

// 記事型（必要な部分だけ）
interface Post {
  id: string;
  tags: Tag[];
}

export const Footer: FunctionComponent = () => {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    const fetchTagsFromPosts = async () => {
      try {
        const blogId = process.env.NEXT_PUBLIC_BLOG_ID;
        if (!blogId) {
          console.error("NEXT_PUBLIC_BLOG_ID が設定されていません");
          return;
        }

        const res = await fetch(`https://www.wisp.blog/api/v1/${blogId}/posts?limit=all`);
        const data = await res.json();

        // 記事からタグを集めて重複排除
        const allTags: Tag[] = data.posts
          .flatMap((post: Post) => post.tags)
          .reduce((acc: Tag[], tag: Tag) => {
            if (!acc.find((t) => t.id === tag.id)) acc.push(tag);
            return acc;
          }, []);

        setTags(allTags);
      } catch (err) {
        console.error("タグ取得エラー:", err);
      }
    };

    fetchTagsFromPosts();
  }, []);

  return (
    <section className="mt-8 md:mt-16 mb-12">
      <div className="mb-6">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground mb-2 border-t border-current pt-2">
          CATEGORIES
        </h2>
        {/* タグ一覧：縦並び */}
        <div className="flex flex-col items-start gap-1 mb-4">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tag/${tag.name}`}
              className="text-sm text-primary hover:underline inline-block underline decoration-2 underline-offset-4 decoration-transparent hover:decoration-primary transition"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      </div>
      {/* 上部：コピーライト・RSS・ダークモード */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-muted-foreground">
          © {config.blog.copyright} {new Date().getFullYear()}
        </div>
        <div className="text-xs text-muted-foreground hidden lg:block">
          <Link
            href={`https://wisp.blog/?utm_source=next-js-template&utm_medium=web&utm_campaign=${config.baseUrl}`}
          >
            Blog powered by wisp
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/rss" className="w-auto inline-flex">
            <Button variant="ghost" className="p-2">
              <Rss className="w-4 h-4" />
            </Button>
          </Link>
          <DarkModeToggle />
        </div>
      </div>
      {/* 小画面用コピーライト */}
      <div className="text-xs text-muted-foreground lg:hidden">
        <Link
          href={`https://wisp.blog/?utm_source=next-js-template&utm_medium=web&utm_campaign=${config.baseUrl}`}
        >
          Blog powered by wisp
        </Link>
      </div>
    </section>
  );
};
