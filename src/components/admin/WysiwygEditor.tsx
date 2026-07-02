"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import { editorViewCtx } from "@milkdown/kit/core";
import { insertImageCommand } from "@milkdown/kit/preset/commonmark";
import { callCommand } from "@milkdown/kit/utils";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

type Props = {
  /** 初期 markdown（マウント時のみ反映。以後はエディタが真実） */
  defaultValue: string;
  onChange: (markdown: string) => void;
  /** 画像をアップロードして URL を返す（HEIC変換込み） */
  onUpload: (file: File) => Promise<string>;
};

/** 親から命令的に呼べる操作（画像をカーソル位置に挿入する等） */
export type WysiwygHandle = {
  insertImage: (url: string, caption?: string) => void;
};

// Obsidian/Notion 風のインライン WYSIWYG（markdown を保ったまま編集）
const WysiwygEditor = forwardRef<WysiwygHandle, Props>(function WysiwygEditor(
  { defaultValue, onChange, onUpload },
  ref
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const onChangeRef = useRef(onChange);
  const onUploadRef = useRef(onUpload);
  onChangeRef.current = onChange;
  onUploadRef.current = onUpload;

  // 外部のボタン（固定ツールバー / ライブラリ）からカーソル位置に画像を挿入する。
  // Crepe の「画像ブロック」ノードとして入れる（インライン画像だと右上のキャプション
  // ボタンが出ないため）。挿入経路による差をなくし、常にキャプションを付けられる。
  useImperativeHandle(ref, () => ({
    insertImage: (url, caption = "") => {
      crepeRef.current?.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const { state, dispatch } = view;
        const blockType = state.schema.nodes["image-block"];
        if (blockType) {
          const node = blockType.create({ src: url, caption, ratio: 1 });
          dispatch(state.tr.replaceSelectionWith(node).scrollIntoView());
          view.focus();
          return;
        }
        // フォールバック：万一 image-block スキーマが無ければ従来のインライン挿入
        callCommand(insertImageCommand.key, { src: url, alt: caption })(ctx);
      });
    },
  }));

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
      if (destroyed) {
        await crepe.destroy();
        return;
      }
      crepeRef.current = crepe;
    })();

    return () => {
      destroyed = true;
      crepeRef.current = null;
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
});

export default WysiwygEditor;
