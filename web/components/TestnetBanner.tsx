"use client";

import { useState } from "react";
import Link from "next/link";

export function TestnetBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="w-full z-[60] relative"
      style={{ background: "linear-gradient(90deg, rgba(124,58,237,0.18) 0%, rgba(139,92,246,0.1) 100%)", borderBottom: "1px solid rgba(139,92,246,0.25)" }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase"
            style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.35)" }}>
            ⚠ TESTNET
          </span>
          <span style={{ color: "rgba(237,235,230,0.5)" }}>
            GenLayer Bradbury Testnet — GEN tokens have{" "}
            <strong style={{ color: "rgba(237,235,230,0.75)" }}>no real-world value.</strong>
          </span>
          <Link href="https://testnet-faucet.genlayer.foundation" target="_blank" rel="noreferrer"
            className="hidden sm:inline transition-colors"
            style={{ color: "#a78bfa", textDecoration: "underline" }}>
            Get free GEN →
          </Link>
        </div>
        <button onClick={() => setDismissed(true)}
          className="text-xs font-mono shrink-0 transition-opacity hover:opacity-100 opacity-40"
          style={{ color: "rgba(237,235,230,0.6)" }}>
          ✕
        </button>
      </div>
    </div>
  );
}
