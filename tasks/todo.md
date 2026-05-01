# 脱WispCMS 移行計画

最終更新: 2026-04-20

---

## 要件サマリ

### 執筆・編集環境
- **PC**: Obsidian（メイン執筆）
- **スマホ**: Obsidian Mobile（執筆補助）

### 画像要件
- 短期: `public/images/posts/{year}/{month}/` で静的運用
- URL は `/images/...` のルート相対パスに統一（Markdown・frontmatter ともに外部URLを書かない）
- 将来: 同じパス体系を CDN にミラーして配信先だけ差し替え（コンテンツ書き換え不要）

### コンテンツ管理
- Gitリポジトリ内 `content/posts/` でMarkdown管理（当面継続）
- frontmatterで記事メタを完全管理

---

## frontmatterスキーマ（確定）

```yaml
---
number: 1
slug: "article-slug"
tags:
  - travel
  - photography
date: "2026-03-19T12:00:00.000Z"
updated: "2026-03-19T12:00:00.000Z"
location: "Tokyo, Japan"
title: "記事タイトル"
description: "記事の概要（OG/meta用）"
metaTags:
  - "photography"
  - "japan"
coverImage: "/images/posts/2026/03/cover.webp"
featured: false
draft: false
---
```

---

## 画像ディレクトリ構成

```
public/images/
  ├── posts/              # 記事画像（coverImage + 本文内画像）
  │   └── 2026/03/
  │       └── photo.webp
  ├── ui/                 # サイト装飾・共通画像
  │   └── placeholder.webp
  └── (将来) originals/  # 原本は別ストレージを検討
```

---

## 移行フェーズ

### ✅ 完了済み

- [x] frontmatterスキーマ確定
- [x] `src/lib/content.ts` 作成（getPosts/getPost/getTags/getRelatedPosts）
- [x] ドメイン型定義（Wisp型を排除 → `src/types/content.ts`）
- [x] `blog/page.tsx` → content.ts経由
- [x] `blog/[slug]/page.tsx` → content.ts経由
- [x] `tag/page.tsx` / `tag/[slug]/page.tsx` → content.ts経由
- [x] `RelatedPosts.tsx` → ローカル関連記事ロジック
- [x] `sitemap.ts` → content.ts経由
- [x] `rss/route.ts` → content.ts経由
- [x] `LocationCardOverlay.tsx` → /api/posts 経由
- [x] `PolaroidCard.tsx` → /api/posts 経由（Wisp依存除去）
- [x] `CommentForm.tsx` / `CommentSection.tsx` 削除（コメント機能廃止）
- [x] `wisp.ts` スタブ削除
- [x] `@wisp-cms/client` / `@wisp-cms/react-custom-component` パッケージ削除
- [x] `next.config.mjs` imagedelivery.net 前提を除去
- [x] `_template.md` をスキーマに合わせて更新

### Phase A: 画像運用の整備（次のステップ）
- [ ] `public/images/posts/` ディレクトリ構造を作成
- [ ] 既存記事の `coverImage` を `/images/...` 形式に統一
- [ ] Markdown 本文内の外部画像URLを `/images/...` に移行（あれば）
- [ ] `public/images/ui/placeholder.webp` を適切な場所に移動

### Phase B: コンテンツの充実
- [ ] 既存Wisp記事をMarkdownとしてエクスポート・移行
- [ ] 各記事に `location` フィールドを補完
- [ ] 地球儀ピン（`src/lib/locations.ts`）と記事 `location` を紐づけ確認

### Phase C: コメント機能（将来対応）
- [ ] 方針決定: Valtown / Supabase / GitHub Issues連携 / 廃止継続
- [ ] 決定に従い実装

### Phase D: 画像の高速配信（将来対応）
- [ ] CDNドメイン（cdn.colorfulworld.jp 等）の検討
- [ ] 同一パス体系で public/images をオブジェクトストレージへ同期
- [ ] next.config.mjs に CDN の remotePatterns を追加

---

## 判断が必要な残件

- [ ] コメント機能の方針
- [ ] CDN導入のタイミング（記事数・画像数が増えてきたら）
- [ ] content/posts を将来 Obsidian vault（別リポジトリ）へ分離するか

---

## 検証チェックリスト

- [ ] Wisp文字列検索で `@wisp-cms`, `wisp.` の残存がないことを確認
- [ ] 地球儀UIでピン・PolaroidCard・LocationCardOverlay が正常動作
- [ ] 記事一覧・詳細・タグ・RSS・サイトマップで content.ts 由来データのみで表示
- [ ] coverImage あり / なし / 本文内画像あり の3パターンで崩れ・404なし
- [ ] `npm run build` が通ること

