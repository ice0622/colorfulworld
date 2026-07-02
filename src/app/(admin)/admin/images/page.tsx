import { requireOwner } from "@/lib/admin-auth";
import { hasDb } from "@/db/client";
import { listMedia } from "@/lib/admin/media-repo";
import { AdminNav } from "@/components/admin/AdminNav";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export const dynamic = "force-dynamic";

export default async function AdminImagesPage() {
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

  const items = await listMedia({ limit: 60 });
  return (
    <div>
      <AdminNav />
      <MediaLibrary initial={items} />
    </div>
  );
}
