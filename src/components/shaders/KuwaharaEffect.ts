import { Effect } from "postprocessing";
import { Uniform } from "three";

// -------------------------------------------------------------------
// Kuwahara フィルター (4-sector ベース実装)
//
// 参考: "On Crafting Painterly Shaders" by Maxime Heckel
// https://blog.maximeheckel.com/posts/on-crafting-painterly-shaders/
//
// 各ピクセルを中心に 4 つの矩形領域（Sector）を定義し、
// 最も分散の小さい Sector の平均色を出力する。
// これにより、エッジを保持しながらテクスチャ細部を平滑化する。
//
// uStrength: 0.0 = 元画像, 1.0 = 完全な絵画表現
// -------------------------------------------------------------------

const fragmentShader = /* glsl */ `
  uniform float uStrength;

  // 1 Sector あたりのサンプル辺長 (変更する場合は定数を修正)
  #define KERNEL_SIZE 3

  // postprocessing が inputBuffer と resolution を自動的に提供する。
  // resolution.xy = レンダーターゲットの幅・高さ (px)

  vec3 sampleTex(const in vec2 uv, vec2 pixelOffset) {
    return texture2D(inputBuffer, uv + pixelOffset / resolution.xy).rgb;
  }

  // offset: Sector の左上コーナーをピクセル単位で指定
  void getSector(
    const in vec2 uv,
    vec2 offset,
    out vec3 avgColor,
    out float variance
  ) {
    vec3 colorSum     = vec3(0.0);
    vec3 squaredSum   = vec3(0.0);
    float count       = 0.0;

    for (int y = 0; y < KERNEL_SIZE; y++) {
      for (int x = 0; x < KERNEL_SIZE; x++) {
        vec2 off = offset + vec2(float(x), float(y));
        vec3 c   = sampleTex(uv, off);
        colorSum    += c;
        squaredSum  += c * c;
        count       += 1.0;
      }
    }

    avgColor         = colorSum / count;
    vec3 v           = (squaredSum / count) - (avgColor * avgColor);
    // RGB 分散を輝度 1 値に変換して比較しやすくする
    variance         = dot(v, vec3(0.299, 0.587, 0.114));
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // strength が 0 なら元画像をそのまま返す
    if (uStrength <= 0.001) {
      outputColor = inputColor;
      return;
    }

    float k = float(KERNEL_SIZE);

    vec3  avgColors[4];
    float variances[4];

    // 4 Sector: 左上・右上・左下・右下
    getSector(uv, vec2(-k, -k), avgColors[0], variances[0]);
    getSector(uv, vec2( 0.0, -k), avgColors[1], variances[1]);
    getSector(uv, vec2(-k,  0.0), avgColors[2], variances[2]);
    getSector(uv, vec2( 0.0,  0.0), avgColors[3], variances[3]);

    // 最も分散の小さい Sector の平均色を採用
    float minVar   = variances[0];
    vec3 paintColor = avgColors[0];

    for (int i = 1; i < 4; i++) {
      if (variances[i] < minVar) {
        minVar     = variances[i];
        paintColor = avgColors[i];
      }
    }

    // strength で元画像と絵画表現を線形補間
    outputColor = vec4(mix(inputColor.rgb, paintColor, uStrength), inputColor.a);
  }
`;

export class KuwaharaEffect extends Effect {
  constructor({ strength = 1.0 }: { strength?: number } = {}) {
    super("KuwaharaEffect", fragmentShader, {
      uniforms: new Map<string, Uniform<unknown>>([
        ["uStrength", new Uniform(strength)],
      ]),
    });
  }

  get strength(): number {
    return (this.uniforms.get("uStrength") as Uniform<number>).value;
  }

  set strength(value: number) {
    (this.uniforms.get("uStrength") as Uniform<number>).value = value;
  }
}
