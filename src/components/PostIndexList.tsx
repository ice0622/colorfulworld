"use client";

import Link from "next/link";
import { formatDate } from "date-fns";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Post } from "@/types/content";

type Props = {
  posts: Post[];
};

function postDate(post: Post): Date {
  return new Date(post.publishedAt || post.createdAt);
}

// 年ごとにグルーピング（posts は日付降順で渡される前提）
function groupByYear(posts: Post[]): { year: number; posts: Post[] }[] {
  const groups: { year: number; posts: Post[] }[] = [];
  for (const post of posts) {
    const year = postDate(post).getFullYear();
    const last = groups[groups.length - 1];
    if (last && last.year === year) {
      last.posts.push(post);
    } else {
      groups.push({ year, posts: [post] });
    }
  }
  return groups;
}

// ---- イージング ----
// リキッドな“追従”: わずかにオーバーシュートする spring 風カーブ。
// ガラスのハイライトが次の行へぬるっと流れて、ふわっと落ち着く。
const SPRING = "cubic-bezier(0.34,1.4,0.5,1)";

type Rect = { top: number; left: number; width: number; height: number };

/**
 * 記事を年ごとに区切ったテキストのみのミニマル index。
 * Apple "Liquid Glass" 的なインタラクション：
 * 1枚の半透明ガラスのハイライトが、ホバー中の行へ spring でぬるっと移動する。
 * タップ時はわずかに沈む（0.97）Apple ライクな触感。
 */
export function PostIndexList({ posts }: Props) {
  const groups = groupByYear(posts);

  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [active, setActive] = useState(false);

  const moveTo = (el: HTMLElement) => {
    const c = containerRef.current;
    if (!c) return;
    // container 基準の相対座標で計測（途中の positioned 祖先に影響されない）
    const cr = c.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top - cr.top,
      left: r.left - cr.left,
      width: r.width,
      height: r.height,
    });
    setActive(true);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseLeave={() => setActive(false)}
    >
      {/* リキッド・ガラスのハイライト（行間をぬるっと移動） */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0 top-0 z-0 rounded-2xl",
          // ガラス素材：半透明＋ブラー＋淡いふち＋内側ハイライト
          "bg-foreground/[0.07] backdrop-blur-sm ring-1 ring-foreground/10",
          "shadow-[inset_0_1px_0_hsl(var(--background)/0.7),0_2px_8px_rgb(0_0_0/0.08)]",
          "will-change-transform transition-[transform,width,height,opacity] duration-[450ms]",
          active ? "opacity-100" : "opacity-0"
        )}
        style={{
          transform: rect ? `translate3d(${rect.left}px, ${rect.top}px, 0)` : undefined,
          width: rect?.width,
          height: rect?.height,
          transitionTimingFunction: SPRING,
        }}
      />

      <div className="relative z-10 flex flex-col gap-6">
        {groups.map((group) => (
          <section key={group.year}>
            <h2 className="mb-1 px-4 text-xs font-medium tracking-widest text-muted-foreground tabular-nums">
              {group.year}
            </h2>

            <ul className="flex flex-col">
              {group.posts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    onMouseEnter={(e) => moveTo(e.currentTarget)}
                    className={cn(
                      "group flex items-center justify-between gap-4 rounded-2xl px-4 py-2.5",
                      // タップ／クリックでわずかに沈む（Apple ライクな触感）
                      "transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.985]"
                    )}
                  >
                    <h3 className="min-w-0 flex-1 truncate text-base font-medium text-foreground transition-colors duration-200">
                      {post.title}
                    </h3>

                    <time className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      {formatDate(postDate(post), "MM.dd")}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
