"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDoctor } from "@/lib/recoverwell/auth";
import { createClient } from "@/lib/supabase/server";
import { surgeryTypeToUrlSegment } from "@/lib/recoverwell/pages";

// Called from a <form action={createPage}> — receives FormData
export async function createPage(formData: FormData) {
  const surgeryType = formData.get("surgeryType") as string;
  if (!surgeryType) throw new Error("Missing surgeryType");

  const doctor = await requireDoctor();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rw_recommendation_pages")
    .insert({ doctor_id: doctor.id, surgery_type: surgeryType, is_published: false })
    .select("id")
    .single();

  if (error || !data) throw new Error("Failed to create page");

  redirect(`/recoverwell/portal/pages/${data.id}/edit`);
}

type SaveProduct = {
  product_id: string;
  custom_instructions: string | null;
  sort_order: number;
};

// Called from PageEditor client component via useTransition
export async function savePageProducts(
  pageId: string,
  practiceSlug: string,
  surgeryType: string,
  products: SaveProduct[]
) {
  const doctor = await requireDoctor();
  const supabase = await createClient();

  // Ownership check
  const { data: page } = await supabase
    .from("rw_recommendation_pages")
    .select("id")
    .eq("id", pageId)
    .eq("doctor_id", doctor.id)
    .single();
  if (!page) throw new Error("Page not found");

  // Replace all page products atomically
  await supabase.from("rw_page_products").delete().eq("page_id", pageId);

  if (products.length > 0) {
    const { error } = await supabase.from("rw_page_products").insert(
      products.map((p) => ({
        page_id: pageId,
        product_id: p.product_id,
        custom_instructions: p.custom_instructions,
        sort_order: p.sort_order,
      }))
    );
    if (error) throw new Error("Failed to save products");
  }

  revalidatePath(
    `/recoverwell/dr/${practiceSlug}/${surgeryTypeToUrlSegment(surgeryType)}`
  );
}

// Called from PageEditor client component via useTransition
export async function togglePublish(
  pageId: string,
  practiceSlug: string,
  surgeryType: string,
  currentIsPublished: boolean
) {
  const doctor = await requireDoctor();
  const supabase = await createClient();

  const { error } = await supabase
    .from("rw_recommendation_pages")
    .update({ is_published: !currentIsPublished })
    .eq("id", pageId)
    .eq("doctor_id", doctor.id);

  if (error) throw new Error("Failed to update publish status");

  revalidatePath(
    `/recoverwell/dr/${practiceSlug}/${surgeryTypeToUrlSegment(surgeryType)}`
  );
  revalidatePath("/recoverwell/portal");
}
