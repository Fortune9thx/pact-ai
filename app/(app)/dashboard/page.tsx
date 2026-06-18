"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDeals } from "@/hooks/useDeal";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatGEN, statusLabel, truncateAddress } from "@/lib/utils";
import { getInviteUrl } from "@/lib/invite";
import type { Deal, DealStatus } from "@/lib/types";
import {
  PlusCircle, RefreshCw, ArrowUpRight, Copy, CheckCircle2,
  Zap, Clock, TrendingUp, Layers, Share2, ChevronRight,
} from "lucide-react";

/* ── Status config ──────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<DealStatus, { label: string; dot: string; badge: string; text: string }> = {
  PENDING:        { label: "Awaiting Seller", dot: "#6366F1", badge: "rgba(99,102,241,0.12)",  text: "#6366F1" },
  FUNDED:         { label: "Active",          dot: "#10B981", badge: "rgba(16,185,129,0.12)",  text: "#059669" },
  SUBMITTED:      { label: "Work In",         dot: "#8B5CF6", badge: "rgba(139,92,246,0.12)",  text: "#7C3AED" },
  AI_REVIEWED:    { label: "AI Reviewed",     dot: "#F59E0B", badge: "rgba(245,158,11,0.12)",  text: "#D97706" },
  RESOLVED_PASS:  { label: "Approved",        dot: "#10B981", badge: "rgba(16,185,129,0.10)",  text: "#059669" },
  RESOLVED_FAIL:  { label: "Rejected",        dot: "#EF4444", badge: "rgba(239,68,68,0.10)",   text: "#DC2626" },
  CANCELLED:      { label: "Cancelled",       dot: "#9CA3AF", badge: "rgba(156,163,175,0.12)", text: "#6B7280" },
};

function StatusPill({ status }: { status: DealStatus }) {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.CANCELLED;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{ background: c.badge, color: c.text }}
    >
      <span className="size-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

/* ── Stat card ──────────────────────────────────────────────────────── */
function StatCard({
  label, value, sub, icon: Icon, accent, index,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; accent: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-2xl p-5 bg-white flex flex-col gap-2"
      style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>{label}</span>
        <span
          className="flex size-7 items-center justify-center rounded-lg"
          style={{ background: accent + "18" }}
        >
          <Icon className="size-3.5" style={{ color: accent }} />
        </span>
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ color: "#111827" }}>{value}</p>
      <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{sub}</p>
    </motion.div>
  );
}

