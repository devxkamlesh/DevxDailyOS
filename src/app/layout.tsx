import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://sadhana.app"),
  title: "Sadhana — Show up. Every day.",
  description: "A personal discipline system for developers, creators, and independent builders. Build consistency without pressure, noise, or motivation hacks.",
  keywords: ["discipline", "consistency", "daily practice", "developers", "creators", "independent builders", "sadhana", "habits", "focus"],
  authors: [{ name: "Sadhana Team" }],
  creator: "Sadhana",
  publisher: "Sadhana",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sadhana.app",
    siteName: "Sadhana",
    title: "Sadhana — Show up. Every day.",
    description: "A personal discipline system for developers, creators, and independent builders. Build consistency without pressure, noise, or motivation hacks.",
    images: [
      {
        url: "/Logo/logo.svg",
        width: 512,
        height: 512,
        alt: "Sadhana Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sadhana — Show up. Every day.",
    description: "A personal discipline system for developers, creators, and independent builders.",
    images: ["/Logo/logo.svg"],
  },
  icons: {
    icon: "/Logo/logo.svg",
    apple: "/Logo/logo.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <head>
        <meta name="theme-color" content="#4a5568" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
