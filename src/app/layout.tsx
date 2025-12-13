import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sadhana — साधना | Daily Practice for Developers & Creators",
  description: "A gamified productivity OS for developers, creators, and freelancers. Build habits, ship projects, and level up your daily practice. Made in India 🇮🇳",
  keywords: ["habit tracker", "productivity", "gamification", "developers", "freelancers", "project management", "sadhana", "daily practice", "India"],
  authors: [{ name: "Sadhana Team" }],
  creator: "Sadhana",
  publisher: "Sadhana",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://sadhana.app",
    siteName: "Sadhana",
    title: "Sadhana — साधना | Build Habits. Ship Projects. Level Up.",
    description: "A gamified productivity OS for developers, creators, and freelancers. Transform your daily routine into a journey of growth.",
    images: [
      {
        url: "/Logo/logo.png",
        width: 512,
        height: 512,
        alt: "Sadhana Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sadhana — साधना | Daily Practice for Developers",
    description: "Build habits, ship projects, and level up. A gamified productivity OS made in India.",
    images: ["/Logo/logo.png"],
  },
  icons: {
    icon: "/Logo/logo.png",
    apple: "/Logo/logo.png",
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
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
