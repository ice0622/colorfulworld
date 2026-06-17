"use client";

import { useState } from "react";

export interface FontOption {
  id: string;
  name: string;
  fontFamily: string;
  weight: string;
  supportsJP: boolean;
  tag: string;
}

const SAMPLE_TITLES = [
  "東京の片隅で見つけた、忘れられない風景",
  "旅の記憶と、もう戻れない季節について",
  "The Future of Web Design",
  "朝の光の中で、ぼんやりと考えていたこと",
];

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
        <span className="text-xs font-mono tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

export function FontPreviewClient({ fonts }: { fonts: FontOption[] }) {
  const [selectedId, setSelectedId] = useState(fonts[0].id);
  const [customTitle, setCustomTitle] = useState(SAMPLE_TITLES[0]);
  const [scaleY, setScaleY] = useState(1.0);
  const [letterSpacing, setLetterSpacing] = useState(-0.02);
  const [fontSize, setFontSize] = useState<"5xl" | "6xl" | "7xl">("6xl");

  const selected = fonts.find((f) => f.id === selectedId) ?? fonts[0];

  const fontSizeClass = {
    "5xl": "text-5xl",
    "6xl": "text-6xl",
    "7xl": "text-7xl",
  }[fontSize];

  const titleStyle: React.CSSProperties = {
    fontFamily: selected.fontFamily,
    fontWeight: selected.weight,
    transform: `scaleY(${scaleY})`,
    transformOrigin: "top left",
    letterSpacing: `${letterSpacing}em`,
    display: "inline-block",
    width: "100%",
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">フォントプレビュー</h2>
        <p className="text-sm text-muted-foreground">
          フォント選択 + scaleY / letter-spacing でリアルタイム調整
        </p>
      </div>

      {/* ── プレビューエリア ── */}
      <div className="border rounded-2xl p-8 mb-6 bg-muted overflow-hidden">
        <div className="text-xs text-muted-foreground mb-4 tracking-widest uppercase">
          {selected.name} · scaleY {scaleY.toFixed(2)} · tracking{" "}
          {letterSpacing.toFixed(3)}em
        </div>
        <div
          className={`${fontSizeClass} leading-tight break-words`}
          style={titleStyle}
        >
          {customTitle}
        </div>
        <div className="flex items-center gap-3 mt-6 text-sm text-muted-foreground">
          <span>2025年05月29日</span>
          <span>#旅行</span>
          <span>#エッセイ</span>
          {!selected.supportsJP && (
            <span className="bg-brand/15 text-foreground/80 text-xs px-2 py-0.5 rounded">
              ラテン文字のみ
            </span>
          )}
        </div>
      </div>

      {/* ── 変形コントロール ── */}
      <div className="border rounded-xl p-5 mb-6 grid sm:grid-cols-2 gap-5">
        <Slider
          label="scaleY — 縦伸び"
          value={scaleY}
          min={0.8}
          max={2.0}
          step={0.05}
          display={`${scaleY.toFixed(2)}×`}
          onChange={setScaleY}
        />
        <Slider
          label="letter-spacing — 文字間"
          value={letterSpacing}
          min={-0.12}
          max={0.08}
          step={0.005}
          display={`${letterSpacing.toFixed(3)}em`}
          onChange={setLetterSpacing}
        />
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">
            サイズ
          </div>
          <div className="flex gap-1.5">
            {(["5xl", "6xl", "7xl"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  fontSize === s
                    ? "bg-foreground text-background border-foreground"
                    : "hover:border-foreground/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">
            リセット
          </div>
          <button
            onClick={() => {
              setScaleY(1.0);
              setLetterSpacing(-0.02);
            }}
            className="px-3 py-1.5 rounded-lg text-sm border hover:border-foreground/40 transition-colors"
          >
            デフォルトに戻す
          </button>
        </div>
      </div>

      {/* ── タイトル入力 ── */}
      <div className="mb-8">
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">
          タイトルを入力
        </label>
        <input
          type="text"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          className="w-full border rounded-lg px-4 py-2.5 bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {SAMPLE_TITLES.map((t) => (
            <button
              key={t}
              onClick={() => setCustomTitle(t)}
              className="text-xs border rounded-full px-3 py-1 hover:bg-muted transition-colors truncate max-w-[200px]"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── フォント選択グリッド ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {fonts.map((font) => (
          <button
            key={font.id}
            onClick={() => setSelectedId(font.id)}
            className={`border rounded-xl p-4 text-left transition-all ${
              selectedId === font.id
                ? "border-foreground bg-foreground text-background"
                : "hover:border-foreground/40"
            }`}
          >
            <div
              className="text-3xl leading-tight mb-2 truncate"
              style={{
                fontFamily: font.fontFamily,
                fontWeight: font.weight,
                transform: `scaleY(${scaleY})`,
                transformOrigin: "top left",
                letterSpacing: `${letterSpacing}em`,
                display: "inline-block",
              }}
            >
              見出しABC
            </div>
            <div className="text-xs font-mono leading-snug mt-2">{font.name}</div>
            <div
              className={`text-xs mt-0.5 ${
                selectedId === font.id ? "opacity-60" : "text-muted-foreground"
              }`}
            >
              {font.tag}
            </div>
          </button>
        ))}
      </div>

      {/* ── 全フォント縦比較 ── */}
      <div>
        <h3 className="text-base font-bold mb-4">
          全フォント比較{" "}
          <span className="text-xs font-normal text-muted-foreground">
            スライダーの値が反映されます
          </span>
        </h3>
        <div className="space-y-3">
          {fonts.map((font) => (
            <div
              key={font.id}
              onClick={() => setSelectedId(font.id)}
              className={`border rounded-xl px-5 pt-5 pb-4 cursor-pointer transition-all overflow-hidden ${
                selectedId === font.id
                  ? "border-foreground"
                  : "hover:border-foreground/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {font.name}
                </span>
                <div className="flex gap-1.5">
                  <span className="text-xs border rounded px-1.5 py-0.5">
                    {font.tag}
                  </span>
                  {font.supportsJP ? (
                    <span className="text-xs border border-primary/40 text-link rounded px-1.5 py-0.5">
                      JP✓
                    </span>
                  ) : (
                    <span className="text-xs border border-brand/50 text-brand rounded px-1.5 py-0.5">
                      JP×
                    </span>
                  )}
                </div>
              </div>
              <div
                className="text-4xl sm:text-5xl leading-tight break-words"
                style={{
                  fontFamily: font.fontFamily,
                  fontWeight: font.weight,
                  transform: `scaleY(${scaleY})`,
                  transformOrigin: "top left",
                  letterSpacing: `${letterSpacing}em`,
                  display: "inline-block",
                  width: "100%",
                  marginBottom: `${(scaleY - 1) * 1.5}rem`,
                }}
              >
                {customTitle}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
