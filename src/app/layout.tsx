import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "CrossPeças — Peças compatíveis, preço de fábrica",
  description: "Descubra qual carro mais barato usa a mesma peça que o seu. Economia real na hora da manutenção.",
  openGraph: { title: "CrossPeças", description: "Peças compatíveis, preço de fábrica." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} scroll-smooth`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
