"use client";

import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// 画像をアップロードして URL を返す。アップロード自体は呼び出し側が onUploaded で受け取る。
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "アップロード失敗" }));
    throw new Error(error || "アップロード失敗");
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}

type Props = {
  onUploaded: (url: string) => void;
  /** ドロップゾーンの見た目（children）。省略時はボタン風 */
  children?: React.ReactNode;
  className?: string;
};

export function ImageUploader({ onUploaded, children, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const { toast } = useToast();

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    toast({ description: "画像をアップロード中…" });
    try {
      const url = await uploadImage(file);
      onUploaded(url);
      toast({ description: "アップロード完了" });
    } catch (e) {
      toast({
        variant: "destructive",
        description: e instanceof Error ? e.message : "アップロード失敗",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={
        className ??
        `flex cursor-pointer items-center justify-center rounded-md border border-dashed px-3 py-2 text-sm transition-colors ${
          drag ? "border-primary bg-muted" : "border-input text-muted-foreground hover:bg-muted"
        }`
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {children ?? (busy ? "アップロード中…" : "画像をドロップ / クリックで選択")}
    </div>
  );
}
