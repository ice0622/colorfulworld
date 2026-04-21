"use client";

import { config } from "@/config";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FunctionComponent, useState } from "react";

interface MenuItem {
  name: string;
  href: string;
}

const menuItems: MenuItem[] = [
  { name: "Home", href: "/" },
  { name: "Blog", href: "/blog" },
  { name: "About", href: "/about" },
];

export const Header: FunctionComponent = () => {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isVisible = scrollDirection === "up";

  return (
    <motion.header
      role="banner"
      // スクロール下 → 上へ飛んで消える / スクロール上 → びよーんと降りてくる
      animate={{ y: isVisible ? 0 : "-150%" }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 28,
        mass: 0.8,
      }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      style={{ willChange: "transform" }}
    >
      <nav
        className={cn(
          "relative flex items-center gap-1 px-3 py-2 rounded-2xl",
          // Glass effect
          "backdrop-blur-md",
          "bg-white/60 dark:bg-black/40",
          "border border-white/40 dark:border-white/10",
          "shadow-[0_4px_24px_rgba(0,0,0,0.08)]",
          // GPU layer
          "translate-z-0 isolate"
        )}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {/* ロゴ */}
        <Link
          href="/"
          aria-label={config.blog.name}
          className="px-3 py-1 text-sm font-bold tracking-tight mr-1 text-gray-800 dark:text-gray-100"
        >
          {config.blog.name}
        </Link>

        {/* 区切り線 */}
        <div className="w-px h-4 bg-gray-300/60 dark:bg-white/20 mx-1" />

        {/* ナビアイテム */}
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative px-3 py-1 text-sm rounded-xl transition-colors duration-150",
              "text-gray-600 dark:text-gray-300",
              "hover:text-gray-900 dark:hover:text-white",
              pathname === item.href && "font-semibold text-gray-900 dark:text-white"
            )}
            onMouseEnter={() => setHoveredItem(item.href)}
          >
            {/* Spring ハイライト */}
            <AnimatePresence>
              {hoveredItem === item.href && (
                <motion.span
                  layoutId="dock-highlight"
                  className="absolute inset-0 rounded-xl bg-gray-900/8 dark:bg-white/10"
                  transition={{
                    type: "spring",
                    stiffness: 250,
                    damping: 27,
                    mass: 1,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>
            <span className="relative z-10">{item.name}</span>
          </Link>
        ))}
      </nav>
    </motion.header>
  );
};

// 後方互換: Navigation を単体で使っているページがある場合のエイリアス
export const Navigation = Header;
