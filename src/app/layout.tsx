import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-cream`}
      >
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
