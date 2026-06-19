"use client";

import { config } from "@/config";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FunctionComponent } from "react";

/**
 * ミニマルなフローティングヘッダー。
 * 下スクロールで隠れ、上スクロール（停止時）で出てくる。
 * 中身は サイト名(=Home) / About。現在地はテキストの濃さで明示。
 */
export const Header: FunctionComponent = () => {
  const pathname = usePathname() ?? "";
  const scrollDirection = useScrollDirection();
  const isVisible = scrollDirection === "up";

  const isHome = pathname === "/";
  const isAbout = pathname.startsWith("/about");

  return (
    <motion.header
      animate={{ y: isVisible ? 0 : "-150%" }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
    >
      <nav
        className={cn(
          // 内容幅にぴったり収まる小型ピル（横に広げない）
          "flex items-center gap-1 rounded-full py-1.5 pl-4 pr-1.5",
          "backdrop-blur-md",
          "bg-card/70",
          "border border-border/60",
          // 影は軽く。カードが「浮く」印象を抑える
          "shadow-[0_2px_12px_hsl(var(--foreground)/0.06)]"
        )}
      >
        <Link
          href="/"
          className={cn(
            "text-sm font-semibold tracking-tight transition-colors",
            isHome
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {config.blog.name}
        </Link>

        <span aria-hidden className="mx-1.5 h-3.5 w-px bg-border/70" />

        <Link
          href="/about"
          className={cn(
            "rounded-full px-3 py-1 text-sm transition-colors",
            isAbout
              ? "font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          About
        </Link>
      </nav>
    </motion.header>
  );
};
