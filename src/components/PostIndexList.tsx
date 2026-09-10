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

// ---- モーション ----
// 注意：duration / easing はクラスではなく style で当てる。
// このプロジェクトは tailwindcss-animate を入れており、同プラグインが `duration-*` /
// `ease-*` を animation 用に乗っ取るため、**任意値（duration-[600ms] / ease-[...]）が
// 無言で生成されない**（テーマ既定の duration-150 等は core 側が生き残る）。
// 以前ここに書いていた duration-[450ms] は効いておらず、既定の 150ms で動いていた。
//
// リキッドな“追従”: わずかにオーバーシュートする spring 風カーブ。
// セグメントのピルも、リストのハイライトも、同じ動きの言語で揃える。
// 行き過ぎ量は控えめ（1.25）。ピルは clip-path で切り抜いているため、端のセグメントで
// 大きく行き過ぎると切り抜き矩形が枠の外へ出て、丸みが一瞬欠けて見える。
const SPRING = "cubic-bezier(0.34,1.25,0.5,1)";
const PILL_MS = "600ms"; // ピルのスライド（移動距離が長いのでゆっくり）
const HOVER_MS = "450ms"; // リストのホバー・ハイライト

// タップで沈む触感（減速のみ・行き過ぎなし）。毎行で同じ参照を使い回す。
const PRESS_STYLE = { transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" } as const;

// ---- セグメントの寸法（黄金比 φ ≒ 1.618 を基準にする） ----
// 行ボックス 20px（text-sm）を起点に、
//   セグメント高 = 20 × φ ≒ 32px
//   セグメント幅 = 32 × φ ≒ 52px（2文字ラベル 28px ＋ 左右 12px）
// 枠は 3 区画 ＋ px-2 py-1 で 172×40 ≒ φ³（4.24）の横長になる（旧 px-6 の 236×40 比で幅 3 割減）。
//
// 幅は padding ではなく **固定のグリッド列** で決める。下層＝<button>／上層＝<span> は
// 内在幅の算出がブラウザによって微妙に違い、padding 頼みだと 2 レイヤーの区画境界が
// 数 px ずれて「ピルの中で文字が中央に来ない」状態になる。列幅を固定すれば
// 切り抜き位置と区画境界が必ず一致する。
// ※ラベルは 1〜2 文字前提。3 文字以上を足すときはこの幅を見直す。
const SEG_W_REM = 3.25; // 52px
const SEG_W = `${SEG_W_REM}rem`;
const SEG_H = "2rem"; // 32px

// スプリングの“行き過ぎ”の逃げ幅。
// ピルは clip-path で切り抜いているため、切り抜き矩形が要素の外へ出るとその分だけ
// 描くピクセルが無くなり、丸い端が直線に削れて見える（行き過ぎは移動距離の約 2%＝最大 2px 強だが、
// 半径 16px の端を 2px 削ると 15px ほどの平らな面ができて目立つ）。
// そこで上層だけを左右に 4px はみ出させ、枠の横 padding（px-2＝8px）の内側で行き過ぎを吸収する。
// 切り抜きは % ではなく rem の絶対値で置く（逃げ幅を含めた実寸で数えるため）。
const ROOM_REM = 0.25; // 4px
const SEGMENT =
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium";

type Rect = { top: number; left: number; width: number; height: number };

/**
 * カテゴリ別のテキスト index。
 * 上部のセグメンテッドコントロールでカテゴリを切り替え、選択中カテゴリの記事だけを表示する。
 * リスト側は 1 枚のガラスのハイライトがホバー行へぬるっと追従する。
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

  // 選択中の 1 区画だけを切り抜く矩形。列幅が固定なので実寸（rem）でそのまま数えられる。
  // ピルと反転文字が同一レイヤーにあるため、この矩形を動かすだけで色の反転位置も必ず一致する。
  const segments = Math.max(groups.length, 1);
  const pillClip = `inset(0 ${ROOM_REM + (segments - 1 - selectedIdx) * SEG_W_REM}rem 0 ${
    ROOM_REM + selectedIdx * SEG_W_REM
  }rem round 9999px)`;

  // 2 つのレイヤーが必ず同じ格子になるよう、同一のグリッド定義を共有する
  const rowStyle = {
    gridTemplateColumns: `repeat(${segments}, ${SEG_W})`,
    height: SEG_H,
  };

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
    <div ref={containerRef} className="relative max-w-2xl mx-auto" onMouseLeave={() => setActive(false)}>
      {/* セグメンテッドコントロール：リキッドグラスの枠に白いピルが spring でスライドする。
          ピルと「反転した文字」は同じ 1 枚のレイヤーに置き、clip-path で選択中の区画だけを
          切り抜く。文字色を切り替えるアニメーションを持たないので、ピルの移動と色の反転が
          原理的にずれない（タイミング調整が不要）。 */}
      <div
        className="relative z-10 mb-8 px-4"
        onMouseEnter={() => setActive(false)}
      >
        <div
          className={cn(
            // px-2（8px）は上層がはみ出す 4px を飲み込むための余白でもある
            "relative inline-flex rounded-full px-2 py-1",
            // 枠：地の紺よりわずかに明るいガラス。上端のハイライトと外側の落ち影で浮かせる
            "bg-foreground/[0.07] backdrop-blur-md ring-1 ring-foreground/15",
            "shadow-[inset_0_1px_0_hsl(var(--foreground)/0.18),0_10px_28px_-14px_hsl(var(--scrim)/0.9)]",
            // フォーカス輪郭はピルに隠れるので枠側に出す
            "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
          )}
        >
          <div className="relative">
            {/* 下層：未選択の文字（ピルの外側だけが見える） */}
            <div className="grid" style={rowStyle}>
              {groups.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  aria-pressed={selected === g.key}
                  onClick={() => setSelected(g.key)}
                  className={cn(
                    SEGMENT,
                    "rounded-full text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* 上層：白いピル＋濃紺の文字。clip-path が動くと塗りと文字色が同時に切り替わる。
                落ち影は clip-path で切られないよう、外側の drop-shadow で切り抜き後の形に付ける。 */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -inset-x-1 drop-shadow-[0_2px_6px_hsl(var(--scrim)/0.5)]"
            >
              <div
                className="grid px-1 bg-primary text-primary-foreground transition-[clip-path] will-change-[clip-path]"
                style={{
                  ...rowStyle,
                  clipPath: pillClip,
                  transitionDuration: PILL_MS,
                  transitionTimingFunction: SPRING,
                }}
              >
                {groups.map((g) => (
                  <span key={g.key} className={SEGMENT}>
                    {g.label}
                  </span>
                ))}
              </div>
            </div>
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
          "will-change-transform transition-[transform,width,height,opacity]",
          active ? "opacity-100" : "opacity-0"
        )}
        style={{
          transform: rect ? `translate3d(${rect.left}px, ${rect.top}px, 0)` : undefined,
          width: rect?.width,
          height: rect?.height,
          transitionDuration: HOVER_MS,
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
                    style={PRESS_STYLE}
                    className={cn(
                      "group flex items-center justify-between gap-4 rounded-2xl px-4 py-2.5",
                      // タップ／クリックでわずかに沈む（Apple ライクな触感）
                      "transition-transform duration-150 active:scale-[0.985]"
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
