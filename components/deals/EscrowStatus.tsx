"use client";

import { cn, formatGEN, statusLabel } from "@/lib/utils";
import type { Deal } from "@/lib/types";
import { Lock, Unlock, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";

interface EscrowStatusProps {
  deal: Deal;
  className?: string;
}

const steps: Array<{ status: Deal["status"]; label: string }> = [
  { status: "FUNDED", label: "Funded" },
  { status: "SUBMITTED", label: "Submitted" },
  { status: "DISPUTED", label: "AI Review" },
  { status: "RESOLVED_PASS", label: "Resolved" },
];

const statusOrder: Record<string, number> = {
  CREATED: 0,
  FUNDED: 0,
  SUBMITTED: 1,
  DISPUTED: 2,
  RESOLVED_PASS: 3,
  RESOLVED_FAIL: 3,
  CANCELLED: 0,
};

function EscrowIcon({ status }: { status: Deal["status"] }) {
  if (status === "RESOLVED_PASS") return <CheckCircle2 className="size-5 text-[var(--color-verdict-pass)]" />;
  if (status === "RESOLVED_FAIL") return <XCircle className="size-5 text-[var(--color-verdict-fail)]" />;
  if (status === "DISPUTED") return <AlertTriangle className="size-5 text-[var(--color-status-disputed)]" />;
  if (status === "CANCELLED") return <XCircle className="size-5 text-[var(--color-muted-foreground)]" />;
  return <Lock className="size-5 text-[var(--color-primary)]" />;
}

export function EscrowStatus({ deal, className }: EscrowStatusProps) {
  const currentStep = statusOrder[deal.status] ?? 0;
  const isResolved = deal.status === "RESOLVED_PASS" || deal.status === "RESOLVED_FAIL" || deal.status === "CANCELLED";

  return (
    <div className={cn("rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Escrow Status</h3>
        <EscrowIcon status={deal.status} />
      </div>

      {/* Amount */}
      <div className="flex items-baseline gap-2 mb-5">
        <span className="tabular text-2xl font-bold text-[var(--color-foreground)]">
          {formatGEN(deal.amount, 2)}
        </span>
        <span className="text-sm text-[var(--color-muted-foreground)]">GEN</span>
        <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">
          {isResolved ? (
            <span className={cn(
              "font-medium",
              deal.status === "RESOLVED_PASS" && "text-[var(--color-verdict-pass)]",
              deal.status === "RESOLVED_FAIL" && "text-[var(--color-verdict-fail)]",
              deal.status === "CANCELLED" && "text-[var(--color-muted-foreground)]"
            )}>
              {deal.status === "RESOLVED_PASS" ? "Released to seller" :
               deal.status === "RESOLVED_FAIL" ? "Refunded to buyer" :
               "Cancelled"}
            </span>
          ) : (
            <span className="text-[var(--color-status-funded)]">In escrow</span>
          )}
        </span>
      </div>

      {/* Progress steps */}
      {deal.status !== "CANCELLED" && (
        <div className="relative">
          {/* Track line */}
          <div className="absolute top-3 left-3 right-3 h-px bg-[var(--color-border)]" />
          <div
            className="absolute top-3 left-3 h-px bg-[var(--color-primary)] transition-all duration-500"
            style={{ width: `${Math.min((currentStep / (steps.length - 1)) * 100, 100)}%`, right: "auto", maxWidth: "calc(100% - 24px)" }}
          />

          <div className="relative flex justify-between">
            {steps.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep || (step.status === "RESOLVED_PASS" && deal.status === "RESOLVED_FAIL");
              const isFailStep = i === steps.length - 1 && deal.status === "RESOLVED_FAIL";

              return (
                <div key={step.status} className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "relative z-10 flex size-6 items-center justify-center rounded-full border-2 transition-all duration-300",
                      done || active
                        ? isFailStep
                          ? "border-[var(--color-verdict-fail)] bg-[var(--color-verdict-fail)]"
                          : "border-[var(--color-primary)] bg-[var(--color-primary)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)]"
                    )}
                  >
                    {(done || active) && (
                      <CheckCircle2 className="size-3 text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium",
                    done || active
                      ? "text-[var(--color-foreground)]"
                      : "text-[var(--color-muted-foreground)]"
                  )}>
                    {isFailStep && deal.status === "RESOLVED_FAIL" ? "Rejected" : step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
