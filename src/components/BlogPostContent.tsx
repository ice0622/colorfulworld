"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

// remark-html は standalone 画像を <p><img></p> として出力する
// 画像の直後にキャプションテキストが続く場合（<p><img/>テキスト</p>）も処理する
function extractImgEl(block: ChildNode): { img: Element; caption?: string } | null {
  if (block.nodeName === "IMG") return { img: block as Element };
  if (block.nodeName === "P") {
    const children = Array.from((block as Element).childNodes).filter(
      (n) => !(n.nodeName === "#text" && !n.textContent?.trim())
    );
    if (children.length >= 1 && children[0].nodeName === "IMG") {
      const caption = children.slice(1).map((n) => n.textContent).join("").trim();
      return { img: children[0] as Element, caption: caption || undefined };
    }
  }
  return null;
}

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
      code: ["class"],
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
        {contentBlocks.map((block, index) => {
          const imgData = extractImgEl(block);
          return (
            <motion.div
              key={index}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="prose lg:prose-xl dark:prose-invert mx-auto"
            >
              {imgData ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgData.img.getAttribute("src") ?? ""}
                    alt={imgData.img.getAttribute("alt") ?? ""}
                    className="w-full rounded-lg"
                  />
                  {imgData.caption && <p>{imgData.caption}</p>}
                </>
              ) : block.nodeName !== "#text" && block.nodeName !== "#comment" ? (
                <div dangerouslySetInnerHTML={{ __html: (block as Element).outerHTML }} />
              ) : (
                <p>{block.textContent}</p>
              )}
            </motion.div>
          );
        })}
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
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [titleExtraHeight, setTitleExtraHeight] = useState(0);

  useLayoutEffect(() => {
    if (titleRef.current) {
      // scaleY(2) で視覚的高さが2倍になるが layout 高さは変わらないため差分を補正
      setTitleExtraHeight(titleRef.current.offsetHeight);
    }
  }, [post?.title]);

  useEffect(() => {
    if (!post?.content) return;
    document.querySelectorAll("pre code").forEach((el) => {
      hljs.highlightElement(el as HTMLElement);
    });
  }, [post?.content]);

  if (!post) return null;

  const { title, publishedAt, createdAt, content, tags } = post;

  return (
    <div>
      {/* タイトルエリア */}
      <div className="mx-auto max-w-4xl mt-4" style={{ paddingBottom: `${titleExtraHeight + 32}px` }}>
        <h1
          ref={titleRef}
          className="text-3xl sm:text-4xl lg:text-5xl font-black break-words leading-tight"
          style={{
            fontFamily: "var(--font-noto-serif-jp)",
            fontWeight: 900,
            transform: "scaleY(1.6)",
            transformOrigin: "top left",
            letterSpacing: "-0.06em",
            display: "inline-block",
            width: "100%",
          }}
        >
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