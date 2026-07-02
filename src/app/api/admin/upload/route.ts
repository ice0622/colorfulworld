import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireOwnerApi } from "@/lib/admin-auth";
import { insertMedia } from "@/lib/admin/media-repo";

const MAX_BYTES = 15 * 1024 * 1024; // 15MB

// アップロードされたバッファから寸法と blur を算出する。
// decode 不能（拡張子詐称の AVIF 等）なら全て null を返し、アップロード自体は成功させる（無回帰）。
async function computeMeta(
  buf: Buffer
): Promise<{ width: number | null; height: number | null; blur: string | null }> {
  try {
    // EXIF orientation を正規化してから実寸を採る（回転画像の CLS 対策）
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

export async function POST(req: Request) {
  if (!(await requireOwnerApi())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file がありません" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "画像ファイルのみ対応" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "ファイルが大きすぎます（15MBまで）" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const key = `posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // sharp でメタを採るためバッファを一度だけ読む（put もこのバッファを使う）
  const buf = Buffer.from(await file.arrayBuffer());

  const blob = await put(key, buf, {
    access: "public",
    contentType: file.type,
  });

  const { width, height, blur } = await computeMeta(buf);

  // ライブラリ（再利用）に登録。DB 書き込み失敗でアップロード自体を落とさない。
  try {
    await insertMedia({
      url: blob.url,
      pathname: key,
      filename: file.name,
      mime: file.type,
      size: buf.length,
      width,
      height,
      blur,
      source: "blob",
    });
  } catch (e) {
    console.error("media insert failed", e);
  }

  return NextResponse.json({ url: blob.url, width, height, blur });
}
