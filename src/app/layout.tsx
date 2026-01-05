import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers"; // <-- Importe o novo componente

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gato Comics V2",
  description: "Plataforma de Leitura de Mangás e Webtoons",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {/* Envolva os 'children' com o novo Provedor */}
        <Providers>
          {children}
          <Toaster position="top-center" theme="dark" richColors />
        </Providers>
      </body>
    </html>
  );
}