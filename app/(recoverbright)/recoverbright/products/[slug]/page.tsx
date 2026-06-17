import { notFound } from "next/navigation";
import Image from "next/image";
import { getProducts } from "@/lib/recoverbright/products";
import { BackButton } from "../BackButton";
import type { Metadata } from "next";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.slug === slug);
  if (!product) return { title: "Not Found" };
  return {
    title: product.name,
    description: product.default_instructions ?? undefined,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  // Re-use getProducts and find by slug (small table, fine for Phase 1)
  const products = await getProducts();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  return (
    <div className="min-h-screen bg-[#f9f7f4]">
      {/* Back nav */}
      <div className="border-b border-[#1c1a17]/8 bg-white px-6 py-3">
        <div className="mx-auto max-w-xl">
              <BackButton />
        </div>
      </div>

      <main className="mx-auto max-w-xl px-6 py-10">
        <div className="rounded-xl border border-[#1c1a17]/8 bg-white p-6 sm:p-8">
          {/* Image */}
          <div className="mb-6 flex justify-center">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                width={160}
                height={160}
                className="rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-[120px] w-[120px] items-center justify-center rounded-lg bg-[#1c1a17]/4">
                <span className="text-4xl opacity-15">⬜</span>
              </div>
            )}
          </div>

          {/* Identity */}
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#1c1a17]/38">
            {product.category}
          </p>
          <h1 className="mt-1 text-[22px] font-semibold leading-snug text-[#1c1a17]">
            {product.name}
          </h1>

          {/* Instructions */}
          {product.default_instructions && (
            <div className="mt-5 border-t border-[#1c1a17]/8 pt-5">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#1c1a17]/35">
                Usage Guide
              </p>
              <p className="text-[14px] leading-[1.8] text-[#1c1a17]/65">
                {product.default_instructions}
              </p>
            </div>
          )}

          {/* Buy button */}
          <div className="mt-6 border-t border-[#1c1a17]/8 pt-6">
            {product.buy_url ? (
              <a
                href={product.buy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1c1a17] px-6 py-3.5 text-[14px] font-medium text-[#f9f7f4] transition hover:bg-[#1c1a17]/80"
              >
                Buy on Amazon
                <span aria-hidden="true" className="text-[#f9f7f4]/60">↗</span>
              </a>
            ) : (
              <div className="rounded-lg border border-[#1c1a17]/10 p-4 text-center">
                <p className="text-[13px] text-[#1c1a17]/45">
                  Purchase link coming soon.
                </p>
              </div>
            )}
            <p className="mt-3 text-center font-mono text-[10px] text-[#1c1a17]/28">
              Recommended by your doctor · Recover Bright
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
