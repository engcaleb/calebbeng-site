import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Recover Bright",
    template: "%s | Recover Bright",
  },
  description:
    "Doctor-curated recovery products for your procedure. Recommended by your care team.",
  openGraph: {
    title: "Recover Bright",
    description:
      "Doctor-curated recovery products for your procedure. Recommended by your care team.",
    siteName: "Recover Bright",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Recover Bright",
    description:
      "Doctor-curated recovery products for your procedure. Recommended by your care team.",
  },
};

export default function RecoverBrightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
