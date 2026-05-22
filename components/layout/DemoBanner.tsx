"use client";

import { Beaker, ExternalLink } from "lucide-react";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function DemoBanner() {
  if (!IS_DEMO) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400">
      <Beaker className="size-3.5 shrink-0" />
      <p className="text-xs">
        <span className="font-semibold">Interactive Demo</span>
        {" — "}
        All actions are simulated in your browser using realistic data. No real transactions.{" "}
        <a
          href="https://github.com/fortune9thx/pact-ai"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline underline-offset-2 opacity-80 hover:opacity-100"
        >
          View on GitHub <ExternalLink className="size-3" />
        </a>
      </p>
    </div>
  );
}
