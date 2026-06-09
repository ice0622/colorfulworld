"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Bold, Italic, Heading, Link2, Code, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type MarkdownTextareaHandle = {
  insert: (text: string) => void;
};

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** 画像ファイルをアップロードして URL を返す */
  onUpload: (file: File) => Promise<string>;
  /** スクロール位置（0..1）通知（プレビュー同期用） */
  onScrollRatio?: (ratio: number) => void;
};

export const MarkdownTextarea = forwardRef<MarkdownTextareaHandle, Props>(
  function MarkdownTextarea(
    { value, onChange, placeholder, onUpload, onScrollRatio },
    ref
  ) {
    const taRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const seqRef = useRef(0);
    const [dragging, setDragging] = useState(false);
    const { toast } = useToast();

    // 置換は非同期完了後に最新 value で行うため ref で追従
    const valueRef = useRef(value);
    valueRef.current = value;

    const setCaret = (pos: number) => {
      requestAnimationFrame(() => {
        const ta = taRef.current;
        if (!ta) return;
        ta.focus();
        ta.setSelectionRange(pos, pos);
      });
    };

    // キャレット位置（無ければ末尾）にテキスト挿入し、挿入後のキャレット位置を返す
    const insertText = (text: string): void => {
      const ta = taRef.current;
      const cur = valueRef.current;
      const start = ta?.selectionStart ?? cur.length;
      const end = ta?.selectionEnd ?? start;
      const next = cur.slice(0, start) + text + cur.slice(end);
      onChange(next);
      setCaret(start + text.length);
    };

    useImperativeHandle(ref, () => ({ insert: insertText }));

    // GitHub 風：プレースホルダ即挿入 → 完了で本物に置換
    const uploadAndInsert = async (file: File) => {
      const seq = ++seqRef.current;
      const placeholder = `![アップロード中… #${seq}]()`;
      insertText(`\n${placeholder}\n`);
      try {
        const url = await onUpload(file);
        onChange(valueRef.current.replace(placeholder, `![](${url})`));
      } catch (e) {
        // 失敗時はプレースホルダを除去
        onChange(valueRef.current.replace(placeholder, ""));
        toast({
          variant: "destructive",
          description: e instanceof Error ? e.message : "アップロード失敗",
        });
      }
    };

    // HEIC は file.type が空のことがあるので拡張子でも画像判定する
    const isImageFile = (f: File) =>
      f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name);

    const handleFiles = (files: FileList | File[] | null | undefined) => {
      const images = Array.from(files ?? []).filter(isImageFile);
      images.forEach((f) => void uploadAndInsert(f));
    };

    // ---- ツールバー（選択範囲を装飾） ----
    const wrap = (before: string, after = before, ph = "") => {
      const ta = taRef.current;
      const cur = valueRef.current;
      const start = ta?.selectionStart ?? cur.length;
      const end = ta?.selectionEnd ?? cur.length;
      const selected = cur.slice(start, end) || ph;
      const next = cur.slice(0, start) + before + selected + after + cur.slice(end);
      onChange(next);
      setCaret(start + before.length + selected.length + after.length);
    };
    const prefixLine = (prefix: string) => {
      const ta = taRef.current;
      const cur = valueRef.current;
      const start = ta?.selectionStart ?? cur.length;
      const lineStart = cur.lastIndexOf("\n", start - 1) + 1;
      onChange(cur.slice(0, lineStart) + prefix + cur.slice(lineStart));
      setCaret(start + prefix.length);
    };

    const btn =
      "inline-flex h-8 w-8 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground";

    return (
      <div className="relative flex h-full flex-col rounded-md border border-input">
        <div className="flex items-center gap-0.5 border-b border-input px-1 py-1">
          <button type="button" className={btn} title="太字" onClick={() => wrap("**", "**", "太字")}>
            <Bold className="h-4 w-4" />
          </button>
          <button type="button" className={btn} title="斜体" onClick={() => wrap("*", "*", "斜体")}>
            <Italic className="h-4 w-4" />
          </button>
          <button type="button" className={btn} title="見出し" onClick={() => prefixLine("## ")}>
            <Heading className="h-4 w-4" />
          </button>
          <button type="button" className={btn} title="リンク" onClick={() => wrap("[", "](url)", "テキスト")}>
            <Link2 className="h-4 w-4" />
          </button>
          <button type="button" className={btn} title="コード" onClick={() => wrap("`", "`", "code")}>
            <Code className="h-4 w-4" />
          </button>
          <button type="button" className={btn} title="画像を追加" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="h-4 w-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => {
            const el = e.currentTarget;
            const max = el.scrollHeight - el.clientHeight;
            onScrollRatio?.(max > 0 ? el.scrollTop / max : 0);
          }}
          placeholder={placeholder}
          spellCheck={false}
          onDragOver={(e) => {
            if (Array.from(e.dataTransfer.types).includes("Files")) {
              e.preventDefault();
              setDragging(true);
            }
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            if (e.dataTransfer.files.length) {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }
          }}
          onPaste={(e) => {
            const files = Array.from(e.clipboardData.files).filter(isImageFile);
            if (files.length) {
              e.preventDefault();
              handleFiles(files);
            }
          }}
          className="h-[50vh] flex-1 resize-none bg-background p-3 font-mono text-sm leading-relaxed outline-none lg:h-[70vh]"
        />

        {/* ドラッグ中のオーバーレイ */}
        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-background/80 text-sm font-medium text-primary">
            ドロップして画像をアップロード
          </div>
        )}
      </div>
    );
  }
);
