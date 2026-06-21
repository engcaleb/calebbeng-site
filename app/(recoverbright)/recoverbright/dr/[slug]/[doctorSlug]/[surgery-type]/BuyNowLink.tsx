"use client";

import Link from "next/link";
import { rbTrack } from "@/lib/recoverbright/analytics";

export function BuyNowLink({
  href,
  productSlug,
  practiceSlug,
  surgeryType,
}: {
  href: string;
  productSlug: string;
  practiceSlug: string;
  surgeryType: string;
}) {
  return (
    <Link
      href={href}
      onClick={() =>
        rbTrack("buy_now_clicked", {
          product_slug: productSlug,
          practice_slug: practiceSlug,
          surgery_type: surgeryType,
        })
      }
      className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#1c1a17] px-4 py-2 text-[13px] font-medium text-[#f9f7f4] transition hover:bg-[#1c1a17]/80"
    >
      Buy Now
      <span aria-hidden="true">→</span>
    </Link>
  );
}
