"use client";

import { useMemo } from "react";
import { createPortal } from "react-dom";
import { VT323 } from "next/font/google";
import { POST_LOCATIONS } from "@/lib/locations";
import type { Post } from "@/types/content";
import type { PostLocation } from "@/lib/locations";

const vt323 = VT323({ weight: "400", subsets: ["latin"], display: "swap" });

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function formatBoardDate(post: Post | null | undefined): string {
  const dateStr = post?.publishedAt ?? post?.createdAt;
  if (!dateStr) return "---";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "---";
    return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;
  } catch {
    return "---";
  }
}


type Props = {
  locationPosts: Record<string, Post | null>;
  onNavigate: (loc: PostLocation) => void;
};

export default function DepartureBoardOverlay({ locationPosts, onNavigate }: Props) {
  const boardLocations = useMemo(() => {
    const shuffled = [...POST_LOCATIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(3, POST_LOCATIONS.length));
  }, []);

  return createPortal(
    <div
      className={vt323.className}
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {/* 支柱2本（画面上端 → 看板上部） */}
      <div style={{ display: "flex", width: "100%", justifyContent: "space-between", padding: "0 22%" }}>
        <div style={{ width: 2, height: 48, background: "rgba(255,255,255,0.22)", boxShadow: "0 0 4px rgba(255,255,255,0.12)" }} />
        <div style={{ width: 2, height: 48, background: "rgba(255,255,255,0.22)", boxShadow: "0 0 4px rgba(255,255,255,0.12)" }} />
      </div>
      {/* 看板本体 */}
      <div
        className="bg-black border border-white/25 overflow-hidden"
        style={{
          minWidth: "280px",
          pointerEvents: "auto",
          boxShadow: "0 0 16px rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center justify-between px-3 py-1 border-b border-white/20 bg-white/5">
          <span className="text-white/50 tracking-[0.25em] uppercase" style={{ fontSize: "11px" }}>
            ◀ DEPARTURE
          </span>
          <span className="text-white/30 tracking-widest" style={{ fontSize: "11px" }}>
            GLOBE ▶
          </span>
        </div>
        {boardLocations.map((loc, i) => (
          <button
            key={loc.slug}
            onClick={() => onNavigate(loc)}
            className={[
              "w-full flex items-center gap-2 px-3 py-1 text-left cursor-pointer",
              "hover:bg-white/5 active:bg-white/10 transition-colors",
              i < boardLocations.length - 1 ? "border-b border-white/10" : "",
            ].join(" ")}
          >
            <span className="text-white/60 text-sm shrink-0" style={{ textShadow: "0 0 6px rgba(255,255,255,0.5)" }}>
              ◎
            </span>
            <span className="text-white flex-1 text-sm tracking-widest" style={{ textShadow: "0 0 6px rgba(255,255,255,0.4)" }}>
              {loc.query.split(",")[0].trim().toUpperCase()}
            </span>
            <span className="text-white/80 text-sm tabular-nums shrink-0" style={{ textShadow: "0 0 6px rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>
              {formatBoardDate(locationPosts[loc.slug])}
            </span>
            <span className="text-white/50 text-sm shrink-0" style={{ textShadow: "0 0 5px rgba(255,255,255,0.4)" }}>
              →
            </span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}
