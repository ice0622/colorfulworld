"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });

type GlobeWrapperProps = {
  isVisible?: boolean;
  onReady?: () => void;
};

export default function GlobeWrapper({ isVisible = true, onReady }: GlobeWrapperProps) {
  return (
    <div className="relative my-10 flex min-h-[26rem] w-full justify-center">
      <div
        className={cn(
          "absolute inset-x-6 top-1/2 h-64 -translate-y-1/2 rounded-full bg-white/8 blur-3xl transition-opacity duration-1000",
          isVisible ? "opacity-100" : "opacity-60"
        )}
      />
      <div
        className={cn(
          "transition-all duration-1000 ease-out",
          isVisible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-10 scale-[0.97] opacity-0"
        )}
      >
        <Globe onReady={onReady} />
      </div>
    </div>
  );
}