import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const spaceGrotesk = localFont({
  src: "./fonts/SpaceGrotesk-Variable.ttf",
  variable: "--font-display",
  weight: "500 700",
});

const plusJakarta = localFont({
  src: "./fonts/PlusJakartaSans-Variable.ttf",
  variable: "--font-body",
  weight: "400 800",
});

export const metadata: Metadata = {
  title: "FotoKamek - Generator Foto 4x6",
  description:
    "Upload foto ape ajak, auto-crop langsung njadi foto 4x6 sung rapi. ndaan perlu ke studio agek.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${spaceGrotesk.variable} ${plusJakarta.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
