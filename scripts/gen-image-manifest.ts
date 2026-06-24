/**
 * 本文画像の最適化用マニフェストを生成する。
 *
 * DB(posts.body_md / cover_image) から参照されている全画像URLを集め、
 * 各画像の実寸(width/height)と極小blurプレースホルダ(data URL)を sharp で算出し、
 * src/lib/image-manifest.json に { URL: {w,h,blur} } として書き出す。
 *
 * BlogPostContent はこのマニフェストを引いて next/image に width/height/blurDataURL を渡し、
 * レイアウトシフトなし + blur→鮮明 の読み込み体験を実現する。
 *
 * - ローカル画像(/images/...): public 配下のファイルを読む
 * - Vercel Blob 等(http/https): fetch して取得
 * - 既存マニフェストにあるURLは再計算しない（冪等・Blobの再fetch回避）
 *
 * Usage: npm run gen:image-manifest
 * 前提: .env.local もしくは .env に DATABASE_URL が設定されていること。
 */
import fs from "fs";
import path from "path";
import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";
import sharp from "sharp";
import { markdownToHtml } from "../src/lib/postParse";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✗ DATABASE_URL が未設定です。.env.local に設定してください。");
  process.exit(1);
}

const PUBLIC_DIR = path.join(process.cwd(), "public");
const OUT_PATH = path.join(process.cwd(), "src/lib/image-manifest.json");

// w/h/blur を持つ通常エントリ、または decode 不可で最適化を回避するエントリ。
type ImageMeta = { w: number; h: number; blur: string } | { unoptimized: true };
type Manifest = Record<string, ImageMeta>;

/**
 * レンダリング後のHTMLから <img src> を抽出する。
 * ブラウザが実際に持つ src（remark によるURLエンコード後の値）と一致させるため、
 * 生 markdown ではなく markdownToHtml の出力から抜く。
 */
function extractImgSrcs(html: string): string[] {
  const urls: string[] = [];
  const re = /<img[^>]+src=["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[1]) urls.push(m[1]);
  }
  return urls;
}

/** URL から画像バイト列を取得する。ローカルは public 配下、http(s) は fetch。 */
async function loadBytes(src: string): Promise<Buffer | null> {
  if (src.startsWith("/")) {
    const filePath = path.join(PUBLIC_DIR, decodeURIComponent(src));
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ ローカルファイルが見つかりません: ${src}`);
      return null;
    }
    return fs.readFileSync(filePath);
  }
  if (src.startsWith("http://") || src.startsWith("https://")) {
    const res = await fetch(src);
    if (!res.ok) {
      console.warn(`  ⚠ fetch 失敗 (${res.status}): ${src}`);
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  }
  console.warn(`  ⚠ 未対応のURL形式: ${src}`);
  return null;
}

/**
 * sharp で寸法とblurを算出する。decode できない画像（拡張子詐称のAVIF等）は
 * { unoptimized: true } を返し、コンポーネント側で最適化を回避させる（無回帰）。
 */
async function computeMeta(buf: Buffer): Promise<ImageMeta | null> {
  try {
    // .rotate() で EXIF orientation を正規化してから実寸を採る（回転画像のCLS対策）
    const meta = await sharp(buf).rotate().metadata();
    if (!meta.width || !meta.height) return { unoptimized: true };

    const blurBuf = await sharp(buf)
      .rotate()
      .resize(20, null, { fit: "inside" })
      .webp({ quality: 40 })
      .toBuffer();
    const blur = `data:image/webp;base64,${blurBuf.toString("base64")}`;

    return { w: meta.width, h: meta.height, blur };
  } catch {
    // sharp が decode 不能 → 最適化を回避して素のまま配信させる
    return { unoptimized: true };
  }
}

async function main() {
  const sql = neon(url!);
  const rows = (await sql`SELECT body_md, cover_image FROM posts`) as Array<{
    body_md: string | null;
    cover_image: string | null;
  }>;

  // 参照されている全URLを収集（distinct）。
  // 本文画像はブラウザのsrcと一致させるため markdownToHtml 後の <img src> から抽出。
  const urlSet = new Set<string>();
  for (const r of rows) {
    const html = await markdownToHtml(r.body_md ?? "");
    for (const u of extractImgSrcs(html)) urlSet.add(u);
    const c = r.cover_image ?? "";
    if (c) urlSet.add(c);
  }

  // 既存マニフェストを読み込み（増分処理）
  let manifest: Manifest = {};
  if (fs.existsSync(OUT_PATH)) {
    manifest = JSON.parse(fs.readFileSync(OUT_PATH, "utf-8")) as Manifest;
  }

  const allUrls = [...urlSet];
  const todo = allUrls.filter((u) => !manifest[u]);
  console.log(
    `画像URL: 計${allUrls.length}件 / 新規${todo.length}件（既存${allUrls.length - todo.length}件はスキップ）`
  );

  let ok = 0;
  let failed = 0;
  for (const src of todo) {
    try {
      const buf = await loadBytes(src);
      if (!buf) {
        failed++;
        continue;
      }
      const meta = await computeMeta(buf);
      if (!meta) {
        console.warn(`  ⚠ 寸法取得できず: ${src}`);
        failed++;
        continue;
      }
      manifest[src] = meta;
      ok++;
    } catch (e) {
      console.warn(`  ⚠ 処理失敗: ${src}`, e instanceof Error ? e.message : e);
      failed++;
    }
  }

  // キーをソートして安定した diff にする
  const sorted: Manifest = {};
  for (const k of Object.keys(manifest).sort()) sorted[k] = manifest[k];

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(sorted, null, 2) + "\n", "utf-8");

  console.log(
    `✓ 完了: 新規${ok}件 追加 / 失敗${failed}件 / マニフェスト総数${Object.keys(sorted).length}件`
  );
  console.log(`  → ${path.relative(process.cwd(), OUT_PATH)}`);
}

main().catch((e) => {
  console.error("✗ 生成に失敗しました:", e);
  process.exit(1);
});
