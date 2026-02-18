"use client";

import createGlobe from "cobe";
import { useEffect, useRef } from "react";

export default function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 回転角を追跡する変数
    let phi = 0;

    const globe = createGlobe(canvasRef.current!, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 5,
      baseColor: [1, 1, 1],
      markerColor: [1, 1, 1],
      glowColor: [1, 1, 1],
      markers: [
        // 東京
        { location: [35.6895, 139.6917], size: 0.1 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.005;
      },
    });

    return () => globe.destroy();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: 600,
        height: 600,
      }}
    />
  );
}