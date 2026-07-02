"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScoreBreakdown } from "./ConfidenceScore";
import type { AIVerdict } from "@/lib/types";
import { CheckCircle2, XCircle, Brain, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIVerdictPanelProps {
  verdict: AIVerdict | null;
  isPending?: boolean;
  className?: string;
  // New: deal status + buyer actions
  status?: string;
  isBuyer?: boolean;
  onAcceptAI?: () => void;
  onOverrideRelease?: () => void;
  onOverrideRefund?: () => void;
  actionLoading?: string | null;
}

/* ── AI evaluating state ── */
function PendingState() {
  return (
    <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
          <Brain className="size-5 text-[var(--color-primary)] animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">AI Review In Progress</h3>
          <p className="text-xs text-[var(--color-muted-foreground)]">GenLayer validators are analyzing the submission</p>
        </div>
      </div>
      <div className="space-y-2">
        {["Analyzing creative style against brief", "Evaluating prompt alignment", "Assessing quality standards"].map((step, i) => (
          <div key={step} className="flex items-center gap-2.5">
            <div
              className="size-1.5 rounded-full bg-[var(--color-primary)]"
              style={{ animation: `pulse-soft 1.5s ease-in-out ${i * 0.3}s infinite` }}
            />
            <span className="text-xs text-[var(--color-muted-foreground)]">{step}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[var(--color-muted-foreground)] mt-4">
        This usually takes 1–2 minutes. You&apos;ll make the final decision.
      </p>
    </div>
  );
}

/* ── Recommendation header ── */
function RecommendationHeader({ result }: { result: "PASS" | "FAIL" }) {
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
          : <XCircle     className="size-5 text-[var(--color-verdict-fail)]" />}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "text-base font-bold",
            pass ? "text-[var(--color-verdict-pass)]" : "text-[var(--color-verdict-fail)]"
          )}>
            {pass ? "AI Recommends Approval" : "AI Recommends Rejection"}
          </h3>
          <span className="flex items-center gap-1 text-[10px] text-[var(--color-muted-foreground)] bg-[var(--color-surface-overlay)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
            <Sparkles className="size-2.5" />
            AI Review
          </span>
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
          This is a recommendation. You make the final decision below.
        </p>
      </div>
    </div>
  );
}

/* ── Resolved state header ── */
function ResolvedHeader({ status }: { status: string }) {
  const pass = status === "RESOLVED_PASS";
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
          : <XCircle      className="size-5 text-[var(--color-verdict-fail)]" />}
      </div>
      <div>
        <h3 className={cn(
          "text-base font-bold",
          pass ? "text-[var(--color-verdict-pass)]" : "text-[var(--color-verdict-fail)]"
        )}>
          {pass ? "Payment Released" : "Payment Refunded"}
        </h3>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
          {pass ? "Escrow has been released to the seller." : "Escrow has been refunded to the buyer."}
        </p>
      </div>
    </div>
  );
}

export function AIVerdictPanel({
  verdict,
  isPending,
  className,
  status,
  isBuyer,
  onAcceptAI,
  onOverrideRelease,
  onOverrideRefund,
  actionLoading,
}: AIVerdictPanelProps) {

  // Nothing to show
  if (!isPending && !verdict && status !== "AI_REVIEWED") {
    return (
      <div className={cn(className, "rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center")}>
        <Brain className="size-8 text-[var(--color-muted-foreground)] mx-auto mb-2" />
        <p className="text-sm font-medium text-[var(--color-muted-foreground)]">No AI review yet</p>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
          If you want a second opinion on submitted work, request an AI review.
        </p>
      </div>
    );
  }

  if (isPending) {
    return <div className={className}><PendingState /></div>;
  }

  if (!verdict) return null;

  const isResolved = status === "RESOLVED_PASS" || status === "RESOLVED_FAIL";
  const isAIReviewed = status === "AI_REVIEWED";
  const canAct = isBuyer && isAIReviewed;

  return (
    <motion.div
      className={cn("flex flex-col gap-4", className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header — changes based on whether resolved or pending buyer action */}
      {isResolved
        ? <ResolvedHeader status={status!} />
        : <RecommendationHeader result={verdict.result} />
      }

      {/* Reasoning */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="size-3.5 text-[var(--color-primary)]" />
          <h3 className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
            AI Reasoning
          </h3>
        </div>
        <p className="text-sm text-[var(--color-foreground)] leading-relaxed">
          {verdict.reasoning}
        </p>
      </div>

      {/* Score breakdown — only shown when rich fields are present */}
      {(verdict.style_match != null || verdict.styleMatch != null) && (
        <ScoreBreakdown
          styleMatch={verdict.style_match ?? verdict.styleMatch ?? 0}
          promptAlignment={verdict.prompt_alignment ?? verdict.promptAlignment ?? 0}
          qualityMatch={verdict.quality_match ?? verdict.qualityMatch ?? 0}
          confidence={verdict.confidence}
        />
      )}

      {/* Buyer decision panel */}
      {canAct && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <p className="text-xs font-semibold text-[var(--color-foreground)] mb-1">Your Decision</p>
          <p className="text-xs text-[var(--color-muted-foreground)] mb-4">
            The AI has reviewed the work. Accept the recommendation or override it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Accept AI recommendation */}
            <Button
              size="sm"
              className={cn(
                "flex-1 gap-2",
                verdict.result === "PASS"
                  ? "" /* default primary = release */
                  : "bg-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/90"
              )}
              onClick={onAcceptAI}
              loading={actionLoading === "release"}
            >
              {actionLoading !== "release" && (
                verdict.result === "PASS"
                  ? <ThumbsUp className="size-3.5" />
                  : <ThumbsDown className="size-3.5" />
              )}
              {verdict.result === "PASS" ? "Accept and Release Payment" : "Accept and Request Refund"}
            </Button>
            {/* Override */}
            <div className="flex gap-2 flex-1">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 gap-1.5 text-xs"
                onClick={onOverrideRelease}
                loading={actionLoading === "override-release"}
                title="Override AI and release payment"
              >
                {actionLoading !== "override-release" && <ThumbsUp className="size-3" />}
                Release
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 gap-1.5 text-xs"
                onClick={onOverrideRefund}
                loading={actionLoading === "override-refund"}
                title="Override AI and request refund"
              >
                {actionLoading !== "override-refund" && <ThumbsDown className="size-3" />}
                Refund
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-[var(--color-muted-foreground)] mt-3">
            &ldquo;Release&rdquo; / &ldquo;Refund&rdquo; override the AI recommendation with your own judgment.
          </p>
        </div>
      )}
    </motion.div>
  );
}
