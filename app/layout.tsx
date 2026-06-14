import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
