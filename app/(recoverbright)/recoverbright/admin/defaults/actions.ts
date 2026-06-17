"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/recoverbright/auth";
import { revalidatePath } from "next/cache";

export async function saveDefaults(surgeryType: string, productIds: string[]) {
  await requireAdmin();

  const supabase = createServiceClient();

  const { error: deleteError } = await supabase
    .from("rw_default_products")
    .delete()
    .eq("surgery_type", surgeryType);
  if (deleteError) throw new Error(deleteError.message);

  if (productIds.length > 0) {
    const { error } = await supabase.from("rw_default_products").insert(
      productIds.map((product_id, sort_order) => ({
        surgery_type: surgeryType,
        product_id,
        sort_order,
      }))
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/recoverbright/admin/defaults");
}

export async function addSurgeryType(name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("rw_surgery_types")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSort =
    existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { error } = await supabase
    .from("rw_surgery_types")
    .insert({ name: trimmed, sort_order: nextSort });

  if (error) {
    if (error.code === "23505") throw new Error("Surgery type already exists");
    throw new Error(error.message);
  }

  revalidatePath("/recoverbright/admin/defaults");
  revalidatePath("/recoverbright/portal/pages/new");
}
