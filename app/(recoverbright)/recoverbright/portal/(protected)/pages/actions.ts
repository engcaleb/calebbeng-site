"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDoctor } from "@/lib/recoverbright/auth";
import { createClient } from "@/lib/supabase/server";
import { surgeryTypeToUrlSegment } from "@/lib/recoverbright/pages";
import { getSurgeryTypes } from "@/lib/recoverbright/portal-pages";

// Called from a <form action={createPage}> — receives FormData
export async function createPage(formData: FormData) {
  const surgeryType = formData.get("surgeryType") as string;
  if (!surgeryType) throw new Error("Missing surgeryType");
  const validTypes = await getSurgeryTypes();
  if (!validTypes.includes(surgeryType))
    throw new Error("Invalid surgery type");

  const doctor = await requireDoctor();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rw_recommendation_pages")
    .insert({ doctor_id: doctor.id, surgery_type: surgeryType, is_published: false })
    .select("id")
    .single();

  if (error || !data) throw new Error("Failed to create page");

  // Pre-populate with admin-defined defaults for this surgery type
  const { data: defaults } = await supabase
    .from("rw_default_products")
    .select("product_id, sort_order")
    .eq("surgery_type", surgeryType)
    .order("sort_order", { ascending: true });

  if (defaults && defaults.length > 0) {
    await supabase.from("rw_page_products").insert(
      defaults.map((d) => ({
        page_id: data.id,
        product_id: d.product_id,
        custom_instructions: null,
        sort_order: d.sort_order,
      }))
    );
  }

  redirect(`/recoverbright/portal/pages/${data.id}/edit`);
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

  // Delete existing products — check error before proceeding to insert
  const { error: deleteError } = await supabase
    .from("rw_page_products")
    .delete()
    .eq("page_id", pageId);
  if (deleteError) throw new Error("Failed to clear existing products");

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
    `/recoverbright/dr/${practiceSlug}/${surgeryTypeToUrlSegment(surgeryType)}`
  );
  revalidatePath("/recoverbright/portal");
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
    `/recoverbright/dr/${practiceSlug}/${surgeryTypeToUrlSegment(surgeryType)}`
  );
  revalidatePath("/recoverbright/portal");
}

// Called from PageEditor client component via useTransition
export async function toggleShowDoctor(
  pageId: string,
  practiceSlug: string,
  surgeryType: string,
  currentShowDoctor: boolean
) {
  const doctor = await requireDoctor();
  const supabase = await createClient();

  const { error } = await supabase
    .from("rw_recommendation_pages")
    .update({ show_doctor: !currentShowDoctor })
    .eq("id", pageId)
    .eq("doctor_id", doctor.id);

  if (error) throw new Error("Failed to update show_doctor");

  revalidatePath(
    `/recoverbright/dr/${practiceSlug}/${surgeryTypeToUrlSegment(surgeryType)}`
  );
}
