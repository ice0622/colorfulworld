"use client";

import GlobeWrapper from "@/components/GlobeWrapper";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const INTRO_FADE_OUT_DELAY_MS = 1700;
const INTRO_COMPLETE_DELAY_MS = 2550;

export default function HomeHero() {
  const [hasIntroFinished, setHasIntroFinished] = useState(false);
  const [isIntroFadingOut, setIsIntroFadingOut] = useState(false);
  const [isGlobeReady, setIsGlobeReady] = useState(false);

  useEffect(() => {
    const fadeOutId = window.setTimeout(() => {
      setIsIntroFadingOut(true);
    }, INTRO_FADE_OUT_DELAY_MS);

    const completeId = window.setTimeout(() => {
      setHasIntroFinished(true);
    }, INTRO_COMPLETE_DELAY_MS);

    return () => {
      window.clearTimeout(fadeOutId);
      window.clearTimeout(completeId);
    };
  }, []);

  const shouldRevealGlobe = hasIntroFinished && isGlobeReady;
  const shouldRevealCopy = hasIntroFinished;

  const transition = useMemo(
    () => ({ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }),
    []
  );

  return (
    <section className="relative flex flex-col items-center justify-center">
      {/* イントロ（クリーン版） */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={isIntroFadingOut ? { opacity: 0 } : { opacity: 1 }}
        transition={transition}
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
        aria-hidden={hasIntroFinished}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={
            isIntroFadingOut
              ? { opacity: 0, y: -16 }
              : { opacity: 1, y: 0 }
          }
          transition={transition}
          className="text-center px-6"
        >
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={
              isIntroFadingOut
                ? { opacity: 0, y: -10 }
                : { opacity: 1, y: 0 }
            }
            transition={{ delay: 0.05, ...transition }}
            className="px-4 text-4xl font-semibold tracking-[0.08em] text-gray-900 dark:text-white sm:text-5xl md:text-6xl"
            style={{ fontFamily: "'Hannari', serif" }}
          >
            {process.env.NEXT_PUBLIC_BLOG_DISPLAY_NAME}
          </motion.h1>
        </motion.div>
      </motion.div>

      {/* メインコンテンツ */}
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-6 text-center">
        <GlobeWrapper
          isVisible={shouldRevealGlobe}
          onReady={() => setIsGlobeReady(true)}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={
            shouldRevealCopy
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 16 }
          }
          transition={transition}
          className="space-y-4 pt-2"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={
              shouldRevealCopy
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 10 }
            }
            transition={{
              delay: shouldRevealGlobe ? 0.1 : 0,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Link
              href="/blog"
              className="text-sm text-gray-700 underline underline-offset-4 transition-colors hover:text-gray-900 dark:text-white/70 dark:hover:text-white"
            >
              すべての記事を見る →
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}