import { requireDoctor } from "@/lib/recoverbright/auth";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings — Portal" };

export default async function SettingsPage() {
  const doctor = await requireDoctor();
  return (
    <main className="min-h-screen bg-[#f9f7f4] p-8">
      <div className="mx-auto max-w-xl">
        <SettingsForm doctor={doctor} />
      </div>
    </main>
  );
}
