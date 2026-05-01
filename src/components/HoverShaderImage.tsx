"use client";

import { useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const PainterlyCanvas = dynamic(
  () => import("@/components/shaders/PainterlyCanvas"),
  { ssr: false }
);

// ホバーを一定時間継続すると isLocked=true になり元画像にロックインされる
// ロックイン後はホバー解除してもフィルタが戻らない

const LOCK_DELAY_MS = 1000; // ロックインまでのホバー時間（ms）

type Props = {
  src: string;
  strength?: number;
  className?: string;
};

export default function HoverShaderImage({ src, strength = 0.7, className }: Props) {
  const [isLocked, setIsLocked] = useState(false);
  const [progress, setProgress] = useState(0); // 0〜1: ホバー中の進行度
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startTimer = useCallback(() => {
    if (isLocked) return;
    startTimeRef.current = performance.now();

    // プログレスバーのアニメーション
    const updateProgress = () => {
      if (!startTimeRef.current) return;
      const elapsed = performance.now() - startTimeRef.current;
      const p = Math.min(elapsed / LOCK_DELAY_MS, 1);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(updateProgress);
      }
    };
    rafRef.current = requestAnimationFrame(updateProgress);

    timerRef.current = setTimeout(() => {
      setIsLocked(true);
      setProgress(1);
    }, LOCK_DELAY_MS);
  }, [isLocked]);

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startTimeRef.current = null;
    if (!isLocked) setProgress(0);
  }, [isLocked]);

  return (
    <div
      className={`relative cursor-pointer select-none ${className ?? ""}`}
      onMouseEnter={startTimer}
      onMouseLeave={cancelTimer}
      // タッチデバイス: タップ押下でタイマー開始、離したらキャンセル
      onTouchStart={startTimer}
      onTouchEnd={cancelTimer}
    >
      <PainterlyCanvas src={src} strength={strength} isLocked={isLocked} />

      {/* ロックイン前のみプログレスバーを表示 */}
      {!isLocked && progress > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <div
            className="h-full bg-white/80 transition-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {/* ロックイン完了インジケーター */}
      {isLocked && (
        <div className="absolute bottom-2 right-2 text-white/70 text-xs bg-black/40 px-2 py-0.5 rounded-full pointer-events-none">
          ✓
        </div>
      )}
    </div>
  );
}
