"use client";

import { useRef, useState } from "react";
import {
  ImagePlus,
  Images,
  Loader2,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import { useBatchUpload, type BatchItem } from "./useBatchUpload";
import { MediaPickerSheet } from "./MediaPickerSheet";

type Props = {
  /** 画像URLを本文のカーソル位置へ挿入する（複数時は順番に呼ばれる） */
  onInsert: (url: string) => void;
};

const STATUS_LABEL: Record<BatchItem["status"], string> = {
  queued: "待機",
  converting: "変換中",
  uploading: "アップ中",
  done: "完了",
  error: "失敗",
};

function StatusIcon({ status }: { status: BatchItem["status"] }) {
  if (status === "done") return <Check className="h-4 w-4" />;
  if (status === "error") return <AlertCircle className="h-4 w-4" />;
  if (status === "converting" || status === "uploading")
    return <Loader2 className="h-4 w-4 animate-spin" />;
  return <span className="h-4 w-4" />; // queued: 余白
}

// 執筆中つねに画面下に固定される、スマホ向けの操作バー。
// 「画像を追加」= 複数選択してまとめてアップ → 選んだ順に本文へ挿入。
// 「ライブラリ」= 過去にアップした画像から選んで挿入。
export function EditorToolbar({ onInsert }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { items, running, elapsedMs, run, clear } = useBatchUpload(onInsert);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await run(Array.from(files));
    if (inputRef.current) inputRef.current.value = "";
  };

  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 px-4 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {/* 進捗パネル（状態チップ＋件数＋経過タイマー） */}
      {items.length > 0 && (
        <div className="mx-auto max-w-4xl pt-2">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {doneCount}/{items.length} 完了
              {errorCount > 0 && ` ・ ${errorCount}件 失敗`}
              {" ・ "}
              経過 {(elapsedMs / 1000).toFixed(1)}s
            </span>
            {!running && (
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                閉じる
              </button>
            )}
          </div>
          <ul className="max-h-28 space-y-0.5 overflow-y-auto text-xs">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  <StatusIcon status={it.status} />
                </span>
                <span className="min-w-0 flex-1 truncate">{it.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {it.status === "error" && it.error
                    ? it.error
                    : STATUS_LABEL[it.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mx-auto flex max-w-4xl items-center gap-2 py-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={running}
          className="inline-flex h-12 items-center gap-2 rounded-md border border-input px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          {running ? "アップロード中…" : "画像を追加"}
        </button>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={running}
          className="inline-flex h-12 items-center gap-2 rounded-md border border-input px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Images className="h-5 w-5" />
          ライブラリ
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <MediaPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onInsert={onInsert}
      />
    </div>
  );
}
