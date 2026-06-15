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
  show_doctor: boolean;
  page_products: PageProductForEditor[];
};

export type PdfProduct = {
  name: string;
  slug: string;
  category: string;
  image_url: string | null;
  instructions: string | null; // custom_instructions ?? default_instructions
  sort_order: number;
};

export type PageForPdf = {
  surgery_type: string;
  practice_name: string;
  practice_logo_url: string | null;
  products: PdfProduct[];
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
    .select("id, surgery_type, is_published, doctor_id, show_doctor")
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

export async function getPageForPdf(
  pageId: string,
  doctorId: string
): Promise<PageForPdf | null> {
  const supabase = await createClient();

  // Run page ownership check + practice lookup in parallel
  const [pageResult, doctorResult] = await Promise.all([
    supabase
      .from("rw_recommendation_pages")
      .select("surgery_type")
      .eq("id", pageId)
      .eq("doctor_id", doctorId)
      .single(),
    supabase
      .from("rw_doctors")
      .select("practice:rw_practices(name, logo_url)")
      .eq("id", doctorId)
      .single(),
  ]);

  if (pageResult.error || !pageResult.data) return null;
  if (doctorResult.error || !doctorResult.data) return null;

  // Supabase returns FK joins as array or object — handle both
  const practiceRaw = doctorResult.data.practice as unknown;
  const practice = (
    Array.isArray(practiceRaw) ? practiceRaw[0] : practiceRaw
  ) as { name: string; logo_url: string | null } | null;
  if (!practice) return null;

  // Load page products with product details
  const { data: rows } = await supabase
    .from("rw_page_products")
    .select(
      "sort_order, custom_instructions, rw_products(name, slug, category, image_url, default_instructions)"
    )
    .eq("page_id", pageId)
    .order("sort_order", { ascending: true });

  type ProductRow = {
    name: string;
    slug: string;
    category: string;
    image_url: string | null;
    default_instructions: string | null;
  };

  const products: PdfProduct[] = (rows ?? [])
    .filter((r) => r.rw_products)
    .map((r, i) => {
      const raw = r.rw_products as unknown;
      const p = (Array.isArray(raw) ? raw[0] : raw) as ProductRow;
      return {
        name: p.name,
        slug: p.slug,
        category: p.category,
        image_url: p.image_url,
        instructions: r.custom_instructions ?? p.default_instructions,
        sort_order: r.sort_order ?? i,
      };
    });

  return {
    surgery_type: pageResult.data.surgery_type,
    practice_name: practice.name,
    practice_logo_url: practice.logo_url,
    products,
  };
}
