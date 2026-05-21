import type { Metadata } from "next";
import "./globals.css";
import { TransactionStatus } from "@/components/wallet/TransactionStatus";

export const metadata: Metadata = {
  title: "VibeCheck — AI-Powered Creative Escrow",
  description:
    "Smart contracts that understand nuance. AI-powered escrow resolution for creative work and quality-based agreements on GenLayer.",
  openGraph: {
    title: "VibeCheck",
    description: "Smart contracts that understand creative intent.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--color-background)] text-[var(--color-foreground)]">
        {children}
        <TransactionStatus />
      </body>
    </html>
  );
}
