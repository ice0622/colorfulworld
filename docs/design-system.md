# デザインシステム（侍ブルー）

このサイトの見た目の「唯一の真実」。色・余白・タイポはここに従う。
迷ったらまずこのファイル。新しい色や一回限りの上書きを足さない。

もとはワールドカップ期間限定の「侍ブルー」オーバーレイだったが、常設のベース配色に格上げした。

## 原則

1. **アクセントは紺1色のみ。** 濃紺の地＋白系の文字・面の濃淡だけで構成する。
   それ以外の色相（赤・緑・クレイなど）の差し色は使わない。
2. **コントラストは色相でなく明度（濃淡）と余白で作る。** 明暗・余白・サイズで可読性を出す。
3. **状態は色に頼らない。** 成否／下書き公開／危険は「アイコン＋文字＋濃淡」で二重に示す。
4. **色は必ずトークン経由。** 生の色（`gray-*` / `white` / `black` / `#hex` / `rgba()` / `dark:`）は使わない。
5. **テーマ切替は廃止。** 固定の侍ブルー配色（ライト/ダークの概念は持たない）。

## カラートークン（出所：[src/app/globals.css](../src/app/globals.css) の `:root`）

値は HSL チャンネル（`hsl(var(--x))` 前提。`/opacity` 修飾子が効く）。

| トークン | Tailwind クラス | 近似HEX | 役割 |
|---|---|---|---|
| `--background` | `bg-background` | `#14264F` 付近 | ページの地（侍ブルーの濃紺） |
| `--foreground` | `text-foreground` | ほぼ白 | 本文・見出し |
| `--card` / `--popover` | `bg-card` / `bg-popover` | 地より明るい紺 | カード・浮く面 |
| `--muted` | `bg-muted` | 落ち着いた紺 | 控えめな面・タグ地 |
| `--muted-foreground` | `text-muted-foreground` | 淡い青グレー | 補助文字・日付・キャプション |
| `--secondary` | `bg-secondary` | やや控えめな紺 | 補助ボタン/バッジ地 |
| `--accent` | `bg-accent` | 地よりやや明るい紺 | hover の地 |
| `--primary` | `bg-primary` / `text-primary` | ほぼ白 | 主要な塗りボタン（白地＋紺文字）。**差し色ではない** |
| `--primary-foreground` | `text-primary-foreground` | 濃紺 | 白面に載る濃色文字 |
| `--border` / `--input` | `border-border` | 紺地で見える濃さ | 区切り線・入力枠 |
| `--ring` | `ring-ring` | 淡い青白 | フォーカス輪郭 |
| `--destructive` | `bg-destructive` | 淡いグレー | 危険操作（赤は使わない。アイコン＋確認で示す） |
| `--scrim` | `bg-scrim` | 固定の濃紺（背景よりさらに暗い） | モーダル背景専用。`foreground` の明暗に関わらず常に暗い |

> 面・境界色は地の紺に合わせ hue≈213-223 で統一。他の色相のグレーは混ぜない。
> `--scrim` だけは `foreground`/`background` から独立した固定値（モーダルを暗く沈めるための専用トークン。テーマの明暗方向が変わっても壊れない）。

## 使い分けルール

- **文字**：本文・見出し＝`text-foreground`。補助・メタ＝`text-muted-foreground`。
- **リンク**：色で区別しない。`text-foreground` ＋ hover で下線（`hover:underline` / `underline-offset-4`）。
- **面**：ページ地＝`bg-background`、カード＝`bg-card`、控えめブロック＝`bg-muted`。
- **hover 地**：`hover:bg-muted` または `hover:bg-accent`。
- **区切り**：`border-border` / `divide-border`。
- **塗りボタン（主）**：`bg-primary text-primary-foreground`（白ボタン＋濃紺文字）。副は `variant="outline"/"ghost"`。
- **フォーカス**：`focus-visible:ring-2 ring-ring`。
- **スクリム（モーダル背景）**：`bg-scrim/70`〜`/80`。`bg-foreground/*` は使わない
  （`foreground` は今は白なので、モーダルを薄くしてしまい壊れる）。
- **状態バッジ**：地＝濃淡（`bg-muted` / `bg-foreground/10`）＋ lucide アイコン＋文字。色相で区別しない。
  - 例：公開＝`Check`＋`bg-foreground/10`、下書き＝`Pencil`＋`bg-muted`。
- **危険操作**：`variant="destructive"`（淡いグレー）＋アイコン＋確認ダイアログ。

## 余白（8px グリッド）

`0.5rem`（8px）刻みを基本。`gap`/`space-y`/`py` は `2/4/6/8/10/12/16/20` を使う。
記事本文の縦リズムは [globals.css](../src/app/globals.css) の `.blog-flow` に既定：
段落間 24px、`###` 前 40px、`##`/`#` 前 56px。

## タイポ

- フォント：`--font-sans`（Inter）。本文行間 1.9（`.blog-content`）。
- 見出しスケール（prose 上書き）：h1 = `text-2xl`/bold、h2 = `text-xl`、h3 = `text-lg`。
- 記事本文の h2/h3 は本文と地続きにならないよう、タイトルと同じ `--font-noto-serif-jp`（weight 900）＋
  `scaleY(1.15)` の縦伸長で「見出しらしさ」を出す（[globals.css](../src/app/globals.css) の
  `.blog-content .prose h2/h3`）。h2 は下線を `border-border` でコンテナ幅いっぱいに、
  h3 は横に短い棒線（`border-border` の背景）を添えて区別する。色ではなく書体・線・伸長で差をつける。
- 補助ラベルは `text-xs` ＋ `tracking-widest`（必要なら `uppercase`）。

## 例外（意図的な独自意匠）

以下はベースパレット外の色を意図的に使う領域。増やさない：
- 発車表示風オーバーレイ [DepartureBoardOverlay](../src/components/DepartureBoardOverlay.tsx)
- シェーダー展示 [/shaders](../src/app/shaders/page.tsx)
- コードブロック（`#1e1e1e` のエディタ風）

## 経緯（旧・期間限定テーマ）

もとはワールドカップ限定の「侍ブルー」オーバーレイ（`html[data-theme="samurai"]` で `:root` を
一時的に上書きする仕組み）として導入したが、この配色を気に入ったため `:root` 本体に統合し常設化した。
`data-theme="samurai"` の仕組み自体は [layout.tsx](../src/app/layout.tsx) から削除済み。
追従しない箇所（OG画像 `og-image/template.tsx` のHEX直書きなど）は変わらず残る。

## ドリフトを防ぐ運用

- 色を足したくなったら、まず既存トークンで足りるか確認。足りなければ**このファイルにトークンを追加してから**使う（コンポーネントに生色を書かない）。
- レビュー時 `grep -rE "dark:|(bg|text|border)-(gray|white|black|red|green|blue)" src/` で生色の混入を確認。
