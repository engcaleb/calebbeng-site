import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "RecoverBright",
    template: "%s | RecoverBright",
  },
  description:
    "Doctor-curated recovery guides with the products you need. Recommended by your care team, ready when you are.",
  openGraph: {
    title: "RecoverBright",
    description:
      "Doctor-curated recovery guides with the products you need. Recommended by your care team, ready when you are.",
    siteName: "RecoverBright",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "RecoverBright",
    description:
      "Doctor-curated recovery guides with the products you need. Recommended by your care team, ready when you are.",
  },
};

export default function RecoverBrightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
