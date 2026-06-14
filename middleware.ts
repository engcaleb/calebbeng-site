import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const isRecoverWell =
    hostname === "recoverwell.calebbeng.com" ||
    hostname.startsWith("recoverwell.calebbeng.com:");

  if (!isRecoverWell) return NextResponse.next();

  const { pathname, search } = request.nextUrl;

  // Already prefixed — avoid double-rewrite on internal Next.js requests
  if (pathname.startsWith("/recoverwell")) return NextResponse.next();

  const rewritten = new URL(
    `/recoverwell${pathname === "/" ? "" : pathname}${search}`,
    request.url
  );

  return NextResponse.rewrite(rewritten);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
