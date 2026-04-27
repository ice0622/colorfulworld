"use client";

import { config } from "@/config";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FunctionComponent, useEffect, useState } from "react";

const menuItems = [
  { name: "Home", href: "/" },
  { name: "Blog", href: "/blog" },
  { name: "About", href: "/about" },
];

export const Header: FunctionComponent = () => {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();

  const [isOpen, setIsOpen] = useState(false);

  const isVisible = scrollDirection === "up";

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <motion.header
      animate={{ y: isVisible ? 0 : "-150%" }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="fixed top-4 left-0 right-0 mx-auto z-50 w-[calc(100%-1rem)] max-w-lg"
    >
      <motion.nav
        layout
        className={cn(
          "flex flex-col rounded-2xl",
          "backdrop-blur-md",
          "bg-white/60 dark:bg-black/40",
          "border border-white/40 dark:border-white/10",
          "shadow-[0_4px_24px_rgba(0,0,0,0.08)]",
          "overflow-hidden" // ← ここ重要（蛇腹用）
        )}
      >
        {/* 上段：タイトル + ボタン（常に固定） */}
        <div className="flex items-center justify-between px-3 py-2">
          <Link
            href="/"
            className="px-3 py-1 text-sm font-bold tracking-tight text-gray-800 dark:text-gray-100 truncate max-w-[140px]"
          >
            {config.blog.name}
          </Link>

          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="sm:hidden p-2 rounded-lg active:scale-95 transition"
          >
            <div className="relative w-5 h-5">
              <motion.span
                className="absolute left-0 top-1/2 w-full h-[2px] bg-gray-800 dark:bg-white origin-center"
                animate={isOpen ? { rotate: 45 } : { y: -6 }}
              />
              <motion.span
                className="absolute left-0 top-1/2 w-full h-[2px] bg-gray-800 dark:bg-white"
                animate={{ opacity: isOpen ? 0 : 1 }}
              />
              <motion.span
                className="absolute left-0 top-1/2 w-full h-[2px] bg-gray-800 dark:bg-white origin-center"
                animate={isOpen ? { rotate: -45 } : { y: 6 }}
              />
            </div>
          </button>

          {/* PCナビ */}
          <div className="hidden sm:flex items-center gap-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1 text-sm rounded-xl",
                  pathname === item.href && "font-semibold"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* モバイルメニュー（蛇腹） */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="sm:hidden"
            >
              <div className="flex flex-col gap-1 px-2 pb-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 rounded-xl text-sm",
                      "hover:bg-gray-900/10 dark:hover:bg-white/10",
                      pathname === item.href && "font-semibold"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </motion.header>
  );
};