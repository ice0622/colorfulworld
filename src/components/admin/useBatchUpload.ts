"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadImage } from "./ImageUploader";

export type BatchItemStatus =
  | "queued"
  | "converting"
  | "uploading"
  | "done"
  | "error";

export type BatchItem = {
  id: string;
  name: string;
  status: BatchItemStatus;
  error?: string;
};

// スマホのメモリを守るため同時処理数は絞る（HEIC 変換が重い）
const CONCURRENCY = 2;

/**
 * 複数画像を少数並列（同時2件）でアップロードするフック。
 * - 各ファイルの状態（待機/変換中/アップ中/完了/失敗）と全体の経過時間を持つ
 * - 完了したら「選択順」で onInsert を呼ぶ（完了順ではない）
 */
export function useBatchUpload(onInsert: (url: string) => void) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onInsertRef = useRef(onInsert);
  onInsertRef.current = onInsert;

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    []
  );

  const run = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const batch: BatchItem[] = files.map((f, i) => ({
      id: `${i}-${f.name}`,
      name: f.name,
      status: "queued",
    }));
    setItems(batch);
    setRunning(true);
    setElapsedMs(0);

    const startedAt = performance.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setElapsedMs(performance.now() - startedAt),
      200
    );

    const setStatus = (id: string, status: BatchItemStatus, error?: string) =>
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status, error } : it))
      );

    const results: (string | null)[] = new Array(files.length).fill(null);
    let cursor = 0;

    const worker = async () => {
      while (cursor < files.length) {
        const idx = cursor++;
        const id = batch[idx].id;
        try {
          const { url } = await uploadImage(files[idx], (phase) =>
            setStatus(id, phase)
          );
          results[idx] = url;
          setStatus(id, "done");
        } catch (e) {
          setStatus(id, "error", e instanceof Error ? e.message : "失敗");
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker)
    );

    // 選択順に本文へ挿入（成功したものだけ）
    for (const url of results) if (url) onInsertRef.current(url);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedMs(performance.now() - startedAt);
    setRunning(false);
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, running, elapsedMs, run, clear };
}
