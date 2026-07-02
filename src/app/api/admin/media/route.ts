import { NextResponse } from "next/server";
import { requireOwnerApi } from "@/lib/admin-auth";
import { listMedia } from "@/lib/admin/media-repo";

// 画像ライブラリの一覧取得。エディタ内ピッカーと一覧ページの「もっと読む」から使う。
export async function GET(req: Request) {
  if (!(await requireOwnerApi())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const before = searchParams.get("before") || undefined;
  const limitRaw = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 60;

  const items = await listMedia({ limit, before });
  return NextResponse.json({ items });
}
