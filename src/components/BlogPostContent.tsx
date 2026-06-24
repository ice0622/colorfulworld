"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { GetPostResult } from "@/types/content";
import Link from "next/link";
import LikeButton from "@/components/LikeButton";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import sanitize, { defaults } from "sanitize-html";
import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// 画像とキャプションを解決する。
// キャプションの出所は 2 系統：
//   1) CMS（Crepe 画像ブロック）→ markdown の title 属性に入る（例: ![1.33](url "説明")）
//   2) 手書き markdown → 画像直後の同段落テキスト（![alt](url) のすぐ次の行）
// Crepe は alt にアスペクト比の数値を入れるため、数値 alt は意味を持たないものとして扱う。
function resolveImg(
  img: Element,
  trailing?: string
): { img: Element; caption?: string; alt: string } {
  const rawAlt = img.getAttribute("alt")?.trim() ?? "";
  const title = img.getAttribute("title")?.trim();
  const caption = trailing?.trim() || title || undefined;

  const altIsRatio = rawAlt !== "" && Number.isFinite(Number(rawAlt));
  const alt = altIsRatio ? (caption ?? "") : rawAlt;

  return { img, caption, alt };
}

function extractImgEl(
  block: ChildNode
): { img: Element; caption?: string; alt: string } | null {
  if (block.nodeName === "IMG") return resolveImg(block as Element);

  if (block.nodeName === "P") {
    const children = Array.from((block as Element).childNodes).filter(
      (n) => !(n.nodeName === "#text" && !n.textContent?.trim())
    );

    if (children.length >= 1 && children[0].nodeName === "IMG") {
      const trailing = children
        .slice(1)
        .map((n) => n.textContent)
        .join("")
        .trim();

      return resolveImg(children[0] as Element, trailing);
    }
  }

  return null;
}

export const PostContent = ({
  content,
  animate = true,
}: {
  content: string;
  animate?: boolean;
}) => {
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
    allowedIframeHostnames: [
      "www.youtube.com",
      "www.youtube-nocookie.com",
    ],
  });

  const [contentBlocks, setContentBlocks] = useState<ChildNode[]>([]);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      sanitizedContent,
      "text/html"
    );

    setContentBlocks(Array.from(doc.body.childNodes));
  }, [sanitizedContent]);

  useEffect(() => {
    document.querySelectorAll("pre code").forEach((el) => {
      hljs.highlightElement(el as HTMLElement);
    });
  }, [contentBlocks]);

  return (
    <div className="blog-content mx-auto">
      <div className="blog-flow">
        {contentBlocks.map((block, index) => {
          const imgData = extractImgEl(block);
          const imgSrc = imgData?.img.getAttribute("src") ?? "";

          const blockClass =
            "prose prose-neutral mx-auto " +
            "prose-h1:text-2xl prose-h1:font-bold " +
            "prose-h2:text-xl prose-h2:font-semibold " +
            "prose-h3:text-lg prose-h3:font-semibold";

          const inner = (
            <>
              {imgData && imgSrc ? (
                <figure className="my-6">
                  <img
                    src={imgSrc}
                    alt={imgData.alt}
                    className="mx-auto max-h-[80vh] w-auto max-w-full rounded-lg"
                  />
                  {imgData.caption && (
                    <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                      {imgData.caption}
                    </figcaption>
                  )}
                </figure>
              ) : imgData && !imgSrc ? (
                <p className="text-muted-foreground">{imgData.alt}</p>
              ) : block.nodeName !== "#text" &&
                block.nodeName !== "#comment" ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: (block as Element).outerHTML,
                  }}
                />
              ) : (
                <p>{block.textContent}</p>
              )}
            </>
          );

          return animate ? (
            <motion.div
              key={index}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className={blockClass}
            >
              {inner}
            </motion.div>
          ) : (
            <div key={index} className={blockClass}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const BlogPostContent = ({
  post,
  slug,
}: {
  post: GetPostResult["post"];
  slug: string;
}) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [titleExtraHeight, setTitleExtraHeight] = useState(0);

  useLayoutEffect(() => {
    if (titleRef.current) {
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

  const {
    title,
    publishedAt,
    createdAt,
    content,
    tags,
  } = post;

  return (
    <div>
      <div
        className="mx-auto max-w-2xl mt-4"
        style={{
          paddingBottom: `${titleExtraHeight + 32}px`,
        }}
      >
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

      <div className="prose prose-neutral mx-auto max-w-2xl break-words">
        <PostContent content={content} />
      </div>

      {/* メタ＋いいね：左に「#タグ・日付」の塊、右にいいねボタンを同じ行で右寄せ */}
      <div className="mx-auto mt-6 flex max-w-2xl items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm opacity-40">
          <span className="flex flex-wrap gap-x-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.name}`}
                className="text-primary hover:underline"
              >
                #{tag.name}
              </Link>
            ))}
          </span>
          <span>
            {new Intl.DateTimeFormat("ja-JP", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date(publishedAt || createdAt))}
          </span>
        </div>

        <LikeButton postId={post.id} title={title} slug={slug} />
      </div>
    </div>
  );
};