import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  },
  twitter: {
    card: "summary_large_image",
    title: "SABYR",
    description: "Современный казахстанский fashion-бренд",
  },
  icons: {
    icon: "/favicon.ico",
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
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
