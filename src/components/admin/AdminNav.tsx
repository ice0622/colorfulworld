import Link from "next/link";
import { signOutAction } from "@/app/(admin)/admin/actions";

export function AdminNav() {
  return (
    <nav className="mb-6 flex items-center justify-between border-b border-border/60 py-3">
      <div className="flex items-center gap-4 text-sm">
        <Link href="/admin" className="font-semibold">
          管理
        </Link>
        <Link
          href="/admin/new"
          className="text-muted-foreground hover:text-foreground"
        >
          新規
        </Link>
        <Link
          href="/"
          target="_blank"
          className="text-muted-foreground hover:text-foreground"
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
