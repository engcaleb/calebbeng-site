import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getSurgeryTypes,
  getDefaultProductsForSurgeryType,
} from "@/lib/recoverbright/portal-pages";
import {
  urlToSurgeryType,
  surgeryTypeToUrlSegment,
} from "@/lib/recoverbright/pages";

export const revalidate = 3600;

type Props = { params: Promise<{ surgeryType: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { surgeryType: slug } = await params;
  const surgeryType = urlToSurgeryType(slug);
  return {
    title: `${surgeryType} Recovery Guide — RecoverBright`,
    description: `Recommended recovery products for ${surgeryType} — curated based on physician recommendations.`,
  };
}

export default async function BrowseProcedurePage({ params }: Props) {
  const { surgeryType: slug } = await params;
  const surgeryType = urlToSurgeryType(slug);

  const [surgeryTypes, products] = await Promise.all([
    getSurgeryTypes(),
    getDefaultProductsForSurgeryType(surgeryType),
  ]);

  if (!surgeryTypes.includes(surgeryType)) notFound();

  const categoryMap = new Map<string, typeof products>();
  for (const p of products) {
    const list = categoryMap.get(p.category) ?? [];
    list.push(p);
    categoryMap.set(p.category, list);
  }
  const categories = Array.from(categoryMap.entries());

  const otherTypes = surgeryTypes.filter((t) => t !== surgeryType);

  return (
    <div className="min-h-screen bg-[#f9f7f4] text-[#1c1a17]">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between border-b border-[#e8e3da] px-6 py-5 md:px-12">
        <Link
          href="/recoverbright"
          className="font-mono text-[12px] uppercase tracking-[0.28em] text-[#1c1a17]/60 hover:text-[#1c1a17] transition"
        >
          RecoverBright
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/recoverbright/articles"
            className="text-[13px] text-[#1c1a17]/50 hover:text-[#1c1a17] transition"
          >
            Articles
          </Link>
          <Link
            href="/recoverbright/portal/login"
            className="text-[13px] text-[#1c1a17]/35 hover:text-[#1c1a17] transition"
          >
            Provider login →
          </Link>
        </div>
      </nav>

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="border-b border-[#e8e3da] bg-white px-6 py-12 md:px-12">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/recoverbright"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1c1a17]/35 hover:text-[#1c1a17] transition"
          >
            ← All procedures
          </Link>
          <h1 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">
            {surgeryType} Recovery Guide
          </h1>
          <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-[#1c1a17]/55">
            {products.length > 0
              ? `${products.length} recommended products, curated based on what physicians most commonly recommend for ${surgeryType} recovery.`
              : `Recovery guidance for ${surgeryType}.`}
          </p>
          <p className="mt-5 inline-block rounded-full bg-[#e8f2ec] px-4 py-1.5 font-mono text-[11px] text-[#5c8a6e]">
            Have a personalized link from your care team? That takes priority — it's tailored for you.
          </p>
        </div>
      </div>

      {/* ── Products ────────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-6 py-12 md:px-12">
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[#1c1a17]/40">
              No products configured for this procedure yet.
            </p>
            <Link
              href="/recoverbright/articles"
              className="mt-4 inline-block text-[14px] text-[#5c8a6e] hover:text-[#4a7a5c] transition"
            >
              Browse recovery articles →
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map(([category, catProducts]) => (
              <div key={category}>
                <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.25em] text-[#1c1a17]/35">
                  {category}
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {catProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex gap-4 rounded-xl border border-[#e8e3da] bg-white p-5 transition hover:border-[#d0e6d8]"
                    >
                      {product.image_url && (
                        <Image
                          src={product.image_url}
                          alt=""
                          width={72}
                          height={72}
                          className="h-[72px] w-[72px] shrink-0 rounded-lg object-contain"
                        />
                      )}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="text-[15px] font-medium leading-snug text-[#1c1a17]">
                          {product.name}
                        </p>
                        {product.default_instructions && (
                          <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[#1c1a17]/55">
                            {product.default_instructions}
                          </p>
                        )}
                        {product.buy_url ? (
                          <a
                            href={product.buy_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#5c8a6e] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#4a7a5c]"
                          >
                            View on Amazon →
                          </a>
                        ) : (
                          <p className="mt-3 font-mono text-[11px] text-[#1c1a17]/30">
                            Link coming soon
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Other procedures ──────────────────────────────── */}
        {otherTypes.length > 0 && (
          <div className="mt-16 border-t border-[#e8e3da] pt-12">
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.25em] text-[#1c1a17]/35">
              Other procedures
            </p>
            <div className="flex flex-wrap gap-3">
              {otherTypes.map((t) => (
                <Link
                  key={t}
                  href={`/recoverbright/browse/${surgeryTypeToUrlSegment(t)}`}
                  className="rounded-lg border border-[#e8e3da] bg-white px-4 py-2.5 text-[14px] text-[#1c1a17]/70 transition hover:border-[#5c8a6e] hover:text-[#5c8a6e]"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Medical disclaimer ────────────────────────────── */}
        <p className="mt-12 text-center font-mono text-[11px] text-[#1c1a17]/30">
          Not a substitute for medical advice. Always follow your doctor's
          instructions.
        </p>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-[#e8e3da] px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/35">
            RecoverBright
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/recoverbright/articles"
              className="font-mono text-[11px] text-[#1c1a17]/35 hover:text-[#1c1a17] transition"
            >
              Articles
            </Link>
            <Link
              href="/recoverbright/privacy"
              className="font-mono text-[11px] text-[#1c1a17]/35 hover:text-[#1c1a17] transition"
            >
              Privacy
            </Link>
            <Link
              href="/recoverbright/portal/login"
              className="font-mono text-[11px] text-[#1c1a17]/35 hover:text-[#1c1a17] transition"
            >
              Provider login →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
