"use client";

import { config } from "@/config";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FunctionComponent, useEffect, useId, useState } from "react";

// 各ナビ項目の手書き風オーバルパス（下→左→上→右の順に描画）
const OVAL_PATHS = [
  // Travel: 横広め、底面が緩やかに膨らむ形
  "M 88,34 C 68,44 24,43 5,33 C -3,24 -1,9 14,3 C 28,-2 72,-2 90,8 C 101,17 102,26 88,34 Z",
  // Blog: やや縦長・左右非対称で少し歪み
  "M 83,37 C 55,49 20,46 5,35 C -4,26 2,7 17,1 C 32,-4 70,-3 88,8 C 100,17 102,28 83,37 Z",
  // About: 右下が低め・全体的にいびつな形
  "M 87,33 C 72,41 28,45 8,31 C -2,21 5,7 20,2 C 36,-4 65,-1 88,10 C 102,21 99,27 87,33 Z",
];

type NavLinkProps = {
  href: string;
  ovalPath: string;
  children: React.ReactNode;
  className?: string;
};

function NavLink({ href, ovalPath, children, className }: NavLinkProps) {
  const [isHovered, setIsHovered] = useState(false);
  const rawId = useId();
  const filterId = rawId.replace(/:/g, "");

  return (
    <Link
      href={href}
      className={cn("relative inline-block px-3 py-1 text-sm font-['Hannari']", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <motion.svg
            key="oval"
            aria-hidden="true"
            viewBox="0 0 100 44"
            preserveAspectRatio="none"
            className="absolute pointer-events-none"
            style={{
              top: "-2px",
              bottom: "-2px",
              left: "-6px",
              right: "-6px",
              width: "calc(100% + 12px)",
              height: "calc(100% + 4px)",
              overflow: "visible",
            }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <defs>
              {/* チョーク質感: ノイズを高コントラスト化してより白く不透明な粒感に */}
              <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
                <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" seed="3" result="grain" />
                <feColorMatrix in="grain" type="saturate" values="0" result="grayGrain" />
                <feColorMatrix in="grayGrain" type="matrix"
                  values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 4 -1"
                  result="threshGrain" />
                <feComposite in="SourceGraphic" in2="threshGrain" operator="in" />
              </filter>
            </defs>
            <motion.path
              d={ovalPath}
              fill="none"
              stroke="rgba(255,255,255,0.95)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${filterId})`}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ pathLength: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </Link>
  );
}

const menuItems = [
  { name: "Travel", href: "/" },
  { name: "Blog",   href: "/blog" },
  { name: "About",  href: "/about" },
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
          "shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
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
            {menuItems.map((item, i) => (
              <NavLink
                key={item.href}
                href={item.href}
                
                ovalPath={OVAL_PATHS[i]}
              >
                {item.name}
              </NavLink>
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
              className="sm:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-1 px-2 pb-2">
                {menuItems.map((item, i) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    
                    ovalPath={OVAL_PATHS[i]}
                    className="py-2 rounded-xl hover:bg-gray-900/10 dark:hover:bg-white/10"
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </motion.header>
  );
};