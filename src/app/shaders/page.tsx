"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useEffect } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";

const PainterlyCanvas = dynamic(
  () => import("@/components/shaders/PainterlyCanvas"),
  { ssr: false }
);

const DEMO_IMAGE = "/images/posts/フランス/1.jpg";
const SCROLL_HEIGHT_VH = 350;

export default function PainterlyShaderPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(containerRef);

  // ===== ロック状態 =====
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (progress > 0.98 && !isLocked) {
      setIsLocked(true);
    }
  }, [progress, isLocked]);

  // ===== strength制御 =====
  const strength = isLocked ? 0 : Math.max(0, 1 - progress);

  return (
    <main className="bg-black text-white min-h-screen">
      {/* header */}
      <section className="flex flex-col items-center justify-center h-screen px-6 text-center gap-6">
        <h1 className="text-4xl sm:text-6xl font-semibold">
          Painterly Shader
        </h1>
      </section>

      {/* scroll area */}
      <div
        ref={containerRef}
        style={{ height: `${SCROLL_HEIGHT_VH}vh`, position: "relative" }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            width: "100%",
          }}
        >
          <PainterlyCanvas
            src={DEMO_IMAGE}
            strength={strength}
            isLocked={isLocked}
          />
        </div>
      </div>
    </main>
  );
}