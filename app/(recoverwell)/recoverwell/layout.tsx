import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Recover Well",
    template: "%s | Recover Well",
  },
  description:
    "Doctor-curated recovery products for your procedure. Recommended by your care team.",
};

export default function RecoverWellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
