import { requireDoctor } from "@/lib/recoverwell/auth";
import { getMyPages, SURGERY_TYPES } from "@/lib/recoverwell/portal-pages";
import { createPage } from "../actions";
import Link from "next/link";

export const metadata = { title: "New Page — Portal" };

export default async function NewPagePage() {
  const doctor = await requireDoctor();
  const existing = await getMyPages(doctor.id);
  const existingTypes = new Set(existing.map((p) => p.surgery_type));
  const available = SURGERY_TYPES.filter((t) => !existingTypes.has(t));

  return (
    <main className="min-h-screen bg-[#f9f7f4] p-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <Link
            href="/recoverwell/portal"
            className="font-mono text-[12px] text-[#1c1a17]/40 hover:text-[#1c1a17]"
          >
            ← Dashboard
          </Link>
        </div>

        <h1 className="mb-2 text-xl font-medium text-[#1c1a17]">
          New Recommendation Page
        </h1>
        <p className="mb-6 font-mono text-[13px] text-[#1c1a17]/40">
          Choose a surgery type. You can add products and publish after.
        </p>

        {available.length === 0 ? (
          <div className="rounded-xl border border-[#e8e3da] bg-white p-8 text-center">
            <p className="font-mono text-sm text-[#1c1a17]/40">
              You already have pages for all available surgery types.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {available.map((type) => (
              <form key={type} action={createPage}>
                <input type="hidden" name="surgeryType" value={type} />
                <button
                  type="submit"
                  className="w-full rounded-xl border border-[#e8e3da] bg-white px-6 py-5 text-left transition hover:border-[#1c1a17]/25 hover:bg-[#f0ede8]"
                >
                  <span className="font-medium text-[#1c1a17]">{type}</span>
                  <span className="ml-2 font-mono text-[12px] text-[#1c1a17]/35">
                    recovery recommendations
                  </span>
                </button>
              </form>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