/* ── Deal row ───────────────────────────────────────────────────────── */
function DealRow({
  deal, role, index,
}: {
  deal: Deal; role: "buyer" | "seller" | "open"; index: number;
}) {
  const [copied, setCopied] = useState(false);

  const copyInvite = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(getInviteUrl(deal.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const amountNum = typeof deal.amount === "string" ? parseFloat(deal.amount) : Number(deal.amount);

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
    >
      <Link
        href={`/deal/${deal.id}`}
        className="flex items-center gap-3 px-5 py-4 hover:bg-[#FAFAFA] transition-colors group"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      >
        {/* Status dot */}
        <span
          className="size-2 rounded-full shrink-0"
          style={{ background: STATUS_CONFIG[deal.status]?.dot ?? "#9CA3AF" }}
        />

        {/* Brief */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "#111827" }}>
            {deal.prompt.length > 52
              ? deal.prompt.slice(0, 52) + "…"
              : deal.prompt}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-[10px]" style={{ color: "#9CA3AF" }}>{deal.id}</span>
            {deal.deadline > 0 && (
              <>
                <span style={{ color: "#D1D5DB" }}>·</span>
                <span className="text-[10px]" style={{ color: "#9CA3AF" }}>
                  {deal.deadline}d deadline
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status pill — hidden on mobile */}
        <div className="hidden sm:block shrink-0">
          <StatusPill status={deal.status} />
        </div>

        {/* Amount */}
        <div className="text-right shrink-0 w-20">
          <p className="text-sm font-semibold tabular-nums" style={{ color: "#111827" }}>
            {amountNum} GEN
          </p>
        </div>

        {/* Copy invite (PENDING buyer only) */}
        {role === "buyer" && deal.status === "PENDING" && (
          <button
            onClick={copyInvite}
            className={cn(
              "flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-lg border shrink-0 transition-all",
              copied
                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                : "border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            )}
          >
            {copied ? <CheckCircle2 className="size-3" /> : <Share2 className="size-3" />}
            {copied ? "Copied" : "Invite"}
          </button>
        )}

        {/* Arrow */}
        <ChevronRight className="size-4 shrink-0 opacity-30 group-hover:opacity-70 transition-opacity" />
      </Link>
    </motion.div>
  );
}

/* ── Section ────────────────────────────────────────────────────────── */
function Section({
  title, badge, children, empty, cta,
}: {
  title: string;
  badge?: number;
  children: React.ReactNode;
  empty?: React.ReactNode;
  cta?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden bg-white"
      style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold" style={{ color: "#111827" }}>{title}</h3>
          {badge !== undefined && badge > 0 && (
            <span
              className="tabular text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1" }}
            >
              {badge}
            </span>
          )}
        </div>
        {cta}
      </div>
      {badge === 0 || !children ? empty : children}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { deals, loading, refresh } = useDeals();
  const { wallet } = useWallet();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  }, [refresh]);

  // Auto-refresh every 15s while connected — GenLayer validators take 30–120s,
  // so new deals and status changes won't appear until the next poll.
  useEffect(() => {
    if (!wallet.isConnected) return;
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [wallet.isConnected, refresh]);

  // Case-insensitive address match against all deals in the store
  const myAddr = useMemo(
    () => (wallet.address ?? "").toLowerCase(),
    [wallet.address]
  );

  const myBuyingDeals = useMemo(
    () => deals.filter(d => d.buyer.toLowerCase() === myAddr),
    [deals, myAddr]
  );

  const mySellingDeals = useMemo(
    () => deals.filter(d => d.seller && d.seller.toLowerCase() === myAddr),
    [deals, myAddr]
  );

  // Open market: PENDING deals not created by me (potential seller opportunities)
  const openMarket = useMemo(
    () => deals.filter(d => d.status === "PENDING" && d.buyer.toLowerCase() !== myAddr),
    [deals, myAddr]
  );

  // Stats computed from real deal data
  const stats = useMemo(() => {
    const active  = myBuyingDeals.filter(d => ["PENDING","FUNDED","SUBMITTED","AI_REVIEWED"].includes(d.status)).length
                  + mySellingDeals.filter(d => ["FUNDED","SUBMITTED"].includes(d.status)).length;
    const pending = myBuyingDeals.filter(d => d.status === "PENDING").length;
    const done    = myBuyingDeals.filter(d => ["RESOLVED_PASS","RESOLVED_FAIL","CANCELLED"].includes(d.status)).length;
    const volume  = myBuyingDeals.reduce((s, d) => s + (parseFloat(String(d.amount)) || 0), 0);
    return { active, pending, done, volume };
  }, [myBuyingDeals, mySellingDeals]);

  // Active + pending grouped by recency (latest id last in array = highest id)
  const myActiveDeals = useMemo(() => [
    ...myBuyingDeals.filter(d => ["PENDING","FUNDED","SUBMITTED","AI_REVIEWED"].includes(d.status)),
    ...mySellingDeals.filter(d => ["FUNDED","SUBMITTED"].includes(d.status)),
  ].sort((a, b) => {
    const na = parseInt(a.id.replace("deal_",""),10);
    const nb = parseInt(b.id.replace("deal_",""),10);
    return nb - na;
  }), [myBuyingDeals, mySellingDeals]);

  const myClosedDeals = useMemo(() => [
    ...myBuyingDeals.filter(d => ["RESOLVED_PASS","RESOLVED_FAIL","CANCELLED"].includes(d.status)),
  ].sort((a, b) => {
    const na = parseInt(a.id.replace("deal_",""),10);
    const nb = parseInt(b.id.replace("deal_",""),10);
    return nb - na;
  }), [myBuyingDeals]);

  const isConnected = wallet.isConnected;
  const isLoading   = loading || refreshing;

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: "#111827" }}>
            Dashboard
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
            Overview of your deals and escrow activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex size-8 items-center justify-center rounded-lg border transition-colors hover:bg-gray-50"
            style={{ borderColor: "rgba(0,0,0,0.1)" }}
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} style={{ color: "#6B7280" }} />
          </button>
          <Link href="/create">
            <Button size="sm" className="gap-1.5 h-8">
              <PlusCircle className="size-3.5" />
              New Agreement
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard index={0} label="Active"       value={String(stats.active)}  sub="In progress"         icon={Zap}       accent="#6366F1" />
        <StatCard index={1} label="Awaiting"     value={String(stats.pending)} sub="Need seller"         icon={Clock}     accent="#F59E0B" />
        <StatCard index={2} label="Completed"    value={String(stats.done)}    sub="Resolved deals"      icon={TrendingUp} accent="#10B981" />
        <StatCard index={3} label="Volume"       value={`${stats.volume} GEN`} sub="Total escrowed"      icon={Layers}    accent="#8B5CF6" />
      </div>

      {isConnected ? (
        <div className="flex flex-col gap-5">

          {/* ── My Active Agreements ── */}
          <Section
            title="My Agreements"
            badge={myActiveDeals.length}
            cta={
              <Link href="/create">
                <button
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: "rgba(99,102,241,0.08)", color: "#6366F1" }}
                >
                  <PlusCircle className="size-3" />
                  New
                </button>
              </Link>
            }
            empty={
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div
                  className="flex size-12 items-center justify-center rounded-2xl mb-3"
                  style={{ background: "rgba(99,102,241,0.08)" }}
                >
                  <Layers className="size-5" style={{ color: "#6366F1" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "#374151" }}>No active agreements</p>
                <p className="text-xs mt-1 mb-5" style={{ color: "#9CA3AF" }}>
                  Create your first protected deal to get started
                </p>
                <Link href="/create">
                  <Button size="sm" className="gap-1.5">
                    <PlusCircle className="size-3.5" /> Create Agreement
                  </Button>
                </Link>
              </div>
            }
          >
            <div>
              {myActiveDeals.map((deal, i) => (
                <DealRow
                  key={deal.id}
                  deal={deal}
                  role={deal.buyer.toLowerCase() === myAddr ? "buyer" : "seller"}
                  index={i}
                />
              ))}
            </div>
          </Section>

          {/* ── Completed / Closed ── */}
          {myClosedDeals.length > 0 && (
            <Section
              title="Completed"
              badge={myClosedDeals.length}
              empty={null}
            >
              <div>
                {myClosedDeals.map((deal, i) => (
                  <DealRow key={deal.id} deal={deal} role="buyer" index={i} />
                ))}
              </div>
            </Section>
          )}

          {/* ── Open Market ── */}
          {openMarket.length > 0 && (
            <Section
              title="Open Market"
              badge={openMarket.length}
              cta={
                <span className="text-[10px] font-medium px-2 py-1 rounded-md"
                  style={{ background: "rgba(16,185,129,0.08)", color: "#059669" }}>
                  Accept any to start earning
                </span>
              }
              empty={null}
            >
              <div>
                {openMarket.slice(0, 5).map((deal, i) => (
                  <DealRow key={deal.id} deal={deal} role="open" index={i} />
                ))}
                {openMarket.length > 5 && (
                  <div className="px-5 py-3 text-center">
                    <Link href="/dashboard" onClick={handleRefresh}
                      className="text-xs font-medium" style={{ color: "#6366F1" }}>
                      View {openMarket.length - 5} more open deals
                    </Link>
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>
      ) : (
        /* ── Not connected — global view ── */
        <Section
          title="All Agreements"
          badge={deals.length}
          empty={
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <p className="text-sm font-semibold mb-1" style={{ color: "#374151" }}>
                Connect your wallet to see your deals
              </p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Or browse open agreements below
              </p>
            </div>
          }
        >
          <div>
            {deals.slice(0, 10).map((deal, i) => (
              <DealRow key={deal.id} deal={deal} role="open" index={i} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
