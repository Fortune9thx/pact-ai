"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  useDeal, useApproveWork, useRequestAIReview,
  useReleaseAfterAI, useOverrideAI, useCancelDeal,
} from "@/hooks/useDeal";
import { useWallet } from "@/hooks/useWallet";
import { EscrowStatus } from "@/components/deals/EscrowStatus";
import { AIVerdictPanel } from "@/components/verdict/AIVerdictPanel";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { truncateAddress, formatGEN, statusLabel } from "@/lib/utils";
import { getInviteUrl } from "@/lib/invite";
import {
  ArrowLeft, User, Copy, CheckCircle2, ExternalLink,
  Brain, Share2, Clock, Banknote, AlertTriangle, ThumbsUp, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function statusVariant(status: string) {
  const map: Record<string, string> = {
    PENDING: "funded", FUNDED: "funded", SUBMITTED: "default",
    AI_REVIEWED: "disputed", RESOLVED_PASS: "resolved",
    RESOLVED_FAIL: "destructive", CANCELLED: "secondary",
  };
  return (map[status] ?? "secondary") as "default" | "secondary" | "funded" | "disputed" | "resolved" | "destructive";
}

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { deal, isPending, loading, refetch } = useDeal(id);
  const { wallet } = useWallet();
  const approveWork     = useApproveWork();
  const requestAIReview = useRequestAIReview();
  const releaseAfterAI  = useReleaseAfterAI();
  const overrideAI      = useOverrideAI();
  const cancelDeal      = useCancelDeal();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const run = useCallback(async (key: string, fn: () => Promise<unknown>) => {
    setActionLoading(key);
    try { await fn(); await refetch(); }
    finally { setActionLoading(null); }
  }, [refetch]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-8 w-32 rounded-lg bg-[var(--color-surface-raised)] shimmer-bg mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-36 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shimmer-bg" />)}
          </div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => <div key={i} className="h-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shimmer-bg" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <p className="text-[var(--color-muted-foreground)]">Deal not found.</p>
        <Link href="/dashboard"><Button variant="ghost" size="sm" className="mt-4">Back to Dashboard</Button></Link>
      </div>
    );
  }

  // Disable all actions while the deal is still being confirmed by GenLayer validators
  const blockActions = isPending;

  const isBuyer  = wallet.address?.toLowerCase() === deal.buyer.toLowerCase();
  const isSeller = deal.seller !== "" && wallet.address?.toLowerCase() === deal.seller.toLowerCase();
  const inviteUrl = getInviteUrl(deal.id);

  // Action availability
  const canApprove       = !blockActions && isBuyer && deal.status === "SUBMITTED";
  const canRequestAI     = !blockActions && isBuyer && deal.status === "SUBMITTED";
  const canReleaseAfterAI = !blockActions && isBuyer && deal.status === "AI_REVIEWED";
  const canSubmit        = !blockActions && isSeller && deal.status === "FUNDED";
  const canCancel        = !blockActions && isBuyer && ["PENDING", "FUNDED"].includes(deal.status);
  const isAIReviewing    = deal.status === "AI_REVIEWED" && !deal.aiVerdict;

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

        {/* Confirming banner — shown while GenLayer validators process the transaction */}
        {isPending && (
          <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50">
            <Loader2 className="size-4 text-indigo-500 shrink-0 animate-spin" />
            <div>
              <p className="text-sm font-semibold text-indigo-700">Confirming on GenLayer</p>
              <p className="text-xs text-indigo-500 mt-0.5">
                Your deal was submitted. GenLayer validators are processing it — this takes 30–120 seconds.
                This page will update automatically.
              </p>
            </div>
          </div>
        )}

        {/* Back + header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
              <ArrowLeft className="size-3.5" />
              Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--color-muted-foreground)]">{deal.id}</span>
            <Badge variant={statusVariant(deal.status)}>{statusLabel(deal.status)}</Badge>
          </div>
        </div>

        {/* ── Invite banner (PENDING) ── */}
        {deal.status === "PENDING" && isBuyer && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5 p-4 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
            <Share2 className="size-4 text-[var(--color-primary)] shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-foreground)]">Awaiting seller</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                Share this invite link with the creative you hired.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-[10px] text-[var(--color-foreground)] truncate bg-white border border-[var(--color-border)] rounded px-2 py-1 max-w-[240px]">
                  {inviteUrl}
                </span>
                <button
                  onClick={() => copy(inviteUrl, "invite")}
                  className={cn(
                    "flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-all shrink-0",
                    copiedField === "invite"
                      ? "border-[var(--color-verdict-pass)]/30 bg-[var(--color-verdict-pass)]/8 text-[var(--color-verdict-pass)]"
                      : "border-[var(--color-primary)]/25 bg-[var(--color-primary)] text-white"
                  )}
                >
                  {copiedField === "invite" ? <CheckCircle2 className="size-3" /> : <Copy className="size-3" />}
                  {copiedField === "invite" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Seller invite banner (PENDING, not buyer) ── */}
        {deal.status === "PENDING" && !isBuyer && (
          <div className="flex items-center gap-3 mb-5 p-4 rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/8">
            <AlertTriangle className="size-4 text-[var(--color-accent-foreground)] shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground)]">This deal is awaiting a seller</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                Were you sent an invite link? Open it to accept this deal.
              </p>
              <Link href={`/invite/${deal.id}`} className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline mt-1">
                Open invite page <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main column ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Brief */}
            <Card>
              <CardHeader><CardTitle>Creative Brief</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--color-foreground)] leading-relaxed italic">
                  &ldquo;{deal.prompt}&rdquo;
                </p>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader><CardTitle>Participants</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { role: "Buyer",  address: deal.buyer,  isMe: isBuyer  },
                    { role: "Seller", address: deal.seller, isMe: isSeller },
                  ].map(({ role, address, isMe }) => (
                    <div key={role} className="flex flex-col gap-1.5 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">{role}</p>
                        {isMe && <span className="text-[10px] text-[var(--color-primary)] font-medium">You</span>}
                      </div>
                      {address ? (
                        <div className="flex items-center gap-1.5">
                          <User className="size-3 text-[var(--color-muted-foreground)] shrink-0" />
                          <span className="font-mono text-xs text-[var(--color-foreground)] flex-1 truncate">
                            {truncateAddress(address, 6)}
                          </span>
                          <button onClick={() => copy(address, role)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
                            {copiedField === role
                              ? <CheckCircle2 className="size-3 text-[var(--color-verdict-pass)]" />
                              : <Copy className="size-3" />}
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--color-muted-foreground)] italic">
                          Awaiting acceptance…
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Submission */}
            {deal.submission && (
              <Card>
                <CardHeader><CardTitle>Work Submission</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <a
                    href={deal.submission}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
                  >
                    <ExternalLink className="size-3.5" />
                    <span className="truncate">{deal.submission}</span>
                  </a>
                  {deal.submissionDescription && (
                    <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                      {deal.submissionDescription}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Buyer review actions (SUBMITTED) ── */}
            {deal.status === "SUBMITTED" && isBuyer && (
              <Card className="border-[var(--color-primary)]/15 bg-[var(--color-primary)]/3">
                <CardHeader>
                  <CardTitle>Review Submitted Work</CardTitle>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Your creative has submitted their work. Review it and decide how to proceed.
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => run("approve", () => approveWork(deal.id))}
                    loading={actionLoading === "approve"}
                  >
                    {actionLoading !== "approve" && <ThumbsUp className="size-3.5" />}
                    Approve &amp; Release Payment
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 gap-2"
                    onClick={() => run("ai-review", () => requestAIReview(deal.id))}
                    loading={actionLoading === "ai-review"}
                  >
                    {actionLoading !== "ai-review" && <Brain className="size-3.5" />}
                    Request AI Review
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* AI Verdict Panel */}
            <AIVerdictPanel
              verdict={deal.aiVerdict}
              isPending={isAIReviewing}
              status={deal.status}
              isBuyer={isBuyer}
              onAcceptAI={canReleaseAfterAI ? () => run("release", () => releaseAfterAI(deal.id)) : undefined}
              onOverrideRelease={canReleaseAfterAI ? () => run("override-release", () => overrideAI(deal.id, true)) : undefined}
              onOverrideRefund={canReleaseAfterAI ? () => run("override-refund", () => overrideAI(deal.id, false)) : undefined}
              actionLoading={actionLoading}
            />

            {/* Secondary actions */}
            <div className="flex flex-wrap gap-3">
              {canSubmit && (
                <Link href={`/submit/${deal.id}`}>
                  <Button size="sm" className="gap-1.5">Submit Work</Button>
                </Link>
              )}
              {canCancel && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] gap-1.5"
                  onClick={() => run("cancel", () => cancelDeal(deal.id))}
                  loading={actionLoading === "cancel"}
                >
                  Cancel Deal
                </Button>
              )}
            </div>
          </div>

          {/* ── Side column ── */}
          <div className="flex flex-col gap-4">
            {/* Deal terms summary */}
            <Card>
              <CardContent className="p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
                  Agreement Terms
                </p>
                <div className="flex items-center gap-2">
                  <Banknote className="size-4 text-[var(--color-primary)] shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--color-muted-foreground)]">Escrow</p>
                    <p className="tabular text-sm font-semibold">{formatGEN(deal.amount)} GEN</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-[var(--color-primary)] shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--color-muted-foreground)]">Deadline</p>
                    <p className="text-sm font-semibold">{deal.deadline} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <EscrowStatus deal={deal} />
            <ActivityTimeline deal={deal} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
