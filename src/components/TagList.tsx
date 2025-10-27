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
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});

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

        const counts: Record<string, number> = {};
        const allTags: Tag[] = [];

        data.posts.forEach((post: Post) => {
          post.tags.forEach((tag) => {
            if (!allTags.find((t) => t.id === tag.id)) allTags.push(tag);
            counts[tag.id] = (counts[tag.id] || 0) + 1;
          });
        });

        setTags(allTags);
        setTagCounts(counts);
      } catch (err) {
        console.error("タグ取得エラー:", err);
      }
    };

    fetchTagsFromPosts();
  }, []);

  if (tags.length === 0) return null;

  return (
    <section className="mt-8 md:mt-16 mb-12">
      <h2 className="text-xs font-semibold tracking-wider text-muted-foreground mb-2 border-t border-current pt-2">
        CATEGORIES
      </h2>
      <div className="flex flex-col items-start gap-1 mb-4">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-1">
            <Link
              href={`/tag/${tag.name}`}
              className="text-sm text-primary hover:underline inline underline decoration-2 underline-offset-4 decoration-transparent hover:decoration-primary transition"
            >
              {tag.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              ({tagCounts[tag.id] || 0})
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
