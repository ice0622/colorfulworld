"use client";

import createGlobe from "cobe";
import { useEffect, useRef, useState } from "react";
import { POST_LOCATIONS, PostLocation } from "@/lib/locations";
import LocationCardOverlay from "@/components/LocationCardOverlay";
import PolaroidCard from "@/components/PolaroidCard";

const DRAG_SENSITIVITY = 0.005;
const AUTO_ROTATION_STEP = 0.003;
const AUTO_ROTATION_RESUME_DELAY_MS = 0;
const AUTO_ROTATION_SPEED_EPSILON = 0.0006;
const AUTO_ROTATION_THETA_EPSILON = 0.00035;
const INERTIA_DAMPING = 0.92;
const INERTIA_MIN_SPEED = 0.0001;
const FOCUS_EASING = 0.08;
const ARRIVAL_EPSILON = 0.01;
const MAX_THETA = Math.PI / 2;

const locationToAngles = (lat: number, lng: number): [number, number] => {
  return [
    Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2),
    (lat * Math.PI) / 180,
  ];
};

const clampTheta = (theta: number) => {
  return Math.max(-MAX_THETA, Math.min(MAX_THETA, theta));
};

const normalizePhi = (phi: number) => {
  const doublePi = Math.PI * 2;
  return ((phi % doublePi) + doublePi) % doublePi;
};

const LOCATION_ANGLES = POST_LOCATIONS.map((location) => ({
  location,
  angles: locationToAngles(location.lat, location.lng),
}));

type GlobeProps = {
  onReady?: () => void;
};

