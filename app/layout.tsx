import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-display-loaded",
  display: "swap",
  preload: true,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-body-loaded",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    template: "%s — Akshita",
    default: "Akshita — Product Designer",
  },
  description:
    "Product designer focused on enterprise and consumer experiences. Portfolio of case studies in UX, interaction design, and design systems.",
  metadataBase: new URL("https://placeholder.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Akshita Portfolio",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
