// ...existing code...
"use client";
import { useEffect, useRef, useState } from "react";

export default function LikeButton({ postId }: { postId: string }) {
  const [total, setTotal] = useState(0);
  const [myCount, setMyCount] = useState(0);
  const [pulse, setPulse] = useState(false);

  // pending は送信待ちの増分
  const pendingRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!postId) return;
    setMyCount(0);
    pendingRef.current = 0;

    fetch(`/api/like?postId=${postId}`)
      .then((res) => res.json())
      .then((data) => setTotal(Number(data.count ?? 0)))
      .catch(() => setTotal(0));

    // 定期フラッシュ（2秒毎にまとめて送る）
    intervalRef.current = window.setInterval(() => {
      const p = pendingRef.current;
      if (p > 0) {
        // fire-and-forget（await しない）
        fetch("/api/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, count: p }),
        }).catch(() => {
          // 失敗しても再試行する設計にできる（今回は残したまま次ループで再送）
        });
        pendingRef.current = 0;
      }
    }, 2000);

    // ページ離脱時は sendBeacon で残りを送る
    const onBeforeUnload = () => {
      const remaining = pendingRef.current;
      if (remaining > 0 && navigator.sendBeacon) {
        const url = "/api/like";
        const blob = new Blob([JSON.stringify({ postId, count: remaining })], {
          type: "application/json",
        });
        navigator.sendBeacon(url, blob);
        pendingRef.current = 0;
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [postId]);

  const handleClick = () => {
    if (!postId) return;
    if (myCount >= 10) return;

    // 即時楽観更新（UI の停止なし）
    const newMy = myCount + 1;
    setMyCount(newMy);
    setTotal((t) => t + 1);

    // pending に加算（バックグラウンドでまとめて送信）
    pendingRef.current += 1;

    // 視覚フィードバックだけは即時に行う
    setPulse(true);
    setTimeout(() => setPulse(false), 420);
  };

  const lizards = "🦎".repeat(myCount);
  const reachedLimit = myCount >= 10;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-3">
        <span className="text-2xl font-semibold text-black dark:text-white">
          {total}
        </span>
        <div className="text-xs text-black/60 dark:text-white/60">
          みんなの「🦎」合計
        </div>
      </div>

      <div className="flex items-center justify-center mb-3">
        <div className="px-3 py-2 rounded-md min-h-[44px] flex items-center gap-2 border border-black/10 dark:border-white/10">
          <span className="text-lg select-none">{lizards}</span>
          <span
            aria-hidden
            style={{
              width: 12,
              display: reachedLimit ? "none" : "inline-block",
              textAlign: "left",
              animation: "blink 1s step-end infinite",
            }}
            className="text-lg text-black dark:text-white"
          >
            |
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center">
        {!reachedLimit ? (
          <button
            onClick={handleClick}
            aria-label="いいね"
            className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-transform focus:outline-none
              bg-gray-200 dark:bg-gray-700 text-black dark:text-white shadow-sm hover:scale-105 active:scale-95`}
            style={{
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {/* 中央にトカゲ */}
            <span
              className={`${pulse ? "scale-110" : ""} inline-block text-xl`}
              aria-hidden
            >
              🦎
            </span>

          </button>
        ) : (
          // ボタンではなくプレーンなテキストに置換（ホバーでの一時停止を回避）
          <div className="px-4 py-2 rounded-lg inline-flex items-center gap-3 justify-center w-fit text-black dark:text-white font-medium">
            Thank you Lizard
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
// ...existing code...