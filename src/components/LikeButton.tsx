"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CatLogo } from "@/components/CatLogo";

const MAX_MY_LIKES = 10;

export default function LikeButton({
  postId,
  title,
  slug,
}: {
  postId: string;
  title?: string;
  slug?: string;
}) {
  const [total, setTotal] = useState<number | string>("…");
  const [myCount, setMyCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  // クリック毎にインクリメントし、+1 要素を再マウントしてアニメを必ずやり直す
  const [bumpKey, setBumpKey] = useState(0);

  const clientIdRef = useRef<string>("");
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- 初回 clientId を決める ---
  useEffect(() => {
    let id = localStorage.getItem("like-client-id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("like-client-id", id);
    }
    clientIdRef.current = id;
  }, []);

  // --- 初期ロード（みんなの合計） ---
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

  // --- アンマウント時にタイマーを掃除 ---
  useEffect(() => {
    return () => {
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
    };
  }, []);

  const reachedLimit = myCount >= MAX_MY_LIKES;

  const handleClick = () => {
    if (!postId) return;
    if (reachedLimit) return;

    // UI 即時更新（total が未取得の場合は 1 にする）
    setMyCount((c) => c + 1);
    setTotal((t) => (typeof t === "number" ? t + 1 : 1));

    // サーバへ即送信
    fetch("/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId,
        title,
        slug,
        clientId: clientIdRef.current,
        add: 1,
      }),
    }).catch(() => {
      // 通信失敗しても UI は戻さない
    });

    // 連打しても毎回 +1 を再生する：key を進めて再マウント＋タイマーをやり直す
    setBumpKey((k) => k + 1);
    setPulse(true);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setPulse(false), 600);
  };

  const display = typeof total === "number" ? total : "…";

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3">
      {/* 猫だけのタップ用ピル。数字は切り離して下に置く。タップで +1 */}
      <button
        type="button"
        onClick={handleClick}
        disabled={reachedLimit}
        aria-label="猫を贈る（いいね）"
        className={cn(
          // ホバー拡大は撤去（境界でのちらつき防止）。押下時のみ scale。
          "relative inline-flex transform-gpu items-center justify-center rounded-full border border-border bg-card px-7 py-3 shadow-sm transition",
          "hover:bg-accent active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-default disabled:hover:bg-card"
        )}
      >
        <CatLogo
          className={cn(
            "h-9 w-auto origin-center transition-transform duration-300",
            pulse && "scale-110"
          )}
        />

        {/* タップ時の +1 フィードバック（key でクリック毎に必ず再生） */}
        {pulse && (
          <span
            key={bumpKey}
            aria-hidden
            className="pointer-events-none absolute -top-1 right-3 text-sm font-medium text-muted-foreground"
            style={{ animation: "floatUp 0.6s ease-out forwards" }}
          >
            +1
          </span>
        )}
      </button>

      {/* みんなの合計（猫とは切り離した控えめなキャプション） */}
      <div className="text-sm text-muted-foreground">
        みんなの合計{" "}
        <span className="font-medium tabular-nums text-foreground">{display}</span>
      </div>

      {/* 自分の貢献（最大 10）。色相に頼らず濃淡のドットで表現 */}
      <div className="flex h-5 items-center justify-center gap-1 text-xs text-muted-foreground">
        {reachedLimit ? (
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            Thank you Cat
            <CatLogo className="h-4 w-auto" />
          </span>
        ) : (
          <span className="flex items-center gap-1" aria-hidden>
            {Array.from({ length: MAX_MY_LIKES }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i < myCount ? "bg-foreground" : "bg-foreground/15"
                )}
              />
            ))}
          </span>
        )}
      </div>

      <style>{`@keyframes floatUp { 0% { opacity: 0; transform: translateY(2px); } 25% { opacity: 1; } 100% { opacity: 0; transform: translateY(-14px); } }`}</style>
    </div>
  );
}
