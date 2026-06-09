"use client";

import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// HEIC/HEIF（iPhone 写真など）はブラウザで表示できないので JPEG に変換してから扱う
async function convertHeicIfNeeded(file: File): Promise<File> {
  const isHeic =
    /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (!isHeic) return file;

  const heic2any = (await import("heic2any")).default;
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  const blob = Array.isArray(out) ? out[0] : out;
  const name = file.name.replace(/\.(heic|heif)$/i, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

// アップロード前に長辺 maxDim までリサイズ＆再エンコードして転送量を減らす
const MAX_DIM = 1920;
const JPEG_QUALITY = 0.82;

async function downscaleImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // デコードできなければそのまま送る
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIM / Math.max(width, height));
  // 既に十分小さい（縮小不要かつ 1MB 未満）なら再エンコードしない
  if (scale === 1 && file.size < 1_000_000) {
    bitmap.close();
    return file;
  }

  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  // PNG は透過維持のため PNG、それ以外は JPEG
  const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outType, JPEG_QUALITY)
  );
  if (!blob) return file;

  const ext = outType === "image/png" ? "png" : "jpg";
  const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
  return new File([blob], name, { type: outType });
}

// 画像をアップロードして URL を返す。HEIC変換→リサイズ→送信。60秒でタイムアウト。
export async function uploadImage(input: File): Promise<string> {
  const converted = await convertHeicIfNeeded(input);
  const file = await downscaleImage(converted);

  const form = new FormData();
  form.append("file", file);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "アップロード失敗" }));
      throw new Error(error || "アップロード失敗");
    }
    const { url } = (await res.json()) as { url: string };
    return url;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("アップロードがタイムアウトしました（60秒）");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
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
