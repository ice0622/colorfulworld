"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { requireOwner } from "@/lib/admin-auth";
import { postFormSchema, type PostFormValues } from "@/lib/admin/post-schema";
import {
  upsertPost,
  setPublished,
  deletePost,
  slugExists,
} from "@/lib/admin/repo";

// 公開側キャッシュの無効化（タグ＋主要パス）
function revalidatePublic(slug?: string) {
  revalidateTag("posts");
  revalidateTag("tags");
  if (slug) revalidateTag(`post:${slug}`);
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/tag");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/rss");
  revalidatePath("/sitemap.xml");
}

type ActionResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string };

// 下書き保存（既存の公開状態は変えない）。新規は draft=true で作成。
export async function saveDraft(values: PostFormValues): Promise<ActionResult> {
  await requireOwner();
  const parsed = postFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "入力エラー" };
  }
  const v = parsed.data;

  if (await slugExists(v.slug, v.id)) {
    return { ok: false, error: `slug "${v.slug}" は既に使われています` };
  }

  const { id, slug } = await upsertPost({
    id: v.id,
    slug: v.slug,
    title: v.title,
    description: v.description,
    bodyMd: v.bodyMd,
    coverImage: v.coverImage ?? null,
    tags: v.tags,
    location: v.location,
    metaTags: v.metaTags,
    publishedAt: v.publishedAt ?? null,
    featured: v.featured,
  });

  revalidatePath("/admin");
  // 既存記事の編集なら公開ページも更新しうるので revalidate
  revalidatePublic(slug);
  return { ok: true, id, slug };
}

export async function publishPost(id: string): Promise<void> {
  await requireOwner();
  const slug = await setPublished(id, true);
  revalidatePath("/admin");
  revalidatePublic(slug);
}

export async function unpublishPost(id: string): Promise<void> {
  await requireOwner();
  const slug = await setPublished(id, false);
  revalidatePath("/admin");
  revalidatePublic(slug);
}

export async function deletePostAction(id: string): Promise<void> {
  await requireOwner();
  const slug = await deletePost(id);
  revalidatePath("/admin");
  revalidatePublic(slug);
}

// 保存して公開（エディタの「公開」ボタン用）
export async function saveAndPublish(
  values: PostFormValues
): Promise<ActionResult> {
  const res = await saveDraft(values);
  if (!res.ok) return res;
  await setPublished(res.id, true);
  revalidatePath("/admin");
  revalidatePublic(res.slug);
  return res;
}

export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/admin" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
