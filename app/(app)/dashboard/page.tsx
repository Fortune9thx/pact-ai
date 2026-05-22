"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDeals } from "@/hooks/useDeal";
import { useWallet } from "@/hooks/useWallet";
import { DealCard } from "@/components/deals/DealCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatGEN, cn } from "@/lib/utils";
import { getInviteUrl } from "@/lib/invite";
import type { Deal } from "@/lib/types";
import {
  PlusCircle, LayoutDashboard, Brain, Banknote, Clock,
  RefreshCw, ArrowRight, TrendingUp, Share2, Copy,
  CheckCircle2, AlertTriangle,
} from "lucide-react";

/* ── Stat card ──────────────────────────────────────────────────── */
function StatCard({
  label, value, sub, icon: Icon, index,
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="p-5">
        <CardContent className="p-0">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">{label}</p>
            <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-surface-raised)]">
              <Icon className="size-4 text-[var(--color-primary)]" />
            </div>
          </div>
          <p className="tabular text-2xl font-bold text-[var(--color-foreground)]">{value}</p>
          {sub && <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── Pending invite row ─────────────────────────────────────────── */
function PendingInviteRow({ deal }: { deal: Deal }) {
  const [copied, setCopied] = useState(false);
  const url = getInviteUrl(deal.id);
  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-raised)] transition-colors">
      <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 shrink-0">
        <Share2 className="size-3.5 text-[var(--color-primary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--color-foreground)] truncate">
          {deal.prompt.slice(0, 45)}{deal.prompt.length > 45 ? "…" : ""}
        </p>
        <p className="font-mono text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
          {deal.id} · {formatGEN(deal.amount)} GEN
        </p>
      </div>
      <button
        onClick={copy}
        className={cn(
          "flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-md border transition-all shrink-0",
          copied
            ? "border-[var(--color-verdict-pass)]/25 text-[var(--color-verdict-pass)] bg-[var(--color-verdict-pass)]/8"
            : "border-[var(--color-primary)]/25 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
        )}
      >
        {copied ? <CheckCircle2 className="size-3" /> : <Copy className="size-3" />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <Link href={`/deal/${deal.id}`} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors">
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

/* ── AI review needs-action row ─────────────────────────────────── */
function AIReviewRow({ deal }: { deal: Deal }) {
  return (
    <Link href={`/deal/${deal.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-raised)] transition-colors group">
      <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-accent)]/15 shrink-0">
        <Brain className="size-3.5 text-[var(--color-accent-foreground)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--color-foreground)] truncate">
          {deal.prompt.slice(0, 45)}{deal.prompt.length > 45 ? "…" : ""}
        </p>
        <p className="font-mono text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
          {deal.id} · AI reviewed · awaiting your decision
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-medium text-[var(--color-accent-foreground)] bg-[var(--color-accent)]/15 px-2 py-0.5 rounded-full">
          {deal.aiVerdict?.confidence ?? "—"}% confidence
        </span>
        <ArrowRight className="size-3 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition-colors" />
      </div>
    </Link>
  );
}

/* ── Section wrapper ────────────────────────────────────────────── */
function Section({
  title, count, children, empty, action,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  empty: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          {count > 0 && (
            <span className="tabular text-[10px] font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/8 px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        {action}
      </div>
      {count === 0 ? empty : children}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { deals, stats, loading, refresh, myDeals } = useDeals();
  const { wallet } = useWallet();

  const [myBuying, setMyBuying] = useState<Deal[]>([]);
  const [mySelling, setMySelling] = useState<Deal[]>([]);
  const [myLoading, setMyLoading] = useState(false);

  const loadMyDeals = useCallback(async () => {
    if (!wallet.address) return;
    setMyLoading(true);
    try {
      const { buying, selling } = await myDeals();
      setMyBuying(buying);
      setMySelling(selling);
    } finally {
      setMyLoading(false);
    }
  }, [myDeals, wallet.address]);

  useEffect(() => { loadMyDeals(); }, [loadMyDeals]);

  const handleRefresh = async () => { await refresh(); await loadMyDeals(); };

  // Sections derived from myDeals (role-aware)
  const pendingInvites   = myBuying.filter(d => d.status === "PENDING");
  const activeCollabs    = [
    ...myBuying.filter(d => ["FUNDED", "SUBMITTED"].includes(d.status)),
    ...mySelling.filter(d => ["FUNDED", "SUBMITTED"].includes(d.status)),
  ];
  const needsMyReview    = myBuying.filter(d => d.status === "AI_REVIEWED");
  const sellingActive    = mySelling.filter(d => d.status === "FUNDED");

  // Fallback to all deals when wallet not connected
  const showGlobal = !wallet.isConnected;
  const globalActive = deals.filter(d => ["FUNDED", "SUBMITTED", "AI_REVIEWED"].includes(d.status));
  const recentDeals = [...deals].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 6);

  const isWorking = loading || myLoading;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <LayoutDashboard className="size-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-semibold">Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={handleRefresh} disabled={isWorking} title="Refresh">
            <RefreshCw className={cn("size-3.5", isWorking && "animate-spin")} />
          </Button>
          <Link href="/create">
            <Button size="sm" className="gap-1.5">
              <PlusCircle className="size-3.5" />
              New Agreement
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active Deals"      value={String(stats.activeDeals)}    sub="In progress"          icon={TrendingUp} index={0} />
          <StatCard label="Needs Review"      value={String(stats.pendingReviews)} sub="Awaiting your call"   icon={Brain}      index={1} />
          <StatCard label="Total Agreements"  value={stats.escrowVolume}           sub="All time"             icon={Banknote}   index={2} />
          <StatCard label="Resolved by AI"    value={`${stats.aiResolutionRate}%`} sub="AI-assisted outcomes" icon={Clock}      index={3} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shimmer-bg" />
          ))}
        </div>
      )}

      {/* Connected wallet: role-aware sections */}
      {wallet.isConnected ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-7">

            {/* 1. Awaiting Acceptance */}
            <Section
              title="Awaiting Acceptance"
              count={pendingInvites.length}
              action={
                <Link href="/create">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <PlusCircle className="size-3" /> New
                  </Button>
                </Link>
              }
              empty={
                <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-[var(--color-border)] text-center">
                  <Share2 className="size-7 text-[var(--color-muted-foreground)] mb-2 opacity-40" />
                  <p className="text-xs text-[var(--color-muted-foreground)]">No pending invites</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                    Create an agreement and share the invite link
                  </p>
                </div>
              }
            >
              <Card>
                <CardContent className="p-0 divide-y divide-[var(--color-border)]">
                  {pendingInvites.map(d => <PendingInviteRow key={d.id} deal={d} />)}
                </CardContent>
              </Card>
            </Section>

            {/* 2. Needs Your Review (AI reviewed) */}
            {needsMyReview.length > 0 && (
              <Section
                title="Needs Your Decision"
                count={needsMyReview.length}
                empty={null}
              >
                <Card className="border-[var(--color-accent)]/25">
                  <CardContent className="p-0 divide-y divide-[var(--color-border)]">
                    {needsMyReview.map(d => <AIReviewRow key={d.id} deal={d} />)}
                  </CardContent>
                </Card>
              </Section>
            )}

            {/* 3. Active Collaborations */}
            <Section
              title="Active Collaborations"
              count={activeCollabs.length}
              empty={
                <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-[var(--color-border)] text-center">
                  <LayoutDashboard className="size-7 text-[var(--color-muted-foreground)] mb-2 opacity-40" />
                  <p className="text-xs text-[var(--color-muted-foreground)]">No active collaborations</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 mb-4">
                    Deals appear here once a seller accepts
                  </p>
                  <Link href="/create">
                    <Button size="sm" className="gap-1.5">
                      <PlusCircle className="size-3.5" /> Create Agreement
                    </Button>
                  </Link>
                </div>
              }
            >
              <div className="flex flex-col gap-3">
                {activeCollabs.map((deal, i) => <DealCard key={deal.id} deal={deal} index={i} />)}
              </div>
            </Section>

            {/* 4. As seller */}
            {sellingActive.length > 0 && (
              <Section title="Work to Deliver" count={sellingActive.length} empty={null}>
                <div className="flex flex-col gap-3">
                  {sellingActive.map((deal, i) => <DealCard key={deal.id} deal={deal} index={i} />)}
                </div>
              </Section>
            )}
          </div>

          {/* Recent activity sidebar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Recent Agreements</h3>
            </div>
            <Card>
              <CardContent className="p-0">
                {recentDeals.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[var(--color-muted-foreground)]">
                    No deals yet
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--color-border)]">
                    {recentDeals.map((deal) => (
                      <Link
                        key={deal.id}
                        href={`/deal/${deal.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--color-surface-raised)] transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-[var(--color-foreground)] truncate">
                            {deal.prompt.slice(0, 40)}{deal.prompt.length > 40 ? "…" : ""}
                          </p>
                          <p className="font-mono text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
                            {deal.id}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="tabular text-xs text-[var(--color-muted-foreground)]">
                            {formatGEN(deal.amount, 2)}
                          </span>
                          <ArrowRight className="size-3 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Not connected — show global active deals */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Active Deals</h3>
              <span className="tabular text-xs text-[var(--color-muted-foreground)]">
                {globalActive.length} deal{globalActive.length !== 1 ? "s" : ""}
              </span>
            </div>
            {isWorking ? (
              <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shimmer-bg" />
                ))}
              </div>
            ) : globalActive.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-[var(--color-border)] text-center">
                <AlertTriangle className="size-8 text-[var(--color-muted-foreground)] mb-3 opacity-40" />
                <p className="text-sm font-medium text-[var(--color-muted-foreground)]">No active deals on-chain</p>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1 mb-4">Connect wallet to see your agreements</p>
                <Link href="/create">
                  <Button size="sm" className="gap-1.5"><PlusCircle className="size-3.5" /> Create Agreement</Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {globalActive.map((deal, i) => <DealCard key={deal.id} deal={deal} index={i} />)}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Recent</h3>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-[var(--color-border)]">
                  {recentDeals.map((deal) => (
                    <Link key={deal.id} href={`/deal/${deal.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--color-surface-raised)] transition-colors group">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{deal.prompt.slice(0, 40)}{deal.prompt.length > 40 ? "…" : ""}</p>
                        <p className="font-mono text-[10px] text-[var(--color-muted-foreground)] mt-0.5">{deal.id}</p>
                      </div>
                      <ArrowRight className="size-3 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
