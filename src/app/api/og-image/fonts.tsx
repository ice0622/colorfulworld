import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export type FontMap = Record<
  string,
  {
    data: Buffer | ArrayBuffer;
    name: string;
    weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
    style?: "normal" | "italic";
    lang?: string;
  }
>;

// フォントは関数バンドルに同梱し、ファイルシステムから直接読み込む。
// new URL(..., import.meta.url) で Next がアセットをバンドルに含めてくれるので、
// それをパスへ変換して fs で読む。実行時に外部 fetch しないためコールドスタートが速い。
const loadFile = (path: string) =>
  readFile(fileURLToPath(new URL(path, import.meta.url)));

let loadedFonts: FontMap | null = null;

const loadFontsRaw = async (): Promise<FontMap> => {
  const [interSemibold, interRegular, notoSerifJP] = await Promise.all([
    loadFile("./_fonts/Inter-SemiBold.ttf"),
    loadFile("./_fonts/Inter-Regular.ttf"),
    loadFile("./_fonts/NotoSerifJP-Black.ttf"),
  ]);

  return {
    "inter-semibold": {
      name: "Inter",
      data: interSemibold,
      weight: 600,
      style: "normal",
    },
    "inter-regular": {
      name: "Inter",
      data: interRegular,
      weight: 400,
      style: "normal",
    },
    // 日本語グリフ用。Inter に無い文字はこのフォントで描画される（site の見出しと同じ Noto Serif JP）
    "noto-serif-jp": {
      name: "Noto Serif JP",
      data: notoSerifJP,
      weight: 900,
      style: "normal",
    },
  };
};

export const loadFonts = async (): Promise<FontMap> => {
  if (loadedFonts) {
    return loadedFonts;
  }
  loadedFonts = await loadFontsRaw();
  return loadedFonts;
};
