"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { GeistPixelSquare } from "geist/font/pixel";
import { PostLocation } from "@/lib/locations";
import type { Post } from "@/types/content";

const geistPixel = GeistPixelSquare;

type Props = {
  location: PostLocation;
  isActive: boolean;
  post: Post | null;
  /** クリック時に LocationCardOverlay を開くためのコールバック */
  onSelect?: () => void;
};

// ---- サイズ定数 ----
const CARD_WIDTH = "w-14 sm:w-16";
const PHOTO_SIZES = "(max-width: 640px) 56px, 64px";
const PADDING_TOP = "p-[4px]";
const PADDING_BTM = "pb-2";
const LABEL_SIZE = "text-[8px]";
// -------------------

// ---- 傾き設定（ここを変えるだけで全カードの傾き範囲が変わる）----
const MIN_TILT = 1; // 最小傾き（度）
const MAX_TILT = 3; // 最大傾き（度）
// ---------------------------------------------------------------

// slug から決定的な傾き角度を生成する
function getTiltAngle(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  const sign = hash % 2 === 0 ? 1 : -1;
  const range = MAX_TILT - MIN_TILT;
  const magnitude = MIN_TILT + (Math.abs(hash) % (range + 1));
  return sign * magnitude;
}

export default function PolaroidCard({ location, isActive, post, onSelect }: Props) {
  const label =
    location.slug.charAt(0).toUpperCase() + location.slug.slice(1);

  const tiltAngle = useMemo(() => getTiltAngle(location.slug), [location.slug]);

  // NOTE: cobe が `:root` に設定する --cobe-visible-* は数値ではなく "N" 文字列のため
  // opacity / scale には使えない。isActive prop を直接使う。
  return (
    <div
      style={{
        position: "absolute",
        ...({
          // cobe が各マーカーの screen 座標に 1px のアンカー div を生成し
          // anchor-name: --cobe-{slug} を付与するので、それを参照する
          positionAnchor: `--cobe-${location.slug}`,
          // カードの左端 = アンカー中心 X → translate -50% で水平中央揃え
          left: "anchor(center)",
          // カードの下端 = アンカー中心 Y → 座標の真上に表示
          bottom: "anchor(center)",
        } as React.CSSProperties),
        // アンカーから 8px 上に余白を取り、決定的な傾きを付ける
        // isActive が変わると scale 0↔1 でアンカーから伸び出るように遷移
        opacity: isActive ? 1 : 0,
        transform:
          `translate(-50%, -8px) ` +
          `rotate(${tiltAngle}deg) ` +
          `scale(${isActive ? 1 : 0})`,
        // スケールはカード下端中央（アンカー付近）を起点に伸びる
        transformOrigin: "center bottom",
        pointerEvents: isActive && post ? "auto" : "none",
        zIndex: 10,
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {post ? (
        <button
          type="button"
          onClick={onSelect}
          className="block text-left cursor-pointer"
        >
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
        </button>
      ) : null}
    </div>
  );
}