export default function Globe({ onReady }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onReadyRef = useRef(onReady);
  const focusRef = useRef<[number, number]>(
    locationToAngles(POST_LOCATIONS[0].lat, POST_LOCATIONS[0].lng)
  );
  const stopMotionRef = useRef<() => void>(() => { });
  const [selectedLocation, setSelectedLocation] = useState<PostLocation | null>(null);
  const [frontmostSlug, setFrontmostSlug] = useState<string | null>(POST_LOCATIONS[0].slug);
  const selectedLocationRef = useRef<PostLocation | null>(null);
  const frontmostSlugRef = useRef<string | null>(POST_LOCATIONS[0].slug);
  // ボタンを押した時の「予約地点」。到着したらカードを開く
  const pendingLocationRef = useRef<PostLocation | null>(null);
  selectedLocationRef.current = selectedLocation;

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    let width = 0;
    let currentPhi = focusRef.current[0];
    let currentTheta = focusRef.current[1];
    const doublePi = Math.PI * 2;

    // ドラッグ状態
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let lastPointerTime = 0;
    let inertiaPhiVelocity = 0;
    let inertiaThetaVelocity = 0;
    let lastFrameTime = 0;
    let lastInteractionAt = performance.now();

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

    stopMotionRef.current = () => {
      inertiaPhiVelocity = 0;
      inertiaThetaVelocity = 0;
      lastInteractionAt = performance.now();
    };

    // v2: onRender は廃止。requestAnimationFrame + globe.update() で自前アニメーション
    let animFrameId: number;
    let fadeInFrameId = 0;
    const animate = (frameTime: number) => {
      if (!lastFrameTime) lastFrameTime = frameTime;
      const deltaRatio = Math.min((frameTime - lastFrameTime) / 16.67, 4);
      lastFrameTime = frameTime;

      const [focusPhi, focusTheta] = focusRef.current;

      const hasPendingFocus = pendingLocationRef.current !== null;
      const shouldHoldFocus = hasPendingFocus || selectedLocationRef.current !== null;
      const canMergeIntoAutoRotate =
        !shouldHoldFocus &&
        !isDragging &&
        frameTime - lastInteractionAt >= AUTO_ROTATION_RESUME_DELAY_MS &&
        Math.abs(inertiaThetaVelocity) < AUTO_ROTATION_THETA_EPSILON &&
        inertiaPhiVelocity > 0 &&
        Math.abs(inertiaPhiVelocity - AUTO_ROTATION_STEP) <= AUTO_ROTATION_SPEED_EPSILON;
      const canAutoRotate =
        !shouldHoldFocus &&
        !isDragging &&
        Math.abs(inertiaPhiVelocity) < INERTIA_MIN_SPEED &&
        Math.abs(inertiaThetaVelocity) < INERTIA_MIN_SPEED &&
        frameTime - lastInteractionAt >= AUTO_ROTATION_RESUME_DELAY_MS;

      if (isDragging) {
        inertiaPhiVelocity = 0;
        inertiaThetaVelocity = 0;
      } else if (
        Math.abs(inertiaPhiVelocity) >= INERTIA_MIN_SPEED ||
        Math.abs(inertiaThetaVelocity) >= INERTIA_MIN_SPEED
      ) {
        if (canMergeIntoAutoRotate) {
          currentPhi += AUTO_ROTATION_STEP * deltaRatio;
          inertiaPhiVelocity = 0;
          inertiaThetaVelocity = 0;
        } else {
          currentPhi += inertiaPhiVelocity * deltaRatio;
          currentTheta = clampTheta(currentTheta + inertiaThetaVelocity * deltaRatio);
          const damping = Math.pow(INERTIA_DAMPING, deltaRatio);
          inertiaPhiVelocity *= damping;
          inertiaThetaVelocity *= damping;
        }
        focusRef.current = [currentPhi, currentTheta];
        lastInteractionAt = frameTime;
      } else if (shouldHoldFocus) {
        const distPositive = (focusPhi - currentPhi + doublePi) % doublePi;
        const distNegative = (currentPhi - focusPhi + doublePi) % doublePi;
        const focusEase = 1 - Math.pow(1 - FOCUS_EASING, deltaRatio);

        if (distPositive < distNegative) {
          currentPhi += distPositive * focusEase;
        } else {
          currentPhi -= distNegative * focusEase;
        }
        currentTheta = clampTheta(
          currentTheta + (focusTheta - currentTheta) * focusEase
        );

        const dist = Math.min(distPositive, distNegative);
        if (
          pendingLocationRef.current &&
          dist < ARRIVAL_EPSILON &&
          Math.abs(currentTheta - focusTheta) < ARRIVAL_EPSILON
        ) {
          setSelectedLocation(pendingLocationRef.current);
          pendingLocationRef.current = null;
        }
      } else if (canAutoRotate) {
        currentPhi += AUTO_ROTATION_STEP * deltaRatio;
      }

      currentPhi = normalizePhi(currentPhi);

      let nextFrontmostSlug: string | null = null;
      let minAngularDistance = Infinity;
      for (const { location, angles } of LOCATION_ANGLES) {
        const [locationPhi, locationTheta] = angles;
        const phiDistance = Math.min(
          (currentPhi - locationPhi + doublePi) % doublePi,
          (locationPhi - currentPhi + doublePi) % doublePi
        );
        const thetaDistance = Math.abs(currentTheta - locationTheta);
        const angularDistance = Math.hypot(phiDistance, thetaDistance);

        if (angularDistance < Math.PI / 2 && angularDistance < minAngularDistance) {
          minAngularDistance = angularDistance;
          nextFrontmostSlug = location.slug;
        }
      }

      if (nextFrontmostSlug !== frontmostSlugRef.current) {
        frontmostSlugRef.current = nextFrontmostSlug;
        setFrontmostSlug(nextFrontmostSlug);
      }

      globe.update({
        width: width * 2,
        height: width * 2,
        phi: currentPhi,
        theta: currentTheta,
      });

      animFrameId = requestAnimationFrame(animate);
    };
    animFrameId = requestAnimationFrame(animate);

    // ドラッグで地球儀を回転するポインターイベント
    const canvas = canvasRef.current!;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      lastPointerTime = e.timeStamp;
      inertiaPhiVelocity = 0;
      inertiaThetaVelocity = 0;
      lastInteractionAt = performance.now();
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
      // 進行中のアニメーション予約をキャンセル
      pendingLocationRef.current = null;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const deltaMs = Math.max(e.timeStamp - lastPointerTime, 1);
      lastX = e.clientX;
      lastY = e.clientY;
      lastPointerTime = e.timeStamp;
      // 横移動 → phi（左がプラス方向）、縦移動 → theta
      currentPhi += dx * DRAG_SENSITIVITY;
      currentTheta = clampTheta(currentTheta + dy * DRAG_SENSITIVITY);
      const frameScale = deltaMs / 16.67;
      inertiaPhiVelocity = (dx * DRAG_SENSITIVITY) / frameScale;
      inertiaThetaVelocity = (dy * DRAG_SENSITIVITY) / frameScale;
      // focusRef を追従させてアニメーションの引き戻しを防ぐ
      focusRef.current = [currentPhi, currentTheta];
      lastInteractionAt = performance.now();
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging = false;
      lastInteractionAt = performance.now();
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      canvas.style.cursor = "grab";
    };

    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    fadeInFrameId = requestAnimationFrame(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = "1";
      onReadyRef.current?.();
    });

    return () => {
      cancelAnimationFrame(animFrameId);
      cancelAnimationFrame(fadeInFrameId);
      stopMotionRef.current = () => { };
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
        <PolaroidCard
          key={loc.slug}
          location={loc}
          isActive={frontmostSlug === loc.slug}
        />
      ))}

      <div className="flex flex-wrap justify-center items-center gap-2 mt-3">
        <span className="text-sm text-muted-foreground">Rotate to:</span>
        {POST_LOCATIONS.map((loc) => (
          <button
            key={loc.slug}
            onClick={() => {
              stopMotionRef.current();
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