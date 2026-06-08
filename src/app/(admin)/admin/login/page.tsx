import { redirect } from "next/navigation";
import { Github } from "lucide-react";
import { isOwner } from "@/lib/admin-auth";
import { signInWithGitHub } from "../actions";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isOwner()) redirect("/admin");

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6">
      <h1 className="text-lg font-semibold">管理画面ログイン</h1>
      <form action={signInWithGitHub}>
        <button className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
          <Github className="h-4 w-4" />
          GitHub でログイン
        </button>
      </form>
      <p className="text-xs text-muted-foreground">
        許可されたアカウントのみログインできます
      </p>
    </div>
  );
}
