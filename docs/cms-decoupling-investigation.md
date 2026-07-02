# 脱CMS（Wisp依存解消）調査メモ

最終更新: 2026-02-25

## 目的

- Wisp CMS 依存を段階的に解消し、コンテンツ配信・表示を自前運用へ移行する。
- いきなり全置換せず、**影響が小さい順**に進めてサービス停止リスクを下げる。

## 現状の依存サマリ

### 1) データ取得（最重要）

- `src/lib/wisp.ts`
  - `@wisp-cms/client` のクライアント初期化。
- `src/app/blog/page.tsx`
  - `wisp.getPosts`（記事一覧）。
- `src/app/blog/[slug]/page.tsx`
  - `wisp.getPost`（記事詳細）
  - `wisp.getRelatedPosts`（関連記事）
- `src/app/tag/page.tsx`
  - `wisp.getTags`（タグ一覧）。
- `src/app/tag/[slug]/page.tsx`
  - `wisp.getPosts({ tags })`（タグ別一覧）。
- `src/app/rss/route.ts`
  - `wisp.getPosts`（RSS生成データ）。
- `src/app/sitemap.ts`
  - `wisp.getPosts`（URL列挙）。
- `src/lib/tagUtils.ts`
  - `wisp.getPosts` ベースでタグ集計。
- `src/components/LocationCardOverlay.tsx`
  - `wisp.getPosts({ tags: location.wispTags })` で地図オーバーレイ記事取得。

### 2) コメント機能（Wisp API依存）

- `src/components/CommentSection.tsx`
  - `wisp.getComments`。
- `src/components/CommentForm.tsx`
  - `wisp.createComment`。

### 3) 型・描画依存

- `src/components/BlogPostPreview.tsx`
  - `GetPostsResult` 型を使用。
- `src/components/BlogPostContent.tsx`
  - `GetPostResult` 型を使用。
- `src/components/RelatedPosts.tsx`
  - `GetRelatedPostsResult` 型を使用。
- `src/components/PostContent.tsx`
  - `@wisp-cms/react-custom-component`（Wisp独自埋め込みコンポーネント）。

### 4) 設定・依存パッケージ・文言

- `src/config.ts`
  - `NEXT_PUBLIC_BLOG_ID` 必須化。
- `package.json`
  - `@wisp-cms/client`
  - `@wisp-cms/react-custom-component`
- `README.md`
  - セットアップ/技術スタックがWisp前提。
- `src/components/Footer.tsx`
  - "Blog powered by wisp" リンク。

## 影響範囲（優先度つき）

### P0: サイト表示の根幹（先に着手）

- 記事一覧・記事詳細・タグ一覧/タグ別・関連記事。
- ここが未移行だとフロントが表示不能。

### P0-補足: 画像移行の設計（最重要）

- 脱CMSで詰まりやすいのは本文より**画像運用**。
- 要件は「高画質」と「片手間でアップロードできること」。

#### 推奨方針（現実解）

- **画像はGit管理しない**（リポジトリ肥大化を防ぐ）。
- **オリジナル画像はオブジェクトストレージ保存**（R2 / S3 / Vercel Blob など）。
- 配信は `next/image` を使い、必要に応じて CDN 変換（WebP/AVIF）を使う。
- 記事側は「画像URLのみ」を保持（frontmatterや本文内URL）。

#### 最小で楽なアップロード導線

- 管理用に1ページだけ用意: `/admin/upload`
- ボタンで画像をアップロード → 完了後に以下を自動表示
  - 公開URL
  - Markdown貼り付け用文字列（例: `![alt](https://... )`）
- この導線だと、日常運用は「アップロードして貼るだけ」で済む。

#### 画質と容量の運用ルール（先に決める）

- 元画像は長辺 3000px 程度まで許容（高画質アーカイブ用）。
- 表示は用途別に上限を分ける（ヒーロー、本文、サムネイル）。
- サムネイルは軽量版を使用し、LCP対象だけ高品質で配信。
- EXIFは保存前に除去（容量削減とプライバシー対策）。

#### 移行手順（画像）

1. 既存記事の画像URLを棚卸し（Wisp配信URL一覧化）。
2. 一括コピーで新ストレージへ移送（スクリプト化）。
3. 本文内URLを置換（Wisp URL → 新CDN URL）。
4. 404チェックと重複画像チェックを実施。
5. 問題なければWisp画像依存を段階的に停止。

#### 推奨優先度

- P0の中でも「記事表示」と同列で先行実施。
- 理由: 画像設計が固まらないと本文移行後に再修正が多発するため。

#### 高画質・高可用・低コストの本命構成（複雑さ許容版）

- **保存先**: Cloudflare R2（オリジナル画像を保存）
- **配信**: Cloudflare（CDN + Image Resizing）
- **アプリ**: Next.js（Vercel）は画像URLを参照するだけ
- **アップロード**: `/admin/upload` から署名付きURLで直接R2へアップロード

この構成を本命にする理由:

- 高画質原本を保持しつつ、配信時に WebP/AVIF へ変換できる。
- エッジ配信で応答が安定しやすく、突発トラフィックにも強い。
- 画像配信コストを抑えやすい（特に配信量が増えた時）。
- 実装は増えるが、責務分離（保存/変換/表示）が明確で長期運用しやすい。

#### 実装設計（推奨）

1. **オブジェクトキーを不変化**
  - 例: `posts/{slug}/{yyyymmdd}-{hash}.jpg`
  - 上書き更新せず、更新時は新キー発行（キャッシュ不整合回避）。
