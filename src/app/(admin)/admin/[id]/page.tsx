import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/admin-auth";
import { getAdminPost } from "@/lib/admin/repo";
import { AdminNav } from "@/components/admin/AdminNav";
import { PostEditor } from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOwner();
  const { id } = await params;
  const post = await getAdminPost(id);
  if (!post) notFound();

  return (
    <div>
      <AdminNav />
      <PostEditor initial={post} />
    </div>
  );
}
