"use client";

import { useEffect, useState } from "react";
import type { GetPostResult } from "@/types/content";
import Link from "next/link";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import sanitize, { defaults } from "sanitize-html";
import { motion } from "framer-motion";
// 参考コードに合わせて画像ハイライトのトグルを用意（存在する場合のみ有効）
import ImageHighright from "./ImageHighright";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export const PostContent = ({ content }: { content: string }) => {
  const [showSlider, setShowSlider] = useState(false);

  // 許可タグ・属性を明示してサニタイズ
  const sanitizedContent = sanitize(content, {
    allowedTags: [
      "b",
      "br",
      "i",
      "em",
      "strong",
      "a",
      "img",
      "h1",
      "h2",
      "h3",
      "code",
      "pre",
      "p",
      "li",
      "ul",
      "ol",
      "blockquote",
      "td",
      "th",
      "table",
      "tr",
      "tbody",
      "thead",
      "tfoot",
      "small",
      "div",
      "iframe",
    ],
    allowedAttributes: {
      ...defaults.allowedAttributes,
      "*": ["style"],
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      iframe: ["src", "allowfullscreen", "style"],
      code: ["class"], // 言語クラスを残すとハイライトが効く
      pre: [],
    },
    allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com"],
  });

  // ブロック単位に分割
  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitizedContent, "text/html");
  const contentBlocks = Array.from(doc.body.childNodes);

  // ブロックがレンダリングされた後にコードハイライト
  useEffect(() => {
    document.querySelectorAll("pre code").forEach((el) => {
      hljs.highlightElement(el as HTMLElement);
    });
  }, [sanitizedContent]);

  return (
    <div className="blog-content mx-auto">
      <div className="space-y-6">
        {contentBlocks.map((block, index) => (
          <motion.div
            key={index}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="prose lg:prose-xl dark:prose-invert mx-auto"
          >
            {block.nodeType === Node.ELEMENT_NODE ? (
              <div dangerouslySetInnerHTML={{ __html: (block as Element).outerHTML }} />
            ) : (
              <p>{block.textContent}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* 参考実装に合わせたハイライト画像のトグル（任意） */}
      <div className="flex justify-center mt-4">
        <button
          className="p-2 bg-white text-black border border-black rounded hover:bg-black hover:text-white transition-colors duration-300"
          onClick={() => setShowSlider((v) => !v)}
        >
          {showSlider ? "閉じる" : "ハイライト"}
        </button>
      </div>
      {showSlider && <ImageHighright content={sanitizedContent} />}
    </div>
  );
};

export const BlogPostContent = ({ post }: { post: GetPostResult["post"] }) => {
  useEffect(() => {
    if (!post?.content) return;
    // 念のため、ページ初回表示でもハイライトを走らせる
    document.querySelectorAll("pre code").forEach((el) => {
      hljs.highlightElement(el as HTMLElement);
    });
  }, [post?.content]);

  if (!post) return null;

  const { title, publishedAt, createdAt, content, tags } = post;

  return (
    <div>
      {/* タイトルエリア：本文proseの外に出して大きく表示 */}
      <div className="mx-auto max-w-4xl mb-8 mt-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight break-words">
          {title}
        </h1>
      </div>
      <div
        className="prose lg:prose-lg dark:prose-invert mx-auto max-w-4xl mb-10 break-words"
      >
        {/* ふわっと要素単位で表示 */}
        <PostContent content={content} />

        <div className="mt-10 opacity-40 text-sm">
          {tags.map((tag) => (
            <Link key={tag.id} href={`/tag/${tag.name}`} className="text-primary mr-2">
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