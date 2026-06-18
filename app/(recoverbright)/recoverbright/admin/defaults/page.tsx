import { requireAdmin } from "@/lib/recoverbright/auth";
import { getActiveProducts } from "@/lib/recoverbright/products";
import { createServiceClient } from "@/lib/supabase/service";
import { getSurgeryTypes } from "@/lib/recoverbright/portal-pages";
import { DefaultsEditor } from "./DefaultsEditor";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Default Products — Admin" };

export default async function AdminDefaultsPage() {
  await requireAdmin();
  const supabase = createServiceClient();
  const [surgeryTypes, products, { data: defaults }] = await Promise.all([
    getSurgeryTypes(),
    getActiveProducts(),
    supabase
      .from("rw_default_products")
      .select("surgery_type, product_id"),
  ]);

  const defaultsByType: Record<string, string[]> = {};
  for (const row of defaults ?? []) {
    if (!defaultsByType[row.surgery_type])
      defaultsByType[row.surgery_type] = [];
    defaultsByType[row.surgery_type].push(row.product_id);
  }

  return (
    <div className="min-h-screen bg-[#f9f7f4]">
      <header className="border-b border-[#1c1a17]/8 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1c1a17]/35">
              RecoverBright · Admin
            </p>
            <h1 className="mt-0.5 text-lg font-medium text-[#1c1a17]">
              Default Products
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/recoverbright/admin/articles"
              className="font-mono text-[12px] text-[#1c1a17]/40 hover:text-[#1c1a17]"
            >
              Articles →
            </a>
            <a
              href="/recoverbright/admin/products"
              className="font-mono text-[12px] text-[#1c1a17]/40 hover:text-[#1c1a17]"
            >
              ← Products
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <p className="text-[13px] text-[#1c1a17]/55">
          Select a surgery type, then choose default products. Doctors can
          restore to these defaults from the page editor.
        </p>

        <DefaultsEditor
          surgeryTypes={surgeryTypes}
          products={products}
          defaultsByType={defaultsByType}
        />
      </main>
    </div>
  );
}
