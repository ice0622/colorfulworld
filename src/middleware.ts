import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Auth.js のラッパで req.auth（セッション有無）を取得しつつ、
// 既存の noindex ロジックと管理画面ガードをマージする。
export default auth((req) => {
  const hostname = req.headers.get("host") ?? "";
  const path = req.nextUrl.pathname;
  const isAdmin = path.startsWith("/admin");
  const isLogin = path === "/admin/login";

  // 管理画面はログイン必須（未ログインは /admin/login へ）
  if (isAdmin && !isLogin && !req.auth) {
    return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
  }

  const response = NextResponse.next();
  // vercel.app ドメインと /admin 配下は noindex
  if (hostname.endsWith(".vercel.app") || isAdmin) {
    response.headers.set("X-Robots-Tag", "noindex");
  }
  return response;
});

export const config = {
  // _next/static, _next/image, favicon などは除外
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
