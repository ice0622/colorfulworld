
# ポートフォリオサイト

Next.js 15 で構築した個人ポートフォリオ兼ブログです。外部CMSを使わず、全てNext.js内で完結しています。

---

## 技術スタック

| カテゴリ          | 使用技術                                       |
| ----------------- | ---------------------------------------------- |
| フレームワーク    | Next.js 15 (App Router / Turbopack)            |
| 言語              | TypeScript                                     |
| スタイリング      | Tailwind CSS                                   |
| UI コンポーネント | shadcn/ui (Radix UI)                           |
| 3D 地球儀         | COBE2 (WebGL)                                  |
| アニメーション    | Framer Motion                                  |
| いいね機能        | Upstash Redis                                  |
| 画像処理          | 桑原フィルタ (Kuwahara Filter, WebGL/GLSL実装) |
| デプロイ          | Vercel                                         |

---

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router のページ群
│   ├── page.tsx            # トップページ（ポートフォリオ・ブログ・地球儀）
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
│   ├── Globe.tsx           # COBE2によるWebGL地球儀（座標・ピン・ポラロイドカード対応）
│   ├── KuwaharaEffect.ts   # 桑原フィルタ実装
│   ├── PolaroidCard.tsx   # ポラロイド風カード
│   ├── LikeButton.tsx      # いいねボタン
│   ├── Header.tsx          # ヘッダー・ナビゲーション
│   ├── Footer.tsx          # フッター
│   └── ui/                 # shadcn/ui コンポーネント群
│
└── lib/
    ├── redis.ts            # Upstash Redis 接続
    ├── locations.ts        # 地球儀ピン用の場所データ
    └── utils.ts            # 汎用ユーティリティ
```

---

## 主な機能

- ブログ記事一覧・詳細（Next.js内で管理）
- タグによる記事フィルタリング
- ライト / ダークモード
- いいねボタン（Upstash Redisで永続化）
- OGP画像自動生成
- RSSフィード・サイトマップ自動生成
- WebGL地球儀（COBE2）
    - onRender廃止などCOBE2の新仕様対応
    - 座標データ・ピン・ポラロイドカード表示
- 桑原フィルタによる画像処理（WebGL/GLSLで独自実装）

---


## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm i --legacy-peer-deps

# 環境変数の設定
cp .env.example .env
# .env に必要な値を記入

# 開発サーバー起動
npm run dev
```

[http://localhost:3000](http://localhost:3000) で確認できます。

---

## 環境変数一覧

| 変数名                          | 説明                      | 必須 |
| ------------------------------- | ------------------------- | ---- |
| `NEXT_PUBLIC_BASE_URL`          | サイトのURL               |      |
| `NEXT_PUBLIC_BLOG_DISPLAY_NAME` | ブログ表示名              |      |
| `NEXT_PUBLIC_BLOG_DESCRIPTION`  | ブログの説明文            |      |
| `UPSTASH_REDIS_REST_URL`        | Upstash RedisのURL        |      |
| `UPSTASH_REDIS_REST_TOKEN`      | Upstash Redisのトークン   |      |
| `OG_IMAGE_SECRET`               | OGP画像署名用シークレット |      |