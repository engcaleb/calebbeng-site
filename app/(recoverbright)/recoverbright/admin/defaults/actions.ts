"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/recoverbright/auth";
import { revalidatePath } from "next/cache";

export async function saveDefaults(formData: FormData) {
  await requireAdmin();
  const surgeryType = formData.get("surgeryType") as string;
  const productIds = formData.getAll("productId") as string[];

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
