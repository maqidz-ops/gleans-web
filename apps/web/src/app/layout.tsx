import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://gleans.my.id"),
  title: {
    default: "Gleans - Partner penulisan akademikmu",
    template: "%s | Gleans",
  },
  description:
    "Platform all-in-one untuk mahasiswa: cek AI dengan GPTZero, parafrase teks, dan buat sitasi APA 7 atau IEEE dengan cepat.",
  icons: { icon: [{ url: "/favicon.png", type: "image/png" }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
