"use server";

import { revalidatePath } from "next/cache";
import { requireDoctor } from "@/lib/recoverbright/auth";
import { createClient } from "@/lib/supabase/server";

export async function dismissOnboarding() {
  const doctor = await requireDoctor();
  const supabase = await createClient();
  await supabase
    .from("rw_doctors")
    .update({ onboarding_dismissed: true })
    .eq("id", doctor.id);
  revalidatePath("/recoverbright/portal");
}
