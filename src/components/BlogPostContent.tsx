"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { GetPostResult } from "@/types/content";
import Link from "next/link";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import sanitize, { defaults } from "sanitize-html";
import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

function extractImgEl(block: ChildNode): { img: Element; caption?: string } | null {
  if (block.nodeName === "IMG") return { img: block as Element };

  if (block.nodeName === "P") {
    const children = Array.from((block as Element).childNodes).filter(
      (n) => !(n.nodeName === "#text" && !n.textContent?.trim())
    );

    if (children.length >= 1 && children[0].nodeName === "IMG") {
      const caption = children
        .slice(1)
        .map((n) => n.textContent)
        .join("")
        .trim();

      return {
        img: children[0] as Element,
        caption: caption || undefined,
      };
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
                <>
                  <img
                    src={imgSrc}
                    alt={imgData.img.getAttribute("alt") ?? ""}
                    className="mx-auto max-h-[80vh] w-auto max-w-full rounded-lg"
                  />
                  {imgData.caption && <p>{imgData.caption}</p>}
                </>
              ) : imgData && !imgSrc ? (
                <p className="text-muted-foreground">
                  {imgData.img.getAttribute("alt") || ""}
                </p>
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
}: {
  post: GetPostResult["post"];
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

      <div className="prose prose-neutral mx-auto max-w-2xl mb-10 break-words">
        <PostContent content={content} />

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
          }).format(
            new Date(
              publishedAt || createdAt
            )
          )}
        </div>
      </div>
    </div>
  );
};