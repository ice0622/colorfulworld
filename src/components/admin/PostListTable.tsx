"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  publishPost,
  unpublishPost,
  deletePostAction,
} from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import { Check, Pencil } from "lucide-react";
import type { AdminListItem } from "@/lib/admin/repo";

const CATEGORY_LABEL: Record<string, string> = {
  trip: "旅",
  tech: "技術",
  daily: "日常",
};

export function PostListTable({ items }: { items: AdminListItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    try {
      await fn();
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        記事がありません。「新規」から作成してください。
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {items.map((p) => (
        <li key={p.id} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/${p.id}`}
                className="truncate font-medium hover:underline"
              >
                {p.title || "(無題)"}
              </Link>
              {p.draft ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  <Pencil className="h-3 w-3" />
                  下書き
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground/10 px-2 py-0.5 text-[11px] text-foreground">
                  <Check className="h-3 w-3" />
                  公開
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {CATEGORY_LABEL[p.category] ?? p.category}
              {p.publishedAt ? ` ・ ${p.publishedAt.slice(0, 10)}` : ""}
              {p.tags.length ? ` ・ ${p.tags.join(", ")}` : ""}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {p.draft ? (
              <Button
                size="sm"
                variant="outline"
                disabled={busy === p.id}
                onClick={() => run(p.id, () => publishPost(p.id))}
              >
                公開
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={busy === p.id}
                onClick={() => run(p.id, () => unpublishPost(p.id))}
              >
                非公開
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              disabled={busy === p.id}
              onClick={() => {
                if (confirm(`「${p.title}」を削除しますか？`)) {
                  run(p.id, () => deletePostAction(p.id));
                }
              }}
            >
              削除
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
