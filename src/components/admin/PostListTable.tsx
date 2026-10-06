"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AdminListItem } from "@/lib/admin/repo";
import { PostStatusBadge } from "./PostStatusBadge";
import { PostActionsMenu } from "./PostActionsMenu";

const CATEGORY_LABEL: Record<string, string> = {
  trip: "旅",
  tech: "技術",
  daily: "日常",
};

type Filter = "all" | "published" | "draft";

export function PostListTable({ items }: { items: AdminListItem[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        記事がありません。「新規」から作成してください。
      </p>
    );
  }

  const counts = {
    all: items.length,
    published: items.filter((p) => !p.draft).length,
    draft: items.filter((p) => p.draft).length,
  };
  const visible = items.filter((p) =>
    filter === "all" ? true : filter === "draft" ? p.draft : !p.draft
  );
  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "published", label: "公開中" },
    { key: "draft", label: "下書き" },
  ];

  return (
    <div>
      {/* 状態で絞り込み（件数つき） */}
      <div className="mb-2 flex gap-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={filter === t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              "rounded-md px-2.5 py-1 text-sm transition-colors",
              filter === t.key
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            <span className="ml-1.5 tabular-nums opacity-60">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <ul className="divide-y divide-border/60">
        {visible.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-3">
            {/* 状態は行の左端に幅を揃えて置き、縦に目で追えるようにする */}
            <div className="w-[4.25rem] shrink-0">
              <PostStatusBadge draft={p.draft} />
            </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/${p.id}`}
                className="block truncate font-medium hover:underline"
              >
                {p.title || "(無題)"}
              </Link>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {CATEGORY_LABEL[p.category] ?? p.category}
                {p.publishedAt ? ` ・ ${p.publishedAt.slice(0, 10)}` : ""}
                {p.tags.length ? ` ・ ${p.tags.join(", ")}` : ""}
              </div>
            </div>

            <PostActionsMenu
              post={p}
              showEdit
              showPublish
              onDone={() => router.refresh()}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
