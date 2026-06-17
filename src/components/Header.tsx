"use client";

import { config } from "@/config";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FunctionComponent } from "react";
import { DarkModeToggle } from "./DarkModeToggle";

/**
 * ミニマルなフローティングヘッダー。
 * 下スクロールで隠れ、上スクロール（停止時）で出てくる。
 * 中身は サイト名(=Home) / About / テーマ。現在地はテキストの濃さで明示。
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
      className="fixed left-0 right-0 top-4 z-50 mx-auto w-[calc(100%-1rem)] max-w-2xl"
    >
      <nav
        className={cn(
          "flex items-center justify-between rounded-2xl px-4 py-2.5",
          "backdrop-blur-md",
          "bg-white/60 dark:bg-black/40",
          "border border-white/40 dark:border-white/10",
          "shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
        )}
      >
        <Link
          href="/"
          className={cn(
            "text-sm font-semibold tracking-tight transition-colors",
            isHome
              ? "text-gray-900 dark:text-white"
              : "text-gray-700 hover:text-gray-900 dark:text-white/70 dark:hover:text-white"
          )}
        >
          {config.blog.name}
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/about"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              isAbout
                ? "font-medium text-gray-900 dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
            )}
          >
            About
          </Link>
          <DarkModeToggle />
        </div>
      </nav>
    </motion.header>
  );
};
