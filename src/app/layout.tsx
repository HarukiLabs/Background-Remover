import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Nacht Remover - Free Background Removal Tool",
  description: "Remove backgrounds from your images instantly, right in your browser. Free, private, and no uploads required. Powered by AI.",
  keywords: ["background removal", "image editor", "photo editor", "AI", "free", "privacy", "nacht remover"],
  authors: [{ name: "Nacht Remover" }],
  creator: "Nacht Remover",
  publisher: "Nacht Remover",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nacht-remover.vercel.app",
    siteName: "Nacht Remover",
    title: "Nacht Remover - Free Background Removal Tool",
    description: "Remove backgrounds from your images instantly. Free, private, no uploads required.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nacht Remover - Free Background Removal Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nacht Remover - Free Background Removal Tool",
    description: "Remove backgrounds from your images instantly. Free, private, no uploads required.",
    images: ["/og-image.png"],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  themeColor: "#0a0a0a",
};

// Structured data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Nacht Remover",
  description: "Remove backgrounds from your images instantly, right in your browser. Free, private, and no uploads required.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  browserRequirements: "Requires JavaScript and WebAssembly support",
  featureList: [
    "AI-powered background removal",
    "Client-side processing",
    "No data uploads",
    "Free to use",
    "Before/after comparison",
    "PNG download with transparency",
  ],
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${inter.variable} antialiased gradient-bg min-h-screen`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
