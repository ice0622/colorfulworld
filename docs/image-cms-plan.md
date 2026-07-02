# 画像CMS構築計画

## 要件整理

| 要件 | 内容 |
|------|------|
| 対応入力形式 | JPEG, PNG, HEIC/HEIF, RAW（ARW/CR2/NEF等）|
| スマホ編集 | モバイルから記事・画像を投稿できる |
| 画質劣化なし | 配信時に最適化するが原本は保持 |
| 執筆環境 | Obsidian（ローカル/モバイル）|
| 管理画面 | 画像一覧 + ワンクリックURL取得 |
| ストレージ | Cloudflare R2 |
| コンテンツ管理 | Gitリポジトリ（Markdown）|

---

## 現実性評価

### ✅ 実現可能（そのまま進める）

- **JPEG/PNG/HEIC → WebP/AVIF変換**  
  `sharp`（Node.js）でGitHub Actions上で高速変換できる。HEIC も `sharp` v0.33+ でネイティブ対応。

- **Cloudflare R2への自動アップロード**  
  `wrangler` CLIまたは `@aws-sdk/client-s3`（R2はS3互換）でActions内から直接PUT可能。

- **Obsidianの画像パスをR2 URLに自動置換**  
  Actions内で `sed` またはNode.jsスクリプトで `![[image.jpg]]` → `![](https://cdn.colorfulworld.jp/image.jpg)` に変換。

- **管理画面（画像一覧 + URLコピー）**  
  R2のAPIで一覧取得 → Next.jsのAdmin Route（認証付き）で画像ギャラリーを実装。

### ⚠️ 条件付き実現可能

- **RAWファイル（ARW/CR2/NEF）の変換**  
  GitHub Actionsの `ubuntu-latest` に `darktable-cli` または `dcraw` をaptでインストールすれば変換可能。  
  ただし **変換に数十秒〜数分かかる** ため、RAWは「原本保存のみ」にしてプレビューはJPEGサムネイルを別生成するのが現実的。

- **スマホからのGit Push（Obsidian Mobile）**  
  iOSは `Working Copy` アプリ、AndroidはObsidian + `MGit` の組み合わせで可能。  
  ただし操作がやや煩雑。→ 後述の「モバイル向け割り切り案」参照。

### ❌ 現実的でない（別手段を推奨）

- **RAWをそのままブラウザ表示**  
  ブラウザはRAWフォーマットに対応していない。必ずJPEG/WebP等への変換が必要。

---

## 推奨アーキテクチャ

```
[執筆]                    [自動処理]                    [配信]
Obsidian ──Git Push──▶ GitHub Actions ──────────────▶ Cloudflare R2
  ↓                        ↓                              ↓
 .md + 画像           ① 画像検出・変換              公開URL発行
 (ローカル)           ② R2へアップロード         https://cdn.colorfulworld.jp/
                      ③ .mdのパス書き換え              ↓
                      ④ wisp等CMSへ同期          Next.js ブログ表示
```

### ストレージ設計（R2バケット構成）

```
colorfulworld-images/
  ├── originals/          # 原本（RAW/HEIC含む）← 非公開でもOK
  │   └── 2026/03/photo.arw
  ├── web/                # 公開用（WebP変換済み）
  │   └── 2026/03/photo.webp
  └── thumbnails/         # サムネイル（管理画面用 400px）
      └── 2026/03/photo_thumb.webp
```

---

## 実装手順

### Phase 1：コンテンツ用リポジトリ分離

```
content-repo/           ← 新規作成する専用リポジトリ
  ├── posts/
  │   └── 2026-03-17-article.md
  └── images/
      └── 2026/03/
          ├── photo.jpg
          └── photo.heic
```

Obsidianのvaultをこのリポジトリのルートに向ける。  
画像添付設定は「現在のノートと同じフォルダ」→ `images/{year}/{month}/` に変更。

### Phase 2：GitHub Actions ワークフロー

`.github/workflows/sync-images.yml` の概要：

```yaml
on:
  push:
    paths:
      - 'images/**'

jobs:
  process-images:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2  # 差分検出のため

      - name: 変更された画像を検出
        run: |
          git diff --name-only HEAD~1 HEAD -- 'images/**' > changed_images.txt

      - name: Node.js セットアップ
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: RAW変換ツール（必要な場合のみ）
        run: sudo apt-get install -y darktable  # RAW対応する場合

      - name: 画像変換 & R2アップロード
        run: node scripts/process-images.js
        env:
          R2_ACCOUNT_ID: ${{ secrets.R2_ACCOUNT_ID }}
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_BUCKET: colorfulworld-images

      - name: Markdownのパス書き換え & コミット
        run: |
          node scripts/replace-image-paths.js
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add -A
          git diff --staged --quiet || git commit -m "chore: replace image paths with CDN URLs"
          git push
```

### Phase 3：画像処理スクリプト

`scripts/process-images.js` のロジック：

```javascript
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, existsSync } from 'fs';

// 処理対象の拡張子
const SUPPORTED = ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp'];
const RAW_FORMATS = ['.arw', '.cr2', '.nef', '.raf'];

// RAW → JPEGはdarktable-cliで前処理してからsharpに渡す
// 通常フォーマットはsharpで直接WebP変換
// originals/にオリジナルをそのままアップロード
// web/にWebP版をアップロード
```

### Phase 4：管理画面（画像ギャラリー）

`src/app/admin/images/page.tsx` として実装：

- R2の `list objects` APIで画像一覧を取得
- サムネイル表示（`thumbnails/` から）
- URLをワンクリックコピー（クリップボードAPI）
- 認証は Next-Auth または `ADMIN_PASSWORD` 環境変数で簡易保護

---

## モバイル編集の現実的な落とし所

| シナリオ | 手段 | 難易度 |
|---------|------|--------|
| テキストのみ編集 | Obsidian Mobile + Working Copy（iOS）/ MGit（Android）| 中 |
| 画像もスマホから投稿 | **管理画面から直接アップロード** → URLをコピー → Obsidianに貼る | 低 |
| 完全にモバイル完結 | Obsidian Mobile + Working Copy（自動同期設定）| 高 |

**推奨**：スマホで画像を撮ったら管理画面のアップロード機能を使い、発行されたURLをMarkdownに貼る。Obsidianでの執筆はスマホでも可能だが、Git同期の設定コストを考えると管理画面経由が現実的。

---

## コスト試算

| サービス | 料金 | 備考 |
|---------|------|------|
| Cloudflare R2 | **無料** 10GB/月まで、転送量課金なし | 超過分 $0.015/GB |
| GitHub Actions | **無料** 2,000分/月まで | 画像変換は1回数十秒 |
| Cloudflare Workers | **無料** 100,000リクエスト/日まで | カスタムリサイズProxy用 |

→ **個人ブログ規模では実質無料で運用可能。**

---

## 実装優先順位

1. **Phase 1**：content-repoの作成とObsidian連携（1日）
2. **Phase 2-3**：GitHub Actions + 画像変換スクリプト（2〜3日）
3. **Phase 4**：管理画面の画像ギャラリー（1〜2日）
4. モバイルGitワークフロー整備（必要に応じて）

---

## 未解決の判断事項

- [ ] RAW対応は「原本保存のみ」か「変換も行う」か
- [ ] content-repoは site-repo と別にするか同じにするか
- [ ] 管理画面の認証方式（Next-Auth / 簡易パスワード）
- [ ] 既存のwisp.blogとの共存期間をどうするか
