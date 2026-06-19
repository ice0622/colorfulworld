// 猫ロゴ確認用ページ（採用が決まったら削除する一時ページ）
// 開発サーバーで http://localhost:3000/cat-preview を開いて見てください。
// 手書き画像 (=・ω・=) を potrace でベクター化した CatLogo を表示。

import { CatLogo } from "@/components/CatLogo";

export default function CatPreviewPage() {
  return (
    <div className="container mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        猫ロゴ（手書きをトレース・確認用）
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        あなたの手書き顔文字を potrace で切り抜いたものです。線は文字色（currentColor）に追従。
        これでよければ、このページは削除します。気になる点（太さ・大きさ・余白）があれば調整します。
      </p>

      <div className="mt-12 flex flex-col gap-12 text-foreground">
        {/* 大きく */}
        <section className="flex flex-col items-center gap-3">
          <span className="text-xs text-muted-foreground">大</span>
          <CatLogo className="h-28 w-auto" />
        </section>

        {/* いいねピル内（本番と同じ） */}
        <section className="flex flex-col items-center gap-3">
          <span className="text-xs text-muted-foreground">いいねピル内（本番と同じ）</span>
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-6 py-3 shadow-sm">
            <CatLogo className="h-8 w-auto" />
            <span className="text-2xl font-semibold tabular-nums text-foreground">124</span>
          </div>
        </section>

        {/* 小（本文中サイズ） */}
        <section className="flex flex-col items-center gap-3">
          <span className="text-xs text-muted-foreground">小（本文中に並べたとき）</span>
          <div className="flex items-center gap-2 text-base text-muted-foreground">
            みんなの
            <CatLogo className="inline-block h-5 w-auto text-foreground" />
            合計 124
          </div>
        </section>

        {/* 文字色追従の確認：muted 上 */}
        <section className="flex flex-col items-center gap-3">
          <span className="text-xs text-muted-foreground">色追従の確認（薄い文字色に合わせる）</span>
          <div className="text-muted-foreground">
            <CatLogo className="h-12 w-auto" />
          </div>
        </section>
      </div>
    </div>
  );
}
