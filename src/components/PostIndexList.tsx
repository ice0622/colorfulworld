"use client";

import Link from "next/link";
import { formatDate } from "date-fns";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Post, PostCategory } from "@/types/content";

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

// カテゴリの表示順とラベル（旅がメイン → 技術 → 日常）
const CATEGORIES: { key: PostCategory; label: string }[] = [
  { key: "trip", label: "旅" },
  { key: "tech", label: "技術" },
  { key: "daily", label: "日常" },
];

// ---- イージング ----
// リキッドな“追従”: わずかにオーバーシュートする spring 風カーブ。
// セグメントのピルも、リストのハイライトも、同じ動きの言語で揃える。
const SPRING = "cubic-bezier(0.34,1.4,0.5,1)";

type Rect = { top: number; left: number; width: number; height: number };

/**
 * カテゴリ別のテキスト index。
 * 上部に Apple ライクなセグメンテッドコントロール（ガラスのピルが spring で
 * スライド）でカテゴリを切り替え、選択中カテゴリの記事だけを表示する。
 * リスト側も 1 枚のガラスのハイライトがホバー行へぬるっと追従する。
 */
export function PostIndexList({ posts }: Props) {
  // 投稿が 1 件以上あるカテゴリだけをタブにする
  const groups = CATEGORIES.map((c) => ({
    ...c,
    posts: posts.filter((p) => p.category === c.key),
  })).filter((g) => g.posts.length > 0);

  const [selected, setSelected] = useState<PostCategory>(groups[0]?.key ?? "trip");
  const selectedIdx = Math.max(0, groups.findIndex((g) => g.key === selected));
  const current = groups[selectedIdx]?.posts ?? [];

  // リストのホバー・ハイライト（行へ追従）
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [active, setActive] = useState(false);

  const moveTo = (el: HTMLElement) => {
    const c = containerRef.current;
    if (!c) return;
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
    <div ref={containerRef} className="relative" onMouseLeave={() => setActive(false)}>
      {/* セグメンテッドコントロール：ガラスのピルが選択中へスライド */}
      <div
        className="relative z-10 mb-8 px-4"
        onMouseEnter={() => setActive(false)}
      >
        <div className="inline-flex rounded-full bg-muted/60 p-1 ring-1 ring-foreground/[0.06]">
          <div className="relative flex">
            {/* スライドするガラスのピル */}
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 rounded-full bg-background shadow-[0_1px_3px_rgb(0_0_0/0.12)] ring-1 ring-foreground/[0.05] transition-transform duration-[450ms] will-change-transform"
              style={{
                width: `${100 / groups.length}%`,
                transform: `translateX(${selectedIdx * 100}%)`,
                transitionTimingFunction: SPRING,
              }}
            />
            {groups.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setSelected(g.key)}
                className={cn(
                  "relative z-10 flex-1 whitespace-nowrap rounded-full px-6 py-1.5 text-sm transition-colors duration-200",
                  selected === g.key
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* リキッド・ガラスのハイライト（行間をぬるっと移動） */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0 top-0 z-0 rounded-2xl",
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

      {/* 選択中カテゴリの記事リスト（年で区切る） */}
      <div className="relative z-10 flex flex-col gap-6">
        {groupByYear(current).map((yearGroup) => (
          <section key={yearGroup.year}>
            <h3 className="mb-1 px-4 text-xs font-medium tracking-widest text-muted-foreground tabular-nums">
              {yearGroup.year}
            </h3>

            <ul className="flex flex-col">
              {yearGroup.posts.map((post) => (
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
                    <span className="min-w-0 flex-1 truncate text-base font-medium text-foreground transition-colors duration-200">
                      {post.title}
                    </span>

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
