import { requireDoctor } from "@/lib/recoverbright/auth";
import { getSurgeryTypes } from "@/lib/recoverbright/portal-pages";
import { getDefaultProductCounts } from "@/lib/recoverbright/products";
import { createClient } from "@/lib/supabase/server";
import { createPage } from "../actions";
import Link from "next/link";

export const metadata = { title: "New Page — Portal" };

export default async function NewPagePage() {
  const doctor = await requireDoctor();
  const supabase = await createClient();
  const [{ data: myPages }, surgeryTypes, productCounts] = await Promise.all([
    supabase
      .from("rw_recommendation_pages")
      .select("surgery_type")
      .eq("doctor_id", doctor.id),
    getSurgeryTypes(),
    getDefaultProductCounts(),
  ]);
  const existingTypes = new Set(
    (myPages ?? []).map((p: { surgery_type: string }) => p.surgery_type)
  );
  const available = surgeryTypes.filter((t: string) => !existingTypes.has(t));

  return (
    <main className="min-h-screen bg-[#f9f7f4] p-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <Link
            href="/recoverbright/portal"
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
            {available.map((type) => {
              const count = productCounts[type] ?? 0;
              return (
                <form key={type} action={createPage}>
                  <input type="hidden" name="surgeryType" value={type} />
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-[#e8e3da] bg-white px-6 py-5 text-left transition hover:border-[#1c1a17]/25 hover:bg-[#f0ede8]"
                  >
                    <span className="font-medium text-[#1c1a17]">{type}</span>
                    <span className="ml-2 font-mono text-[12px] text-[#1c1a17]/35">
                      {count > 0
                        ? `${count} product${count === 1 ? "" : "s"}`
                        : "recovery recommendations"}
                    </span>
                  </button>
                </form>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
