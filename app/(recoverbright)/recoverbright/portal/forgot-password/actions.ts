"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function forgotPasswordAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    redirect(
      `/recoverbright/portal/forgot-password?error=${encodeURIComponent("Email is required.")}`
    );
  }

  const headersList = await headers();
  const origin = headersList.get("origin") || "https://recoverbright.com";
  const isRecoverBright = origin.includes("recoverbright.com");
  const callbackPath = isRecoverBright
    ? "/auth/callback"
    : "/recoverbright/auth/callback";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}${callbackPath}?next=/recoverbright/portal/reset-password`,
  });

  if (error) {
    redirect(
      `/recoverbright/portal/forgot-password?error=${encodeURIComponent("Something went wrong. Please try again.")}`
    );
  }

  redirect("/recoverbright/portal/forgot-password?success=1");
}
