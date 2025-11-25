import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import { cn } from "@/lib/utils";
import { AppProviders } from "@/components/providers/app-providers";
import { CommandPaletteWrapper } from "@/components/system/command-palette-wrapper";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Iqtisadiyyat Admin",
    template: "%s | Iqtisadiyyat Admin",
  },
  description:
    "Iqtisadiyyat.az xəbər kontentinin idarə edilməsi üçün Next.js 13 əsaslı admin panel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans", fontSans.variable)} suppressHydrationWarning>
        <AppProviders>
          {children}
          <CommandPaletteWrapper />
        </AppProviders>
      </body>
    </html>
  );
}
