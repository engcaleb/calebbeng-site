"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { validatePassword } from "@/lib/recoverwell/password";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function errorRedirect(message: string): never {
  redirect(
    `/recoverwell/portal/register?error=${encodeURIComponent(message)}`
  );
}

export async function registerAction(formData: FormData) {
  const practiceName = (formData.get("practiceName") as string)?.trim();
  const doctorName = (formData.get("doctorName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!practiceName || !doctorName || !email || !password || !confirmPassword) {
    errorRedirect("All fields are required.");
  }

  if (password !== confirmPassword) {
    errorRedirect("Passwords do not match.");
  }

  const passwordError = validatePassword(password);
  if (passwordError) errorRedirect(passwordError);

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    const msg = authError.message.toLowerCase().includes("already registered")
      ? "An account with that email already exists."
      : authError.message;
    errorRedirect(msg);
  }

  if (!authData.user) {
    errorRedirect(
      "Account created — check your email to confirm before signing in."
    );
  }

  // Use service role so RLS doesn't block practice/doctor inserts
  const service = createServiceClient();

  // Generate unique slug
  const baseSlug = slugify(practiceName) || "practice";
  let slug = baseSlug;
  let suffix = 2;
  while (true) {
    const { data: existing } = await service
      .from("rw_practices")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  const { data: practice, error: practiceError } = await service
    .from("rw_practices")
    .insert({ name: practiceName, slug, contact_email: email })
    .select("id")
    .single();

  if (practiceError || !practice) {
    errorRedirect("Failed to set up your practice. Please try again.");
  }

  const { error: doctorError } = await service.from("rw_doctors").insert({
    practice_id: practice.id,
    name: doctorName,
    auth_user_id: authData.user.id,
  });

  if (doctorError) {
    errorRedirect("Failed to set up your account. Please try again.");
  }

  redirect("/recoverwell/portal");
}
