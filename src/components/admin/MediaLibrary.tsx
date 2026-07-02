"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { softDeleteMediaAction } from "@/app/(admin)/admin/images/actions";
import type { MediaItem } from "@/lib/admin/media-repo";

const PAGE = 60;

// 画像ライブラリの管理ページ本体。閲覧・URLコピー・ソフト削除・もっと読む。
export function MediaLibrary({ initial }: { initial: MediaItem[] }) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [done, setDone] = useState(initial.length < PAGE);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const loadMore = async () => {
    setLoading(true);
    try {
      const last = items[items.length - 1];
      const qs = new URLSearchParams({ limit: String(PAGE) });
      if (last) qs.set("before", last.createdAt);
      const res = await fetch(`/api/admin/media?${qs.toString()}`);
      if (!res.ok) throw new Error("読み込みに失敗しました");
      const { items: got } = (await res.json()) as { items: MediaItem[] };
      setItems((prev) => [...prev, ...got]);
      if (got.length < PAGE) setDone(true);
    } catch (e) {
      toast({
        variant: "destructive",
        description: e instanceof Error ? e.message : "読み込みに失敗しました",
      });
    } finally {
      setLoading(false);
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ description: "URLをコピーしました" });
    } catch {
      toast({ variant: "destructive", description: "コピーできませんでした" });
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("この画像をライブラリから削除しますか？（記事で使用中の表示は残ります）"))
      return;
    setDeleting(id);
    try {
      const res = await softDeleteMediaAction(id);
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast({ description: "削除しました" });
    } catch {
      toast({ variant: "destructive", description: "削除に失敗しました" });
    } finally {
      setDeleting(null);
    }
  };

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        まだ画像がありません。記事編集画面からアップロードするとここに貯まります。
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((m) => (
          <div
            key={m.id}
            className="overflow-hidden rounded-md border border-input"
          >
            <div className="relative aspect-square bg-muted">
              <Image
                src={m.url}
                alt={m.filename ?? ""}
                fill
                sizes="(max-width: 640px) 50vw, 240px"
                className="object-cover"
                {...(m.blur
                  ? { placeholder: "blur" as const, blurDataURL: m.blur }
                  : {})}
              />
            </div>
            <div className="flex items-center justify-between gap-1 p-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 flex-1 justify-start gap-1 px-2 text-xs"
                onClick={() => copy(m.url)}
              >
                <Copy className="h-3.5 w-3.5" />
                URLコピー
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 px-0"
                onClick={() => remove(m.id)}
                disabled={deleting === m.id}
                aria-label="削除"
              >
                {deleting === m.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!done && (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            もっと読む
          </Button>
        </div>
      )}
    </div>
  );
}
