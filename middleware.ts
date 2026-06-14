// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // --- Supabase session refresh ---
  // Collect cookies Supabase wants to set, then apply them to whichever
  // response we ultimately return (next or rewrite).
  const pendingCookies: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options: options ?? {} });
          });
        },
      },
    },
  );

  // getUser() refreshes the access token if it is near expiry.
  // Return value is intentionally ignored here — auth decisions happen in layouts.
  await supabase.auth.getUser();

  // --- Hostname rewrite for recoverwell.calebbeng.com ---
  const hostname = request.headers.get("host") ?? "";
  const isRecoverWell =
    hostname === "recoverwell.calebbeng.com" ||
    hostname.startsWith("recoverwell.calebbeng.com:");

  let response: NextResponse;

  if (!isRecoverWell) {
    response = NextResponse.next({ request });
  } else {
    const { pathname, search } = request.nextUrl;

    if (pathname.startsWith("/recoverwell")) {
      response = NextResponse.next({ request });
    } else {
      const rewritten = new URL(
        `/recoverwell${pathname === "/" ? "" : pathname}${search}`,
        request.url,
      );
      response = NextResponse.rewrite(rewritten);
    }
  }

  // Apply any auth cookies to the final response
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
