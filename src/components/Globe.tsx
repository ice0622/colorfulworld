"use client";

import createGlobe from "cobe";
import { useEffect, useRef } from "react";
import { POST_LOCATIONS } from "@/lib/locations";

const locationToAngles = (lat: number, lng: number): [number, number] => {
  return [
    Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2),
    (lat * Math.PI) / 180,
  ];
};

export default function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const focusRef = useRef<[number, number]>(
    locationToAngles(POST_LOCATIONS[0].lat, POST_LOCATIONS[0].lng)
  );

  useEffect(() => {
    let width = 0;
    let currentPhi = 0;
    let currentTheta = 0;
    const doublePi = Math.PI * 2;

    const onResize = () => {
      if (canvasRef.current) width = canvasRef.current.offsetWidth;
    };
    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvasRef.current!, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 3,
      mapSamples: 16000,
      mapBrightness: 1.2,
      baseColor: [1, 1, 1],
      markerColor: [251 / 255, 200 / 255, 21 / 255],
      glowColor: [1.2, 1.2, 1.2],
      markers: POST_LOCATIONS.map((loc) => ({
        location: [loc.lat, loc.lng] as [number, number],
        size: loc.size,
      })),
      onRender: (state) => {
        state.phi = currentPhi;
        state.theta = currentTheta;
        const [focusPhi, focusTheta] = focusRef.current;
        const distPositive = (focusPhi - currentPhi + doublePi) % doublePi;
        const distNegative = (currentPhi - focusPhi + doublePi) % doublePi;
        if (distPositive < distNegative) {
          currentPhi += distPositive * 0.08;
        } else {
          currentPhi -= distNegative * 0.08;
        }
        currentTheta = currentTheta * 0.92 + focusTheta * 0.08;
        state.width = width * 2;
        state.height = width * 2;
      },
    });

    setTimeout(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = "1";
    });

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 600,
        aspectRatio: 1,
        margin: "auto",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          contain: "layout paint size",
          opacity: 0,
          transition: "opacity 1s ease",
        }}
      />
      <div className="flex flex-wrap justify-center items-center gap-2 mt-3">
        <span className="text-sm text-muted-foreground">Rotate to:</span>
        {POST_LOCATIONS.map((loc) => (
          <button
            key={loc.slug}
            onClick={() => {
              focusRef.current = locationToAngles(loc.lat, loc.lng);
            }}
            className="bg-white/10 hover:bg-white/20 transition-colors rounded-lg px-3 py-1 text-sm cursor-pointer"
          >
            {loc.name}
          </button>
        ))}
      </div>
    </div>
  );
}