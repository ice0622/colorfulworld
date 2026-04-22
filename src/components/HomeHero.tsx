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

  const titleTransition = useMemo(
    () => ({ duration: 0.9, ease: [0.22, 1, 0.36, 1] as const }),
    []
  );

  return (
    <section className="relative flex flex-col items-center justify-center">
      <div className="absolute inset-0 -z-20 
  bg-[linear-gradient(180deg,_rgba(9,9,11,0.95)_0%,_rgba(9,9,11,0.7)_40%,_rgba(9,9,11,0)_100%)]"
      />
      <motion.div
        initial={{ opacity: 1 }}
        animate={isIntroFadingOut ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
        aria-hidden={hasIntroFinished}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(9,9,11,0.92)_0%,_rgba(9,9,11,0.82)_48%,_rgba(9,9,11,0.58)_100%)]" />
        <motion.div
          initial={{ opacity: 0, y: 22, filter: "blur(18px)" }}
          animate={isIntroFadingOut
            ? { opacity: 0, y: -18, filter: "blur(12px)", scale: 1.015 }
            : { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
          transition={titleTransition}
          className="relative z-10 space-y-5 px-6 text-center"
        >
          <motion.h1
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={isIntroFadingOut
              ? { opacity: 0, y: -12, scale: 1.01 }
              : { opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.08, ...titleTransition }}
            className="px-4 text-4xl font-semibold tracking-[0.08em] text-white sm:text-5xl md:text-6xl"
            style={{ fontFamily: "'Hannari', serif" }}
          >
            {process.env.NEXT_PUBLIC_BLOG_DISPLAY_NAME}
          </motion.h1>


        </motion.div>

      </motion.div>

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-6 text-center">
        <GlobeWrapper isVisible={shouldRevealGlobe} onReady={() => setIsGlobeReady(true)} />

        <motion.div
          initial={{ opacity: 0, y: 18, filter: "blur(12px)" }}
          animate={shouldRevealCopy
            ? { opacity: 1, y: 0, filter: "blur(0px)" }
            : { opacity: 0, y: 18, filter: "blur(12px)" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4 pt-2"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={shouldRevealCopy ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ delay: shouldRevealGlobe ? 0.12 : 0, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/blog"
              className="text-sm text-white/78 underline underline-offset-4 transition-colors hover:text-white dark:text-white/72 dark:hover:text-white"
            >
              すべての記事を見る →
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}