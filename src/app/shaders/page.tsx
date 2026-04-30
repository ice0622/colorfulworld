"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useEffect } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";

// WebGL は SSR 不可のため dynamic import で client-only に限定
const PainterlyCanvas = dynamic(
  () => import("@/components/shaders/PainterlyCanvas"),
  { ssr: false }
);

// デモに使用する写真。public/ 以下のパスを指定。
const DEMO_IMAGES = [
  "/images/posts/フランス/1.jpg",
  "/images/posts/フランス/2.jpg",
  "/images/posts/フランス/3.jpg",
  "/images/posts/フランス/4.jpg",
];
// スティッキースクロールの高さ (vh)。
// 100vh がキャンバス表示領域、残りがスクロール量になる。
const SCROLL_HEIGHT_VH = 350;

export default function PainterlyShaderPage() {

  const [currentIndex, setCurrentIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const progress = useScrollProgress(containerRef);
  // ロック状態: 一度ロックされたら解除しない
  const [isLocked, setIsLocked] = useState(false);
  useEffect(() => {
    if (!isLocked && progress > 0.98) {
      setIsLocked(true);
    }
  }, [progress, isLocked]);

  // ロック時はstrength=0で固定
  const strength = isLocked ? 0 : Math.max(0, 1 - progress);

  // ロック時にスクロール領域を縮めても「止まっているように見せる」
  const prevScrollInfo = useRef<{ scrollY: number, offsetTop: number } | null>(null);

  // isLockedになる直前のscrollYとcontainer.offsetTopを記録
  useEffect(() => {
    if (!isLocked && progress > 0.98 && containerRef.current) {
      prevScrollInfo.current = {
        scrollY: window.scrollY,
        offsetTop: containerRef.current.offsetTop,
      };
    }
  }, [progress, isLocked]);

  // isLockedになった直後に差分だけscrollTo
  useEffect(() => {
    if (isLocked && containerRef.current && prevScrollInfo.current) {
      // レイアウト反映後に実行（1フレーム遅延）
      requestAnimationFrame(() => {
        const newOffsetTop = containerRef.current!.offsetTop;
        const { scrollY, offsetTop } = prevScrollInfo.current!;
        const diff = newOffsetTop - offsetTop;
        window.scrollTo({ top: scrollY + diff, behavior: "auto" });
      });
    }
  }, [isLocked]);

  return (
    <main className="bg-black text-white min-h-screen">
      {/* ========== ヘッダー ========== */}
      <section className="flex flex-col items-center justify-center h-screen px-6 text-center gap-6">
        <p className="text-sm tracking-widest text-white/40 uppercase">
          Shader Experiment
        </p>
        <h1
          className="text-4xl sm:text-6xl font-semibold tracking-tight"
          style={{ fontFamily: "'Hannari', serif" }}
        >
          Painterly Shader
        </h1>
        <p className="max-w-md text-white/60 text-base leading-relaxed">
          Scroll to focus the image.<br />
          The photo becomes sharper as you move.
        </p>
        <span className="mt-4 text-white/30 text-sm animate-bounce">
          ↓ スクロールしてください
        </span>
      </section>

      {/* ========== スティッキースクロールセクション ========== */}
      {/*
        このコンテナの高さが SCROLL_HEIGHT_VH になり、
        内部の sticky div (100vh) がスクロール中ずっと画面に貼り付く。
        スクロール量によって strength が 1→0 に変化し、絵画→写真へ遷移する。
      */}
      <div
        ref={containerRef}
        style={{ height: isLocked ? "100vh" : `${SCROLL_HEIGHT_VH}vh`, position: "relative" }}
      >
        {/* キャンバス（sticky） */}
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            width: "100%",
          }}
        >

          <PainterlyCanvas
            src={DEMO_IMAGES}
            strength={strength}
            isLocked={isLocked}
            currentIndex={currentIndex}
            onChangeIndex={setCurrentIndex}
          />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-10">
            <button onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0}>← 前</button>
            <button onClick={() => setCurrentIndex(i => Math.min(DEMO_IMAGES.length - 1, i + 1))} disabled={currentIndex === DEMO_IMAGES.length - 1}>次 →</button>
          </div>
          {/* オーバーレイ: ミニマルなピントインジケーター */}
          <div
            className="pointer-events-none absolute inset-0 flex flex-col justify-end p-4"
            style={{ transition: "opacity 0.4s ease" }}
          >
            <div className="flex flex-col gap-1 max-w-[180px]">
              <div className="flex justify-between text-[10px] text-white/50 tracking-widest uppercase font-semibold" style={{
                fontFamily: "'EB Garamond', 'Libre Baskerville', serif"
              }}>
                <span>Blur</span>
                <span>Focus</span>
              </div>
              <div className="h-0.5 bg-white/15 rounded-full relative mt-0.5 mb-0.5">
                <div
                  className="absolute top-0 left-0 h-0.5 bg-white/70 rounded-full transition-all duration-150"
                  style={{ width: `${(1 - strength) * 100}%` }}
                />
              </div>
              <div className="flex justify-end mt-0.5">
                <span className="text-[10px] text-white/60 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {`${Math.round((1 - strength) * 100)}%`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== スクロール後の解説 ========== */}
      <section className="max-w-2xl mx-auto px-6 py-24 space-y-8 text-white/70">
        {/* 技術的な説明は省略し、シンプルなUIに */}

        <h2 className="text-2xl font-semibold text-white pt-4">次のステップ</h2>
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
            構造テンソルからエッジ方向を検出し、筆のストロークを方向に沿わせる
          </li>
          <li>
            <strong className="text-white">カラー補正パス</strong>：
            量子化・彩度・トーンマッピング・紙テクスチャで絵画感を高める
          </li>
        </ul>
      </section>
    </main>
  );
}
