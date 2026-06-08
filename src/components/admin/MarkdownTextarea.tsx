"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Bold, Italic, Heading, Link2, Code, Image as ImageIcon } from "lucide-react";

export type MarkdownTextareaHandle = {
  insert: (text: string) => void;
};

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  onRequestImage?: () => void; // 画像ボタン押下時（PostEditor 側でアップローダを開く）
};

export const MarkdownTextarea = forwardRef<MarkdownTextareaHandle, Props>(
  function MarkdownTextarea({ value, onChange, placeholder, onRequestImage }, ref) {
    const taRef = useRef<HTMLTextAreaElement>(null);

    const setCaret = (pos: number) => {
      requestAnimationFrame(() => {
        const ta = taRef.current;
        if (!ta) return;
        ta.focus();
        ta.setSelectionRange(pos, pos);
      });
    };

    useImperativeHandle(ref, () => ({
      insert(text: string) {
        const ta = taRef.current;
        const start = ta?.selectionStart ?? value.length;
        const end = ta?.selectionEnd ?? value.length;
        const next = value.slice(0, start) + text + value.slice(end);
        onChange(next);
        setCaret(start + text.length);
      },
    }));

    // 選択範囲を before/after で囲む（無選択ならプレースホルダ挿入）
    const wrap = (before: string, after = before, placeholderText = "") => {
      const ta = taRef.current;
      const start = ta?.selectionStart ?? value.length;
      const end = ta?.selectionEnd ?? value.length;
      const selected = value.slice(start, end) || placeholderText;
      const next =
        value.slice(0, start) + before + selected + after + value.slice(end);
      onChange(next);
      setCaret(start + before.length + selected.length + after.length);
    };

    const prefixLine = (prefix: string) => {
      const ta = taRef.current;
      const start = ta?.selectionStart ?? value.length;
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
      onChange(next);
      setCaret(start + prefix.length);
    };

    const btn =
      "inline-flex h-8 w-8 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground";

    return (
      <div className="flex h-full flex-col rounded-md border border-input">
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
          <button type="button" className={btn} title="画像を挿入" onClick={onRequestImage}>
            <ImageIcon className="h-4 w-4" />
          </button>
        </div>
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          className="min-h-[50vh] flex-1 resize-none bg-background p-3 font-mono text-sm leading-relaxed outline-none"
        />
      </div>
    );
  }
);
