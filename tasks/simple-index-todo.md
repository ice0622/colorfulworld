# シンプルなブログ index ページ（デモ）

最終更新: 2026-06-08

## 確定した設計（質問で決定）

| 項目 | 決定 |
|---|---|
| 行レイアウト | サムネ左 ・ タイトル中 ・ 日付 右寄せ（rauno 風） |
| サムネ表現 | ポラロイド枠維持（白フチ＋わずかな傾き）、**画像のみ・キャプションなし** |
| 密度 | 中間（サムネ ~64px） |
| タイポ | サンセリフ（Geist sans） |
| ホバー | 行全体がふんわりハイライト |
| 並べ方 | 年ごとに区切る（"2026" "2025" 見出し） |
| 配色 | ライト／ダーク両対応を維持 |
| ヘッダー部 | サイト名 ＋ 一言紹介 |
| 行の情報量 | タイトル ＋ 日付のみ |
| 日付表記 | 月.日（例: 03.19） |
| デモ方針 | `/demo` に作成 → 納得後にトップと /blog を置換 |

## デモ実装タスク

- [ ] 1. `src/components/PolaroidThumb.tsx` 新規作成
  - ポラロイド枠（白フチ＋影＋slug 由来の決定的な微傾き）、画像のみ
  - ダークモード対応
  - 既存 `PolaroidCard` の `getTiltAngle` ロジックを流用（globe 依存は持ち込まない）
- [ ] 2. `src/components/PostIndexList.tsx` 新規作成
  - 記事を年ごとにグルーピング（publishedAt || createdAt）
  - 年見出し + 行リスト
  - 行: `/blog/[slug]` への Link、左=PolaroidThumb / 中=タイトル / 右=日付(MM.DD)
  - 行ホバーで背景ふんわりハイライト（Tailwind の CSS のみ、client 不要）
  - サンセリフ、ライト/ダーク両対応
- [ ] 3. `src/app/demo/page.tsx` 新規作成（server component）
  - `getPosts({ limit: "all" })` で全記事取得
  - 最上部にヘッダー部（`config.blog.name` ＋ 一言紹介）
  - `PostIndexList` を描画、metadata（noindex 検討）
- [ ] 4. 検証：`npm run build` と dev で `/demo` を目視確認

## 後続（デモ承認後・別ステップ）

- [ ] 5. トップ `/`（地球儀 HomeHero）をこの index に置換
- [ ] 6. `/blog` 一覧をこの形式に寄せる（ページネーション/タグの扱いを再検討）

## レビュー

（実装後に追記）
