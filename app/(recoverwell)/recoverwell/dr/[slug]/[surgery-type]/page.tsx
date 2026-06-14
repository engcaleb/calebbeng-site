export default async function DoctorRecommendationPage({
  params,
}: {
  params: Promise<{ slug: string; "surgery-type": string }>;
}) {
  const { slug, "surgery-type": surgeryType } = await params;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f9f7f4]">
      <p className="font-mono text-sm text-[#1c1a17]/40">
        Dr. {slug} — {surgeryType}
      </p>
    </main>
  );
}
