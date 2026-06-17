"use client";

// Tiny client island that pulses router.refresh() on a timer. Keeps the
// server-rendered Arena feed up-to-date with on-chain state without forcing
// the user to F5. Skips when the tab is hidden — no point burning RPC calls
// for a screen no one is looking at.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ intervalMs = 45000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id) return;
      id = setInterval(() => router.refresh(), intervalMs);
    };
    const stop = () => {
      if (!id) return;
      clearInterval(id);
      id = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, intervalMs]);
  return null;
}
