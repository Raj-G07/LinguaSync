import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LingoProvider } from "@/context/LingoContext";
import LinguaGuard from "@/components/core/LinguaGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LinguaSync",
  description: "Real-time Translated Communication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LingoProvider>
          <LinguaGuard>
            {children}
          </LinguaGuard>
        </LingoProvider>
      </body>
    </html>
  );
}
