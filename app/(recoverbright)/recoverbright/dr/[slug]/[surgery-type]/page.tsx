import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { urlToSurgeryType, surgeryTypeToUrlSegment } from "@/lib/recoverbright/pages";

type Params = Promise<{ slug: string; "surgery-type": string }>;

export default async function LegacyPatientPage({ params }: { params: Params }) {
  const { slug, "surgery-type": surgerySegment } = await params;
  const supabase = await createClient();
  const surgeryType = urlToSurgeryType(surgerySegment);

  const { data: practice } = await supabase
    .from("rw_practices")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!practice) notFound();

  const { data: doctors } = await supabase
    .from("rw_doctors")
    .select("id, slug")
    .eq("practice_id", practice.id);
  if (!doctors?.length) notFound();

  const doctorIds = doctors.map((d) => d.id);

  const { data: page } = await supabase
    .from("rw_recommendation_pages")
    .select("doctor_id")
    .in("doctor_id", doctorIds)
    .eq("surgery_type", surgeryType)
    .eq("is_published", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  if (!page) notFound();

  const doctor = doctors.find((d) => d.id === page.doctor_id)!;
  redirect(`/recoverbright/dr/${slug}/${doctor.slug}/${surgeryTypeToUrlSegment(surgeryType)}`);
}
