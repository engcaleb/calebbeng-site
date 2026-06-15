// app/(recoverwell)/recoverwell/portal/(protected)/page.tsx
import { requireDoctor } from "@/lib/recoverwell/auth";
import { logoutAction } from "../login/actions";

export default async function PortalPage() {
  const doctor = await requireDoctor();

  return (
    <main className="min-h-screen bg-[#f9f7f4] p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-mono text-2xl font-semibold text-[#1c1a17]">
              Welcome, {doctor.name}
            </h1>
            <p className="mt-1 font-mono text-sm text-[#1c1a17]/50">
              {doctor.practice.name}
            </p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="btn-ghost">
              Sign out
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-[#e8e3da] bg-white p-6">
          <p className="font-mono text-sm text-[#1c1a17]/50">
            Your recommendation pages will appear here.
          </p>
        </div>
      </div>
    </main>
  );
}
