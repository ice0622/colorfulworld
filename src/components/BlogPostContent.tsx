"use client";

import { useEffect } from "react";
import { GetPostResult } from "@/lib/wisp";
import Link from "next/link";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

export const BlogPostContent = ({ post }: { post: GetPostResult["post"] }) => {
  useEffect(() => {
    if (!post?.content) return; // ← ここで中身を判定する
    document.querySelectorAll("pre code").forEach((el) => {
      hljs.highlightElement(el as HTMLElement);
    });
  }, [post?.content]);

  if (!post) return null;

  const { title, publishedAt, createdAt, content, tags } = post;

  return (
    <div>
      <div className="prose lg:prose-xl dark:prose-invert mx-auto max-w-4xl mb-10 lg:mt-20 break-words [&_h1]:text-2xl sm:[&_h1]:text-3xl lg:[&_h1]:text-4xl">
        <h1>{title}</h1>

        <article
          dangerouslySetInnerHTML={{ __html: content }}
        />

        <div className="mt-10 opacity-40 text-sm">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tag/${tag.name}`}
              className="text-primary mr-2"
            >
              #{tag.name}
            </Link>
          ))}
        </div>

        <div className="text-sm opacity-40 mt-4">
          {new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(publishedAt || createdAt))}
        </div>
      </div>
    </div>
  );
};
