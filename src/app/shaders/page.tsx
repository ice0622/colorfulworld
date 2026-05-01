"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PainterlyCanvas = dynamic(
  () => import("@/components/shaders/PainterlyCanvas"),
  { ssr: false }
);

const DEMO_IMAGE = "/images/posts/フランス/1.jpg";

// strength の遷移スピード設定（ms）
// hover in: 写真側へ向かう速度（速め）
// hover out: 絵画側へ戻る速度（遅め・余韻あり）
const HOVER_IN_DURATION = 800;
const HOVER_OUT_DURATION = 2400;

// strength の段階: 絵画側 0.85 からホバーで 0.0 へ収束させる
const STRENGTH_IDLE = 0.85;
const STRENGTH_HOVER = 0.0;

// 0〜1 の t に対して ease-out cubic を返す
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

// 時間ベースのアニメーション: from → to を durationMs かけて
// onChange コールバックで strength を流す。
// cancel 関数を返す。
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

export default function PainterlyShaderPage() {
  // strength を ref で持ち、React の再レンダリングは useAnimationFrame で 1 フレームごとに行う
  const strengthRef = useRef(STRENGTH_IDLE);
  const [strength, setStrength] = useState(STRENGTH_IDLE);
  const cancelAnim = useRef<(() => void) | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // hover 状態が変わったら strength アニメーションを起動
  useEffect(() => {
    // 前のアニメーションをキャンセル
    cancelAnim.current?.();

    const from = strengthRef.current;
    const to = isHovered ? STRENGTH_HOVER : STRENGTH_IDLE;
    const duration = isHovered ? HOVER_IN_DURATION : HOVER_OUT_DURATION;

    cancelAnim.current = animateStrength(from, to, duration, (v) => {
      strengthRef.current = v;
      setStrength(v);
    });

    return () => cancelAnim.current?.();
  }, [isHovered]);

  // 初回ホバーでヒントを消す
  useEffect(() => {
    if (isHovered) setShowHint(false);
  }, [isHovered]);

  return (
    <main className="bg-black text-white">
      {/* ========== 1画面目: フルスクリーンシェーダー ========== */}
      <section
        className="relative w-full h-screen overflow-hidden"
        style={{ userSelect: "none" }}
      >
        {/* Canvas 全面 */}
        <div className="absolute inset-0">
          <PainterlyCanvas src={DEMO_IMAGE} strength={strength} isLocked={false} />
        </div>

        {/* 暗めのグラデーションオーバーレイ（テキスト可読性のため） */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        {/* タイトル: 左上 */}
        <div className="absolute top-0 left-0 p-8 pointer-events-none">
          <p className="text-[10px] tracking-[0.25em] text-white/40 uppercase mb-2">
            Shader Experiment
          </p>
          <h1
            className="text-2xl sm:text-3xl font-semibold tracking-tight text-white/90"
            style={{ fontFamily: "'Hannari', serif" }}
          >
            Painterly Shader
          </h1>
        </div>

        {/* hover インタラクション面 */}
        <motion.div
          className="absolute inset-0 cursor-crosshair"
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          animate={isHovered ? { scale: 1.008 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 28 }}
        />

        {/* ピントインジケーター: 左下 */}
        <div className="pointer-events-none absolute bottom-8 left-8">
          <div className="flex flex-col gap-1 w-36">
            <div
              className="flex justify-between text-[9px] text-white/40 tracking-widest uppercase"
              style={{ fontFamily: "'EB Garamond', 'Libre Baskerville', serif" }}
            >
              <span>Paint</span>
              <span>Photo</span>
            </div>
            <div className="h-px bg-white/15 relative">
              <div
                className="absolute top-0 left-0 h-px bg-white/60"
                style={{
                  width: `${(1 - strength) * 100}%`,
                  transition: "width 0.1s linear",
                }}
              />
            </div>
          </div>
        </div>

        {/* ヒント: 初回ホバー前だけ表示 */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              className="pointer-events-none absolute bottom-8 right-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[10px] text-white/35 tracking-widest uppercase">
                hover to focus
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ========== 2画面目: 技術解説 ========== */}
      <section className="max-w-2xl mx-auto px-6 py-24 space-y-8 text-white/60 bg-black">
        <h2 className="text-xl font-semibold text-white">What is this?</h2>
        <p className="text-sm leading-relaxed">
          画像に{" "}
          <span className="text-white">Kuwahara フィルター</span>
          をリアルタイムで適用しています。
          各ピクセル周辺を 4 つのセクターに分割し、分散が最も小さいセクターの平均色を採用することで、
          エッジを保持しながら油絵のような質感を生み出します。
        </p>
        <h2 className="text-xl font-semibold text-white pt-4">次のステップ</h2>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
          <li>
            <strong className="text-white">Papari 拡張</strong>：
            矩形カーネルを円形（8-sector）へ変更し、エッジ保持を改善する
          </li>
          <li>
            <strong className="text-white">多項式重み付け</strong>：
            ガウス重み付けの代替として演算コストを抑えつつ品質を上げる
          </li>
          <li>
            <strong className="text-white">異方性フィルター</strong>：
            構造テンソルからエッジ方向を検出し、筆ストロークを方向に沿わせる
          </li>
        </ul>
      </section>
    </main>
  );
}
