"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/admin-auth";
import { softDeleteMedia } from "@/lib/admin/media-repo";

// ライブラリからのソフト削除（非表示化のみ。Blob 実体と URL は残す）。
export async function softDeleteMediaAction(id: string): Promise<{ ok: boolean }> {
  await requireOwner();
  await softDeleteMedia(id);
  revalidatePath("/admin/images");
  return { ok: true };
}
