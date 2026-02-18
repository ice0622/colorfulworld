"use client";

import dynamic from "next/dynamic";

const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });

export default function GlobeWrapper() {
  return (
    <div className="flex justify-center my-10">
      <Globe />
    </div>
  );
}