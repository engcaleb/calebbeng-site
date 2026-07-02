"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/recoverbright/rate-limit";

export async function loginAction(formData: FormData) {
  const allowed = await checkRateLimit("login", 10, 15 * 60);
  if (!allowed) {
    redirect("/recoverbright/portal/login?error=rate_limited");
  }

  const supabase = await createClient();
  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/recoverbright/portal/login?error=invalid_credentials");
  }

  redirect("/recoverbright/portal");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/recoverbright/portal/login");
}
