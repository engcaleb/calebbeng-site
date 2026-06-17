import Link from "next/link";

export const metadata = {
  title: "RecoverBright — Doctor-Curated Recovery Guides",
  description:
    "Give your patients a branded recovery product guide they can trust. Built for ophthalmology practices.",
};

export default function RecoverBrightHome() {
  return (
    <div className="min-h-screen bg-[#f9f7f4] text-[#1c1a17]">
      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-[#1c1a17]/60">
          RecoverBright
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/recoverbright/portal/login"
            className="text-[13px] text-[#1c1a17]/50 hover:text-[#1c1a17] transition"
          >
            Sign in
          </Link>
          <Link
            href="/recoverbright/portal/register"
            className="rounded bg-[#1c1a17] px-4 py-2 text-[13px] font-medium text-[#f9f7f4] hover:bg-[#1c1a17]/80 transition"
          >
            Create portal
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 pb-24 pt-20 text-center md:px-12 md:pt-32">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-[#1c1a17]/40">
          Currently in demo
        </p>
        <h1 className="text-4xl font-medium leading-tight tracking-tight text-[#1c1a17] md:text-5xl">
          Your patients deserve a
          <br />
          better recovery guide.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-[#1c1a17]/55">
          Give every patient a curated list of recovery products — branded with
          your practice, shareable as a link, and printable as a PDF for
          discharge packets.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/recoverbright/portal/register"
            className="rounded bg-[#1c1a17] px-6 py-3 text-[14px] font-medium text-[#f9f7f4] hover:bg-[#1c1a17]/80 transition"
          >
            Create your portal →
          </Link>
          <Link
            href="/recoverbright/portal/login"
            className="rounded px-6 py-3 text-[14px] text-[#1c1a17]/50 hover:text-[#1c1a17] transition"
          >
            Sign in to existing account
          </Link>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="border-y border-[#e8e3da] bg-white px-6 py-20 md:px-12">
        <div className="mx-auto max-w-4xl">
          <p className="mb-12 text-center font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/40">
            How it works
          </p>
          <div className="grid gap-10 md:grid-cols-3">
            <Step
              number="01"
              title="Set up your practice"
              body="Add your practice name, your name, and upload your logo. Takes two minutes. Your branding appears on everything patients see."
            />
            <Step
              number="02"
              title="Build your recovery page"
              body="Choose from our curated product catalog. Add your own instructions for each product, or use the defaults we've written. One page per surgery type."
            />
            <Step
              number="03"
              title="Share with patients"
              body="Send the link by text or email, or download a branded PDF for your discharge packets. Patients get to the right products in one tap."
            />
          </div>
        </div>
      </section>

      {/* ── What you get ─────────────────────────────────────── */}
      <section className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-4xl">
          <p className="mb-12 text-center font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/40">
            What your patients receive
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <Deliverable
              label="Patient web page"
              title="A page they can open from their phone."
              body="Your logo and name at the top. Product cards with photos, your custom instructions, and a direct link to buy. Works on any device, no app needed."
              tag="recoverbright.com/dr/your-practice/lasik"
            />
            <Deliverable
              label="Downloadable PDF"
              title="Ready for discharge packets."
              body="Same branding, same products, same instructions — formatted for print. Each product has a QR code so patients can order straight from the page."
              tag="PDF · prints on standard letter paper"
            />
          </div>
        </div>
      </section>

      {/* ── Who it's for ─────────────────────────────────────── */}
      <section className="border-t border-[#e8e3da] bg-white px-6 py-20 md:px-12">
        <div className="mx-auto max-w-4xl">
          <p className="mb-12 text-center font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/40">
            Built for
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <SpecialtyCard
              title="LASIK & refractive surgery"
              body="Pre-loaded with the products your patients actually need: preservative-free drops, UV eyewear, sleep shields, blue light glasses, and more."
            />
            <SpecialtyCard
              title="Cataract surgery"
              body="Curated for an older patient population — protective eyewear that fits over existing glasses, macular supplements, and anti-nausea support."
            />
            <SpecialtyCard
              title="Any surgery type"
              body="LASIK and cataract are the starting point. Add Dry Eye, Retinal, Corneal, or any specialty — each gets its own page and its own product set."
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="px-6 py-24 text-center md:px-12">
        <div className="mx-auto max-w-lg">
          <h2 className="text-2xl font-medium tracking-tight text-[#1c1a17] md:text-3xl">
            Ready to give patients a better experience?
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[#1c1a17]/50">
            Set up your portal in minutes. No contract, no commitment.
          </p>
          <Link
            href="/recoverbright/portal/register"
            className="mt-8 inline-block rounded bg-[#1c1a17] px-8 py-3 text-[14px] font-medium text-[#f9f7f4] hover:bg-[#1c1a17]/80 transition"
          >
            Create your portal →
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-[#e8e3da] px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/35">
            RecoverBright
          </p>
          <Link
            href="/recoverbright/portal/login"
            className="font-mono text-[11px] text-[#1c1a17]/35 hover:text-[#1c1a17] transition"
          >
            Doctor sign in →
          </Link>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Step({
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
    <div className="rounded-xl border border-[#e8e3da] bg-white p-6">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#1c1a17]/35">
        {label}
      </p>
      <h3 className="mb-2 text-[16px] font-medium text-[#1c1a17]">{title}</h3>
      <p className="mb-4 text-[14px] leading-relaxed text-[#1c1a17]/55">{body}</p>
      <p className="font-mono text-[11px] text-[#1c1a17]/30">{tag}</p>
    </div>
  );
}

function SpecialtyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[#e8e3da] p-5">
      <h3 className="mb-2 text-[15px] font-medium text-[#1c1a17]">{title}</h3>
      <p className="text-[13px] leading-relaxed text-[#1c1a17]/55">{body}</p>
    </div>
  );
}
