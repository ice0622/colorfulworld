"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GeistPixelSquare } from "geist/font/pixel";
import { PostLocation } from "@/lib/locations";
import { wisp } from "@/lib/wisp";
import { GetPostsResult } from "@wisp-cms/client";

const geistPixel = GeistPixelSquare;

type Post = GetPostsResult["posts"][0];

type Props = {
  location: PostLocation;
  isActive: boolean;
};

// ---- サイズ定数 ----
const CARD_WIDTH = "w-14 sm:w-16";
const PHOTO_SIZES = "(max-width: 640px) 56px, 64px";
const PADDING_TOP = "p-[4px]";
const PADDING_BTM = "pb-2";
const LABEL_SIZE = "text-[8px]";
// -------------------

export default function PolaroidCard({ location, isActive }: Props) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    wisp
      .getPosts({ tags: location.wispTags, limit: 1 })
      .then(({ posts }) => {
        if (!cancelled && posts.length > 0) {
          setPost(posts[0]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [location]);

  const label =
    location.slug.charAt(0).toUpperCase() + location.slug.slice(1);

  return (
    <div
      style={{
        position: "absolute",
        ...({
          positionAnchor: `--cobe-${location.slug}`,
          opacity: isActive ? `var(--cobe-visible-${location.slug}, 0)` : "0",
          left: "anchor(center)",
          bottom: "anchor(top)",
        } as React.CSSProperties),
        transform:
          `translate(-50%, calc(-10px + (1 - var(--cobe-visible-${location.slug}, 0)) * 12px)) ` +
          `scale(calc(0.92 + var(--cobe-visible-${location.slug}, 0) * 0.08))`,
        pointerEvents: isActive && post ? "auto" : "none",
        zIndex: 10,
        filter: `blur(calc((1 - var(--cobe-visible-${location.slug}, 0)) * 6px))`,
        transition: "opacity 0.3s ease, transform 0.3s ease, filter 0.3s ease",
      }}
    >
      {post ? (
        <Link href={`/blog/${post.slug}`} className="block">
          <div
            className={`bg-white shadow-xl border border-gray-200 ${CARD_WIDTH} ${PADDING_TOP} ${PADDING_BTM}`}
          >
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              {post.image ? (
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes={PHOTO_SIZES}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] p-1 text-center leading-tight">
                  {post.title}
                </div>
              )}
            </div>

            <div
              className={`mt-1 text-center text-gray-800 tracking-[0.08em] ${LABEL_SIZE} ${geistPixel.className}`}
            >
              {label}
            </div>
          </div>
        </Link>
      ) : loading ? (
        <div
          className={`bg-white/90 shadow-xl border border-gray-200 ${CARD_WIDTH} ${PADDING_TOP} ${PADDING_BTM}`}
        >
          <div className="aspect-square bg-gray-100 animate-pulse" />
          <div
            className={`mt-1 text-center text-gray-500 tracking-[0.08em] ${LABEL_SIZE} ${geistPixel.className}`}
          >
            {label}
          </div>
        </div>
      ) : null}
    </div>
  );
}