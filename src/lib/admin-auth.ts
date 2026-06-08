import { auth } from "@/auth";
import { redirect } from "next/navigation";

// セッションが許可ログイン本人かどうか
export async function isOwner(): Promise<boolean> {
  const session = await auth();
  const login = (session as { login?: string } | null)?.login;
  return Boolean(
    session && login && login === process.env.ALLOWED_GITHUB_LOGIN
  );
}

// ページ/サーバーアクション用：本人でなければ /admin/login へ（真の境界）
export async function requireOwner() {
  if (!(await isOwner())) {
    redirect("/admin/login");
  }
}

// API ルート用：本人なら true。呼び出し側で 401 を返す。
export async function requireOwnerApi(): Promise<boolean> {
  return isOwner();
}
