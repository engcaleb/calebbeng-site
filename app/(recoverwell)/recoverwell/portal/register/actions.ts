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

  const service = createServiceClient();

  // Create user via admin API — auto-confirms without sending any email,
  // bypassing Supabase's email confirmation rate limit entirely.
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    const msg = authError.message.toLowerCase().includes("already been registered")
      ? "An account with that email already exists."
      : authError.message;
    errorRedirect(msg);
  }

  if (!authData.user) {
    errorRedirect("Failed to create account. Please try again.");
  }

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

  // Sign the new user in — admin.createUser doesn't set a session cookie
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // Account created successfully — just couldn't auto-sign in
    redirect("/recoverwell/portal/login");
  }

  redirect("/recoverwell/portal");
}
