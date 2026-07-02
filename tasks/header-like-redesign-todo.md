# ヘッダー & いいねエリア デザイン刷新

最終更新: 2026-06-19

## 決定した方向性
- ヘッダー：**小型ピル**（全幅 → 内容幅・中央寄せ、枠/影を軽く、名前+Aboutを近接）
- いいね：**一体型ピル**（🦎＋合計を1タップ。自分の貢献はドット）／“入力欄もどき”は廃止
- ハイライトボタン：**削除**

## タスク
- [x] Header.tsx：全幅ピル → 内容幅の中央寄せピル。影を軽く、名前+Aboutを近接（divider）
- [x] LikeButton.tsx：数字+ラベル+入力欄もどき+丸ボタン → 一体型ピル＋貢献ドット。ロジック維持
- [x] BlogPostContent.tsx：ハイライトボタン+ImageHighrightトグル+showSlider state+chrome prop 撤去
- [x] LivePreview.tsx：`chrome={false}` 撤去（chrome prop 廃止に追従）
- [x] 型/ビルド検証（見た目はブラウザ目視に委ねる）

## 制約
- 色はトークン経由のみ（docs/design-system.md）。生色・dark: 禁止。モノクロ維持。
- ImageHighright.tsx 本体は削除せず温存（使用箇所のみ撤去）。

## レビュー
- `npx tsc --noEmit` 通過（exit 0）。
- 生色チェック（gray/white/black/#hex/rgba/dark:）→ 変更3ファイルで検出なし。
- chrome / ImageHighright / showSlider / blink の残骸なし。
- いいねロジック（clientId, fetch GET/POST, MAX_MY_LIKES, pulse）は完全維持。表示のみ刷新。
- ImageHighright.tsx は未使用（dead）になったが温存（使用箇所のみ撤去）。
- 既知の非関連事項：`next lint` は環境側で `next/core-web-vitals` 設定をロードできず失敗（既存問題、本変更と無関係）。
- 残り：実機ブラウザでの見た目確認はユーザーに委ねる。
