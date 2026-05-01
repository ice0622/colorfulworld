"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";

const PainterlyCanvas = dynamic(
  () => import("@/components/shaders/PainterlyCanvas"),
  { ssr: false }
);

const HOVER_IN_DURATION = 800;   // 絵画 → 写真（速め）
const HOVER_OUT_DURATION = 2400; // 写真 → 絵画（余韻あり）

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function animateStrength(
  from: number,
  to: number,
  durationMs: number,
  onChange: (v: number) => void,
): () => void {
  const start = performance.now();
  let rafId: number;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs);
    onChange(from + (to - from) * easeOutCubic(t));
    if (t < 1) rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}

type Props = {
  src: string;
  strength?: number; // アイドル時の絵画強度 (0.0〜1.0)
  className?: string;
};

export default function HoverShaderImage({ src, strength: idleStrength = 0.85, className }: Props) {
  const strengthRef = useRef(idleStrength);
  const [strength, setStrength] = useState(idleStrength);
  const cancelAnim = useRef<(() => void) | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    cancelAnim.current?.();
    const from = strengthRef.current;
    const to = isHovered ? 0.0 : idleStrength;
    const duration = isHovered ? HOVER_IN_DURATION : HOVER_OUT_DURATION;

    cancelAnim.current = animateStrength(from, to, duration, (v) => {
      strengthRef.current = v;
      setStrength(v);
    });

    return () => cancelAnim.current?.();
  }, [isHovered, idleStrength]);

  return (
    <div
      className={`relative select-none ${className ?? ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <PainterlyCanvas src={src} strength={strength} isLocked={false} />
    </div>
  );
}
