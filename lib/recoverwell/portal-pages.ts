import { createClient } from "@/lib/supabase/server";

export const SURGERY_TYPES = [
  "LASIK",
  "Cataract",
  "Dry Eye",
  "Retinal",
  "Corneal",
] as const;

export type MyPage = {
  id: string;
  surgery_type: string;
  is_published: boolean;
  product_count: number;
};

export type PageProductForEditor = {
  product_id: string;
  custom_instructions: string | null;
  sort_order: number;
};

export type PageForEditor = {
  id: string;
  surgery_type: string;
  is_published: boolean;
  doctor_id: string;
  page_products: PageProductForEditor[];
};

export async function getMyPages(doctorId: string): Promise<MyPage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rw_recommendation_pages")
    .select("id, surgery_type, is_published, rw_page_products(id)")
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    surgery_type: p.surgery_type,
    is_published: p.is_published,
    product_count: Array.isArray(p.rw_page_products)
      ? p.rw_page_products.length
      : 0,
  }));
}

export async function getPageForEditor(
  pageId: string,
  doctorId: string
): Promise<PageForEditor | null> {
  const supabase = await createClient();
  const { data: page, error } = await supabase
    .from("rw_recommendation_pages")
    .select("id, surgery_type, is_published, doctor_id")
    .eq("id", pageId)
    .eq("doctor_id", doctorId)
    .single();
  if (error || !page) return null;

  const { data: pageProducts } = await supabase
    .from("rw_page_products")
    .select("product_id, custom_instructions, sort_order")
    .eq("page_id", pageId)
    .order("sort_order", { ascending: true });

  return {
    ...page,
    page_products: pageProducts ?? [],
  };
}
