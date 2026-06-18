import type { Metadata } from "next";
import "./globals.css";
import { TransactionStatus } from "@/components/wallet/TransactionStatus";
import { Web3Provider } from "@/components/providers/Web3Provider";

export const metadata: Metadata = {
  title: "Pact: AI-Powered Creative Escrow",
  description:
    "Smart contracts that understand nuance. AI-powered escrow resolution for creative work and quality-based agreements on GenLayer.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Pact",
    description: "Smart contracts that understand creative intent.",
    type: "website",
    images: [{ url: "/logo.png", width: 750, height: 750 }],
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
        <Web3Provider>
          {children}
          <TransactionStatus />
        </Web3Provider>
      </body>
    </html>
  );
}
