import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BAGCLUE — New & Preloved Luxury Items | México",
  description: "Bolsas y accesorios de lujo nuevos y preloved. Chanel, Hermès, Goyard, Céline, Louis Vuitton, Balenciaga. Autenticidad verificada por Entrupy. Querétaro, México.",
  keywords: "bolsas de lujo, Chanel México, Hermès México, luxury bags, preloved luxury, BAGCLUE",
  openGraph: {
    title: "BAGCLUE — New & Preloved Luxury Items",
    description: "Bolsas y accesorios de lujo verificados por Entrupy. Envíos desde México y París.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-white text-gray-900 font-sans antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
