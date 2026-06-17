import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TxToasts } from "@/components/TxToasts";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ERISTIC",
  description: "Decentralized claim adjudication on GenLayer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen">
        {children}
        <TxToasts />
      </body>
    </html>
  );
}
