import { notFound } from "next/navigation";
import Image from "next/image";
import { getPublishedPage } from "@/lib/recoverbright/pages";
import { BuyNowLink } from "./BuyNowLink";
import type { Metadata } from "next";

type Params = Promise<{ slug: string; "surgery-type": string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, "surgery-type": surgerySegment } = await params;
  const page = await getPublishedPage(slug, surgerySegment);
  if (!page) return { title: "Not Found" };
  return {
    title: `${page.surgery_type} Recovery — ${page.practice.name}`,
    description: `Doctor-curated ${page.surgery_type} recovery recommendations from ${page.practice.name}.`,
  };
}


export default async function PatientPage({ params }: { params: Params }) {
  const { slug, "surgery-type": surgerySegment } = await params;
  const page = await getPublishedPage(slug, surgerySegment);
  if (!page) notFound();

  const { practice, surgery_type, doctor_name, products } = page;

  // Group products by category to render section headers
  const grouped = products.reduce<Record<string, typeof products>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#f9f7f4]">
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="border-b border-[#1c1a17]/8 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-6">
          {/* Practice identity */}
          <div className="flex items-center gap-4">
            {practice.logo_url && (
              <Image
                src={practice.logo_url}
                alt={`${practice.name} logo`}
                width={96}
                height={96}
                className="rounded-xl object-contain"
              />
            )}
            <div>
              <p className="text-[15px] font-semibold text-[#1c1a17]">
                {practice.name}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1c1a17]/38">
                {surgery_type} · Recovery Guide
              </p>
            </div>
          </div>

          {/* Title + doctor attribution */}
          <div className="mt-6 border-t border-[#1c1a17]/8 pt-6">
            <h1 className="text-2xl font-medium tracking-tight text-[#1c1a17] sm:text-3xl">
              Your {surgery_type} Recovery Guide
            </h1>
            {page.show_doctor && (
              <p className="mt-2 text-[12px] text-[#1c1a17]/50">
                Recommended by{" "}
                <span className="font-semibold text-[#1c1a17]">{doctor_name}</span>
              </p>
            )}
          </div>
        </div>
      </header>

      {/* ── PRODUCT CARDS ──────────────────────────────────────── */}
      <main className="mx-auto max-w-2xl px-6 py-8">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="mb-5">
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.28em] text-[#1c1a17]/35">
              {category}
            </p>
            <div className="space-y-2">
              {items.map((product) => (
                <ProductCard
                  key={product.page_product_id}
                  product={product}
                  practiceSlug={slug}
                  surgeryType={surgery_type}
                />
              ))}
            </div>
          </section>
        ))}

        {products.length === 0 && (
          <p className="py-16 text-center text-sm text-[#1c1a17]/40">
            No products on this page yet.
          </p>
        )}
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-[#1c1a17]/8 px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-center font-mono text-[9px] uppercase tracking-[0.22em] text-[#1c1a17]/25 leading-[1.8]">
            Not a substitute for medical advice<br />
            Follow your doctor&apos;s instructions · RecoverBright
          </p>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({
  product,
  practiceSlug,
  surgeryType,
}: {
  product: {
    page_product_id: string;
    name: string;
    slug: string;
    category: string;
    image_url: string | null;
    instructions: string | null;
    buy_url: string | null;
  };
  practiceSlug: string;
  surgeryType: string;
}) {
  return (
    <div className="flex gap-4 rounded-[9px] border border-[#1c1a17]/8 bg-white p-4 sm:p-5">
      {/* Image — omit entirely if null rather than showing an empty box */}
      {product.image_url && (
        <div className="shrink-0">
          <Image
            src={product.image_url}
            alt={product.name}
            width={80}
            height={80}
            className="rounded-[7px] object-contain"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#1c1a17]/28">
            {product.category}
          </p>
          <p className="mt-0.5 text-[14px] font-semibold leading-snug text-[#1c1a17]">
            {product.name}
          </p>
        </div>

        {product.instructions && (
          <p className="line-clamp-2 text-[11.5px] leading-[1.65] text-[#1c1a17]/55 sm:line-clamp-none">
            {product.instructions}
          </p>
        )}

        {/* Buy button */}
        <div className="mt-1">
          {product.buy_url ? (
            <BuyNowLink
              href={`/recoverbright/products/${product.slug}`}
              productSlug={product.slug}
              practiceSlug={practiceSlug}
              surgeryType={surgeryType}
            />
          ) : (
            <span className="font-mono text-[11px] text-[#1c1a17]/30">
              Link coming soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