2. **画像URL規約を統一**
  - `hero`, `thumb`, `inline` など用途別プリセットを定義。
  - 記事は原則「用途 + 画像ID」だけを持ち、最終URLはヘルパーで生成。
3. **アップロード導線を簡素化**
  - 管理画面でドラッグ&ドロップ。
  - 完了時に `![alt](...)` を自動生成してコピー可能にする。
4. **自動前処理**
  - EXIF除去、最大辺制限、ファイル名正規化、重複検知（hash）。
5. **可用性対策**
  - 日次または週次で別ストレージへバックアップ（例: S3）。
  - 画像メタ（key, width, height, mime）をJSON/DBで管理。

#### コスト運用の考え方

- 最初に予算上限（例: 月額上限）を決め、超過アラートを設定。
- LCP画像だけ高品質、本文画像は品質を一段下げて配信。
- 画像の再生成回数を減らすため、サイズプリセットを固定。

#### 採用判断

- 「実装は多少重くても、将来の画像増加に耐えたい」ならこの構成を採用。
- 「最速で公開優先」なら一時的に `public/images` + Git 管理で開始し、
  画像が増えた段階で上記構成へ移行する二段階方式も可。

### P1: SEO/配信

- `rss` / `sitemap` / 各ページのメタ生成。
- 移行漏れがあるとSEO評価・外部配信に影響。

### P2: 拡張機能

- コメント機能（Wispコメントを継続するか、自前実装へ切替えるか判断が必要）。
- 地図オーバーレイのタグ連携。

### P3: 運用/ドキュメント

- 環境変数、README、Wisp表記、不要依存の削除。

## まずやること（調査フェーズ）

1. **新しいコンテンツソースを決定**
  - 例: `content/*.md`（Git管理） or DB/API。
  - 最初は `content/` ベースを推奨（差分管理しやすい）。
  - **補足**: `md` でも YAML frontmatter が使えるため、メタデータ管理は可能。
2. **共通ドメイン型を先に定義**
   - `Post`, `Tag`, `RelatedPost`, `Comment` など。
   - UIコンポーネントがCMS型に依存しないよう分離。
3. **取得層を抽象化**
   - `src/lib/content.ts` のような入口を作り、
     `getPosts/getPost/getTags/getRelatedPosts` を提供。
   - 初期は Wisp 実装、後で新実装へ差し替え可能にする。
4. **P0ページを順に置換**
   - `blog/page` → `blog/[slug]` → `tag/page` → `tag/[slug]`。
5. **P1（rss/sitemap）置換**
   - 同じ取得層を使って生成。
6. **コメント方針を確定してP2実装**
   - 継続利用 / 無効化 / 自前化 のどれかを選定。
7. **最後にクリーンアップ**
   - env, README, Footer, package依存整理。

## 記事フォーマット方針（Phase 1）

- Phase 1 は **`md + frontmatter`** を採用する。
- 採用理由:
  - `mdx` より実装が軽く、移行速度が速い。
  - 記事メタ（title, slug, date, tags, coverImage など）を先頭で統一管理できる。
  - 将来 `mdx` が必要になっても frontmatter 設計は流用できる。

### frontmatter 例（mdでも有効）

```yaml
---
title: "Speaking at Figma Config 2025"
slug: "config-2025"
date: "2025-05-08T08:00:00.000Z"
updated: "2025-05-09T08:00:00.000Z"
description: "An overview of the talk..."
tags: ["shaders", "webgl"]
coverImage: "/images/posts/config-2025/cover.jpg"
featured: false
draft: false
---
```

### `md` と `mdx` の使い分け

- `md` を使う記事:
  - テキスト、見出し、画像、リンク、通常の埋め込み（iframe等）で完結する記事。
- `mdx` が必要になる記事:
  - Reactコンポーネントを本文中に直接挿入したい記事（独自UI・対話的デモ等）。

### 移行ルール

- まず全記事を `md + frontmatter` に寄せる。
- 本当に必要な記事だけを後から `mdx` に昇格させる。
- これにより、P0の移行速度と保守性を優先できる。

## 推奨実装順（安全重視）

1. **型の自前化**（UIからWisp型を排除）
2. **取得層アダプタ導入**（呼び出し側は変えずに入口統一）
3. **記事一覧/詳細の移行**（最もユーザー影響が大きい）
4. **タグ/関連記事/地図連携の移行**
5. **RSS/Sitemap/メタの移行**
6. **コメント機能の最終判断と実装**
7. **Wisp依存の完全除去（ライブラリ・env・文言）**

## 判断が必要な論点

- コメント機能をどうするか（維持・停止・自前化）。
- Wispカスタムコンポーネント（`PostContent`）を残すか、Markdown/MDX仕様に寄せるか。
- slug運用ルール（重複、リダイレクト、下書き）をどこで担保するか。

## リスクと回避策

- **リスク**: 型置換を後回しにすると、画面ごとの修正が増えて工数が膨らむ。
  - **回避**: 最初にドメイン型と変換レイヤーを作る。
- **リスク**: RSS/Sitemapの移行漏れでSEOが悪化。
  - **回避**: P0完了後すぐP1へ着手し、URL件数を比較確認する。
- **リスク**: コメント仕様変更でUX差分が出る。
  - **回避**: 先に方針決定し、必要なら一時的に非表示運用を許容する。

## 完了条件（脱CMS完了の定義）

- 主要ページ（一覧/詳細/タグ）がWisp未使用で表示できる。
- RSS/Sitemap/メタ生成が新コンテンツソースで生成される。
- コメント方針が反映されている。
- `@wisp-cms/*` 依存と `NEXT_PUBLIC_BLOG_ID` が不要になる。
- READMEと運用手順が新構成に更新済み。
