import type { Metadata } from "next";
import { Fraunces, DM_Sans, Kaushan_Script, Caveat } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
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

const kaushanScript = Kaushan_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script-loaded",
  display: "swap",
  preload: true,
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-doodle-loaded",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.akshitas.com"),
  title: {
    template: "%s · Akshita Singh",
    default: "Akshita Singh, Product Designer",
  },
  description:
    "Product designer focused on enterprise and consumer experiences. Portfolio of case studies in UX, interaction design, and design systems.",
  openGraph: {
    title: "Akshita Singh, Product Designer",
    description:
      "Product designer focused on enterprise and consumer experiences. Portfolio of case studies in UX, interaction design, and design systems.",
    type: "website",
    siteName: "Akshita Singh",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Akshita Singh, Product Designer",
    description:
      "Product designer focused on enterprise and consumer experiences. Portfolio of case studies in UX, interaction design, and design systems.",
  },
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable} ${kaushanScript.variable} ${caveat.variable}`}>
      <head>
        {/* Runs at parse time, before any hydration or browser scroll restoration */}
        <script dangerouslySetInnerHTML={{ __html: "history.scrollRestoration='manual';window.scrollTo(0,0);" }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
