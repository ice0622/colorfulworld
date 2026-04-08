"use client";

import createGlobe from "cobe";
import { useEffect, useRef, useState } from "react";
import { POST_LOCATIONS, PostLocation } from "@/lib/locations";
import LocationCardOverlay from "@/components/LocationCardOverlay";
import PolaroidCard from "@/components/PolaroidCard";

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
  const [selectedLocation, setSelectedLocation] = useState<PostLocation | null>(null);
  // 現在の視点から最も手前（角度距離が最小）の地点スラッグ
  const frontmostSlugRef = useRef<string | null>(null);
  const [frontmostSlug, setFrontmostSlug] = useState<string | null>(null);
  // ボタンを押した時の「予約地点」。到着したらカードを開く
  const pendingLocationRef = useRef<PostLocation | null>(null);
  // 到着時に呼ぶコールバック。useEffect外に置くことで常に最新のstateを参照できる
  const onArriveRef = useRef<((loc: PostLocation) => void) | null>(null);
  onArriveRef.current = (loc) => {
    setSelectedLocation(loc); // カードを表示
  };

  useEffect(() => {
    let width = 0;
    let currentPhi = 0;
    let currentTheta = 0;
    const doublePi = Math.PI * 2;

    // ドラッグ状態
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

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
      markerColor: [1.0, 1.0, 1.0],   // 白く輝く（白黒地球でも目立つ）
      glowColor: [1.2, 1.2, 1.2],
      markers: POST_LOCATIONS.map((loc) => ({
        location: [loc.lat, loc.lng] as [number, number],
        size: loc.size * 1.5,             // マーカーを大きく・目立たせる
        id: loc.slug,
      })),
    });

    // v2: onRender は廃止。requestAnimationFrame + globe.update() で自前アニメーション
    let animFrameId: number;
    const animate = () => {
      const [focusPhi, focusTheta] = focusRef.current;
      const distPositive = (focusPhi - currentPhi + doublePi) % doublePi;
      const distNegative = (currentPhi - focusPhi + doublePi) % doublePi;
      if (distPositive < distNegative) {
        currentPhi += distPositive * 0.08;
      } else {
        currentPhi -= distNegative * 0.08;
      }
      currentTheta = currentTheta * 0.92 + focusTheta * 0.08;

      globe.update({
        width: width * 2,
        height: width * 2,
        phi: currentPhi,
        theta: currentTheta,
      });

      // 目標地点に十分近づいたら到着とみなしてカードを表示
      const dist = Math.min(distPositive, distNegative);
      if (
        pendingLocationRef.current &&
        dist < 0.01 &&
        Math.abs(currentTheta - focusTheta) < 0.01
      ) {
        onArriveRef.current?.(pendingLocationRef.current);
        pendingLocationRef.current = null;
      }

      // 視点から最も手前にある地点を計算（角度距離が最小 かつ 前面hemisphere）
      const normalizedPhi = ((currentPhi % doublePi) + doublePi) % doublePi;
      let minAngularDist = Infinity;
      let newFrontmost: string | null = null;
      for (const loc of POST_LOCATIONS) {
        const [locPhi, locTheta] = locationToAngles(loc.lat, loc.lng);
        const normalizedLocPhi = ((locPhi % doublePi) + doublePi) % doublePi;
        const dPos = (normalizedPhi - normalizedLocPhi + doublePi) % doublePi;
        const dNeg = (normalizedLocPhi - normalizedPhi + doublePi) % doublePi;
        const phiDist = Math.min(dPos, dNeg);
        const thetaDist = Math.abs(currentTheta - locTheta);
        const angularDist = Math.sqrt(phiDist * phiDist + thetaDist * thetaDist);
        // 前面半球（角度距離 < π/2）の中で最も近い地点を選ぶ
        if (angularDist < Math.PI / 2 && angularDist < minAngularDist) {
          minAngularDist = angularDist;
          newFrontmost = loc.slug;
        }
      }
      if (newFrontmost !== frontmostSlugRef.current) {
        frontmostSlugRef.current = newFrontmost;
        setFrontmostSlug(newFrontmost);
      }

      animFrameId = requestAnimationFrame(animate);
    };
    animFrameId = requestAnimationFrame(animate);

    // ドラッグで地球儀を回転するポインターイベント
    const canvas = canvasRef.current!;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
      // 進行中のアニメーション予約をキャンセル
      pendingLocationRef.current = null;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      // 横移動 → phi（左がプラス方向）、縦移動 → theta
      currentPhi += dx * 0.005;
      currentTheta += dy * 0.005;
      currentTheta = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, currentTheta));
      // focusRef を追従させてアニメーションの引き戻しを防ぐ
      focusRef.current = [currentPhi, currentTheta];
    };

    const onPointerUp = () => {
      isDragging = false;
      canvas.style.cursor = "grab";
    };

    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    setTimeout(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = "1";
    });

    return () => {
      cancelAnimationFrame(animFrameId);
      globe.destroy();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
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
        className={[
          "transition-all duration-1000 ease-in-out",
          selectedLocation ? "blur-sm opacity-50 scale-95" : "",
        ].join(" ")}
        style={{
          width: "100%", height: "100%", contain: "layout paint size",
          opacity: 0, transition: "opacity 1s ease"
        }}
      />

      {POST_LOCATIONS.map((loc) => (
        <PolaroidCard key={loc.slug} location={loc} isActive={frontmostSlug === loc.slug} />
      ))}

      <div className="flex flex-wrap justify-center items-center gap-2 mt-3">
        <span className="text-sm text-muted-foreground">Rotate to:</span>
        {POST_LOCATIONS.map((loc) => (
          <button
            key={loc.slug}
            onClick={() => {
              focusRef.current = locationToAngles(loc.lat, loc.lng);
              pendingLocationRef.current = loc;  // 到着したらカードを開く予約
              setSelectedLocation(null);         // 前のカードを即閉じる
            }}
            className="bg-white/10 hover:bg-white/20 transition-colors rounded-lg px-3 py-1 text-sm cursor-pointer"
          >
            {loc.name}
          </button>
        ))}
      </div>

      <LocationCardOverlay
        location={selectedLocation}
        onClose={() => {
          setSelectedLocation(null); // カードを閉じる
        }}
      />

    </div>
  );
}