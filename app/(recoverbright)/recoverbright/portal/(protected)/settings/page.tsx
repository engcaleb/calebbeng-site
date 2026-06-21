import { requireDoctor } from "@/lib/recoverbright/auth";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";
import { TeamSection } from "./TeamSection";

export const metadata = { title: "Settings — Portal" };

export default async function SettingsPage() {
  const doctor = await requireDoctor();
  const supabase = await createClient();

  const { data: teammates } = await supabase
    .from("rw_doctors")
    .select("id, name, slug")
    .eq("practice_id", doctor.practice_id)
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-[#f9f7f4] p-8">
      <div className="mx-auto max-w-xl">
        <SettingsForm doctor={doctor} />
        <div className="mt-10">
          <TeamSection
            teammates={teammates ?? []}
            currentDoctorId={doctor.id}
            practiceId={doctor.practice_id}
          />
        </div>
      </div>
    </main>
  );
}
