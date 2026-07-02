# 画像の source of truth を Neon の media テーブルにする

再利用可能な画像一覧（ライブラリ）の出所として、Vercel Blob を直接 `list()` するのではなく、Neon(Drizzle) に専用の `media` テーブルを新設し、そこを唯一の source of truth とする。理由: 既に記事は Neon 直読の自作CMSであり一貫する／Blob の list はURL・サイズ・アップ時刻しか返せずキャプションや検索・ソフト削除が扱えない／アップロード時に sharp で算出した寸法・blur を保持できる。既存の Blob 画像62枚は一度きりのバックフィルで media に登録し、それ以降は全アップロードが media に記録される。

## Consequences

- Blob と media が二重管理になるが、Blob 側はソフト削除で消さない運用のため実害は小さい（削除は media 行の非表示化のみ）。
- ローカル `public/images/` の163枚はバックフィル対象外とした（ライブラリには載らない）。
