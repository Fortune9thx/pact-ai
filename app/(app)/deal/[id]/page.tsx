"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDeal, useDisputeDeal, useRequestVerdict } from "@/hooks/useDeal";
import { useWallet } from "@/hooks/useWallet";
import { EscrowStatus } from "@/components/deals/EscrowStatus";
import { AIVerdictPanel } from "@/components/verdict/AIVerdictPanel";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { truncateAddress, formatGEN, statusLabel } from "@/lib/utils";
import { ArrowLeft, User, Copy, CheckCircle2, ExternalLink, AlertTriangle, Brain } from "lucide-react";
import { useState } from "react";

function statusVariant(status: string) {
  const map: Record<string, string> = {
    CREATED: "secondary", FUNDED: "funded", SUBMITTED: "default",
    DISPUTED: "disputed", RESOLVED_PASS: "resolved", RESOLVED_FAIL: "destructive", CANCELLED: "secondary",
  };
  return (map[status] ?? "secondary") as "default" | "secondary" | "funded" | "disputed" | "resolved" | "destructive";
}

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { deal, loading, refetch } = useDeal(id);
  const { wallet } = useWallet();
  const disputeDeal = useDisputeDeal();
  const requestVerdict = useRequestVerdict();
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDispute = async () => {
    if (!deal) return;
    setActionLoading(true);
    try {
      await disputeDeal(deal.id);
      await refetch();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestVerdict = async () => {
    if (!deal) return;
    setActionLoading(true);
    try {
      await requestVerdict(deal.id);
      await refetch();
    } finally {
      setActionLoading(false);
    }
  };

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

  const isBuyer = wallet.address?.toLowerCase() === deal.buyer.toLowerCase();
  const isSeller = wallet.address?.toLowerCase() === deal.seller.toLowerCase();
  const canDispute = isBuyer && deal.status === "SUBMITTED";
  const canRequestVerdict = (isBuyer || isSeller) && ["SUBMITTED", "DISPUTED"].includes(deal.status);
  const canSubmit = isSeller && deal.status === "FUNDED";
  const isDisputedPending = deal.status === "DISPUTED" && !deal.aiVerdict;

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Brief */}
            <Card>
              <CardHeader>
                <CardTitle>Creative Brief</CardTitle>
              </CardHeader>
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
                    { role: "Buyer", address: deal.buyer, isMe: isBuyer },
                    { role: "Seller", address: deal.seller, isMe: isSeller },
                  ].map(({ role, address, isMe }) => (
                    <div key={role} className="flex flex-col gap-1.5 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">{role}</p>
                        {isMe && <span className="text-[10px] text-[var(--color-primary)] font-medium">You</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="size-3 text-[var(--color-muted-foreground)] shrink-0" />
                        <span className="font-mono text-xs text-[var(--color-foreground)] flex-1 truncate">
                          {truncateAddress(address, 6)}
                        </span>
                        <button
                          onClick={() => copy(address, role)}
                          className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                        >
                          {copiedField === role
                            ? <CheckCircle2 className="size-3 text-[var(--color-verdict-pass)]" />
                            : <Copy className="size-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Submission */}
            {deal.submission && (
              <Card>
                <CardHeader><CardTitle>Submission</CardTitle></CardHeader>
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

            {/* AI Verdict */}
            <AIVerdictPanel
              verdict={deal.aiVerdict}
              isPending={isDisputedPending}
            />

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {canSubmit && (
                <Link href={`/submit/${deal.id}`}>
                  <Button size="sm" className="gap-1.5">
                    Submit Work
                  </Button>
                </Link>
              )}
              {canDispute && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDispute}
                  loading={actionLoading}
                  className="gap-1.5"
                >
                  <AlertTriangle className="size-3.5" />
                  Dispute &amp; Request AI Review
                </Button>
              )}
              {canRequestVerdict && !isDisputedPending && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleRequestVerdict}
                  loading={actionLoading}
                  className="gap-1.5"
                >
                  <Brain className="size-3.5" />
                  Request AI Verdict
                </Button>
              )}
            </div>
          </div>

          {/* Side column */}
          <div className="flex flex-col gap-4">
            <EscrowStatus deal={deal} />
            <ActivityTimeline deal={deal} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
