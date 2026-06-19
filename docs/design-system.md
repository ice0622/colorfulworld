# デザインシステム（モノクロ × クリーム）

このサイトの見た目の「唯一の真実」。色・余白・タイポはここに従う。
迷ったらまずこのファイル。新しい色や一回限りの上書きを足さない。

## 原則

1. **アクセント色なし（モノクロ）。** クリーム地＋暖色系グレー＋ほぼ黒の文字だけ。
   青・クレイなどの差し色は使わない。
2. **コントラストは色相でなく明度（濃淡）と余白で作る。** 猫の視覚にも人にも、
   明暗・余白・サイズで可読性を出す。
3. **状態は色に頼らない。** 成否／下書き公開／危険は「アイコン＋文字＋濃淡」で二重に示す。
4. **色は必ずトークン経由。** 生の色（`gray-*` / `white` / `black` / `#hex` / `rgba()` / `dark:`）は使わない。
5. **ダーク/ライト切替は廃止。** 固定ライト（クリーム）。

## カラートークン（出所：[src/app/globals.css](../src/app/globals.css) の `:root`）

値は HSL チャンネル（`hsl(var(--x))` 前提。`/opacity` 修飾子が効く）。

| トークン | Tailwind クラス | 近似HEX | 役割 |
|---|---|---|---|
| `--background` | `bg-background` | `#F0EEE6` | ページの地（クリーム） |
| `--foreground` | `text-foreground` | `#1F1E1D` | 本文・見出し（ほぼ黒） |
| `--card` / `--popover` | `bg-card` / `bg-popover` | `#FAF8F2` | カード・浮く面 |
| `--muted` | `bg-muted` | クリーム寄り淡グレー | 控えめな面・タグ地 |
| `--muted-foreground` | `text-muted-foreground` | `#5B5852` | 補助文字・日付・キャプション |
| `--secondary` | `bg-secondary` | 暖色淡グレー | 補助ボタン/バッジ地 |
| `--accent` | `bg-accent` | 淡クリーム | hover の地 |
| `--primary` | `bg-primary` / `text-primary` | ほぼ黒 | 主要な塗りボタン（黒地＋明色文字）。**差し色ではない** |
| `--primary-foreground` | `text-primary-foreground` | `#FAF8F2` | 黒面に載る明色 |
| `--border` / `--input` | `border-border` | 暖色淡グレー | 区切り線・入力枠 |
| `--ring` | `ring-ring` | 中立グレー | フォーカス輪郭 |
| `--destructive` | `bg-destructive` | 濃いグレー | 危険操作（赤は使わない。アイコン＋確認で示す） |

> グレーは地のクリームに合わせ hue≈40 の暖色低彩度で統一。冷たい青みグレーは使わない。

## 使い分けルール

- **文字**：本文・見出し＝`text-foreground`。補助・メタ＝`text-muted-foreground`。
- **リンク**：色で区別しない。`text-foreground` ＋ hover で下線（`hover:underline` / `underline-offset-4`）。
- **面**：ページ地＝`bg-background`、カード＝`bg-card`、控えめブロック＝`bg-muted`。
- **hover 地**：`hover:bg-muted` または `hover:bg-accent`。
- **区切り**：`border-border` / `divide-border`。
- **塗りボタン（主）**：`bg-primary text-primary-foreground`（黒ボタン）。副は `variant="outline"/"ghost"`。
- **フォーカス**：`focus-visible:ring-2 ring-ring`。
- **スクリム（モーダル背景）**：`bg-foreground/70`（黒の半透明）。
- **状態バッジ**：地＝濃淡（`bg-muted` / `bg-foreground/10`）＋ lucide アイコン＋文字。色相で区別しない。
  - 例：公開＝`Check`＋`bg-foreground/10`、下書き＝`Pencil`＋`bg-muted`。
- **危険操作**：`variant="destructive"`（濃グレー）＋アイコン＋確認ダイアログ。

## 余白（8px グリッド）

`0.5rem`（8px）刻みを基本。`gap`/`space-y`/`py` は `2/4/6/8/10/12/16/20` を使う。
記事本文の縦リズムは [globals.css](../src/app/globals.css) の `.blog-flow` に既定：
段落間 24px、`###` 前 40px、`##`/`#` 前 56px。

## タイポ

- フォント：`--font-sans`（Inter）。本文行間 1.9（`.blog-content`）。
- 見出しスケール（prose 上書き）：h1 = `text-2xl`/bold、h2 = `text-xl`/semibold、h3 = `text-lg`/semibold。
- 補助ラベルは `text-xs` ＋ `tracking-widest`（必要なら `uppercase`）。

## 例外（意図的な独自意匠）

以下はクリーム外の濃色を意図的に使う領域。増やさない：
- 発車表示風オーバーレイ [DepartureBoardOverlay](../src/components/DepartureBoardOverlay.tsx)
- シェーダー展示 [/shaders](../src/app/shaders/page.tsx)
- コードブロック（`#1e1e1e` のエディタ風）

## ドリフトを防ぐ運用

- 色を足したくなったら、まず既存トークンで足りるか確認。足りなければ**このファイルにトークンを追加してから**使う（コンポーネントに生色を書かない）。
- レビュー時 `grep -rE "dark:|(bg|text|border)-(gray|white|black|red|green|blue)" src/` で生色の混入を確認。
