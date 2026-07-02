# 写真記事を検索に乗せる（外部流入の増加）

最終更新: 2026-06-29

## 背景（GSCデータ 過去3ヶ月）
- クリック計 約6回 / 表示 約84〜106回。写真・旅記事は検索的にほぼ存在しない。
- 唯一当たっているのは TECH記事（vercel-sitemap 3.3位 等）= 検索語がタイトルにあるから。
- `tag/NikonFE` が表示2回・8位 = 写真にも「需要の芽」がデータに出ている。
- 方針（ユーザー選択）: **写真を検索に乗せる**。France記事をテンプレとして整備し横展開する。

## 核心の問題
詩的タイトル（例「お花のお都 おフランス」）が `<title>` に直結 → 検索語ゼロ → 表示されない。
（`src/app/blog/[slug]/page.tsx` の generateMetadata が `title` をそのまま使用）

---

## Tier 1：見つけてもらう（最優先・コア修正）
- [ ] `seoTitle`（任意）を frontmatter / スキーマに追加。`<title>`/OG title はこれを優先、無ければ従来 `title` にフォールバック。表示用H1は詩的タイトルのまま維持。
  - 対象: `src/db/schema.ts`, `src/types/content.ts`, `src/lib/content.ts`, `src/app/blog/[slug]/page.tsx`
- [ ] France記事に検索語入りの `seoTitle` を設定
- [ ] France記事の `description` を検索語入りに書き換え（Nikon FE / フィルム / パリ / ルーブル / エッフェル塔）

## Tier 2：画像検索（写真ブログの本丸）
- [ ] France記事の空alt（41枚）を、既存の日本語キャプションを元に説明的altで埋める
- [ ] alt運用ルールを決める（被写体＋場所＋機材を自然文で）
- [ ] sitemap に `<image:image>`（image:loc / image:caption）を追加
- [ ] JSON-LD に ImageObject を追加（cover画像など）

## Tier 3：作例ハブ（NikonFEタグの芽を育てる）
- [ ] 撮影データ frontmatter 追加: `camera` / `lens` / `filmStock`（任意・分かる範囲）
- [ ] 記事内に「撮影データ」表示ブロックを追加（読者向け＋keyword）
- [ ] Nikon FE 作例ページ（タグページ強化 or 専用ランディング）で写真を集約

## Tier 4：技術的クイックフィックス
- [ ] root layout の `lang="en"` → `lang="ja"`（`src/app/layout.tsx`）

---

## ユーザーに確認が必要な事実（捏造できないので要回答）
1. カメラは Nikon FE で確定か？
2. レンズは何か？（本文に f/2.0 の記述あり）
3. フィルム銘柄は？（「ISO低かった」= ISO100〜200系？）
   → 銘柄は独立した検索市場（例: Portra 400 作例）。分かれば入口が増える。

## レビュー（2026-06-29 実装）

**重要な訂正**: 当初 `content/posts/France.md` を編集する前提だったが、md は死にコード。実体は
DB+自作CMS（`src/app/(admin)/admin/`）。計画をCMS経路に作り直した（記憶 project_colorfulworld_live_cms / lessons.md 参照）。

**実装済み（コード）**:
- DB: `src/db/schema.ts` に `seo_title/camera/lens/film_stock`（nullable text）4列
- 書き込み: `post-schema.ts`(zod) / `repo.ts`(UpsertInput・common・AdminPost・getAdminPost) / `actions.ts`(saveDraft) / `PostEditor.tsx`(設定Sheetに「SEOタイトル」「撮影データ」入力＋defaultValues)
- 描画: `content.ts`(rowToPost/parsedToPost) / `postParse.ts`(死にパスの整合) / `blog/[slug]/page.tsx`(generateMetadata=seoTitle優先・H1不変、JSON-LD headline/ImageObject/keywords強化) / `BlogPostContent.tsx`(撮影データ表示ブロック・モノクロ) / `sitemap.ts`(cover画像) / `layout.tsx`(lang=ja)
- 前倒し編集（types/content.ts・postParse.tsの型）も本実装に統合済み

**検証**: `npx tsc --noEmit` = exit 0（全チェーン型整合）。`drizzle-kit generate` は full baseline を吐く（このプロジェクトは push 運用で生成ファイル未使用）ため生成物は削除。マイグレーションは `npm run db:push` で適用。

**残（ユーザー作業）**:
- [ ] `npm run db:push`（4列を Neon に追加）※未実施だと `db.select()` 全列SELECTで500（実際に /admin で発生）
- [ ] CMSの設定パネルで France に seoTitle/概要/カメラ/レンズ/フィルムを手入力
- [ ] 公開ページで title/H1/撮影データ/JSON-LD を目視確認、後日GSCで推移観察
