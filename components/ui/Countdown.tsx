"use client";

import { useEffect, useState } from "react";
import type { Deal } from "@/lib/types";

/**
 * Resolve a stable "created" anchor (in epoch seconds) for a deal.
 * The on-chain contract doesn't store a creation timestamp, so for live
 * deals we persist the first time this browser saw the deal and anchor the
 * countdown to that. Demo deals already carry a real `createdAt`.
 */
function resolveAnchor(deal: Deal): number {
  if (typeof deal.createdAt === "number" && deal.createdAt > 0) {
    return deal.createdAt;
  }
  if (typeof window === "undefined") return Math.floor(Date.now() / 1000);
  const key = `pact_first_seen_${deal.id}`;
  const stored = window.localStorage.getItem(key);
  if (stored) return parseInt(stored, 10);
  const now = Math.floor(Date.now() / 1000);
  window.localStorage.setItem(key, String(now));
  return now;
}

/** End of the deadline window, in epoch seconds. */
export function deadlineEnd(deal: Deal): number {
  return resolveAnchor(deal) + (deal.deadline || 0) * 86_400;
}

function format(remainingSec: number, compact: boolean): string {
  if (remainingSec <= 0) return "Overdue";
  const d = Math.floor(remainingSec / 86_400);
  const h = Math.floor((remainingSec % 86_400) / 3_600);
  const m = Math.floor((remainingSec % 3_600) / 60);
  const s = Math.floor(remainingSec % 60);
  const suffix = compact ? "" : " left";
  if (d > 0) return `${d}d ${h}h${suffix}`;
  if (h > 0) return `${h}h ${m}m${suffix}`;
  if (m > 0) return `${m}m ${s}s${suffix}`;
  return `${s}s${suffix}`;
}

/**
 * Live-ticking deadline label. Ticks every second while <1h remains,
 * otherwise every 30s to stay cheap.
 */
export function Countdown({
  deal,
  className,
  style,
  compact = false,
}: {
  deal: Deal;
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}) {
  const end = deadlineEnd(deal);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const remaining = end - Math.floor(Date.now() / 1000);
    const interval = remaining <= 3_600 ? 1_000 : 30_000;
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), interval);
    return () => clearInterval(id);
  }, [end, now]);

  if (!deal.deadline || deal.deadline <= 0) return null;

  const remaining = end - now;
  const overdue = remaining <= 0;

  return (
    <span
      className={className}
      style={{ color: overdue ? "#DC2626" : style?.color, ...style }}
    >
      {format(remaining, compact)}
    </span>
  );
}
