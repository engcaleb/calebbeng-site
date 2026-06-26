import Link from "next/link";
import { getFeaturedArticles } from "@/lib/recoverbright/articles";
import { getSurgeryTypes } from "@/lib/recoverbright/portal-pages";
import { getDefaultProductCounts } from "@/lib/recoverbright/products";
import { surgeryTypeToUrlSegment } from "@/lib/recoverbright/pages";

export const metadata = {
  title: "RecoverBright — Recovery Guides From Your Care Team",
  description:
    "Doctor-curated recovery guides with the products you'll actually need — organized by procedure, explained in plain language.",
};

export default async function RecoverBrightHome() {
  const [featuredArticles, surgeryTypes, productCounts] = await Promise.all([
    getFeaturedArticles(),
    getSurgeryTypes(),
    getDefaultProductCounts(),
  ]);

  return (
    <div className="min-h-screen bg-[#f9f7f4] text-[#1c1a17]">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-[#1c1a17]/60">
          RecoverBright
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/recoverbright/articles"
            className="text-[13px] text-[#1c1a17]/50 hover:text-[#1c1a17] transition"
          >
            Articles
          </Link>
          <Link
            href="#browse"
            className="text-[13px] text-[#1c1a17]/50 hover:text-[#1c1a17] transition"
          >
            Browse
          </Link>
          <Link
            href="/recoverbright/portal/login"
            className="text-[13px] text-[#1c1a17]/35 hover:text-[#1c1a17] transition"
          >
            Provider login →
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-20 text-center md:px-12 md:pt-28">
        <h1 className="text-4xl font-medium leading-tight tracking-tight md:text-5xl lg:text-[3.5rem]">
          Know exactly what you<br className="hidden sm:block" /> need to
          recover.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-[#1c1a17]/55">
          Clear, honest recovery guides with the products your care team
          recommends — organized by procedure and explained in plain language.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="#browse"
            className="rounded-lg bg-[#1c1a17] px-6 py-3 text-[14px] font-medium text-[#f9f7f4] transition hover:bg-[#1c1a17]/80"
          >
            Browse by procedure ↓
          </Link>
          <Link
            href="/recoverbright/articles"
            className="rounded-lg border border-[#1c1a17]/15 px-6 py-3 text-[14px] text-[#1c1a17] transition hover:bg-[#1c1a17]/5"
          >
            Read recovery guides →
          </Link>
        </div>
      </section>

      {/* ── Browse by procedure ──────────────────────────────── */}
      <section
        id="browse"
        className="scroll-mt-8 border-t border-[#e8e3da] bg-white px-6 py-16 md:px-12"
      >
        <div className="mx-auto max-w-4xl">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/40">
            Browse by procedure
          </p>
          <h2 className="mb-8 text-2xl font-medium tracking-tight md:text-3xl">
            Find your recovery guide.
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {surgeryTypes.map((surgeryType) => {
              const count = productCounts[surgeryType] ?? 0;
              const slug = surgeryTypeToUrlSegment(surgeryType);
              return (
                <Link
                  key={surgeryType}
                  href={`/recoverbright/browse/${slug}`}
                  className="group flex flex-col justify-between rounded-xl border border-[#e8e3da] bg-[#f9f7f4] p-5 transition hover:border-[#1c1a17]/25 hover:bg-white"
                >
                  <div>
                    <h3 className="text-[17px] font-medium text-[#1c1a17]">
                      {surgeryType}
                    </h3>
                    {count > 0 && (
                      <p className="mt-1.5 font-mono text-[11px] text-[#1c1a17]/40">
                        {count} recovery essential{count !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  <p className="mt-5 text-[13px] font-medium text-[#1c1a17]/40 transition group-hover:text-[#1c1a17]">
                    See guide →
                  </p>
                </Link>
              );
            })}
          </div>
          <p className="mt-8 text-[13px] text-[#1c1a17]/40">
            Have a personalized link from your care team?{" "}
            <span className="text-[#1c1a17]/60">
              Use that — it's tailored specifically for you.
            </span>
          </p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="border-t border-[#e8e3da] px-6 py-16 md:px-12">
        <div className="mx-auto max-w-4xl">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/40">
            How it works
          </p>
          <h2 className="mb-10 text-2xl font-medium tracking-tight md:text-3xl">
            Simple from the start.
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <HowItWorksStep
              number="01"
              title="Browse or get your link"
              body="Your doctor may send you a personalized recovery page. Or browse by procedure type to see what physicians generally recommend."
            />
            <HowItWorksStep
              number="02"
              title="See every product you need"
              body="Each guide lists products with clear instructions — what they are, why they help, and a direct link to purchase."
            />
            <HowItWorksStep
              number="03"
              title="Recover with confidence"
              body="No guessing, no searching. Everything your care team recommends, organized and ready before your procedure day."
            />
          </div>
        </div>
      </section>

      {/* ── Recovery guides / Articles ───────────────────────── */}
      {featuredArticles.length > 0 && (
        <section className="border-t border-[#e8e3da] bg-white px-6 py-16 md:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/40">
                  Recovery guides
                </p>
                <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
                  Understand your procedure.
                </h2>
              </div>
              <Link
                href="/recoverbright/articles"
                className="shrink-0 text-[13px] text-[#1c1a17]/40 transition hover:text-[#1c1a17]"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.slice(0, 3).map((article) => (
                <Link
                  key={article.id}
                  href={`/recoverbright/articles/${article.slug}`}
                  className="group overflow-hidden rounded-xl border border-[#e8e3da] bg-[#f9f7f4] transition hover:border-[#1c1a17]/20"
                >
                  {article.image_url && (
                    <img
                      src={article.image_url}
                      alt=""
                      className="h-36 w-full object-cover"
                    />
                  )}
                  <div className="p-5">
                    {article.category && (
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#1c1a17]/35">
                        {article.category}
                      </p>
                    )}
                    <h3 className="text-[15px] font-medium text-[#1c1a17] transition group-hover:text-[#1c1a17]/80">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#1c1a17]/50">
                        {article.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trust ───────────────────────────────────────────── */}
      <section className="border-t border-[#e8e3da] px-6 py-16 md:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-medium tracking-tight md:text-2xl">
            Honest recommendations — never sponsored.
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#1c1a17]/55">
            Products appear on RecoverBright because physicians chose them —
            not because companies paid for placement. Our guides reflect what
            care teams actually recommend to their patients.
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-[#e8e3da] px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/35">
            RecoverBright
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/recoverbright/articles"
              className="font-mono text-[11px] text-[#1c1a17]/35 transition hover:text-[#1c1a17]"
            >
              Articles
            </Link>
            <Link
              href="#browse"
              className="font-mono text-[11px] text-[#1c1a17]/35 transition hover:text-[#1c1a17]"
            >
              Browse
            </Link>
            <Link
              href="/recoverbright/privacy"
              className="font-mono text-[11px] text-[#1c1a17]/35 transition hover:text-[#1c1a17]"
            >
              Privacy
            </Link>
            <Link
              href="/recoverbright/portal/login"
              className="font-mono text-[11px] text-[#1c1a17]/35 transition hover:text-[#1c1a17]"
            >
              Provider login →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HowItWorksStep({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-[#1c1a17]/30">
        {number}
      </p>
      <h3 className="mb-2 text-[16px] font-medium text-[#1c1a17]">{title}</h3>
      <p className="text-[14px] leading-relaxed text-[#1c1a17]/55">{body}</p>
    </div>
  );
}
