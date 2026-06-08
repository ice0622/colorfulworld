"use client";

import { useEffect, useState } from "react";
import { PostContent } from "@/components/BlogPostContent";

// 本文 markdown を本番同一パイプラインで HTML 化してプレビュー（debounce）
export function LivePreview({ body, title }: { body: string; title?: string }) {
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
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [body]);

  return (
    <div className="h-full overflow-auto rounded-md border border-input p-4">
      {title && (
        <h1 className="mb-4 text-2xl font-bold tracking-tight">{title}</h1>
      )}
      {html ? (
        <PostContent content={html} chrome={false} />
      ) : (
        <p className="text-sm text-muted-foreground">プレビュー…</p>
      )}
    </div>
  );
}
