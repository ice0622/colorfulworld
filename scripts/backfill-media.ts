/**
 * 既存記事が参照している Vercel Blob 画像を media テーブル（画像ライブラリ）へ一度だけ登録する。
 *
 * - 対象: posts.body_md / cover_image に含まれる *.public.blob.vercel-storage.com の URL のみ
 *   （ローカル /images/... は今回対象外）
 * - 寸法/blur は既存の src/lib/image-manifest.json から流用し、無ければ fetch + sharp で算出
 * - 既に media にある URL はスキップ（冪等・ON CONFLICT DO NOTHING）
 *
 * Usage: npm run backfill:media
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

const MANIFEST_PATH = path.join(process.cwd(), "src/lib/image-manifest.json");
const BLOB_HOST_RE = /\.public\.blob\.vercel-storage\.com$/;

type ImageMeta = { w: number; h: number; blur: string } | { unoptimized: true };
type Manifest = Record<string, ImageMeta>;

function extractImgSrcs(html: string): string[] {
  const urls: string[] = [];
  const re = /<img[^>]+src=["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[1]) urls.push(m[1]);
  }
  return urls;
}

function isBlobUrl(src: string): boolean {
  try {
    return BLOB_HOST_RE.test(new URL(src).host);
  } catch {
    return false;
  }
}

async function computeMetaFromFetch(
  src: string
): Promise<{ width: number | null; height: number | null; blur: string | null }> {
  try {
    const res = await fetch(src);
    if (!res.ok) return { width: null, height: null, blur: null };
    const buf = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(buf).rotate().metadata();
    if (!meta.width || !meta.height) return { width: null, height: null, blur: null };
    const blurBuf = await sharp(buf)
      .rotate()
      .resize(20, null, { fit: "inside" })
      .webp({ quality: 40 })
      .toBuffer();
    return {
      width: meta.width,
      height: meta.height,
      blur: `data:image/webp;base64,${blurBuf.toString("base64")}`,
    };
  } catch {
    return { width: null, height: null, blur: null };
  }
}

async function main() {
  const sql = neon(url!);

  // 参照されている Blob URL を収集
  const rows = (await sql`SELECT body_md, cover_image FROM posts`) as Array<{
    body_md: string | null;
    cover_image: string | null;
  }>;
  const urlSet = new Set<string>();
  for (const r of rows) {
    const html = await markdownToHtml(r.body_md ?? "");
    for (const u of extractImgSrcs(html)) if (isBlobUrl(u)) urlSet.add(u);
    const c = r.cover_image ?? "";
    if (c && isBlobUrl(c)) urlSet.add(c);
  }

  // 既に登録済みの URL を除外
  const existingRows = (await sql`SELECT url FROM media`) as Array<{ url: string }>;
  const existing = new Set(existingRows.map((r) => r.url));
  const todo = [...urlSet].filter((u) => !existing.has(u));

  // マニフェストから寸法/blur を流用
  let manifest: Manifest = {};
  if (fs.existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8")) as Manifest;
  }

  console.log(
    `Blob画像: 参照${urlSet.size}件 / 登録済み${existing.size}件 / 新規${todo.length}件`
  );

  let ok = 0;
  let fetched = 0;
  for (const src of todo) {
    let width: number | null = null;
    let height: number | null = null;
    let blur: string | null = null;

    const meta = manifest[src];
    if (meta && !("unoptimized" in meta)) {
      width = meta.w;
      height = meta.h;
      blur = meta.blur;
    } else if (!meta) {
      // マニフェスト未収録 → fetch + sharp
      const computed = await computeMetaFromFetch(src);
      width = computed.width;
      height = computed.height;
      blur = computed.blur;
      fetched++;
    }
    // meta が unoptimized の場合は全て null のまま（decode 不可）

    const pathname = (() => {
      try {
        return new URL(src).pathname.replace(/^\//, "");
      } catch {
        return null;
      }
    })();
    const filename = pathname ? pathname.split("/").pop() ?? null : null;

    await sql`
      INSERT INTO media (url, pathname, filename, width, height, blur, source)
      VALUES (${src}, ${pathname}, ${filename}, ${width}, ${height}, ${blur}, 'blob')
      ON CONFLICT (url) DO NOTHING
    `;
    ok++;
  }

  console.log(`✓ 完了: ${ok}件 登録（うち fetch+sharp ${fetched}件）`);
}

main().catch((e) => {
  console.error("✗ バックフィルに失敗しました:", e);
  process.exit(1);
});
