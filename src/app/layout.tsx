import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Orbitron, Unbounded, Inter } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SABYR — Fashion Brand",
    template: "%s | SABYR",
  },
  description: "SABYR — современный казахстанский fashion-бренд. Каталог одежды, AI-стилист, SABYR CLUB.",
  keywords: ["SABYR", "fashion", "одежда", "Казахстан", "бренд"],
  authors: [{ name: "SABYR" }],
  creator: "SABYR",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "ru_KZ",
    siteName: "SABYR",
    title: "SABYR — Fashion Brand",
    description: "Современный казахстанский fashion-бренд",
    images: [{ url: "/sabyr-avatar.png", width: 187, height: 187, alt: "SABYR" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SABYR",
    description: "Современный казахстанский fashion-бренд",
    images: ["/sabyr-avatar.png"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/sabyr-avatar.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${orbitron.variable} ${unbounded.variable} ${cormorant.variable} ${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
