"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import { editorViewCtx, editorViewOptionsCtx } from "@milkdown/kit/core";
import { Fragment, Slice } from "@milkdown/kit/prose/model";
import { insertImageCommand } from "@milkdown/kit/preset/commonmark";
import { callCommand, replaceAll } from "@milkdown/kit/utils";
// common/style.css は使わず個別に読む。reset.css（見出し42px・段落16/24px・
// `.milkdown * { margin:0 }` 等の Crepe 独自の文字組み）を外し、本文には公開記事と
// 同じ prose / .blog-flow を効かせるため。色・フォントの変数とエディタ UI に必要な
// reset の残りは globals.css の「管理画面の Crepe エディタ」節で定義している。
import "@milkdown/crepe/theme/common/prosemirror.css";
import "@milkdown/crepe/theme/common/block-edit.css";
import "@milkdown/crepe/theme/common/code-mirror.css";
import "@milkdown/crepe/theme/common/cursor.css";
import "@milkdown/crepe/theme/common/image-block.css";
import "@milkdown/crepe/theme/common/link-tooltip.css";
import "@milkdown/crepe/theme/common/list-item.css";
import "@milkdown/crepe/theme/common/placeholder.css";
import "@milkdown/crepe/theme/common/toolbar.css";
import "@milkdown/crepe/theme/common/table.css";
import "@milkdown/crepe/theme/common/latex.css";

type Props = {
  /** 初期 markdown（マウント時のみ反映。以後はエディタが真実） */
  defaultValue: string;
  onChange: (markdown: string) => void;
  /** 画像をアップロードして URL を返す（HEIC変換込み） */
  onUpload: (file: File) => Promise<string>;
};

/** 親から命令的に呼べる操作（画像をカーソル位置に挿入する等） */
export type WysiwygHandle = {
  /** 画像URL群をカーソル位置へ「1トランザクションで順番に」挿入する */
  insertImages: (urls: string[]) => void;
  /** 本文を markdown で丸ごと置き換える（Markdown モードから戻ったとき） */
  setMarkdown: (markdown: string) => void;
};

// 本文の文字組みは公開記事（BlogPostContent の PostContent）と同じクラスを当てる
const BODY_CLASS =
  "prose prose-neutral mx-auto blog-flow " +
  "prose-h1:text-2xl prose-h1:font-bold " +
  "prose-h2:text-xl " +
  "prose-h3:text-lg";

// Obsidian/Notion 風のインライン WYSIWYG（markdown を保ったまま編集）。
// 見た目は公開記事と一致させる（紺地・同じフォント・prose・縦リズム）。
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
  // ボタンが出ないため）。複数枚は 1 トランザクションでまとめて挿入する:
  // 1枚ずつ連続挿入すると atom/isolating ノードの選択移動で「一部しか入らない」
  // 不具合が起きるため。
  useImperativeHandle(ref, () => ({
    insertImages: (urls) => {
      if (!urls || urls.length === 0) return;
      crepeRef.current?.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const { state } = view;
        const blockType = state.schema.nodes["image-block"];
        if (blockType) {
          const nodes = urls.map((url) =>
            blockType.create({ src: url, caption: "", ratio: 1 })
          );
          const slice = new Slice(Fragment.fromArray(nodes), 0, 0);
          view.dispatch(state.tr.replaceSelection(slice).scrollIntoView());
          view.focus();
          return;
        }
        // フォールバック：image-block スキーマが無ければ従来のインライン挿入
        for (const url of urls) {
          callCommand(insertImageCommand.key, { src: url })(ctx);
        }
      });
    },
    setMarkdown: (markdown) => {
      crepeRef.current?.editor.action(replaceAll(markdown));
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
      crepe.editor.config((ctx) =>
        ctx.update(editorViewOptionsCtx, (prev) => ({
          ...prev,
          attributes: { class: BODY_CLASS },
        }))
      );
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
    // blog-content：公開記事と同じ見出し装飾・行間（globals.css）を効かせる
    <div className="milkdown-host blog-content break-words">
      <div ref={rootRef} />
    </div>
  );
});

export default WysiwygEditor;
