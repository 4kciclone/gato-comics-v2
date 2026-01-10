// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers";

// REMOVA O IMPORT DA NAVBAR AQUI
// import { Navbar } from "@/components/layout/navbar"; <--- APAGUE ISSO

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
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-[#050505] text-white`}>
        <Providers>
          {/* REMOVA O COMPONENTE <Navbar /> DAQUI */}
          
          {/* Deixe apenas o children, assim quem decide o header é a sub-pasta */}
          {children} 
          
          <Toaster position="top-center" theme="dark" richColors />
        </Providers>
      </body>
    </html>
  );
}