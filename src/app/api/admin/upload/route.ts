import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireOwnerApi } from "@/lib/admin-auth";

const MAX_BYTES = 15 * 1024 * 1024; // 15MB

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

  const blob = await put(key, file, {
    access: "public",
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url });
}
