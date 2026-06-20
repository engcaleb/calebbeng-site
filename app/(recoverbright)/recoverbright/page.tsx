import Link from "next/link";
import { getFeaturedArticles } from "@/lib/recoverbright/articles";
import { TrackedCTALink } from "./TrackedCTALink";

export const metadata = {
  title: "RecoverBright — Recovery Guides From Your Care Team",
  description:
    "Doctor-curated recovery product guides for patients preparing for surgery. Trusted recommendations, one tap away.",
};

export default async function RecoverBrightHome() {
  const featuredArticles = await getFeaturedArticles();

  return (
    <div className="min-h-screen bg-[#f9f7f4] text-[#1c1a17]">
      {/* ── Nav ──────────────────────────────────────────────── */}
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
            href="/recoverbright/portal/login"
            className="text-[13px] text-[#1c1a17]/50 hover:text-[#1c1a17] transition"
          >
            Provider sign in
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-20 text-center md:px-12 md:pt-28">
        <h1 className="text-4xl font-medium leading-tight tracking-tight md:text-5xl">
          Recover with confidence.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-[#1c1a17]/55">
          Doctor-curated recovery guides with the products you'll actually need.
          Recommended by your care team, ready when you are.
        </p>
      </section>

      {/* ── Two-path fork ────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 pb-24 md:px-12">
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="#for-patients"
            className="group rounded-xl border border-[#e8e3da] bg-white p-6 transition hover:border-[#1c1a17]/25"
          >
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#1c1a17]/35">
              For patients
            </p>
            <h2 className="text-[17px] font-medium text-[#1c1a17]">
              I have an upcoming procedure
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#1c1a17]/50">
              Find your doctor's recovery guide, learn what to expect, and get
              the products you'll need.
            </p>
            <p className="mt-4 text-[13px] font-medium text-[#1c1a17]/40 group-hover:text-[#1c1a17] transition">
              Learn more ↓
            </p>
          </Link>

          <Link
            href="#for-providers"
            className="group rounded-xl border border-[#e8e3da] bg-white p-6 transition hover:border-[#1c1a17]/25"
          >
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#1c1a17]/35">
              For providers
            </p>
            <h2 className="text-[17px] font-medium text-[#1c1a17]">
              I'm a healthcare provider
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#1c1a17]/50">
              Create branded recovery product pages your patients can trust.
              Set up in minutes.
            </p>
            <p className="mt-4 text-[13px] font-medium text-[#1c1a17]/40 group-hover:text-[#1c1a17] transition">
              Learn more ↓
            </p>
          </Link>
        </div>
      </section>

      {/* ── For patients ─────────────────────────────────────── */}
      <section
        id="for-patients"
        className="scroll-mt-8 border-t border-[#e8e3da] bg-white px-6 py-20 md:px-12"
      >
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/40">
            For patients
          </p>
          <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
            Preparing for a procedure?
          </h2>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[#1c1a17]/55">
            Your doctor may have created a personalized recovery guide for you
            through RecoverBright — a curated list of products to help you heal
            comfortably. Ask your care team for your link, or browse our
            articles to learn what to expect.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <PatientStep
              number="01"
              title="Get your link"
              body="Your doctor or surgical coordinator will share a recovery page link with you — by text, email, or in your discharge packet."
            />
            <PatientStep
              number="02"
              title="See what you need"
              body="Your recovery page shows every product your doctor recommends, with clear instructions and direct links to buy."
            />
            <PatientStep
              number="03"
              title="Recover with confidence"
              body="No guessing, no searching — just the products your care team trusts, ready before your procedure."
            />
          </div>
        </div>
      </section>

      {/* ── Featured articles ─────────────────────────────────── */}
      {featuredArticles.length > 0 && (
        <section className="border-t border-[#e8e3da] px-6 py-20 md:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/40">
                  Articles
                </p>
                <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
                  Understand your procedure
                </h2>
              </div>
              <Link
                href="/recoverbright/articles"
                className="text-[13px] text-[#1c1a17]/40 hover:text-[#1c1a17] transition"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.slice(0, 3).map((article) => (
                <Link
                  key={article.id}
                  href={`/recoverbright/articles/${article.slug}`}
                  className="group overflow-hidden rounded-xl border border-[#e8e3da] bg-white transition hover:border-[#1c1a17]/20"
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
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#1c1a17]/30">
                        {article.category}
                      </p>
                    )}
                    <h3 className="text-[15px] font-medium text-[#1c1a17] group-hover:text-[#1c1a17]/80 transition">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="mt-2 text-[13px] leading-relaxed text-[#1c1a17]/50 line-clamp-2">
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

      {/* ── For providers ─────────────────────────────────────── */}
      <section
        id="for-providers"
        className="scroll-mt-8 border-t border-[#e8e3da] bg-white px-6 py-20 md:px-12"
      >
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/40">
            For providers
          </p>
          <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
            Give patients a better recovery experience.
          </h2>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[#1c1a17]/55">
            Build branded recovery product pages in minutes. Your patients get a
            curated list of exactly what they need — shareable as a link or
            printable as a PDF for discharge packets.
          </p>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <ProviderStep
              number="01"
              title="Set up your practice"
              body="Add your practice name and logo. Your branding appears on everything patients see."
            />
            <ProviderStep
              number="02"
              title="Build your recovery page"
              body="Choose from our curated product catalog. Add your own instructions, or use our defaults. One page per procedure type."
            />
            <ProviderStep
              number="03"
              title="Share with patients"
              body="Send the link by text or email, or download a branded PDF for discharge packets. Patients get to the right products in one tap."
            />
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Deliverable
              label="Patient web page"
              title="A link they can open from their phone."
              body="Your logo and name at the top. Product cards with photos, your instructions, and a direct link to buy. Works on any device."
              tag="recoverbright.com/dr/your-practice/..."
            />
            <Deliverable
              label="Downloadable PDF"
              title="Ready for discharge packets."
              body="Same branding, same products — formatted for print. QR code links patients back to the web version for easy ordering."
              tag="PDF · standard letter paper"
            />
          </div>

          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <TrackedCTALink
              href="/recoverbright/portal/register"
              event="provider_cta_clicked"
              location="provider_section"
              className="rounded bg-[#1c1a17] px-6 py-3 text-[14px] font-medium text-[#f9f7f4] hover:bg-[#1c1a17]/80 transition"
            >
              Create your portal →
            </TrackedCTALink>
            <Link
              href="/recoverbright/portal/login"
              className="rounded px-6 py-3 text-[14px] text-[#1c1a17]/50 hover:text-[#1c1a17] transition"
            >
              Sign in to existing account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="px-6 py-24 text-center md:px-12">
        <div className="mx-auto max-w-lg">
          <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
            Recovery starts before the procedure.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[#1c1a17]/50">
            Whether you're a patient preparing for surgery or a provider
            building better discharge resources — RecoverBright helps you get it
            right.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/recoverbright/articles"
              className="rounded border border-[#1c1a17]/15 px-6 py-3 text-[14px] font-medium text-[#1c1a17] hover:bg-[#1c1a17]/5 transition"
            >
              Browse articles
            </Link>
            <TrackedCTALink
              href="/recoverbright/portal/register"
              event="provider_cta_clicked"
              location="footer_cta"
              className="rounded bg-[#1c1a17] px-6 py-3 text-[14px] font-medium text-[#f9f7f4] hover:bg-[#1c1a17]/80 transition"
            >
              Create provider portal →
            </TrackedCTALink>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
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
              Provider sign in →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function PatientStep({
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

function ProviderStep({
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

function Deliverable({
  label,
  title,
  body,
  tag,
}: {
  label: string;
  title: string;
  body: string;
  tag: string;
}) {
  return (
    <div className="rounded-xl border border-[#e8e3da] p-6">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#1c1a17]/35">
        {label}
      </p>
      <h3 className="mb-2 text-[16px] font-medium text-[#1c1a17]">{title}</h3>
      <p className="mb-4 text-[14px] leading-relaxed text-[#1c1a17]/55">
        {body}
      </p>
      <p className="font-mono text-[11px] text-[#1c1a17]/30">{tag}</p>
    </div>
  );
}
