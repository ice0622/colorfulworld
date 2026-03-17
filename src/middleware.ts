import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";

  // vercel.app ドメインからのアクセスには noindex を付与
  if (hostname.endsWith(".vercel.app")) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // _next/static, _next/image, favicon などは除外
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
