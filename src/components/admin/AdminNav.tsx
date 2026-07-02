"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/(admin)/admin/actions";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname() ?? "";
  const isList = pathname === "/admin";
  const isNew = pathname === "/admin/new";
  const isImages = pathname === "/admin/images";
  const isEdit =
    pathname.startsWith("/admin/") &&
    !isNew &&
    !isImages &&
    pathname !== "/admin/login";

  const linkCls = (active: boolean) =>
    cn(
      "rounded-md px-2.5 py-1 text-sm transition-colors",
      active
        ? "bg-muted font-medium text-foreground"
        : "text-muted-foreground hover:text-foreground"
    );

  return (
    <nav className="mb-6 flex items-center justify-between border-b border-border/60 py-3">
      <div className="flex items-center gap-1">
        <Link href="/admin" className={linkCls(isList)}>
          記事一覧
        </Link>
        <Link href="/admin/new" className={linkCls(isNew)}>
          新規
        </Link>
        <Link href="/admin/images" className={linkCls(isImages)}>
          画像
        </Link>
        {/* 編集中は現在地を明示（リンクではなくラベル） */}
        {isEdit && (
          <span className="rounded-md bg-muted px-2.5 py-1 text-sm font-medium text-foreground">
            編集中
          </span>
        )}
        <Link
          href="/"
          target="_blank"
          className="rounded-md px-2.5 py-1 text-sm text-muted-foreground hover:text-foreground"
        >
          サイトを見る ↗
        </Link>
      </div>
      <form action={signOutAction}>
        <button className="text-sm text-muted-foreground hover:text-foreground">
          ログアウト
        </button>
      </form>
    </nav>
  );
}
