import {
  Bodoni_Moda,
  Cormorant_Garamond,
  Abril_Fatface,
  Noto_Serif_JP,
  Dela_Gothic_One,
  Zen_Kaku_Gothic_New,
} from "next/font/google";
import { FontPreviewClient } from "./FontPreviewClient";

const bodoniModa = Bodoni_Moda({
  weight: ["700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-p-bodoni",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-p-cormorant",
  display: "swap",
});

const abrilFatface = Abril_Fatface({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-p-abril",
  display: "swap",
});

const notoSerifJP = Noto_Serif_JP({
  weight: ["700", "900"],
  subsets: ["latin"],
  variable: "--font-p-noto-serif",
  display: "swap",
});

const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-p-dela",
  display: "swap",
});

const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  weight: ["700", "900"],
  subsets: ["latin"],
  variable: "--font-p-zen-kaku",
  display: "swap",
});

export default function FontPreviewPage() {
  const fontVarClasses = [
    bodoniModa.variable,
    cormorant.variable,
    abrilFatface.variable,
    notoSerifJP.variable,
    delaGothicOne.variable,
    zenKakuGothicNew.variable,
  ].join(" ");

  const fonts = [
    {
      id: "current",
      name: "Inter (現在)",
      fontFamily: "var(--font-sans)",
      weight: "700",
      supportsJP: false,
      tag: "現在",
    },
    {
      id: "bodoni",
      name: "Bodoni Moda",
      fontFamily: "var(--font-p-bodoni)",
      weight: "900",
      supportsJP: false,
      tag: "高コントラスト",
    },
    {
      id: "cormorant",
      name: "Cormorant Garamond",
      fontFamily: "var(--font-p-cormorant)",
      weight: "700",
      supportsJP: false,
      tag: "縦長セリフ",
    },
    {
      id: "abril",
      name: "Abril Fatface",
      fontFamily: "var(--font-p-abril)",
      weight: "400",
      supportsJP: false,
      tag: "ファット・デコ",
    },
    {
      id: "noto-serif",
      name: "Noto Serif JP",
      fontFamily: "var(--font-p-noto-serif)",
      weight: "900",
      supportsJP: true,
      tag: "JP・セリフ",
    },
    {
      id: "dela",
      name: "Dela Gothic One",
      fontFamily: "var(--font-p-dela)",
      weight: "400",
      supportsJP: true,
      tag: "JP・極太",
    },
    {
      id: "zen-kaku",
      name: "Zen Kaku Gothic New",
      fontFamily: "var(--font-p-zen-kaku)",
      weight: "900",
      supportsJP: true,
      tag: "JP・ゴシック",
    },
  ];

  return (
    <div className={fontVarClasses}>
      <FontPreviewClient fonts={fonts} />
    </div>
  );
}
