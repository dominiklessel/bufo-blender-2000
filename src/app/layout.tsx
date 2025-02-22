import type { Metadata } from "next";
import { Lilita_One, Anek_Latin } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

const lilita = Lilita_One({
  variable: "--font-lilita",
  subsets: ["latin"],
  weight: ["400"],
});

const anek = Anek_Latin({
  variable: "--font-anek",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bufo Blender 2000",
  description: "Transform your images into a ribbiting masterpiece!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-title" content="BBlender" />
      </head>
      <body
        className={`${lilita.variable} ${anek.variable} ${anek.className} antialiased bg-cream-50 text-forest-800`}
      >
        <main>{children}</main>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
