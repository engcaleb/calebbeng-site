"use server";

import { revalidatePath } from "next/cache";
import { requireDoctor } from "@/lib/recoverwell/auth";
import { createServiceClient } from "@/lib/supabase/service";

export async function saveSettings(formData: FormData) {
  const doctor = await requireDoctor();
  const supabase = createServiceClient();

  const [practiceResult, doctorResult] = await Promise.all([
    supabase
      .from("rw_practices")
      .update({
        name: (formData.get("practice_name") as string).trim(),
        contact_email:
          (formData.get("contact_email") as string).trim() || null,
        logo_url: (formData.get("logo_url") as string).trim() || null,
      })
      .eq("id", doctor.practice.id),
    supabase
      .from("rw_doctors")
      .update({ name: (formData.get("doctor_name") as string).trim() })
      .eq("id", doctor.id),
  ]);

  if (practiceResult.error) throw new Error(practiceResult.error.message);
  if (doctorResult.error) throw new Error(doctorResult.error.message);

  revalidatePath("/recoverwell/portal");
  revalidatePath("/recoverwell/portal/settings");
}
