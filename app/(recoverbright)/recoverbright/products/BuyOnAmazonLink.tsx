"use client";

import { rbTrack } from "@/lib/recoverbright/analytics";

export function BuyOnAmazonLink({
  href,
  productSlug,
}: {
  href: string;
  productSlug: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        rbTrack("buy_on_amazon_clicked", { product_slug: productSlug })
      }
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1c1a17] px-6 py-3.5 text-[14px] font-medium text-[#f9f7f4] transition hover:bg-[#1c1a17]/80"
    >
      Buy on Amazon
      <span aria-hidden="true" className="text-[#f9f7f4]/60">
        ↗
      </span>
    </a>
  );
}
