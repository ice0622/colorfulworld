"use client";

import { useEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

type Props = {
  /** 初期 markdown（マウント時のみ反映。以後はエディタが真実） */
  defaultValue: string;
  onChange: (markdown: string) => void;
  /** 画像をアップロードして URL を返す（HEIC変換込み） */
  onUpload: (file: File) => Promise<string>;
};

// Obsidian/Notion 風のインライン WYSIWYG（markdown を保ったまま編集）
export default function WysiwygEditor({ defaultValue, onChange, onUpload }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const onUploadRef = useRef(onUpload);
  onChangeRef.current = onChange;
  onUploadRef.current = onUpload;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let crepe: Crepe | null = null;
    let destroyed = false;

    (async () => {
      crepe = new Crepe({
        root,
        defaultValue,
        featureConfigs: {
          [Crepe.Feature.ImageBlock]: {
            onUpload: (f) => onUploadRef.current(f),
            blockOnUpload: (f) => onUploadRef.current(f),
            inlineOnUpload: (f) => onUploadRef.current(f),
          },
        },
      });
      crepe.on((api) => {
        api.markdownUpdated((_ctx, markdown) => onChangeRef.current(markdown));
      });
      await crepe.create();
      if (destroyed) await crepe.destroy();
    })();

    return () => {
      destroyed = true;
      crepe?.destroy();
    };
    // 初期化は一度だけ（defaultValue は初期値としてのみ使用）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="milkdown-host overflow-hidden rounded-md border border-input">
      <div ref={rootRef} />
    </div>
  );
}
