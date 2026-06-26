"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { GetPostResult } from "@/types/content";
import Link from "next/link";
import Image from "next/image";
import { getImageMeta } from "@/lib/imageManifest";
import LikeButton from "@/components/LikeButton";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import sanitize, { defaults } from "sanitize-html";
import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// 本文画像の共通クラス。next/image の inline 寸法を h-auto/w-auto で上書きし、
// max-w-full でコンテナ幅(672px)に収め、縦長は max-h-[80vh] で抑える。
const CONTENT_IMG_CLASS =
  "mx-auto h-auto max-h-[80vh] w-auto max-w-full rounded-lg";
// 本文の表示幅は最大 672px（prose コンテナ）。これに合わせて最適化バリアントを配信。
const CONTENT_IMG_SIZES = "(max-width: 672px) 100vw, 672px";
// ヒーローは左寄せで最大 800px に抑える（後段の max-w-[800px] と一致）。
// ソース実寸 1600px を 800px × DPR2 として使い切り、Retina でも等倍＝シャープにする。
// （ここを実表示幅より小さく宣言すると小さいバリアントが選ばれて拡大ボケする）
const HERO_IMG_SIZES = "(max-width: 768px) 100vw, 800px";

// サムネ（cover）を記事先頭のヒーローで大きく見せる。
// 本文画像と同様に manifest から実寸+blur を引き、CLS なし+blur→鮮明を実現する。
// 先頭の大画像（LCP）なので priority で先読みする。
function HeroImage({ src, alt }: { src: string; alt: string }) {
  const meta = getImageMeta(src);

  // decode 不能な画像は最適化を回避して素のまま配信（無回帰）。
  if (meta && "unoptimized" in meta) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="h-auto w-full" />;
  }

  // マニフェスト収録: 実寸 + blur プレースホルダ（自然なアスペクト比のまま）。
  if (meta) {
    return (
      <Image
        src={src}
        alt={alt}
        width={meta.w}
        height={meta.h}
        quality={90}
        sizes={HERO_IMG_SIZES}
        placeholder="blur"
        blurDataURL={meta.blur}
        className="h-auto w-full"
        priority
      />
    );
  }

  // 未収録（新規アップロード直後）: 最適化のみ・blurなし・暫定比(16:9)。
  return (
    <Image
      src={src}
      alt={alt}
      width={1600}
      height={900}
      quality={90}
      sizes={HERO_IMG_SIZES}
      className="h-auto w-full"
      priority
    />
  );
}

// 本文画像を next/image で最適化配信する。
// マニフェスト(getImageMeta)から実寸+blurを引き、レイアウトシフトなし+blur→鮮明を実現。
function ContentImage({ src, alt }: { src: string; alt: string }) {
  const meta = getImageMeta(src);

  // decode 不能な画像（拡張子詐称のAVIF等）は最適化を回避して素のまま配信（無回帰）。
  if (meta && "unoptimized" in meta) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={CONTENT_IMG_CLASS} />;
  }

  // マニフェスト収録: 実寸 + blur プレースホルダ。
  if (meta) {
    return (
      <Image
        src={src}
        alt={alt}
        width={meta.w}
        height={meta.h}
        quality={90}
        sizes={CONTENT_IMG_SIZES}
        placeholder="blur"
        blurDataURL={meta.blur}
        className={CONTENT_IMG_CLASS}
      />
    );
  }

  // 未収録（新規アップロード直後でマニフェスト未再生成）: 最適化のみ・blurなし・暫定比。
  return (
    <Image
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      quality={90}
      sizes={CONTENT_IMG_SIZES}
      className={CONTENT_IMG_CLASS}
    />
  );
}

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
                  <ContentImage src={imgSrc} alt={imgData.alt} />
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
    image,
  } = post;

  return (
    <div>
      {image ? (
        // サムネあり：ヒーロー。画像を左に大きく（右側に余白）、
        // タイトルは右上の余白へずらして右寄せに置く非対称レイアウト。
        <header className="mt-4 mb-10 sm:mb-14">
          <div className="grid grid-cols-12 items-start gap-y-6 sm:gap-y-8">
            <div
              className="col-span-12 row-start-1 sm:col-start-4 sm:col-span-9"
              style={{
                paddingBottom: `${Math.round(titleExtraHeight * 0.6)}px`,
              }}
            >
              <h1
                ref={titleRef}
                className="text-3xl sm:text-4xl lg:text-5xl font-black break-words leading-tight"
                style={{
                  fontFamily: "var(--font-noto-serif-jp)",
                  fontWeight: 900,
                  transform: "scaleY(1.6)",
                  transformOrigin: "top right",
                  letterSpacing: "-0.06em",
                  display: "inline-block",
                  width: "100%",
                  textAlign: "right",
                }}
              >
                {title}
              </h1>
            </div>
            {/* 完全左寄せ・最大800px（1600pxソースをRetinaで等倍に使い切る上限）。
                右側は大きく余白を残し、上のタイトル右寄せと非対称に組む。 */}
            <div className="col-span-12 row-start-2 max-w-[800px]">
              <HeroImage src={image} alt={title} />
            </div>
          </div>
        </header>
      ) : (
        // サムネなし：従来どおりタイトルのみ（左寄せ・読みやすい幅）。
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
      )}

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