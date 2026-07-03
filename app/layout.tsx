import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Open Data Gacha | Berlin Open Data als Sammelkarten",
  description:
    "Sammle Berliner Open Data Datensätze als Trading Cards! Basierend auf echten Daten von daten.berlin.de. Kämpfe im Supertrumpf-Modus gegen den Computer.",
  keywords: [
    "Open Data",
    "Berlin",
    "Gacha",
    "Trading Cards",
    "Supertrumpf",
    "daten.berlin.de",
  ],
  authors: [{ name: "Technologiestiftung Berlin" }],
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1625",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="bg-background">
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased min-h-screen`}
      >
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
