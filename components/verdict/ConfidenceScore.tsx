"use client";

import { motion } from "framer-motion";
import { cn, confidenceLabel } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ConfidenceScoreProps {
  label: string;
  score: number;
  className?: string;
  showBar?: boolean;
  size?: "sm" | "md" | "lg";
}

function scoreColor(score: number) {
  if (score >= 75) return "text-[var(--color-verdict-pass)]";
  if (score >= 50) return "text-[var(--color-verdict-pending)]";
  return "text-[var(--color-verdict-fail)]";
}

function barColor(score: number) {
  if (score >= 75) return "bg-[var(--color-verdict-pass)]";
  if (score >= 50) return "bg-[var(--color-verdict-pending)]";
  return "bg-[var(--color-verdict-fail)]";
}

export function ConfidenceScore({ label, score, className, showBar = true, size = "md" }: ConfidenceScoreProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-muted-foreground)] font-medium">{label}</span>
        <div className="flex items-baseline gap-1">
          <motion.span
            className={cn("tabular font-bold leading-none", sizeClasses[size], scoreColor(score))}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-[var(--color-muted-foreground)]">/ 100</span>
        </div>
      </div>
      {showBar && (
        <Progress
          value={score}
          indicatorClassName={barColor(score)}
          className="h-1"
        />
      )}
    </div>
  );
}

interface ScoreBreakdownProps {
  styleMatch: number;
  promptAlignment: number;
  qualityMatch: number;
  confidence: number;
}

export function ScoreBreakdown({ styleMatch, promptAlignment, qualityMatch, confidence }: ScoreBreakdownProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <h3 className="text-sm font-semibold mb-4">Score Breakdown</h3>
      <div className="flex flex-col gap-4">
        <ConfidenceScore label="Style Match" score={styleMatch} size="sm" />
        <ConfidenceScore label="Prompt Alignment" score={promptAlignment} size="sm" />
        <ConfidenceScore label="Quality Match" score={qualityMatch} size="sm" />
        <div className="pt-3 border-t border-[var(--color-border)]">
          <ConfidenceScore label="AI Confidence" score={confidence} size="sm"
            className="[&_span.tabular]:text-[var(--color-primary)]"
          />
          <p className="text-[10px] text-[var(--color-muted-foreground)] mt-1.5">
            {confidenceLabel(confidence)} confidence — how certain the AI is about its verdict
          </p>
        </div>
      </div>
    </div>
  );
}
