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
    setLoading(true);
    wisp
      .getPosts({ tags: location.wispTags, limit: 1 })
      .then(({ posts }) => {
        if (posts.length > 0) setPost(posts[0]);
      })
      .finally(() => setLoading(false));
  }, [location]);

  if (loading || !post) return null;

  const label =
    location.slug.charAt(0).toUpperCase() + location.slug.slice(1);

  return (
    <div
      style={{
        position: "absolute",
        ...({
          positionAnchor: `--cobe-${location.slug}`,
          opacity: isActive
            ? `var(--cobe-visible-${location.slug}, 0)`
            : "0",
          left: "anchor(center)",
          bottom: "anchor(top)",
        } as React.CSSProperties),
        transform: "translate(-50%, -10px)",
        pointerEvents: "auto",
        zIndex: 10,
        transition: "opacity 0.3s ease",
      }}
    >
      <Link href={`/blog/${post.slug}`} className="block">
        {/* ポラロイド本体 */}
        <div
          className={`bg-white shadow-xl border border-gray-200 ${CARD_WIDTH} ${PADDING_TOP} ${PADDING_BTM}`}
        >
          {/* 写真 */}
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

          {/* ラベル（Geist Pixel） */}
          <div
            className={`mt-1 text-center text-gray-800 tracking-[0.08em] ${LABEL_SIZE} ${geistPixel.className}`}
          >
            {label}
          </div>
        </div>
      </Link>
    </div>
  );
}