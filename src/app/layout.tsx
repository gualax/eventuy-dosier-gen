import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eventuy - Generador de Dossieres",
  description:
    "Genera dossieres profesionales de espacios y publícalos en Eventuy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
