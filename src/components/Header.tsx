"use client";

import { config } from "@/config";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FunctionComponent } from "react";
import { DarkModeToggle } from "./DarkModeToggle";

/**
 * ミニマルな固定テキストバー。
 * 左＝サイト名（＝Home）、右＝About・テーマ。装飾なしで常に読める。
 * 現在地はテキストの濃さで明示する。
 */
export const Header: FunctionComponent = () => {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAbout = pathname?.startsWith("/about") ?? false;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className={cn(
            "text-sm font-semibold tracking-tight transition-colors",
            isHome ? "text-foreground" : "text-foreground/80 hover:text-foreground"
          )}
        >
          {config.blog.name}
        </Link>

        <nav className="flex items-center gap-1">
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
          <DarkModeToggle />
        </nav>
      </div>
    </header>
  );
};
