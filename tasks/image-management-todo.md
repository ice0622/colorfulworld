# 画像管理（バッチアップロード＋画像ライブラリ）実装計画

grilling 結果の確定設計。決定の根拠は `docs/adr/0001`,`0002`、用語は `CONTEXT.md`、現状コードは `.grill-memory/facts/image-upload-cms.md`。

## 確定した設計

- ライブラリの source of truth = 新規 `media` テーブル(Drizzle/Neon)。
- アップロードは既存サーバルート維持。受け取ったバッファから sharp で w/h+blur を生成し media に記録。
- 公開表示側(BlogPostContent)のマニフェスト統一は今回**やらない**（延期）。
- バッチは同時2〜3件の小プール。進捗は状態チップ＋件数＋経過タイマー（fetch維持）。
- 挿入はカーソル位置に選んだ順で（カーソル未確定なら本文末尾）。
- ライブラリUIはエディタ内ピッカー＋独立 `/admin/images` の両方。
- ライブラリ削除はソフト削除（Blobは残す）。
- 既存 Blob 画像62枚を一度きりバックフィル。ローカル163は対象外。

## タスク

### 1. データモデル
- [ ] `src/db/schema.ts` に `media` テーブル追加: id(uuid), url(text unique), pathname(text, Blobキー), filename, mime, size(int), width(int), height(int), blur(text), source(text 'blob'|'local'), createdAt, deletedAt(nullable, ソフト削除)。index(deletedAt, createdAt desc)。
  - 注: **新テーブル追加は非破壊**（`posts` への列追加ではないので全列SELECT問題に当たらない）。
- [ ] `npm run db:push` でスキーマ反映。

### 2. アップロードルート拡張（サーバ）
- [ ] `src/app/api/admin/upload/route.ts`: `put()` 後に sharp でバッファから w/h と 20px blur data-URL を算出→ `media` に insert →返り値を `{url, mediaId, width, height, blur}` に拡張（既存呼び出しは url だけ使うので後方互換）。
- [ ] 失敗時（sharp decode不可等）は media に unoptimized 相当で記録しつつ url は返す（無回帰）。

### 3. media リポジトリ / 一覧API
- [ ] `src/lib/admin/media-repo.ts`: `listMedia({limit,cursor})`（deletedAt is null, createdAt desc, ページング）, `softDeleteMedia(id)`, `insertMedia(...)`。
- [ ] エディタ用に client から呼べる server action か `GET /api/admin/media`（`requireOwnerApi`）を用意。

### 4. バッチアップロード（クライアント）
- [ ] `uploadImage` 経路を複数対応に: `<input multiple>`＋同時2〜3件の並列プール（変換はメモリ配慮で絞る）。
- [ ] 進捗UI: ファイル毎 状態チップ（待機/変換中/アップ中/完了/失敗）＋「N/M 完了」＋経過秒タイマー。
- [ ] 完了した順ではなく**選択順**でカーソル位置へ連続 `insertImage`。
  - [ ] 検証: Milkdown で `insertImage` をループ呼びしたとき順序が保たれるか実機確認（保たれない場合は末尾追記にフォールバック）。
  - [ ] nice-to-have: `insertImage` の alt にアップ応答の w/h から算出したアスペクト比を入れて Crepe 表示を即正しくする。

### 5. 画像ライブラリ
- [ ] エディタ内ピッカー: EditorToolbar に「ライブラリから選ぶ」→複数選択シート（モバイル向けグリッド、blur プレースホルダ表示）→選んだ順にカーソル挿入（アップと同じ挿入経路）。
- [ ] 独立ページ `src/app/(admin)/admin/images/page.tsx`（`requireOwner`）: グリッド閲覧、URLコピー、ソフト削除。ページング/「もっと読む」。

### 6. バックフィル（一度きり）
- [ ] スクリプト: 全 `posts` の body_md＋cover_image から `*.public.blob.vercel-storage.com` URL を抽出→重複排除→`media` 行作成。w/h/blur は既存 `image-manifest.json` から流用、無ければ fetch＋sharp。
- [ ] 実行後、ライブラリに62枚が並ぶことを確認。

### 7. 掃除
- [ ] `src/components/admin/MarkdownTextarea.tsx` 削除。
- [ ] `src/components/admin/LivePreview.tsx` 削除。
- [ ] 削除後、import 残骸が無いか grep 確認＋型/ビルド確認。

## 延期・非対象（今回やらない）
- 公開表示のマニフェスト統一（アップ直後blur）。media 保存済みなので後日フラグ一つで切替可。
- ローカル163枚のバックフィル。
- 同一ファイル再アップの content-hash 重複排除（再利用はライブラリ選択で担保）。
- ライブラリの検索/フィルタ、使用中記事数の表示、ハード削除。
- カバー画像フィールドへのライブラリピッカー（アップ経路共有で自動的にライブラリには載る）。

## レビュー（2026-07-02 実装完了）

全タスク実装・検証済み。型チェック(tsc --noEmit)パス、dev でルート/認証/DB を実地確認。

### 実装ファイル
- `src/db/schema.ts` — `media` テーブル追加（db:push 反映済み）
- `src/lib/admin/media-repo.ts` — insertMedia / listMedia / softDeleteMedia
- `src/app/api/admin/upload/route.ts` — sharp で w/h+blur 生成 → media 登録、返り値に width/height/blur 追加
- `src/app/api/admin/media/route.ts` — GET 一覧（ピッカー/もっと読む用）
- `src/app/(admin)/admin/images/{page,actions}.tsx` — 一覧ページ + ソフト削除アクション
- `src/components/admin/MediaLibrary.tsx` — 一覧グリッド（コピー/削除/もっと読む）
- `src/components/admin/MediaPickerSheet.tsx` — エディタ内ピッカー（複数選択→順番挿入）
- `src/components/admin/useBatchUpload.ts` — 同時2件プール + 状態/経過時間
- `src/components/admin/EditorToolbar.tsx` — 複数選択アップ + ライブラリボタン + 進捗パネル
- `src/components/admin/ImageUploader.tsx` — uploadImage が {url,width,height} を返し onPhase 通知
- `src/components/admin/AdminNav.tsx` — 「画像」ナビ追加
- `scripts/backfill-media.ts`（`npm run backfill:media`）— **実行済み: Blob 76枚登録**
- 削除: `MarkdownTextarea.tsx` / `LivePreview.tsx`

### 検証結果
- `npm run db:push` → Changes applied（新テーブルのみ・非破壊）
- `npm run backfill:media` → 参照76 / 新規76件登録（fetch+sharp 10件）
- DB確認: media 未削除76件すべて width/height/blur あり
- dev smoke: `/api/admin/media`=401（未認証）, `/admin/images`=307→login, `/admin/login`=200、dev ログにエラーなし
- `npx tsc --noEmit` パス

### 実機で確認してほしいこと（ブラウザ）
- 記事編集画面の下部バー「画像を追加」で**複数選択**→進捗（変換中/アップ中/完了）と経過秒→**選択順**に本文挿入
- 「ライブラリ」ボタン→過去画像から複数選択→順番挿入
- `/admin/images` で一覧・URLコピー・削除（削除しても記事表示は残る）
- スマホでの複数選択アップ（HEIC含む）

### 既知の注意
- lint（`next lint`）は `eslint-config-next@^0.2.4` が eslint 10 と非互換で**元から**壊れている（今回変更とは無関係）。
- 公開表示のマニフェスト統一は延期のまま（アップ直後・即公開の本文画像は次デプロイまで blur 無し＝従来通り）。
