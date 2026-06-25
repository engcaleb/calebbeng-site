import { createClient } from "@/lib/supabase/server";
import type { RwProduct } from "@/lib/recoverbright/products";

export const DEFAULT_SURGERY_TYPES = [
  "LASIK",
  "Cataract",
  "Dry Eye",
  "Retinal",
  "Corneal",
] as const;

export async function getSurgeryTypes(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rw_surgery_types")
    .select("name")
    .order("sort_order", { ascending: true });
  if (error || !data || data.length === 0) {
    return [...DEFAULT_SURGERY_TYPES];
  }
  return data.map((r) => r.name);
}

export type MyPage = {
  id: string;
  surgery_type: string;
  is_published: boolean;
  show_doctor: boolean;
  product_count: number;
  doctor_name: string;
  doctor_slug: string;
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
  practice_slug: string;
  practice_logo_url: string | null;
  products: PdfProduct[];
};

export async function getPracticePages(practiceId: string): Promise<MyPage[]> {
  const supabase = await createClient();

  const { data: doctors } = await supabase
    .from("rw_doctors")
    .select("id, name, slug")
    .eq("practice_id", practiceId);
  if (!doctors?.length) return [];

  const doctorMap = new Map(doctors.map((d) => [d.id, d]));

  const { data, error } = await supabase
    .from("rw_recommendation_pages")
    .select("id, surgery_type, is_published, show_doctor, doctor_id, rw_page_products(id)")
    .in("doctor_id", doctors.map((d) => d.id))
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((p) => {
    const doc = doctorMap.get(p.doctor_id);
    return {
      id: p.id,
      surgery_type: p.surgery_type,
      is_published: p.is_published,
      show_doctor: p.show_doctor,
      product_count: Array.isArray(p.rw_page_products)
        ? p.rw_page_products.length
        : 0,
      doctor_name: doc?.name ?? "",
      doctor_slug: doc?.slug ?? "",
    };
  });
}

export async function getPageForEditor(
  pageId: string,
  practiceId: string
): Promise<PageForEditor | null> {
  const supabase = await createClient();

  const { data: doctors } = await supabase
    .from("rw_doctors")
    .select("id")
    .eq("practice_id", practiceId);
  if (!doctors?.length) return null;

  const { data: page, error } = await supabase
    .from("rw_recommendation_pages")
    .select("id, surgery_type, is_published, doctor_id, show_doctor")
    .eq("id", pageId)
    .in("doctor_id", doctors.map((d) => d.id))
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

export async function getDefaultProductIds(
  surgeryType: string
): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rw_default_products")
    .select("product_id")
    .eq("surgery_type", surgeryType)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((r) => r.product_id);
}

export async function getPageForPdf(
  pageId: string,
  practiceId: string
): Promise<(PageForPdf & { doctor_name: string; doctor_slug: string; show_doctor: boolean }) | null> {
  const supabase = await createClient();

  const { data: doctors } = await supabase
    .from("rw_doctors")
    .select("id, name, slug")
    .eq("practice_id", practiceId);
  if (!doctors?.length) return null;

  const [pageResult, practiceResult] = await Promise.all([
    supabase
      .from("rw_recommendation_pages")
      .select("surgery_type, doctor_id, show_doctor")
      .eq("id", pageId)
      .in("doctor_id", doctors.map((d) => d.id))
      .single(),
    supabase
      .from("rw_practices")
      .select("name, slug, logo_url")
      .eq("id", practiceId)
      .single(),
  ]);

  if (pageResult.error || !pageResult.data) return null;
  if (practiceResult.error || !practiceResult.data) return null;

  const practice = practiceResult.data;
  const pageDoctor = doctors.find((d) => d.id === pageResult.data.doctor_id)!;

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
    show_doctor: pageResult.data.show_doctor,
    practice_name: practice.name,
    practice_slug: practice.slug,
    practice_logo_url: practice.logo_url,
    doctor_name: pageDoctor.name,
    doctor_slug: pageDoctor.slug,
    products,
  };
}

export async function getDefaultProductsForSurgeryType(
  surgeryType: string
): Promise<RwProduct[]> {
  const supabase = await createClient();
  const { data: defaults } = await supabase
    .from("rw_default_products")
    .select("product_id, sort_order")
    .eq("surgery_type", surgeryType)
    .order("sort_order", { ascending: true });
  if (!defaults?.length) return [];

  const ids = defaults.map((d) => d.product_id);
  const { data: products, error } = await supabase
    .from("rw_products")
    .select("*")
    .in("id", ids)
    .eq("is_active", true);
  if (error || !products) return [];

  // Preserve default sort order
  const orderMap = new Map(defaults.map((d) => [d.product_id, d.sort_order]));
  return products.sort(
    (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
  );
}

export async function getNonDefaultProducts(
  surgeryType: string
): Promise<RwProduct[]> {
  const supabase = await createClient();
  const { data: defaults } = await supabase
    .from("rw_default_products")
    .select("product_id")
    .eq("surgery_type", surgeryType);
  const excludeIds = (defaults ?? []).map((d) => d.product_id);

  let query = supabase
    .from("rw_products")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}
