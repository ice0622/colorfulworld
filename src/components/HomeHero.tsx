"use client";

import GlobeWrapper from "@/components/GlobeWrapper";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import type { Post } from "@/types/content";

type Props = {
  locationPosts: Record<string, Post | null>;
};

export default function HomeHero({ locationPosts }: Props) {
  const [isGlobeReady, setIsGlobeReady] = useState(false);

  return (
    <section className="relative flex flex-col items-center justify-center">
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-6 text-center">
        <GlobeWrapper
          isVisible={isGlobeReady}
          onReady={() => setIsGlobeReady(true)}
          locationPosts={locationPosts}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isGlobeReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4 pt-2"
        >
          <Link
            href="/blog"
            className="text-sm text-gray-700 underline underline-offset-4 transition-colors hover:text-gray-900 dark:text-white/70 dark:hover:text-white"
          >
            すべての記事を見る →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}