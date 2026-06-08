import { requireOwner } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { PostEditor } from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireOwner();
  return (
    <div>
      <AdminNav />
      <PostEditor />
    </div>
  );
}
