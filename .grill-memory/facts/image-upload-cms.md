---
verified_at_commit: d40dc87e9dda1157708757a096aa12cfb4a0dc3c
paths:
  - src/components/admin/**
  - src/app/api/admin/upload/**
  - src/app/api/admin/media/**
  - src/app/(admin)/admin/images/**
  - src/db/**
  - src/lib/admin/**
  - src/lib/imageManifest.ts
  - scripts/gen-image-manifest.ts
  - scripts/backfill-media.ts
  - src/components/BlogPostContent.tsx
tags: [image, upload, cms, blob, media, library]
---

注: 2026-07-02 に画像管理（バッチアップロード＋ライブラリ）を実装。以下は実装後の状態
（作業ツリー。まだコミットされていない可能性あり。verified_at_commit は実装前 HEAD）。

## 画像ライブラリ（media テーブル = 画像の source of truth）
- スキーマ `src/db/schema.ts` の `media`: id, url(unique), pathname, filename, mime, size, width, height, blur, source('blob'|'local'), createdAt, deletedAt(ソフト削除)。index(deletedAt, createdAt)。反映は `npm run db:push`。
- リポジトリ `src/lib/admin/media-repo.ts`: `insertMedia`(onConflictDoNothing on url), `listMedia({limit,before})`(deletedAt null, createdAt desc, before=ISO カーソル), `softDeleteMedia(id)`。全て `!hasDb` で no-op。
- 一覧API `src/app/api/admin/media/route.ts`(GET, `requireOwnerApi`)：ピッカーと「もっと読む」用。
- ソフト削除アクション `src/app/(admin)/admin/images/actions.ts` `softDeleteMediaAction`。
- 既存 Blob 画像のバックフィル `scripts/backfill-media.ts`(`npm run backfill:media`)：実行済み76件。マニフェスト流用、無ければ fetch+sharp。

## アップロード経路（バッチ対応済み）
- クライアント `uploadImage(File, onPhase?)`: `src/components/admin/ImageUploader.tsx`。HEIC→JPEG(`heic2any`)→1920px/q0.82 縮小→`POST /api/admin/upload`(60s AbortController)。**返り値 `{url,width,height}`**、onPhase で converting/uploading 通知。
- バッチ `src/components/admin/useBatchUpload.ts`：同時2件プール、状態＋経過時間、完了後に**選択順**で onInsert。`EditorToolbar.tsx` の「画像を追加」が `<input multiple>` で使用。カバー用ドロップゾーン(`ImageUploader` コンポーネント)は単一のまま。
- サーバルート `src/app/api/admin/upload/route.ts`: `requireOwnerApi`、MAX 15MB、key=`posts/<ts>-<rand>.<ext>`、`put(key,buf)`。**sharp でバッファから w/h+blur → `insertMedia` → 返り値 `{url,width,height,blur}`**。DB 失敗はログのみでアップは成功。
- Blob 実体は縮小済み数百KB → Vercel 4.5MB 制限は非該当。

## エディタ / 本文フォーマット
- 本文エディタは Milkdown Crepe(WYSIWYG): `src/components/admin/WysiwygEditor.tsx`。`PostEditor.tsx` で dynamic import。onUpload は `(f)=>uploadImage(f).then(r=>r.url)`（Milkdown は string 期待）。
- 本文は生 markdown、DB列 `posts.body_md`。読取時 `markdownToHtml`(`src/lib/postParse.ts`, remark, `sanitize:false`)。
- 画像挿入は markdown `![alt](url)`。挿入経路: (a) Crepe ImageBlock の onUpload、(b) 命令的ハンドル `insertImage(url,alt="")`(`WysiwygEditor.tsx`) を `EditorToolbar` から。バッチ/ピッカーは (b) を選択順に連続呼び。
- エディタ内ピッカー `src/components/admin/MediaPickerSheet.tsx`（Sheet side=bottom、複数選択→選択順挿入）。
- **画像は2種類**: ブロック画像(`image-block` ノード, attrs src/caption/ratio, **キャプションボタン有り**, 右上) と インライン画像(キャプション無し)。`@milkdown/components` image-block の remark プラグインが「段落の唯一の子が image」の時だけ image-block へ昇格（`![](url)` が段落単独→ブロック / テキスト混在→インライン）。ブロックの markdown 直列化は `![<ratio>](url "<caption>")`（caption=title, ratio=alt(数値)）。
- `WysiwygEditor` の handle は **`insertImages(urls[])`**（`editorViewCtx`→`replaceSelection(new Slice(Fragment.fromArray(image-blockノード群),0,0))` で**1トランザクション**挿入）。バッチ/ピッカーは成功URLをまとめて1回で渡す（`useBatchUpload`/`MediaPickerSheet`→`onInsertMany`→`EditorToolbar`→`PostEditor`）。**注意**: 以前は1枚ずつ `replaceSelectionWith` を連続呼びしていて atom/isolating ノードの選択移動で「6枚中3枚しか挿入されない」不具合があった＝単一トランザクション化で修正(2026-07-02)。image-block ノードにするのはインラインだとキャプションボタンが出ないため。
- 公開表示は寸法をマニフェスト依存で取り、数値altは無視・title/後続テキストをキャプション扱い（`BlogPostContent.tsx` resolveImg）。

## データモデル（Drizzle / Neon, Prismaではない）
- スキーマ `src/db/schema.ts`、クライアント `src/db/client.ts`(`DATABASE_URL` 無ければ db=null, hasDb=false)、`drizzle.config.ts`。
- `posts` 主要列: id(uuid), number, slug(unique), title, seoTitle, description, bodyMd, coverImage, camera, lens, filmStock, category, featured, draft, location[], metaTags[], publishedAt, createdAt, updatedAt。他 `tags`, `postTags`, **`media`**。
- 画像参照は `posts.coverImage` 文字列 + `body_md` 内URL。加えて `media` が全アップロードを追跡。
- 記事書込は `src/lib/admin/repo.ts` `upsertPost`。zod は `src/lib/admin/post-schema.ts`。

## Blob 設定
- `@vercel/blob` v2.4.0。`put` は upload route 内。env: `BLOB_READ_WRITE_TOKEN`(暗黙), `BLOB_STORE_ID`。
- `next.config.mjs` が `*.public.blob.vercel-storage.com` を remote images 許可。

## 画像最適化（ビルド時マニフェスト・公開表示は今回未変更）
- 生成 `scripts/gen-image-manifest.ts`(npm `gen:image-manifest`, prebuild で実行)→ `src/lib/image-manifest.json`。sharp で w/h と 20px webp blur。
- 参照 `src/lib/imageManifest.ts` `getImageMeta(src)`。描画 `src/components/BlogPostContent.tsx`(next/image quality=90 placeholder=blur)。
- **公開表示は今もマニフェスト依存**（media は表示側では未使用＝統一は延期）。アップ直後の新Blob画像は次デプロイまで blur 無し。

## 認証・ナビ
- NextAuth v5 GitHub OAuth。`src/auth.ts`(`ALLOWED_GITHUB_LOGIN`)。`src/middleware.ts` が `/admin` 保護。ガード `src/lib/admin-auth.ts`(`requireOwner`/`requireOwnerApi`)。
- `src/components/admin/AdminNav.tsx` に「画像」(`/admin/images`) 追加。一覧ページ `src/app/(admin)/admin/images/page.tsx` + `MediaLibrary.tsx`(コピー/削除/もっと読む)。

## 掃除済み・その他
- 死コード `MarkdownTextarea.tsx` / `LivePreview.tsx` は**削除済み**。
- 旧案(R2+GitHub Actions+Obsidian) のコードは元々不在（計画doc `docs/image-cms-plan.md` のみ、残置）。
- `next lint` は `eslint-config-next@^0.2.4` が eslint 10 と非互換で**元から**壊れている。型チェックは `npx tsc --noEmit` で通る。
- 本文画像分布(docs/blog-image-optimization.md): ローカル163 + Blob 62（本文のみ）。今回 media 化した Blob URL はカバー込みで76件。
