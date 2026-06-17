"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/recoverbright/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function upsertProduct(formData: FormData) {
  await requireAdmin();
  const supabase = createServiceClient();

  const id = formData.get("id") as string | null;
  const payload = {
    name: (formData.get("name") as string).trim(),
    slug: (formData.get("slug") as string).trim(),
    category: formData.get("category") as string,
    image_url: (formData.get("image_url") as string).trim() || null,
    default_instructions:
      (formData.get("default_instructions") as string).trim() || null,
    buy_url: (formData.get("buy_url") as string).trim() || null,
    sort_order: parseInt(formData.get("sort_order") as string, 10) || 0,
    is_active: formData.get("is_active") === "true",
  };

  if (id) {
    const { error } = await supabase
      .from("rw_products")
      .update(payload)
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("rw_products").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/recoverbright/admin/products");
  redirect("/recoverbright/admin/products");
}

export async function toggleProductActive(formData: FormData) {
  await requireAdmin();
  const supabase = createServiceClient();
  const id = formData.get("id") as string;
  const current = formData.get("is_active") === "true";

  const { error } = await supabase
    .from("rw_products")
    .update({ is_active: !current })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/recoverbright/admin/products");
}
