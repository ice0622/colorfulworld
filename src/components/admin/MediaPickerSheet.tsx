"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/lib/admin/media-repo";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 選択したメディアを「選択順」にまとめて本文へ挿入する */
  onInsertMany: (urls: string[]) => void;
};

const PAGE = 60;

// エディタから開く画像ライブラリのピッカー。複数選択 → 選んだ順に挿入。
export function MediaPickerSheet({ open, onOpenChange, onInsertMany }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]); // url（選択順）
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (before?: string) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ limit: String(PAGE) });
      if (before) qs.set("before", before);
      const res = await fetch(`/api/admin/media?${qs.toString()}`);
      if (!res.ok) throw new Error("読み込みに失敗しました");
      const { items: got } = (await res.json()) as { items: MediaItem[] };
      setItems((prev) => (before ? [...prev, ...got] : got));
      if (got.length < PAGE) setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  // 開くたびに最新を取得しなおす
  useEffect(() => {
    if (!open) return;
    setItems([]);
    setSelected([]);
    setDone(false);
    load();
  }, [open, load]);

  const toggle = (url: string) =>
    setSelected((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );

  const confirm = () => {
    if (selected.length > 0) onInsertMany(selected);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex max-h-[85vh] flex-col p-0">
        <SheetHeader className="border-b border-border/60 p-4">
          <SheetTitle>ライブラリから選ぶ</SheetTitle>
          <SheetDescription>
            タップで選択（選んだ順に本文へ挿入されます）
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!error && items.length === 0 && !loading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              まだ画像がありません。アップロードするとここに貯まります。
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {items.map((m) => {
              const order = selected.indexOf(m.url);
              const isSel = order !== -1;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.url)}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-md border transition-colors",
                    isSel ? "border-primary ring-2 ring-primary" : "border-input"
                  )}
                >
                  <Image
                    src={m.url}
                    alt={m.filename ?? ""}
                    fill
                    sizes="(max-width: 640px) 33vw, 160px"
                    className="object-cover"
                    {...(m.blur
                      ? { placeholder: "blur" as const, blurDataURL: m.blur }
                      : {})}
                  />
                  {isSel && (
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      {order + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex justify-center">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              !done &&
              items.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => load(items[items.length - 1]?.createdAt)}
                >
                  もっと読む
                </Button>
              )
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <span className="text-sm text-muted-foreground">
            {selected.length}枚 選択中
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirm}
              disabled={selected.length === 0}
            >
              挿入
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
