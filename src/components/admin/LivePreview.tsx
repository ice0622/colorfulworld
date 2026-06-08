"use client";

import { forwardRef, useEffect, useState } from "react";
import { PostContent } from "@/components/BlogPostContent";

// 本文 markdown を本番同一パイプラインで HTML 化してプレビュー（debounce）
// スクロール同期のため、外側スクロール要素を ref で公開する
export const LivePreview = forwardRef<
  HTMLDivElement,
  { body: string; title?: string }
>(function LivePreview({ body, title }, ref) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        if (!res.ok) return;
        const { html } = (await res.json()) as { html: string };
        if (!cancelled) setHtml(html);
      } catch {
        /* プレビュー失敗は黙殺 */
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [body]);

  return (
    <div
      ref={ref}
      className="h-[50vh] overflow-auto rounded-md border border-input p-4 lg:h-[70vh]"
    >
      {title && <h1 className="mb-4 text-2xl font-bold tracking-tight">{title}</h1>}
      {html ? (
        <PostContent content={html} chrome={false} animate={false} />
      ) : (
        <p className="text-sm text-muted-foreground">プレビュー…</p>
      )}
    </div>
  );
});
