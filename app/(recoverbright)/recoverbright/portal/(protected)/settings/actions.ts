"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireDoctor } from "@/lib/recoverbright/auth";
import { createServiceClient } from "@/lib/supabase/service";

export async function saveSettings(formData: FormData) {
  const doctor = await requireDoctor();
  const supabase = createServiceClient();

  const [practiceResult, doctorResult] = await Promise.all([
    supabase
      .from("rw_practices")
      .update({
        name: (formData.get("practice_name")?.toString() ?? "").trim(),
        contact_email:
          (formData.get("contact_email")?.toString() ?? "").trim() || null,
        logo_url: (formData.get("logo_url")?.toString() ?? "").trim() || null,
      })
      .eq("id", doctor.practice.id),
    supabase
      .from("rw_doctors")
      .update({ name: (formData.get("doctor_name")?.toString() ?? "").trim() })
      .eq("id", doctor.id),
  ]);

  if (practiceResult.error) throw new Error(practiceResult.error.message);
  if (doctorResult.error) throw new Error(doctorResult.error.message);

  revalidatePath("/recoverbright/portal");
  revalidatePath("/recoverbright/portal/settings");
}

export async function createInviteLink(practiceId: string): Promise<string> {
  const doctor = await requireDoctor();
  if (doctor.practice_id !== practiceId) throw new Error("Unauthorized");

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("rw_invites")
    .insert({
      practice_id: practiceId,
      created_by: doctor.id,
    })
    .select("token")
    .single();

  if (error || !data) throw new Error("Failed to create invite");

  const headersList = await headers();
  const origin = headersList.get("origin") || "https://recoverbright.com";
  const isRecoverBright = origin.includes("recoverbright.com");
  const basePath = isRecoverBright ? "" : "/recoverbright";

  return `${origin}${basePath}/portal/join/${data.token}`;
}
