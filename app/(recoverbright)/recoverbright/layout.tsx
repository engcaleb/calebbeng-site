import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "RecoverBright",
    template: "%s | RecoverBright",
  },
  description:
    "Doctor-curated recovery products for your procedure. Recommended by your care team.",
  openGraph: {
    title: "RecoverBright",
    description:
      "Doctor-curated recovery products for your procedure. Recommended by your care team.",
    siteName: "RecoverBright",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "RecoverBright",
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
