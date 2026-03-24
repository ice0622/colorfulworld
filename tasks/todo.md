# 脱WispCMS 移行計画

最終更新: 2026-03-19

---

## 要件サマリ

### 執筆・編集環境
- **PC**: Obsidian（メイン執筆）
- **スマホ**: Obsidian Mobile（執筆補助） + 管理画面（画像アップロードメイン）

### 画像要件
- 対応形式: JPEG / JPG / PNG / HEIC / HEIF / RAW（ARW・CR2・NEF等）
- 圧縮なしで原本保持。配信時のみ最適化（WebP/AVIF）
- スマホからは管理画面で直接アップロード → URLコピー → Obsidianに貼る
- PCからはObsidian経由でGit pushし、Actions自動処理

### ストレージ・配信
- **Cloudflare R2**: 原本保存（高画質アーカイブ・公開用WebP・サムネイル）
- **Cloudflare CDN**: Image Resizingで用途別配信
- 独自CDNドメイン: `https://cdn.colorfulworld.jp/`

### コンテンツ管理
- Gitリポジトリ（content-repo）でMarkdown管理
- frontmatterで記事メタを完全管理

### 管理画面
- 画像ギャラリー（サムネイル一覧）
- ワンクリックURLコピー
- 直接アップロード機能（スマホ対応）
- 認証付き（`/admin/*`）

---

## frontmatterスキーマ（確定）

```yaml
---
number: 1                          # 記事連番（一意）
slug: "article-slug"               # URL識別子
tags:                              # タグ（複数可）
  - travel
  - photography
date: "2026-03-19T12:00:00.000Z"   # 公開日時
updated: "2026-03-19T12:00:00.000Z"
location: "Tokyo, Japan"           # 撮影・執筆場所
title: "記事タイトル"
description: "記事の概要（OG/meta用）"
metaTags:                          # 追加メタタグ（SEO拡張用）
  - "photography"
  - "japan"
coverImage: "https://cdn.colorfulworld.jp/web/2026/03/cover.webp"
featured: false
draft: false
---
```

---

## R2バケット構成

```
colorfulworld-images/
  ├── originals/          # 原本（RAW/HEIC含む）- 非公開
  │   └── 2026/03/photo.arw
  ├── web/                # 公開用WebP（配信メイン）
  │   └── 2026/03/photo.webp
  └── thumbnails/         # 管理画面用サムネイル（400px）
      └── 2026/03/photo_thumb.webp
```

---

## 移行フェーズ

### Phase 0：基盤設計（今ここ）
- [ ] frontmatterスキーマ確定 ✅
- [ ] content-repo構成決定
- [ ] R2バケット構成確定
- [ ] ドメイン型（Post/Tag）設計

### Phase 1：コンテンツ層の自前化
- [ ] `src/lib/content.ts` 作成（getPosts/getPost/getTags/getRelatedPosts）
- [ ] ドメイン型定義（Wisp型を排除）
- [ ] content-repo作成 + Obsidian vault設定
- [ ] 既存記事をmd+frontmatterで移行（WispからMarkdownエクスポート）
- [ ] `_template.md` をスキーマに合わせて更新 ✅

### Phase 2：サイト表示の移行（P0）
- [ ] `blog/page.tsx` → content.ts経由に差し替え
- [ ] `blog/[slug]/page.tsx` → content.ts経由に差し替え
- [ ] `tag/page.tsx` → content.ts経由に差し替え
- [ ] `tag/[slug]/page.tsx` → content.ts経由に差し替え
- [ ] `RelatedPosts.tsx` → ローカル関連記事ロジックに差し替え
- [ ] `LocationCardOverlay.tsx` → content.ts経由に差し替え

### Phase 3：画像インフラ
- [ ] Cloudflare R2バケット作成・設定
- [ ] CDNドメイン（cdn.colorfulworld.jp）設定
- [ ] GitHub Actions: 画像検出 → 変換 → R2アップロードワークフロー
- [ ] 画像処理スクリプト（sharp + S3互換SDK）
- [ ] Markdownパス自動書き換えスクリプト
- [ ] RAW対応（darktable-cli or dcraw）原本保存のみで可

### Phase 4：管理画面
- [ ] 認証設計（ADMIN_PASSWORD環境変数 or Next-Auth）
- [ ] `/admin/images` - 画像ギャラリー（R2 list objects）
- [ ] アップロード機能（署名付きURL経由でR2へ直接PUT）
- [ ] URLワンクリックコピー（Clipboard API）
- [ ] スマホ対応レイアウト

### Phase 5：SEO/配信（P1）
- [ ] `sitemap.ts` → content.ts経由に差し替え
- [ ] `rss/route.ts` → content.ts経由に差し替え
- [ ] OGイメージ生成の確認

### Phase 6：コメント機能（P2）
- [ ] 方針決定: 継続 / 停止 / 自前化（Valtown or Supabaseなど）
- [ ] 決定に従い実装

### Phase 7：クリーンアップ（P3）
- [ ] `@wisp-cms/client` パッケージ削除
- [ ] `@wisp-cms/react-custom-component` パッケージ削除
- [ ] `NEXT_PUBLIC_BLOG_ID` 環境変数削除
- [ ] `src/lib/wisp.ts` 削除
- [ ] Footer「powered by wisp」除去
- [ ] README更新

---

## 既存Wisp記事の移行手順

1. WispのAPIで全記事をJSONエクスポート（`wisp.getPosts` で全件取得スクリプト）
2. JSONからfrontmatter付きMarkdownに変換スクリプトを実行
3. numberフィールドを連番で付与
4. locationフィールドを手動または半自動で補完
5. 画像URLを棚卸しし、R2への移行スクリプトで一括コピー
6. Markdown本文内のWisp画像URLをCDN URLに置換
7. 404チェックと動作確認

---

## 判断が必要な残件

- [ ] content-repoはsite-repoと**同じ**か**別リポジトリ**か
  - 同じ: シンプル、Actions連携が楽
  - 別: Obsidian用途に特化しやすい、siteとコンテンツを疎結合にできる
  - **推奨**: 別リポジトリ（Obsidian vault = content-repo、siteはsubmodule or API取得）
- [ ] コメント機能の方針
- [ ] RAW変換: 原本保存のみ か 変換も行うか
- [ ] 管理画面認証方式

---

## 実装工数目安

| フェーズ | 内容 | 目安 |
|---------|------|------|
| Phase 0 | 設計確定 | 完了 |
| Phase 1 | コンテンツ層 | 2〜3日 |
| Phase 2 | サイト表示移行 | 3〜4日 |
| Phase 3 | 画像インフラ | 2〜3日 |
| Phase 4 | 管理画面 | 2〜3日 |
| Phase 5 | SEO/配信 | 1日 |
| Phase 6 | コメント | 1〜2日 |
| Phase 7 | クリーンアップ | 0.5日 |
| **合計** | | **約2〜3週間** |
