import manifest from "./image-manifest.json";

/**
 * scripts/gen-image-manifest.ts が生成する画像メタ。
 * - 通常: w/h は実寸、blur は極小webpのdata URL。
 * - unoptimized: sharp で decode できない画像（拡張子詐称のAVIF等）。最適化を回避して素のまま配信する。
 */
export type ImageMeta =
  | { w: number; h: number; blur: string }
  | { unoptimized: true };

/**
 * 画像URL（ローカル `/images/...` または Blob の http(s) URL）に対応する
 * 寸法とblurプレースホルダを返す。未収録なら undefined。
 * src はブラウザが持つ値（remark がURLエンコードした後の `<img src>`）と一致する。
 */
export function getImageMeta(src: string): ImageMeta | undefined {
  return (manifest as Record<string, ImageMeta>)[src];
}
