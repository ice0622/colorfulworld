import { NextResponse } from "next/server";
import { requireOwnerApi } from "@/lib/admin-auth";
import { markdownToHtml } from "@/lib/postParse";

// 本文 markdown を本番と同一パイプラインで HTML 化（プレビュー parity 用）
export async function POST(req: Request) {
  if (!(await requireOwnerApi())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { body } = (await req.json()) as { body?: string };
  const html = await markdownToHtml(String(body ?? ""));
  return NextResponse.json({ html });
}
