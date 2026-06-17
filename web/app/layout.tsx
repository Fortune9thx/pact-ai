import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TxToasts } from "@/components/TxToasts";
import { TestnetBanner } from "@/components/TestnetBanner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ERISTIC — Stake Your Truth",
  description: "File a claim, stake GEN tokens FOR or AGAINST, and receive an immutable AI verdict. Decentralized claim adjudication on GenLayer.",
  keywords: ["GenLayer", "Web3", "prediction market", "AI verdict", "on-chain adjudication", "stake", "claim"],
  openGraph: {
    title: "ERISTIC — Stake Your Truth",
    description: "File a claim, stake GEN tokens, get an AI-powered verdict. No judges. No politics. On-chain truth.",
    url: "https://eristic.vercel.app",
    siteName: "ERISTIC",
    images: [
      {
        url: "https://eristic.vercel.app/og.jpg",
        width: 1200,
        height: 630,
        alt: "ERISTIC — Decentralized Claim Adjudication",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ERISTIC — Stake Your Truth",
    description: "File a claim, stake GEN tokens, get an AI-powered verdict. No judges. No politics. On-chain truth.",
    images: ["https://eristic.vercel.app/og.jpg"],
  },
  metadataBase: new URL("https://eristic.vercel.app"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen">
        <TestnetBanner />
        {children}
        <TxToasts />
      </body>
    </html>
  );
}
