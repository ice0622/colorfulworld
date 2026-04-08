"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PostLocation } from "@/lib/locations";
import { wisp } from "@/lib/wisp";
import { GetPostsResult } from "@wisp-cms/client";

type Post = GetPostsResult["posts"][0];

type Props = {
  location: PostLocation;
  isActive: boolean;
};

export default function PolaroidCard({ location, isActive }: Props) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    wisp
      .getPosts({ tags: location.wispTags, limit: 1 })
      .then(({ posts }) => {
        if (posts.length > 0) {
          setPost(posts[0]);
        }
      })
      .finally(() => setLoading(false));
  }, [location]);

  if (loading || !post) return null;

  return (
    <div
      style={{
        position: "absolute",
        // CSS Anchor Positioning (csstype がまだ未対応のため型アサーション)
        ...({
          positionAnchor: `--cobe-${location.slug}`,
          opacity: isActive ? `var(--cobe-visible-${location.slug}, 0)` : "0",
          left: "anchor(center)",
          bottom: "anchor(top)",
        } as React.CSSProperties),
        transform: "translate(-50%, -10px)",
        pointerEvents: "auto",
        zIndex: 10,
        transition: "opacity 0.3s ease",
      }}
      className="group"
    >
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="bg-white p-1.5 pb-5 shadow-xl border border-gray-200 rotate-[-2deg] group-hover:rotate-0 transition-transform duration-300 w-12 sm:w-16">
          <div className="relative aspect-square overflow-hidden bg-gray-100">
            {post.image ? (
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 56px, 64px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] p-2 text-center">
                {post.title}
              </div>
            )}
          </div>
          <div className="mt-1 text-[8px] font-medium text-gray-700 truncate px-0.5">
            {location.name}
          </div>
        </div>
      </Link>
    </div>
  );
}
