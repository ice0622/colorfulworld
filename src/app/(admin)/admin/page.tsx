import { requireOwner } from "@/lib/admin-auth";
import { hasDb } from "@/db/client";
import { listAllPosts } from "@/lib/admin/repo";
import { AdminNav } from "@/components/admin/AdminNav";
import { PostListTable } from "@/components/admin/PostListTable";

export const dynamic = "force-dynamic";

export default async function AdminListPage() {
  await requireOwner();

  if (!hasDb) {
    return (
      <div>
        <AdminNav />
        <p className="py-12 text-center text-sm text-muted-foreground">
          DATABASE_URL が未設定です。.env.local に設定してください。
        </p>
      </div>
    );
  }

  const items = await listAllPosts();
  return (
    <div>
      <AdminNav />
      <PostListTable items={items} />
    </div>
  );
}
