# admin-colorfulworld 引き継ぎメモ（画像アップロード管理画面）

最終更新: 2026-02-25

## 目的

- 別リポジトリ `admin-colorfulworld` を新規作成し、**画像アップロード専用の管理画面**を実装する。
- 本体ブログ（公開サイト）と分離し、安全に画像運用を行う。

## これまでの意思決定（履歴）

1. 脱CMS方針として、まずは段階移行を採用。
2. 記事本文は Phase 1 で `md + frontmatter` を採用（`mdx` は第2段階）。
3. 画像運用は将来スケールを見据え、クラウド保存前提へ寄せる。
4. 管理画面は公開サイトと分離し、**別プロジェクト/別リポジトリ**で運用する。
5. Vercel は同一アカウント内で、公開サイトと管理画面を別 Project として運用する。

## 前提アーキテクチャ

- 公開サイト: `colorfulworld`（既存）
- 管理画面: `admin-colorfulworld`（新規）
- 保存先: Cloudflare R2
- 配信: Cloudflare CDN（必要に応じて Image Resizing）
- 公開サイト側の記事データは「画像URLのみ保持」

## 今回の実装スコープ（MVP）

### 画面

- `/upload` 1ページのみ
- 機能:
  - 画像ファイル選択（drag & drop可）
  - アップロード実行
  - 完了後に以下を表示
    - 公開URL
    - Markdown貼り付け文字列 `![alt](https://...)`

### API

- `POST /api/upload/sign`
  - 入力: `filename`, `contentType`, `slug`（任意）
  - 出力: 署名付きアップロードURL、保存キー
- `POST /api/upload/finalize`
  - 入力: 保存キー、alt（任意）
  - 出力: 公開URL、Markdown文字列

### 非スコープ（MVPではやらない）

- 画像一覧UI
- 画像削除UI
- リサイズバリエーションの事前生成
- 記事本文エディタ

## セキュリティ要件

- 管理画面はログイン必須（Auth.js など）。
- 署名URLは短命（推奨 60 秒）。
- クライアントから R2 へ直接 PUT するが、署名発行はサーバー側のみ。
- 許可MIMEを制限（`image/jpeg`, `image/png`, `image/webp`, `image/avif`）。
- ファイルサイズ上限を設定（例: 10MB）。

## オブジェクトキー規約（推奨）

- 形式: `posts/{slug-or-misc}/{yyyyMMdd}-{random}.{ext}`
- 上書き禁止（常に新キー）
- キャッシュ不整合回避のため immutable 運用

## 必要な環境変数（admin-colorfulworld）

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`
- `ADMIN_ALLOWED_EMAILS`（カンマ区切り）
- `AUTH_SECRET`（Auth.js用）

## 実装の受け入れ条件

- ログイン後のみ `/upload` にアクセスできる。
- 画像1枚をアップロードして、公開URLが取得できる。
- Markdown文字列がコピーできる。
- 失敗時にユーザーへエラーメッセージを表示できる。

## 公開サイト側への反映ルール

- 記事内画像は `https://<cdn-or-r2-public>/<key>` 形式で参照。
- frontmatter の `coverImage` も同様にURL参照。
- ローカル `public/images` は暫定用途を除き増やさない。

## 次アクション（この順で実施）

1. GitHub に `admin-colorfulworld` リポジトリ作成
2. Vercel で新規 Project として import
3. 最小認証導入
4. 署名URL API 2本実装
5. `/upload` 画面実装
6. R2 への実アップロード疎通確認

## 補足

- このメモは「別リポジトリで最短着手するための引き継ぎ資料」。
- 実装時は `README` にセットアップ手順（env・起動・デプロイ）を必ず併記すること。
