"use client";

import { useEffect, useRef, useState, RefObject } from "react";

/**
 * スティッキーコンテナ内のスクロール進捗を 0〜1 で返す。
 * containerRef: position:sticky + overflow に使う外側の高さのある div を渡す。
 * containerRef が null のときはドキュメント全体のスクロール進捗を返す。
 */
export function useScrollProgress(
  containerRef: RefObject<HTMLElement | null>
): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const container = containerRef.current;
      if (!container) {
        const docScrollable =
          document.documentElement.scrollHeight - window.innerHeight;
        setProgress(
          docScrollable > 0
            ? Math.min(1, Math.max(0, window.scrollY / docScrollable))
            : 0
        );
        return;
      }

      // コンテナの上端がビューポート上端に到達した時点を 0、
      // コンテナの下端がビューポート下端を通過した時点を 1 とする。
      const containerTop = container.offsetTop;
      const scrollable = container.offsetHeight - window.innerHeight;

      const p =
        scrollable > 0
          ? Math.min(1, Math.max(0, (window.scrollY - containerTop) / scrollable))
          : 0;

      setProgress(p);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // 初期値を計算

    return () => window.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  return progress;
}
