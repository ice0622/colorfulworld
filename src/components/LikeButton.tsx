"use client";
import { useEffect, useRef, useState } from "react";

const MAX_MY_LIKES = 10;

export default function LikeButton({ postId }: { postId: string }) {
  const [total, setTotal] = useState(0);
  const [myCount, setMyCount] = useState(0);
  const [pulse, setPulse] = useState(false);

  const clientIdRef = useRef<string>("");

  // --- 初回 clientId を決める ---
  useEffect(() => {
    let id = localStorage.getItem("like-client-id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("like-client-id", id);
    }
    clientIdRef.current = id;
  }, []);

  // --- 初期ロード ---
  useEffect(() => {
    if (!postId) return;

    // ① みんなの合計
    fetch(`/api/like?postId=${postId}`)
      .then((res) => res.json())
      .then((data) => setTotal(Number(data.count ?? "Loading...")))
      .catch(() => setTotal(0));

  }, [postId]);

  const handleClick = () => {
    if (!postId) return;
    if (myCount >= MAX_MY_LIKES) return;

    // UI 即時更新
    setMyCount((c) => c + 1);
    setTotal((t) => t + 1);

    // サーバへ即送信
    fetch("/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId,
        clientId: clientIdRef.current,
        add: 1,
      }),
    }).catch(() => {
      // 通信失敗しても UI は戻さない（もう 1 回押せないから）
    });

    setPulse(true);
    setTimeout(() => setPulse(false), 420);
  };

  const reachedLimit = myCount >= MAX_MY_LIKES;
  const lizards = "🦎".repeat(myCount);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-3">
        <span className="text-2xl font-semibold text-black dark:text-white">{total}</span>
        <div className="text-xs text-black/60 dark:text-white/60">みんなの「🦎」合計</div>
      </div>

      <div className="flex items-center justify-center mb-3">
        <div className="px-3 py-2 rounded-md min-h-[44px] flex items-center gap-2 border border-black/10 dark:border-white/10">
          <span className="text-lg select-none">{lizards}</span>
          {!reachedLimit && (
            <span
              aria-hidden
              style={{ width: 12, display: "inline-block", textAlign: "left", animation: "blink 1s step-end infinite" }}
              className="text-lg text-black dark:text-white"
            >
              |
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center">
        {!reachedLimit ? (
          <button
            onClick={handleClick}
            aria-label="いいね"
            className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-transform focus:outline-none
              bg-gray-200 dark:bg-gray-700 text-black dark:text-white shadow-sm hover:scale-105 active:scale-95`}
            style={{ border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <span className={`${pulse ? "scale-110" : ""} inline-block text-xl`} aria-hidden>
              🦎
            </span>
          </button>
        ) : (
          <div className="px-4 py-2 rounded-lg inline-flex items-center gap-3 justify-center w-fit text-black dark:text-white font-medium">
            Thank you Lizard
          </div>
        )}
      </div>

      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}
