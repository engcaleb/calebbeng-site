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
  const pendingHeaders: Record<string, string> = {};

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options: options ?? {} });
          });
          if (headers) Object.assign(pendingHeaders, headers);
        },
      },
    },
  );

  // getUser() refreshes the access token if it is near expiry.
  const { data: { user } } = await supabase.auth.getUser();

  const ANALYTICS_EXCLUDE_EMAILS = [
    "calebeng21@gmail.com",
    "doctor@prestige.test",
  ];
  const shouldExclude = user?.email
    ? ANALYTICS_EXCLUDE_EMAILS.includes(user.email)
    : false;

  // --- Hostname rewrite for recoverbright.com ---
  const hostname = request.headers.get("host") ?? "";
  const isRecoverBright =
    hostname === "recoverbright.com" ||
    hostname.startsWith("recoverbright.com:") ||
    hostname === "www.recoverbright.com" ||
    hostname.startsWith("www.recoverbright.com:");

  let response: NextResponse;

  if (!isRecoverBright) {
    response = NextResponse.next({ request });
  } else {
    const { pathname, search } = request.nextUrl;

    if (pathname.startsWith("/recoverbright")) {
      response = NextResponse.next({ request });
    } else {
      const rewritten = new URL(
        `/recoverbright${pathname === "/" ? "" : pathname}${search}`,
        request.url,
      );
      response = NextResponse.rewrite(rewritten);
    }
  }

  // Set analytics exclusion cookie
  if (shouldExclude) {
    response.cookies.set("rb_no_track", "1", { path: "/", httpOnly: false });
  } else if (request.cookies.get("rb_no_track")) {
    response.cookies.delete("rb_no_track");
  }

  // Apply any auth cookies and cache-control headers to the final response
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });
  Object.entries(pendingHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
