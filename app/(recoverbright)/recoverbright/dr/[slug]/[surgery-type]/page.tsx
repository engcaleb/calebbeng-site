import { notFound } from "next/navigation";
import Image from "next/image";
import { getPublishedPracticePage } from "@/lib/recoverbright/pages";
import type { Metadata } from "next";

type Params = Promise<{ slug: string; "surgery-type": string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, "surgery-type": surgerySegment } = await params;
  const page = await getPublishedPracticePage(slug, surgerySegment);
  if (!page) return { title: "Not Found" };
  return {
    title: `${page.surgery_type} Recovery — ${page.practice.name}`,
    description: `${page.surgery_type} recovery recommendations from ${page.practice.name}.`,
  };
}

export default async function PracticeWidePage({ params }: { params: Params }) {
  const { slug, "surgery-type": surgerySegment } = await params;
  const page = await getPublishedPracticePage(slug, surgerySegment);
  if (!page) notFound();

  const { practice, surgery_type, products } = page;

  const grouped = products.reduce<Record<string, typeof products>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#f9f7f4]">
      <header className="border-b border-[#1c1a17]/8 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-6">
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
              <p className="font-medium text-[#1c1a17]">{practice.name}</p>
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.15em] text-[#1c1a17]/35">
                {surgery_type} Surgery · Recovery Guide
              </p>
            </div>
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-[#1c1a17]">
            Your {surgery_type} Recovery Guide
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-8">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1c1a17]/35">
              {category}
            </p>
            <div className="space-y-3">
              {items.map((product) => (
                <div
                  key={product.page_product_id}
                  className="flex gap-4 rounded-[9px] border border-[#1c1a17]/8 bg-white p-4 sm:p-5"
                >
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
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1c1a17]/35">
                        {product.category}
                      </p>
                      <p className="text-[15px] font-medium text-[#1c1a17]">
                        {product.name}
                      </p>
                    </div>
                    {product.instructions && (
                      <p className="text-[13px] leading-relaxed text-[#1c1a17]/55 line-clamp-2 sm:line-clamp-none">
                        {product.instructions}
                      </p>
                    )}
                    {product.buy_url && (
                      <a
                        href={product.buy_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block w-fit rounded-full bg-[#1c1a17] px-5 py-1.5 font-mono text-[12px] text-white transition hover:bg-[#1c1a17]/80"
                      >
                        Buy Now
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      <footer className="border-t border-[#1c1a17]/8 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-6 text-center">
          <p className="font-mono text-[11px] leading-relaxed text-[#1c1a17]/30">
            Not a substitute for medical advice · Follow your doctor&apos;s
            instructions · Recover Bright
          </p>
        </div>
      </footer>
    </div>
  );
}
