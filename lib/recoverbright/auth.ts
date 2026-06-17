// lib/recoverbright/auth.ts
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = ["calebeng21@gmail.com"];

export const requireAdmin = cache(async (): Promise<void> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    redirect("/recoverbright/portal/login");
  }
});

export type DoctorWithPractice = {
  id: string;
  name: string;
  auth_user_id: string;
  practice_id: string;
  created_at: string;
  practice: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    contact_email: string | null;
  };
};

export const requireDoctor = cache(async (): Promise<DoctorWithPractice> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/recoverbright/portal/login");

  const { data: doctor, error } = await supabase
    .from("rw_doctors")
    .select("*, practice:rw_practices(*)")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !doctor) redirect("/recoverbright/portal/login");

  // Supabase nested selects type the joined record as an array; cast safely.
  const raw = doctor as unknown as Omit<DoctorWithPractice, "practice"> & {
    practice: DoctorWithPractice["practice"] | DoctorWithPractice["practice"][];
  };

  const practice = Array.isArray(raw.practice) ? raw.practice[0] : raw.practice;
  if (!practice) redirect("/recoverbright/portal/login");

  return { ...raw, practice } as DoctorWithPractice;
});
