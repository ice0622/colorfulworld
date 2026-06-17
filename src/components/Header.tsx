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
      className="fixed left-0 right-0 top-4 z-50 mx-auto w-[calc(100%-1rem)] max-w-2xl"
    >
      <nav
        className={cn(
          "flex items-center justify-between rounded-2xl px-4 py-2.5",
          "backdrop-blur-md",
          "bg-card/70",
          "border border-border/60",
          "shadow-[0_4px_24px_hsl(var(--foreground)/0.08)]"
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

        <div className="flex items-center gap-1">
          <Link
            href="/about"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              isAbout
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            About
          </Link>
        </div>
      </nav>
    </motion.header>
  );
};
