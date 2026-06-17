"use client";

// Live transaction toasts. Mounted once in the root layout; reads from the
// in-memory txQueue. Auto-dismisses FINALIZED toasts after 12s, keeps errors
// pinned until manually closed.

import { useEffect, useState } from "react";
import { subscribe, dismissTx, type TxItem, type TxStatus } from "@/lib/txQueue";

// Explorer URL follows the configured chain. Studionet has its own UI.
const EXPLORER =
  process.env.NEXT_PUBLIC_CHAIN === "bradbury"
    ? "https://explorer-bradbury.genlayer.com"
    : "https://studio.genlayer.com";

// Real-time status → human label + accent. Bradbury statuses progress
// PENDING → PROPOSING → COMMITTING → REVEALING → ACCEPTED → FINALIZED.
const STATUS_META: Record<TxStatus, { label: string; accent: string; spin?: boolean }> = {
  SUBMITTING:    { label: "submitting",        accent: "text-amber/80",   spin: true },
  PENDING:       { label: "pending",            accent: "text-amber/80",   spin: true },
  PROPOSING:     { label: "proposing",          accent: "text-amber/80",   spin: true },
  COMMITTING:    { label: "committing",         accent: "text-amber/80",   spin: true },
  REVEALING:     { label: "revealing",          accent: "text-amber/80",   spin: true },
  ACCEPTED:      { label: "accepted · finalizing", accent: "text-bone",    spin: true },
  FINALIZED:     { label: "finalized",          accent: "text-emerald-400" },
  UNDETERMINED:  { label: "undetermined",       accent: "text-blood" },
  CANCELED:      { label: "canceled",           accent: "text-blood" },
  ERROR:         { label: "error",              accent: "text-blood" },
};

export function TxToasts() {
  const [items, setItems] = useState<TxItem[]>([]);

  useEffect(() => subscribe(setItems), []);

  // Auto-dismiss successes; errors persist for the user to read.
  useEffect(() => {
    const timers = items
      .filter((it) => it.status === "FINALIZED")
      .map((it) => setTimeout(() => dismissTx(it.id), 12_000));
    return () => { for (const t of timers) clearTimeout(t); };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {items.map((it) => {
        const meta = STATUS_META[it.status];
        return (
          <div
            key={it.id}
            className="bg-paper border rule px-4 py-3 text-sm font-mono shadow-lg"
            role="status"
          >
            <div className="flex items-baseline justify-between gap-3">
              <div className={`text-[10px] tracking-[0.25em] ${meta.accent} flex items-center gap-1.5`}>
                {meta.spin && <span className="inline-block w-1.5 h-1.5 bg-current rounded-full animate-pulse" />}
                {meta.label.toUpperCase()}
              </div>
              <button
                onClick={() => dismissTx(it.id)}
                className="text-bone/40 hover:text-bone text-xs"
                aria-label="dismiss"
              >
                ✕
              </button>
            </div>
            <div className="mt-1 text-bone/90 truncate">{it.label}</div>
            {it.error && (
              <div className="mt-1 text-blood/80 text-xs break-all">{it.error}</div>
            )}
            {it.hash && (
              <a
                href={`${EXPLORER}/tx/${it.hash}`}
                target="_blank" rel="noreferrer"
                className="mt-1 inline-block text-bone/50 hover:text-amber text-[11px] tabular-nums"
              >
                {it.hash.slice(0, 10)}…{it.hash.slice(-6)} ↗
              </a>
            )}
            {it.status === "ACCEPTED" && process.env.NEXT_PUBLIC_CHAIN === "bradbury" && (
              <div className="mt-1 text-bone/40 text-[10px]">
                appeal window open · final state in ~10–30 min
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
