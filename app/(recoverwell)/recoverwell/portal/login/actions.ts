"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/recoverwell/portal/login?error=invalid_credentials");
  }

  redirect("/recoverwell/portal");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/recoverwell/portal/login");
}
