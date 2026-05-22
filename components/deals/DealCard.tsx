"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, truncateAddress, formatGEN, formatTimeAgo, statusLabel } from "@/lib/utils";
import { getInviteUrl } from "@/lib/invite";
import type { Deal } from "@/lib/types";
import {
  ArrowRight, Clock, User, Banknote, Share2, Copy,
  CheckCircle2, Brain, AlertTriangle,
} from "lucide-react";

function statusVariant(status: Deal["status"]) {
  const map: Record<string, string> = {
    PENDING:       "funded",
    FUNDED:        "funded",
    SUBMITTED:     "default",
    AI_REVIEWED:   "disputed",
    RESOLVED_PASS: "resolved",
    RESOLVED_FAIL: "destructive",
    CANCELLED:     "secondary",
  };
  return (map[status] ?? "secondary") as "default" | "secondary" | "funded" | "disputed" | "resolved" | "destructive";
}

interface DealCardProps {
  deal: Deal;
  className?: string;
  index?: number;
}

export function DealCard({ deal, className, index = 0 }: DealCardProps) {
  const [copied, setCopied] = useState(false);

  const copyInvite = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(getInviteUrl(deal.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Link href={`/deal/${deal.id}`}>
        <Card
          className={cn(
            "group cursor-pointer transition-all duration-200 hover:border-[var(--color-primary)]/30 hover:shadow-[var(--shadow-card-hover)]",
            deal.status === "AI_REVIEWED" && "border-[var(--color-accent)]/30",
            className
          )}
        >
          <CardContent className="p-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-mono text-[10px] text-[var(--color-muted-foreground)]">
                    {deal.id}
                  </span>
                  <Badge variant={statusVariant(deal.status)}>
                    {statusLabel(deal.status)}
                  </Badge>
                  {deal.status === "AI_REVIEWED" && (
                    <span className="flex items-center gap-1 text-[10px] text-[var(--color-accent-foreground)] bg-[var(--color-accent)]/12 px-1.5 py-0.5 rounded-full">
                      <Brain className="size-2.5" />
                      Decision needed
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-[var(--color-foreground)] line-clamp-2 leading-snug">
                  {deal.prompt}
                </p>
              </div>
              <ArrowRight className="size-4 text-[var(--color-muted-foreground)] shrink-0 mt-0.5 group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all duration-150" />
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                <Banknote className="size-3.5 shrink-0" />
                <span className="tabular font-medium text-[var(--color-foreground)]">
                  {formatGEN(deal.amount)} GEN
                </span>
              </div>

              {deal.seller ? (
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                  <User className="size-3.5 shrink-0" />
                  <span className="font-mono">{truncateAddress(deal.seller)}</span>
                </div>
              ) : (
                /* PENDING — no seller yet */
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                  <AlertTriangle className="size-3 shrink-0 text-[var(--color-status-disputed)]" />
                  <span className="text-[var(--color-status-disputed)]">Awaiting seller</span>
                </div>
              )}

              {deal.createdAt > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                  <Clock className="size-3.5 shrink-0" />
                  <span>{formatTimeAgo(deal.createdAt)}</span>
                </div>
              )}
            </div>

            {/* PENDING: invite link copy strip */}
            {deal.status === "PENDING" && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-2">
                <Share2 className="size-3 text-[var(--color-primary)] shrink-0" />
                <span className="font-mono text-[10px] text-[var(--color-muted-foreground)] flex-1 truncate">
                  {getInviteUrl(deal.id)}
                </span>
                <button
                  onClick={copyInvite}
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded border transition-all shrink-0",
                    copied
                      ? "border-[var(--color-verdict-pass)]/25 text-[var(--color-verdict-pass)] bg-[var(--color-verdict-pass)]/8"
                      : "border-[var(--color-primary)]/25 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
                  )}
                >
                  {copied ? <CheckCircle2 className="size-3" /> : <Copy className="size-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            )}

            {/* AI verdict preview */}
            {deal.aiVerdict && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-2">
                <div
                  className={cn(
                    "size-1.5 rounded-full",
                    deal.aiVerdict.result === "PASS"
                      ? "bg-[var(--color-verdict-pass)]"
                      : "bg-[var(--color-verdict-fail)]"
                  )}
                />
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  AI review:{" "}
                  <span className={cn(
                    "font-medium",
                    deal.aiVerdict.result === "PASS"
                      ? "text-[var(--color-verdict-pass)]"
                      : "text-[var(--color-verdict-fail)]"
                  )}>
                    {deal.aiVerdict.result === "PASS" ? "Recommends approval" : "Recommends rejection"}
                  </span>
                  {" "}·{" "}
                  <span className="tabular">{deal.aiVerdict.confidence}% confidence</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
