import { requireAdmin } from "@/lib/recoverbright/auth";
import { getActiveProducts } from "@/lib/recoverbright/products";
import { createServiceClient } from "@/lib/supabase/service";
import { SURGERY_TYPES } from "@/lib/recoverbright/portal-pages";
import { saveDefaults } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Default Products — Admin" };

export default async function AdminDefaultsPage() {
  await requireAdmin();
  const supabase = createServiceClient();
  const [products, { data: defaults }] = await Promise.all([
    getActiveProducts(),
    supabase
      .from("rw_default_products")
      .select("surgery_type, product_id"),
  ]);

  // Build a Set per surgery type for O(1) checked lookup
  const defaultsByType: Record<string, Set<string>> = {};
  for (const row of defaults ?? []) {
    if (!defaultsByType[row.surgery_type])
      defaultsByType[row.surgery_type] = new Set();
    defaultsByType[row.surgery_type].add(row.product_id);
  }

  return (
    <div className="min-h-screen bg-[#f9f7f4]">
      {/* Header */}
      <header className="border-b border-[#1c1a17]/8 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1c1a17]/35">
              Recover Bright · Admin
            </p>
            <h1 className="mt-0.5 text-lg font-medium text-[#1c1a17]">
              Default Products
            </h1>
          </div>
          <a
            href="/recoverbright/admin/products"
            className="font-mono text-[12px] text-[#1c1a17]/40 hover:text-[#1c1a17]"
          >
            ← Products
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        <p className="text-[13px] text-[#1c1a17]/55">
          Set the recommended products shown to doctors when a new page is
          created. Doctors can restore to these defaults at any time from the
          page editor.
        </p>

        {SURGERY_TYPES.map((surgeryType) => {
          const checked = defaultsByType[surgeryType] ?? new Set<string>();
          return (
            <section
              key={surgeryType}
              className="rounded-lg border border-[#1c1a17]/10 bg-white p-6"
            >
              <form action={saveDefaults}>
                <input type="hidden" name="surgeryType" value={surgeryType} />
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1c1a17]/50">
                    {surgeryType}
                  </h2>
                  <button type="submit" className="btn-primary">
                    Save
                  </button>
                </div>
                <div className="space-y-2">
                  {products.map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-3 py-1"
                    >
                      <input
                        type="checkbox"
                        name="productId"
                        value={p.id}
                        defaultChecked={checked.has(p.id)}
                        className="h-4 w-4 accent-[#1c1a17]"
                      />
                      <span className="flex-1 text-[14px] text-[#1c1a17]">
                        {p.name}
                      </span>
                      <span className="font-mono text-[11px] text-[#1c1a17]/35">
                        {p.category}
                      </span>
                    </label>
                  ))}
                </div>
              </form>
            </section>
          );
        })}
      </main>
    </div>
  );
}
