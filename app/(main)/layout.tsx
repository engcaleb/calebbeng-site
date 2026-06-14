import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Caleb Eng",
  description:
    "Undergraduate researcher at Northwestern University studying economics and mathematical methods, with a focus on network econometrics and how formal methods illuminate social and economic systems.",
  openGraph: {
    title: "Caleb Eng",
    description:
      "Undergraduate researcher at Northwestern University studying economics and mathematical methods, with a focus on network econometrics and how formal methods illuminate social and economic systems.",
    type: "profile",
  },
  twitter: {
    card: "summary",
    title: "Caleb Eng",
    description:
      "Undergraduate researcher at Northwestern University studying economics and mathematical methods, with a focus on network econometrics.",
  },
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
