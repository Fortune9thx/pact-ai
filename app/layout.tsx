import type { Metadata } from "next";
import "./globals.css";
import { TransactionStatus } from "@/components/wallet/TransactionStatus";

export const metadata: Metadata = {
  title: "Pact — AI-Powered Creative Escrow",
  description:
    "Smart contracts that understand nuance. AI-powered escrow resolution for creative work and quality-based agreements on GenLayer.",
  openGraph: {
    title: "Pact",
    description: "Smart contracts that understand creative intent.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-[var(--color-background)] text-[var(--color-foreground)]">
        {children}
        <TransactionStatus />
      </body>
    </html>
  );
}
