// src/components/PainterlyCanvasClient.tsx
"use client";
import dynamic from "next/dynamic";

const PainterlyCanvas = dynamic(
  () => import("@/components/shaders/PainterlyCanvas"),
  { ssr: false }
);

export default PainterlyCanvas;