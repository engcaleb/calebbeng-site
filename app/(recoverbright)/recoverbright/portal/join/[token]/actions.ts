"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { validatePassword } from "@/lib/recoverbright/password";
import { notifyNewSignup } from "@/lib/recoverbright/email";

function slugify(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function errorRedirect(token: string, message: string): never {
  redirect(
    `/recoverbright/portal/join/${token}?error=${encodeURIComponent(message)}`
  );
}

export async function joinAction(formData: FormData) {
  const token = formData.get("token") as string;
  const doctorName = (formData.get("doctorName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token || !doctorName || !email || !password || !confirmPassword) {
    errorRedirect(token, "All fields are required.");
  }

  if (password !== confirmPassword) {
    errorRedirect(token, "Passwords do not match.");
  }

  const passwordError = validatePassword(password);
  if (passwordError) errorRedirect(token, passwordError);

  const service = createServiceClient();

  // Validate invite
  const { data: invite, error: inviteError } = await service
    .from("rw_invites")
    .select("id, practice_id, expires_at, rw_practices(name)")
    .eq("token", token)
    .single();

  if (inviteError || !invite) {
    errorRedirect(token, "Invalid invite link.");
  }

  if (new Date(invite.expires_at) < new Date()) {
    errorRedirect(token, "This invite link has expired. Ask your colleague for a new one.");
  }

  // Create user
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    const msg = authError.message.toLowerCase().includes("already been registered")
      ? "An account with that email already exists."
      : authError.message;
    errorRedirect(token, msg);
  }

  if (!authData.user) {
    errorRedirect(token, "Failed to create account. Please try again.");
  }

  // Generate unique doctor slug
  const baseSlug = slugify(doctorName) || "doctor";
  let doctorSlug = baseSlug;
  let suffix = 2;
  while (true) {
    const { data: existing } = await service
      .from("rw_doctors")
      .select("id")
      .eq("slug", doctorSlug)
      .maybeSingle();
    if (!existing) break;
    doctorSlug = `${baseSlug}-${suffix++}`;
  }

  // Add doctor to the existing practice
  const { error: doctorError } = await service.from("rw_doctors").insert({
    practice_id: invite.practice_id,
    name: doctorName,
    slug: doctorSlug,
    auth_user_id: authData.user.id,
  });

  if (doctorError) {
    errorRedirect(token, "Failed to set up your account. Please try again.");
  }

  const practiceRaw = invite.rw_practices as unknown;
  const practice = (Array.isArray(practiceRaw) ? practiceRaw[0] : practiceRaw) as { name: string } | null;
  notifyNewSignup({
    practiceName: practice?.name ?? "Unknown practice",
    doctorName,
    email,
  });

  // Sign in
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    redirect("/recoverbright/portal/login");
  }

  redirect("/recoverbright/portal");
}
