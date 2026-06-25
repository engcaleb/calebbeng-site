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

  const showDoctor = formData.get("showDoctor") !== "false";

  const doctor = await requireDoctor();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rw_recommendation_pages")
    .insert({ doctor_id: doctor.id, surgery_type: surgeryType, is_published: false, show_doctor: showDoctor })
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

export async function copyPage(formData: FormData) {
  const sourcePageId = formData.get("sourcePageId") as string;
  if (!sourcePageId) throw new Error("Missing sourcePageId");
  const asPracticeWide = formData.get("asPracticeWide") === "true";

  const doctor = await requireDoctor();
  const supabase = await createClient();

  // Verify source page belongs to same practice
  const { data: practiceDocIds } = await supabase
    .from("rw_doctors")
    .select("id")
    .eq("practice_id", doctor.practice_id);
  if (!practiceDocIds?.length) throw new Error("No doctors in practice");
  const docIds = practiceDocIds.map((d) => d.id);

  const { data: sourcePage } = await supabase
    .from("rw_recommendation_pages")
    .select("id, surgery_type")
    .eq("id", sourcePageId)
    .in("doctor_id", docIds)
    .single();
  if (!sourcePage) throw new Error("Source page not found");

  // Load source products
  const { data: sourceProducts } = await supabase
    .from("rw_page_products")
    .select("product_id, custom_instructions, sort_order")
    .eq("page_id", sourcePageId)
    .order("sort_order", { ascending: true });

  const showDoctor = !asPracticeWide;

  // Check for existing page of the same type
  let existingPageId: string | null = null;
  if (asPracticeWide) {
    // Practice-wide: check if any doctor in practice has one
    const { data: existing } = await supabase
      .from("rw_recommendation_pages")
      .select("id")
      .in("doctor_id", docIds)
      .eq("surgery_type", sourcePage.surgery_type)
      .eq("show_doctor", false)
      .limit(1)
      .single();
    existingPageId = existing?.id ?? null;
  } else {
    // Doctor-specific: check if current doctor has one
    const { data: existing } = await supabase
      .from("rw_recommendation_pages")
      .select("id")
      .eq("doctor_id", doctor.id)
      .eq("surgery_type", sourcePage.surgery_type)
      .eq("show_doctor", true)
      .limit(1)
      .single();
    existingPageId = existing?.id ?? null;
  }

  let targetPageId: string;

  if (existingPageId) {
    // Replace products on existing page
    targetPageId = existingPageId;
    const { error: deleteError } = await supabase
      .from("rw_page_products")
      .delete()
      .eq("page_id", existingPageId);
    if (deleteError) throw new Error("Failed to clear existing products");
  } else {
    // Create new page
    const { data: newPage, error: createError } = await supabase
      .from("rw_recommendation_pages")
      .insert({
        doctor_id: doctor.id,
        surgery_type: sourcePage.surgery_type,
        is_published: false,
        show_doctor: showDoctor,
      })
      .select("id")
      .single();
    if (createError || !newPage) throw new Error("Failed to create page");
    targetPageId = newPage.id;
  }

  // Insert copied products
  if (sourceProducts && sourceProducts.length > 0) {
    const { error: insertError } = await supabase
      .from("rw_page_products")
      .insert(
        sourceProducts.map((p) => ({
          page_id: targetPageId,
          product_id: p.product_id,
          custom_instructions: p.custom_instructions,
          sort_order: p.sort_order,
        }))
      );
    if (insertError) throw new Error("Failed to copy products");
  }

  revalidatePath("/recoverbright/portal");
  redirect(`/recoverbright/portal/pages/${targetPageId}/edit`);
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

  // Practice membership check
  const { data: practiceDocIds } = await supabase
    .from("rw_doctors")
    .select("id")
    .eq("practice_id", doctor.practice_id);
  const { data: page } = await supabase
    .from("rw_recommendation_pages")
    .select("id")
    .eq("id", pageId)
    .in("doctor_id", (practiceDocIds ?? []).map((d) => d.id))
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

  const { data: practiceDocIds } = await supabase
    .from("rw_doctors")
    .select("id")
    .eq("practice_id", doctor.practice_id);
  const { error } = await supabase
    .from("rw_recommendation_pages")
    .update({ is_published: !currentIsPublished })
    .eq("id", pageId)
    .in("doctor_id", (practiceDocIds ?? []).map((d) => d.id));

  if (error) throw new Error("Failed to update publish status");

  revalidatePath(
    `/recoverbright/dr/${practiceSlug}/${surgeryTypeToUrlSegment(surgeryType)}`
  );
  revalidatePath("/recoverbright/portal");
}

