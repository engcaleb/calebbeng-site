import Link from "next/link";
import { getPublishedArticles } from "@/lib/recoverbright/articles";
import { ArticlesClient } from "./ArticlesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles — RecoverBright",
  description:
    "Recovery guides and procedure information to help you prepare.",
  openGraph: {
    title: "Articles — RecoverBright",
    description:
      "Recovery guides and procedure information to help you prepare.",
    url: "https://recoverbright.com/articles",
    siteName: "RecoverBright",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Articles — RecoverBright",
    description:
      "Recovery guides and procedure information to help you prepare.",
  },
  alternates: {
    canonical: "https://recoverbright.com/articles",
  },
};

export default async function ArticlesPage() {
  const articles = await getPublishedArticles();

  return (
    <div className="min-h-screen bg-[#f9f7f4] text-[#1c1a17]">
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link
          href="/recoverbright"
          className="font-mono text-[12px] uppercase tracking-[0.28em] text-[#1c1a17]/60 hover:text-[#1c1a17] transition"
        >
          RecoverBright
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="#"
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

      <section className="mx-auto max-w-3xl px-6 pb-24 pt-12 md:px-12">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-[#1c1a17]/40">
          Articles
        </p>
        <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
          Recovery guides & resources
        </h1>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[#1c1a17]/55">
          Information to help you understand your procedure and prepare for a
          smooth recovery.
        </p>

        <ArticlesClient articles={articles} />
      </section>

      <footer className="border-t border-[#e8e3da] px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/35">
            RecoverBright
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/recoverbright/privacy"
              className="font-mono text-[11px] text-[#1c1a17]/35 hover:text-[#1c1a17] transition"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
