"use client";

import { cn, formatTimeAgo, truncateAddress } from "@/lib/utils";
import type { Deal } from "@/lib/types";
import { PlusCircle, DollarSign, Upload, AlertTriangle, CheckCircle2, XCircle, Zap } from "lucide-react";

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

  events.push({
    label: "Deal Created",
    description: `Buyer ${truncateAddress(deal.buyer)} created escrow for creative work`,
    icon: PlusCircle,
    color: "text-[var(--color-primary)]",
    timestamp: deal.createdAt || now - 3600,
  });

  if (["FUNDED", "SUBMITTED", "DISPUTED", "RESOLVED_PASS", "RESOLVED_FAIL"].includes(deal.status)) {
    events.push({
      label: "Escrow Funded",
      description: `${deal.amount} GEN locked in smart contract`,
      icon: DollarSign,
      color: "text-[var(--color-status-funded)]",
      timestamp: deal.createdAt || now - 3500,
    });
  }

  if (deal.submission && ["SUBMITTED", "DISPUTED", "RESOLVED_PASS", "RESOLVED_FAIL"].includes(deal.status)) {
    events.push({
      label: "Work Submitted",
      description: `Seller ${truncateAddress(deal.seller)} delivered creative work`,
      icon: Upload,
      color: "text-[var(--color-foreground)]",
      timestamp: deal.createdAt ? deal.createdAt + 3600 : now - 1800,
    });
  }

  if (["DISPUTED", "RESOLVED_PASS", "RESOLVED_FAIL"].includes(deal.status)) {
    events.push({
      label: "AI Evaluation Requested",
      description: "Buyer raised dispute — GenLayer AI validators initiated",
      icon: AlertTriangle,
      color: "text-[var(--color-status-disputed)]",
      timestamp: deal.createdAt ? deal.createdAt + 7200 : now - 900,
    });
  }

  if (deal.aiVerdict && ["RESOLVED_PASS", "RESOLVED_FAIL"].includes(deal.status)) {
    const pass = deal.aiVerdict.result === "PASS";
    events.push({
      label: pass ? "Work Approved by AI" : "Work Rejected by AI",
      description: pass
        ? `Escrow released to seller — ${deal.aiVerdict.confidence}% confidence`
        : `Escrow refunded to buyer — ${deal.aiVerdict.confidence}% confidence`,
      icon: pass ? CheckCircle2 : XCircle,
      color: pass ? "text-[var(--color-verdict-pass)]" : "text-[var(--color-verdict-fail)]",
      timestamp: deal.aiVerdict.evaluatedAt || now - 300,
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
              {/* Icon + line */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)]",
                )}>
                  <Icon className={cn("size-3.5", event.color)} />
                </div>
                {!isLast && (
                  <div className="w-px flex-1 bg-[var(--color-border)] my-1" />
                )}
              </div>
              {/* Content */}
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
