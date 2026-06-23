"use client";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_MY_LIKES = 10;

// 合計値をスプリングで滑らかにカウントアップ（数字が転がる）
function AnimatedCount({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 130, damping: 20, mass: 0.6 });
  const text = useTransform(spring, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    mv.set(value);
  }, [value, mv]);
  return (
    <motion.span className="font-medium tabular-nums text-foreground">
      {text}
    </motion.span>
  );
}

export default function LikeButton({
  postId,
  title,
  slug,
}: {
  postId: string;
  title?: string;
  slug?: string;
}) {
  const [total, setTotal] = useState<number | null>(null);
  const [myCount, setMyCount] = useState(0);
  const [bursts, setBursts] = useState<number[]>([]);

  const myCountRef = useRef(0); // 長押しループ内で最新値を参照するため
  const burstId = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初期ロード（みんなの合計）
  useEffect(() => {
    if (!postId) return;
    fetch(`/api/like?postId=${encodeURIComponent(postId)}`)
      .then((res) => res.json())
      .then((data) => {
        const n = Number(data?.count);
        setTotal(Number.isFinite(n) ? n : 0);
      })
      .catch(() => setTotal(0));
  }, [postId]);

  const stopHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  // アンマウント時にタイマー掃除
  useEffect(() => stopHold, []);

  const reachedLimit = myCount >= MAX_MY_LIKES;

  // 1いいね加算（UI即時＋サーバへ +1 を1回POST）。上限なら false。
  const addLike = () => {
    if (!postId) return false;
    if (myCountRef.current >= MAX_MY_LIKES) return false;

    myCountRef.current += 1;
    setMyCount(myCountRef.current);
    setTotal((t) => (typeof t === "number" ? t + 1 : 1));

    const id = (burstId.current += 1);
    setBursts((b) => [...b, id]);
    setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), 700);

    fetch("/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, title, slug }),
    }).catch(() => {
      // 通信失敗しても UI は戻さない
    });
    return true;
  };

  // 長押し：最初の1回 → 少し置いて加速連打
  const startHold = () => {
    if (!addLike()) return;
    let delay = 300;
    const tick = () => {
      if (!addLike()) {
        stopHold();
        return;
      }
      delay = Math.max(80, delay * 0.82);
      holdTimer.current = setTimeout(tick, delay);
    };
    holdTimer.current = setTimeout(tick, delay);
  };

  const CIRC = 2 * Math.PI * 27;
  const dashoffset = CIRC * (1 - myCount / MAX_MY_LIKES);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 py-2">
      <div className="relative h-16 w-16">
        {/* 進捗リング（あなたの貢献 / 最大10） */}
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="27" fill="none" stroke="hsl(var(--foreground) / 0.12)" strokeWidth="2.5" />
          <circle
            cx="32"
            cy="32"
            r="27"
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashoffset}
            style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>

        {/* タップごとのリップル＋「+1」 */}
        {bursts.map((id) => (
          <motion.span
            key={`r${id}`}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border border-foreground/25"
            initial={{ scale: 0.75, opacity: 0.5 }}
            animate={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
        {bursts.map((id) => (
          <motion.span
            key={`p${id}`}
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 text-xs font-medium text-muted-foreground"
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -24, opacity: [0, 1, 0] }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            +1
          </motion.span>
        ))}

        {/* ボタン本体：タップ=+1／長押し=加速連打 */}
        <motion.button
          type="button"
          disabled={reachedLimit}
          aria-label="いいね（長押しで増やせます）"
          whileTap={{ scale: 0.9 }}
          onPointerDown={startHold}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              addLike();
            }
          }}
          className={cn(
            "absolute inset-[7px] flex touch-none select-none items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors",
            "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-default disabled:hover:bg-card"
          )}
        >
          <motion.span
            key={myCount}
            initial={{ scale: 1 }}
            animate={{ scale: myCount > 0 ? [1, 1.28, 1] : 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <Heart
              className={cn(
                "h-[22px] w-[22px] text-foreground transition-[fill,opacity] duration-300",
                myCount > 0 ? "fill-current" : "fill-transparent"
              )}
              strokeWidth={1.75}
            />
          </motion.span>
        </motion.button>
      </div>

      {/* みんなの合計（ボタンと切り離した控えめなキャプション・スプリングでカウントアップ） */}
      <div className="flex h-5 items-center gap-1.5 text-sm text-muted-foreground">
        {total === null ? (
          <span className="opacity-50">···</span>
        ) : (
          <>
            <AnimatedCount value={total} />
            <span className="text-xs">{reachedLimit ? "ありがとう" : "いいね"}</span>
          </>
        )}
      </div>
    </div>
  );
}
