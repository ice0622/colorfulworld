"use client";
import Link from "next/link";
import { FunctionComponent, useEffect, useState } from "react";

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

export const TagList: FunctionComponent = () => {
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

  if (tags.length === 0) return null; // タグが無い場合は非表示

  return (
    <section className="mt-8 md:mt-16 mb-12">
      <h2 className="text-xs font-semibold tracking-wider text-muted-foreground mb-2 border-t border-current pt-2">
        CATEGORIES
      </h2>
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
    </section>
  );
};
