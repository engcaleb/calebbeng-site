import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");

  // Only allow same-site relative paths. `new URL("https://evil.com", base)`
  // resolves to the absolute URL regardless of `base`, so an unvalidated
  // `next` param is an open redirect off a trusted domain (phishing).
  const next =
    requestedNext &&
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//")
      ? requestedNext
      : "/recoverbright/portal";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
