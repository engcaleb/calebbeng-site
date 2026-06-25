import { requireDoctor } from "@/lib/recoverbright/auth";
import { getSurgeryTypes, getPracticePages } from "@/lib/recoverbright/portal-pages";
import { getDefaultProductCounts } from "@/lib/recoverbright/products";
import { createPage, copyPage } from "../actions";
import Link from "next/link";

export const metadata = { title: "New Page — Portal" };

export default async function NewPagePage() {
  const doctor = await requireDoctor();
  const [surgeryTypes, productCounts, allPages] = await Promise.all([
    getSurgeryTypes(),
    getDefaultProductCounts(),
    getPracticePages(doctor.practice.id),
  ]);

  // What the current doctor already has
  const myDoctorPages = new Set(
    allPages
      .filter((p) => p.doctor_slug === doctor.slug && p.show_doctor)
      .map((p) => p.surgery_type)
  );
  // What the practice already has (practice-wide)
  const practiceWidePages = new Set(
    allPages.filter((p) => !p.show_doctor).map((p) => p.surgery_type)
  );

  // Surgery types with at least one option available
  const available = surgeryTypes.filter(
    (t) => !myDoctorPages.has(t) || !practiceWidePages.has(t)
  );

  // Other doctors' pages available for copying
  const copyablPages = allPages.filter(
    (p) => p.doctor_slug !== doctor.slug && p.show_doctor
  );

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
          Choose a surgery type and page type.
        </p>

        {available.length === 0 && copyablPages.length === 0 ? (
          <div className="rounded-xl border border-[#e8e3da] bg-white p-8 text-center">
            <p className="font-mono text-sm text-[#1c1a17]/40">
              You already have pages for all available surgery types.
            </p>
          </div>
        ) : (
          <>
            {/* Surgery type picker with dual options */}
            {available.length > 0 && (
              <div className="space-y-2">
                {available.map((type) => {
                  const count = productCounts[type] ?? 0;
                  const canDoctor = !myDoctorPages.has(type);
                  const canPractice = !practiceWidePages.has(type);
                  return (
                    <div
                      key={type}
                      className="rounded-xl border border-[#e8e3da] bg-white px-6 py-5"
                    >
                      <p className="font-medium text-[#1c1a17]">
                        {type}
                        {count > 0 && (
                          <span className="ml-2 font-mono text-[12px] text-[#1c1a17]/35">
                            {count} product{count === 1 ? "" : "s"}
                          </span>
                        )}
                      </p>
                      <div className="mt-3 flex gap-2">
                        {canDoctor && (
                          <form action={createPage}>
                            <input type="hidden" name="surgeryType" value={type} />
                            <input type="hidden" name="showDoctor" value="true" />
                            <button
                              type="submit"
                              className="rounded-lg border border-[#e8e3da] px-4 py-2 font-mono text-[12px] text-[#1c1a17]/60 transition hover:border-[#1c1a17]/25 hover:bg-[#f0ede8]"
                            >
                              My page
                            </button>
                          </form>
                        )}
                        {canPractice && (
                          <form action={createPage}>
                            <input type="hidden" name="surgeryType" value={type} />
                            <input type="hidden" name="showDoctor" value="false" />
                            <button
                              type="submit"
                              className="rounded-lg border border-[#e8e3da] px-4 py-2 font-mono text-[12px] text-[#1c1a17]/60 transition hover:border-[#1c1a17]/25 hover:bg-[#f0ede8]"
                            >
                              Practice page
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Copy from colleague */}
            {copyablPages.length > 0 && (
              <div className="mt-8">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#1c1a17]/35">
                  Or copy from a colleague
                </p>
                <div className="space-y-2">
                  {copyablPages.map((page) => {
                    const hasMyVersion = myDoctorPages.has(page.surgery_type);
                    const hasPracticeVersion = practiceWidePages.has(page.surgery_type);
                    return (
                      <div
                        key={page.id}
                        className="rounded-xl border border-[#e8e3da] bg-white px-6 py-4"
                      >
                        <p className="text-[14px] font-medium text-[#1c1a17]">
                          {page.surgery_type}
                          <span className="ml-2 font-mono text-[12px] text-[#1c1a17]/35">
                            {page.doctor_name} · {page.product_count}{" "}
                            {page.product_count === 1 ? "product" : "products"}
                          </span>
                        </p>
                        <div className="mt-3 flex gap-2">
                          <form action={copyPage}>
                            <input type="hidden" name="sourcePageId" value={page.id} />
                            <button
                              type="submit"
                              className="rounded-lg border border-[#e8e3da] px-4 py-2 font-mono text-[12px] text-[#1c1a17]/60 transition hover:border-[#1c1a17]/25 hover:bg-[#f0ede8]"
                            >
                              {hasMyVersion
                                ? `Copy · replaces your ${page.surgery_type} page`
                                : "Copy as my page"}
                            </button>
                          </form>
                          {!hasPracticeVersion && (
                            <form action={copyPage}>
                              <input type="hidden" name="sourcePageId" value={page.id} />
                              <input type="hidden" name="asPracticeWide" value="true" />
                              <button
                                type="submit"
                                className="rounded-lg border border-[#e8e3da] px-4 py-2 font-mono text-[12px] text-[#1c1a17]/60 transition hover:border-[#1c1a17]/25 hover:bg-[#f0ede8]"
                              >
                                Copy as practice page
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
