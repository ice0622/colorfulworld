"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { uploadImage } from "./ImageUploader";

type Props = {
  /** アップロードした画像URLを本文へ挿入する */
  onInsert: (url: string) => void;
};

// 執筆中つねに画面下に固定される、スマホ向けの操作バー。
// 「画像を追加」→ OS のファイル選択（撮影/ライブラリ）→ アップロード → 本文に挿入。
export function EditorToolbar({ onInsert }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      // uploadImage 内で進捗/完了/失敗の toast を出すのでここでは出さない
      const url = await uploadImage(file);
      onInsert(url);
    } catch {
      // エラー通知も uploadImage 側に委譲済み
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 px-4 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center py-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex h-12 items-center gap-2 rounded-md border border-input px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          {busy ? "アップロード中…" : "画像を追加"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
