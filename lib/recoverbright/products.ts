import { createClient } from "@/lib/supabase/server";

export type RwProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  image_url: string | null;
  default_instructions: string | null;
  buy_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export async function getProducts(): Promise<RwProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rw_products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getProductById(id: string): Promise<RwProduct | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rw_products")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function getActiveProducts(): Promise<RwProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rw_products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getDefaultProductCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rw_default_products")
    .select("surgery_type");
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.surgery_type] = (counts[row.surgery_type] ?? 0) + 1;
  }
  return counts;
}
