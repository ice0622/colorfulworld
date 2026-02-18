# 個人ブログ

Next.js 15 + Wisp CMS で構築した個人ブログです。

---

## 技術スタック

| カテゴリ | 使用技術 |
|---|---|
| フレームワーク | Next.js 15 (App Router / Turbopack) |
| 言語 | TypeScript |
| CMS | Wisp CMS |
| スタイリング | Tailwind CSS |
| UI コンポーネント | shadcn/ui (Radix UI) |
| 3D 地球儀 | cobe (WebGL) |
| アニメーション | Framer Motion |
| いいね機能 | Upstash Redis |
| デプロイ | Vercel |

---

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router のページ群
│   ├── page.tsx            # トップページ（ブログ一覧 + 地球儀）
│   ├── blog/[slug]/        # ブログ記事詳細ページ
│   ├── about/              # About ページ
│   ├── tag/[slug]/         # タグ別記事一覧
│   ├── api/
│   │   ├── like/           # いいね API（Redis）
│   │   └── og-image/       # OGP 画像自動生成
│   ├── rss/                # RSS フィード
│   └── sitemap.ts          # サイトマップ自動生成
│
├── components/
│   ├── Globe.tsx           # COBE による WebGL 地球儀（Client Component）
│   ├── GlobeWrapper.tsx    # Globe の dynamic import ラッパー（Client Component）
│   ├── Header.tsx          # ヘッダー・ナビゲーション
│   ├── Footer.tsx          # フッター
│   ├── BlogPostPreview.tsx # ブログ記事カード
│   ├── LikeButton.tsx      # いいねボタン
│   ├── CommentSection.tsx  # コメント機能
│   ├── RelatedPosts.tsx    # 関連記事
│   └── ui/                 # shadcn/ui コンポーネント群
│
└── lib/
    ├── wisp.ts             # Wisp CMS クライアント設定
    ├── redis.ts            # Upstash Redis 接続
    ├── locations.ts        # 地球儀ピン用の場所データ（予定）
    └── utils.ts            # 汎用ユーティリティ
```

---

## 主な機能

- ブログ記事一覧・詳細（Wisp CMS から取得）
- タグによる記事フィルタリング
- ライト / ダークモード
- いいねボタン（Redis で永続化）
- コメント機能
- OGP 画像自動生成
- RSS フィード
- サイトマップ自動生成
- WebGL 地球儀（cobe）※実装中

---

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm i --legacy-peer-deps

# 環境変数の設定
cp .env.example .env
# .env に NEXT_PUBLIC_BLOG_ID（Wisp CMS の Blog ID）を記入

# 開発サーバー起動
npm run dev
```

[http://localhost:3000](http://localhost:3000) で確認できます。

---

## 環境変数一覧

| 変数名 | 説明 | 必須 |
|---|---|---|
| `NEXT_PUBLIC_BLOG_ID` | Wisp CMS の Blog ID | ✅ |
| `NEXT_PUBLIC_BASE_URL` | サイトの URL | |
| `NEXT_PUBLIC_BLOG_DISPLAY_NAME` | ブログ表示名 | |
| `NEXT_PUBLIC_BLOG_DESCRIPTION` | ブログの説明文 | |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis の URL | |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis のトークン | |
| `OG_IMAGE_SECRET` | OGP 画像署名用シークレット | |