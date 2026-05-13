import type { Metadata } from "next";
import { Playfair_Display, Inter, Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";
import ConditionalLayout from "@/components/ConditionalLayout";

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

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-manrope",
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
    <html lang="es" className={`${playfair.variable} ${inter.variable} ${cormorant.variable} ${manrope.variable}`}>
      <body className="bg-white text-gray-900 font-sans antialiased">
        <ClientProviders>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </ClientProviders>
      </body>
    </html>
  );
}
