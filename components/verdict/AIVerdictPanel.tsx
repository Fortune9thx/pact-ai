"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScoreBreakdown } from "./ConfidenceScore";
import type { AIVerdict } from "@/lib/types";
import { CheckCircle2, XCircle, Brain, Sparkles } from "lucide-react";

interface AIVerdictPanelProps {
  verdict: AIVerdict | null;
  isPending?: boolean;
  className?: string;
}

function PendingState() {
  return (
    <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
          <Brain className="size-5 text-[var(--color-primary)] animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">AI Evaluation In Progress</h3>
          <p className="text-xs text-[var(--color-muted-foreground)]">GenLayer validators are processing your submission</p>
        </div>
      </div>
      <div className="space-y-2">
        {["Analyzing creative style", "Evaluating prompt alignment", "Assessing quality standards"].map((step, i) => (
          <div key={step} className="flex items-center gap-2.5">
            <div
              className="size-1.5 rounded-full bg-[var(--color-primary)]"
              style={{ animation: `pulse-soft 1.5s ease-in-out ${i * 0.3}s infinite` }}
            />
            <span className="text-xs text-[var(--color-muted-foreground)]">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerdictHeader({ result }: { result: "PASS" | "FAIL" }) {
  const pass = result === "PASS";
  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-xl border",
      pass
        ? "border-[var(--color-verdict-pass)]/25 bg-[var(--color-verdict-pass)]/8"
        : "border-[var(--color-verdict-fail)]/25 bg-[var(--color-verdict-fail)]/8"
    )}>
      <div className={cn(
        "flex size-10 items-center justify-center rounded-xl",
        pass ? "bg-[var(--color-verdict-pass)]/15" : "bg-[var(--color-verdict-fail)]/15"
      )}>
        {pass
          ? <CheckCircle2 className="size-5 text-[var(--color-verdict-pass)]" />
          : <XCircle className="size-5 text-[var(--color-verdict-fail)]" />
        }
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "text-base font-bold",
            pass ? "text-[var(--color-verdict-pass)]" : "text-[var(--color-verdict-fail)]"
          )}>
            {pass ? "Work Approved" : "Work Rejected"}
          </h3>
          <span className="flex items-center gap-1 text-[10px] text-[var(--color-muted-foreground)] bg-[var(--color-surface-overlay)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
            <Sparkles className="size-2.5" />
            AI Verdict
          </span>
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
          {pass
            ? "Escrow has been released to the seller"
            : "Escrow has been refunded to the buyer"
          }
        </p>
      </div>
    </div>
  );
}

export function AIVerdictPanel({ verdict, isPending, className }: AIVerdictPanelProps) {
  if (isPending || !verdict) {
    return (
      <div className={className}>
        {isPending ? <PendingState /> : (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center">
            <Brain className="size-8 text-[var(--color-muted-foreground)] mx-auto mb-2" />
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No verdict yet. AI evaluation will run when a dispute is raised.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className={cn("flex flex-col gap-4", className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Verdict header */}
      <VerdictHeader result={verdict.result} />

      {/* Reasoning */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h3 className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide mb-3">
          AI Reasoning
        </h3>
        <p className="text-sm text-[var(--color-foreground)] leading-relaxed">
          {verdict.reasoning}
        </p>
      </div>

      {/* Score breakdown */}
      <ScoreBreakdown
        styleMatch={verdict.style_match ?? verdict.styleMatch ?? 0}
        promptAlignment={verdict.prompt_alignment ?? verdict.promptAlignment ?? 0}
        qualityMatch={verdict.quality_match ?? verdict.qualityMatch ?? 0}
        confidence={verdict.confidence}
      />
    </motion.div>
  );
}
