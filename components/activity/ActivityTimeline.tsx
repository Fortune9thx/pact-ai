"use client";

import { cn, formatTimeAgo, truncateAddress } from "@/lib/utils";
import type { Deal } from "@/lib/types";
import { PlusCircle, DollarSign, Upload, Brain, CheckCircle2, XCircle, Zap, UserCheck, ThumbsUp } from "lucide-react";

interface TimelineEvent {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  timestamp: number;
}

function buildTimeline(deal: Deal): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const now = Math.floor(Date.now() / 1000);
  const base = deal.createdAt || now - 3600;

  // 1. Agreement created
  events.push({
    label: "Agreement Created",
    description: `Buyer ${truncateAddress(deal.buyer)} created a protected creative agreement`,
    icon: PlusCircle,
    color: "text-[var(--color-primary)]",
    timestamp: base,
  });

  // 2. Seller claimed (FUNDED+)
  if (deal.seller && ["FUNDED", "SUBMITTED", "AI_REVIEWED", "RESOLVED_PASS", "RESOLVED_FAIL"].includes(deal.status)) {
    events.push({
      label: "Escrow Active",
      description: `Seller ${truncateAddress(deal.seller)} accepted. ${deal.amount} GEN locked in escrow`,
      icon: UserCheck,
      color: "text-[var(--color-status-funded)]",
      timestamp: base + 600,
    });
  }

  // 3. Work submitted
  if (deal.submission && ["SUBMITTED", "AI_REVIEWED", "RESOLVED_PASS", "RESOLVED_FAIL"].includes(deal.status)) {
    events.push({
      label: "Work Submitted",
      description: deal.seller
        ? `Seller ${truncateAddress(deal.seller)} delivered the creative work`
        : "Creative work delivered",
      icon: Upload,
      color: "text-[var(--color-foreground)]",
      timestamp: base + 3600,
    });
  }

  // 4. AI review requested
  if (["AI_REVIEWED", "RESOLVED_PASS", "RESOLVED_FAIL"].includes(deal.status) && deal.aiVerdict) {
    events.push({
      label: "AI Review Requested",
      description: "Buyer requested AI evaluation. GenLayer validators analyzed the submission",
      icon: Brain,
      color: "text-[var(--color-primary)]",
      timestamp: deal.aiVerdict.evaluated_at || base + 7200,
    });
  }

  // 5. AI verdict delivered
  if (deal.aiVerdict) {
    const pass = deal.aiVerdict.result === "PASS";
    events.push({
      label: pass ? "AI Recommends Approval" : "AI Recommends Rejection",
      description: pass
        ? `AI review complete. ${deal.aiVerdict.confidence}% confidence in approval`
        : `AI review complete. ${deal.aiVerdict.confidence}% confidence in rejection`,
      icon: Brain,
      color: pass ? "text-[var(--color-verdict-pass)]" : "text-[var(--color-verdict-fail)]",
      timestamp: (deal.aiVerdict.evaluated_at || base + 7200) + 60,
    });
  }

  // 6. Buyer approved directly (no AI)
  if (deal.status === "RESOLVED_PASS" && !deal.aiVerdict) {
    events.push({
      label: "Work Approved",
      description: "Buyer approved the work. Escrow release to seller is finalizing on-chain",
      icon: ThumbsUp,
      color: "text-[var(--color-verdict-pass)]",
      timestamp: base + 7200,
    });
  }

  // 7. Final resolution
  // Note: emit_transfer settles at network finalization, not instantly on approval —
  // this can take several minutes on Bradbury, so we describe it as releasing/returning
  // rather than claiming the transfer has already completed.
  if (["RESOLVED_PASS", "RESOLVED_FAIL"].includes(deal.status)) {
    const pass = deal.status === "RESOLVED_PASS";
    events.push({
      label: pass ? "Payment Approved" : "Refund Approved",
      description: pass
        ? "Escrow releasing to seller — finalizes on-chain in a few minutes"
        : "Escrow returning to buyer — finalizes on-chain in a few minutes",
      icon: pass ? CheckCircle2 : XCircle,
      color: pass ? "text-[var(--color-verdict-pass)]" : "text-[var(--color-verdict-fail)]",
      timestamp: base + 7500,
    });
  }

  // 8. Cancelled
  if (deal.status === "CANCELLED") {
    events.push({
      label: "Deal Cancelled",
      description: "Buyer cancelled the agreement before work was submitted",
      icon: XCircle,
      color: "text-[var(--color-muted-foreground)]",
      timestamp: base + 1800,
    });
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
}

export function ActivityTimeline({ deal, className }: { deal: Deal; className?: string }) {
  const events = buildTimeline(deal);

  return (
    <div className={cn("rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="size-3.5 text-[var(--color-primary)]" />
        <h3 className="text-sm font-semibold">Activity</h3>
      </div>
      <div className="flex flex-col">
        {events.map((event, i) => {
          const Icon = event.icon;
          const isLast = i === events.length - 1;
          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                  <Icon className={cn("size-3.5", event.color)} />
                </div>
                {!isLast && <div className="w-px flex-1 bg-[var(--color-border)] my-1" />}
              </div>
              <div className={cn("pb-4 flex-1 min-w-0", isLast && "pb-0")}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[var(--color-foreground)]">{event.label}</p>
                  <span className="text-[10px] text-[var(--color-muted-foreground)] shrink-0">
                    {formatTimeAgo(event.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
