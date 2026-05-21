"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, truncateAddress, formatGEN, formatTimeAgo, statusLabel, statusColor } from "@/lib/utils";
import type { Deal } from "@/lib/types";
import { ArrowRight, Clock, User, Banknote } from "lucide-react";

interface DealCardProps {
  deal: Deal;
  className?: string;
  index?: number;
}

function statusVariant(status: Deal["status"]) {
  const map: Record<string, string> = {
    CREATED: "secondary",
    FUNDED: "funded",
    SUBMITTED: "default",
    DISPUTED: "disputed",
    RESOLVED_PASS: "resolved",
    RESOLVED_FAIL: "destructive",
    CANCELLED: "secondary",
  };
  return (map[status] ?? "secondary") as "default" | "secondary" | "funded" | "disputed" | "resolved" | "destructive";
}

export function DealCard({ deal, className, index = 0 }: DealCardProps) {
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
            className
          )}
        >
          <CardContent className="p-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-[10px] text-[var(--color-muted-foreground)]">
                    {deal.id}
                  </span>
                  <Badge variant={statusVariant(deal.status)}>
                    {statusLabel(deal.status)}
                  </Badge>
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
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                <User className="size-3.5 shrink-0" />
                <span className="font-mono">{truncateAddress(deal.seller)}</span>
              </div>
              {deal.createdAt > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                  <Clock className="size-3.5 shrink-0" />
                  <span>{formatTimeAgo(deal.createdAt)}</span>
                </div>
              )}
            </div>

            {/* AI verdict preview */}
            {deal.aiVerdict && (
              <div
                className={cn(
                  "mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-2",
                )}
              >
                <div
                  className={cn(
                    "size-1.5 rounded-full",
                    deal.aiVerdict.result === "PASS"
                      ? "bg-[var(--color-verdict-pass)]"
                      : "bg-[var(--color-verdict-fail)]"
                  )}
                />
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  AI verdict:{" "}
                  <span
                    className={cn(
                      "font-medium",
                      deal.aiVerdict.result === "PASS"
                        ? "text-[var(--color-verdict-pass)]"
                        : "text-[var(--color-verdict-fail)]"
                    )}
                  >
                    {deal.aiVerdict.result}
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
