| tags | paths | summary | file |
|---|---|---|---|
| image, upload, cms, blob, media, library | src/components/admin/**, src/app/api/admin/**, src/app/(admin)/admin/images/**, src/db/**, src/lib/admin/**, src/lib/imageManifest.ts, scripts/gen-image-manifest.ts, scripts/backfill-media.ts, src/components/BlogPostContent.tsx | 画像管理実装済(2026-07-02)。media テーブル=画像の source of truth。アップは server route で sharp→media 登録。バッチ(useBatchUpload)+エディタ内ピッカー(MediaPickerSheet)+一覧(/admin/images)。公開表示は今もビルド時マニフェスト(統一は延期)。死コードMarkdownTextarea/LivePreview削除済 | facts/image-upload-cms.md |
