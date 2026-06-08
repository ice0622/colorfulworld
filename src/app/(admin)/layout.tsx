import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";

// 管理画面のシェル（公開 Header/Footer は付けない）
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      {children}
      <Toaster />
    </div>
  );
}
