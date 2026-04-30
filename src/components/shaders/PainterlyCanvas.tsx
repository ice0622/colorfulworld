"use client";

import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { wrapEffect } from "@react-three/postprocessing";
import { Suspense, useEffect, useRef } from "react";
import { TextureLoader } from "three";
import { KuwaharaEffect } from "./KuwaharaEffect";

// KuwaharaEffect を R3F コンポーネントとしてラップ
const Kuwahara = wrapEffect(KuwaharaEffect) as React.FC<{ strength?: number }>;

// -------------------------------------------------------------------
// 写真を viewport いっぱいに表示し、アスペクト比を保って cover する
// -------------------------------------------------------------------
function PhotoQuad({ src }: { src: string }) {
  const texture = useLoader(TextureLoader, src);
  const { viewport } = useThree();

  const imageAspect =
    texture.image && texture.image.width > 0
      ? texture.image.width / texture.image.height
      : 1;
  const viewportAspect = viewport.width / viewport.height;

  // cover: viewport をはみ出さず、かつ全面を覆うスケール
  let scaleX = viewport.width;
  let scaleY = viewport.height;
  if (imageAspect > viewportAspect) {
    scaleX = viewport.height * imageAspect;
    scaleY = viewport.height;
  } else {
    scaleX = viewport.width;
    scaleY = viewport.width / imageAspect;
  }

  return (
    <mesh scale={[scaleX, scaleY, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

// -------------------------------------------------------------------
// strength を受け取って Kuwahara ポストプロセスを適用するシーン
// -------------------------------------------------------------------
function Scene({ src, strength }: { src: string; strength: number }) {
  return (
    <>
      <PhotoQuad src={src} />
      <EffectComposer>
        <Kuwahara strength={strength} />
      </EffectComposer>
    </>
  );
}

// -------------------------------------------------------------------
// 外部から使う Canvas コンポーネント
// strength: 0.0 = 元写真, 1.0 = 完全な絵画表現
// -------------------------------------------------------------------
export default function PainterlyCanvas({
  src,
  strength,
}: {
  src: string;
  strength: number;
}) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 10] }}
      gl={{ antialias: false }}
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        <Scene src={src} strength={strength} />
      </Suspense>
    </Canvas>
  );
}
