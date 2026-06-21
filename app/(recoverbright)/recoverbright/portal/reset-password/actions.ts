"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/recoverbright/password";

export async function resetPasswordAction(formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    redirect(
      `/recoverbright/portal/reset-password?error=${encodeURIComponent("Both fields are required.")}`
    );
  }

  if (password !== confirmPassword) {
    redirect(
      `/recoverbright/portal/reset-password?error=${encodeURIComponent("Passwords do not match.")}`
    );
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    redirect(
      `/recoverbright/portal/reset-password?error=${encodeURIComponent(passwordError)}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      `/recoverbright/portal/reset-password?error=${encodeURIComponent("Failed to update password. The link may have expired — try requesting a new one.")}`
    );
  }

  redirect("/recoverbright/portal/reset-password?success=1");
}
