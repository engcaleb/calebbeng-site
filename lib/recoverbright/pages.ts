import { createClient } from "@/lib/supabase/server";

export type Practice = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

export type PageProduct = {
  page_product_id: string;
  sort_order: number;
  instructions: string | null; // custom_instructions ?? default_instructions
  product_id: string;
  name: string;
  slug: string;
  category: string;
  image_url: string | null;
  buy_url: string | null;
};

export type PublishedPage = {
  id: string;
  surgery_type: string;
  practice: Practice;
  doctor_name: string;
  doctor_slug: string;
  show_doctor: boolean;
  products: PageProduct[];
};

// URL segment (e.g. "lasik", "cataract", "dry-eye") → DB value ("LASIK", "Cataract", …)
export function urlToSurgeryType(segment: string): string {
  const map: Record<string, string> = {
    lasik: "LASIK",
    cataract: "Cataract",
    "dry-eye": "Dry Eye",
    "retinal": "Retinal",
    "corneal": "Corneal",
  };
  return (
    map[segment] ??
    segment
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

// DB value ("LASIK", "Cataract", …) → URL segment (e.g. "lasik", "cataract", "dry-eye")
export function surgeryTypeToUrlSegment(surgeryType: string): string {
  const map: Record<string, string> = {
    LASIK: "lasik",
    Cataract: "cataract",
    "Dry Eye": "dry-eye",
    Retinal: "retinal",
    Corneal: "corneal",
  };
  return map[surgeryType] ?? surgeryType.toLowerCase().replace(/\s+/g, "-");
}

export async function getPublishedPage(
  practiceSlug: string,
  doctorSlug: string,
  surgeryTypeSegment: string
): Promise<PublishedPage | null> {
  const supabase = await createClient();
  const surgeryType = urlToSurgeryType(surgeryTypeSegment);

  // 1 — practice
  const { data: practice, error: practiceErr } = await supabase
    .from("rw_practices")
    .select("id, name, slug, logo_url")
    .eq("slug", practiceSlug)
    .single();
  if (practiceErr || !practice) return null;

  // 2 — specific doctor by slug
  const { data: doctor, error: doctorErr } = await supabase
    .from("rw_doctors")
    .select("id, name, slug")
    .eq("practice_id", practice.id)
    .eq("slug", doctorSlug)
    .single();
  if (doctorErr || !doctor) return null;

  // 3 — published recommendation page for this doctor + surgery type
  const { data: page, error: pageErr } = await supabase
    .from("rw_recommendation_pages")
    .select("id, doctor_id, surgery_type, show_doctor")
    .eq("doctor_id", doctor.id)
    .eq("surgery_type", surgeryType)
    .eq("is_published", true)
    .single();
  if (pageErr || !page) return null;

  // 4 — page products with product details
  const { data: rows } = await supabase
    .from("rw_page_products")
    .select(
      `id, sort_order, custom_instructions,
       rw_products ( id, name, slug, category, image_url, default_instructions, buy_url )`
    )
    .eq("page_id", page.id)
    .order("sort_order", { ascending: true });

  type ProductRow = {
    id: string; name: string; slug: string; category: string;
    image_url: string | null; default_instructions: string | null; buy_url: string | null;
  };

  const products: PageProduct[] = (rows ?? [])
    .filter((r) => r.rw_products)
    .map((r) => {
      // Supabase may return the FK join as a single object or an array
      const raw = r.rw_products as unknown;
      const p = (Array.isArray(raw) ? raw[0] : raw) as ProductRow;
      return {
        page_product_id: r.id,
        sort_order: r.sort_order,
        instructions: r.custom_instructions ?? p.default_instructions,
        product_id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        image_url: p.image_url,
        buy_url: p.buy_url,
      };
    });

  return {
    id: page.id,
    surgery_type: page.surgery_type,
    practice,
    doctor_name: doctor.name,
    doctor_slug: doctor.slug,
    show_doctor: page.show_doctor,
    products,
  };
}

export async function getPublishedPracticePage(
  practiceSlug: string,
  surgeryTypeSegment: string
): Promise<PublishedPage | null> {
  const supabase = await createClient();
  const surgeryType = urlToSurgeryType(surgeryTypeSegment);

  const { data: practice, error: practiceErr } = await supabase
    .from("rw_practices")
    .select("id, name, slug, logo_url")
    .eq("slug", practiceSlug)
    .single();
  if (practiceErr || !practice) return null;

  // Find all doctors in the practice
  const { data: doctors } = await supabase
    .from("rw_doctors")
    .select("id, name, slug")
    .eq("practice_id", practice.id);
  if (!doctors?.length) return null;

  // Find published practice-wide page
  const { data: page } = await supabase
    .from("rw_recommendation_pages")
    .select("id, doctor_id, surgery_type, show_doctor")
    .in("doctor_id", doctors.map((d) => d.id))
    .eq("surgery_type", surgeryType)
    .eq("is_published", true)
    .eq("show_doctor", false)
    .limit(1)
    .single();
  if (!page) return null;

  const pageDoctor = doctors.find((d) => d.id === page.doctor_id)!;

  // Load page products with product details
  const { data: rows } = await supabase
    .from("rw_page_products")
    .select(
      `id, sort_order, custom_instructions,
       rw_products ( id, name, slug, category, image_url, default_instructions, buy_url )`
    )
    .eq("page_id", page.id)
    .order("sort_order", { ascending: true });

  type ProductRow = {
    id: string; name: string; slug: string; category: string;
    image_url: string | null; default_instructions: string | null; buy_url: string | null;
  };

  const products: PageProduct[] = (rows ?? [])
    .filter((r) => r.rw_products)
    .map((r) => {
      const raw = r.rw_products as unknown;
      const p = (Array.isArray(raw) ? raw[0] : raw) as ProductRow;
      return {
        page_product_id: r.id,
        sort_order: r.sort_order,
        instructions: r.custom_instructions ?? p.default_instructions,
        product_id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        image_url: p.image_url,
        buy_url: p.buy_url,
      };
    });

  return {
    id: page.id,
    surgery_type: page.surgery_type,
    practice,
    doctor_name: pageDoctor.name,
    doctor_slug: pageDoctor.slug,
    show_doctor: false,
    products,
  };
}
