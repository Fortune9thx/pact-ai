"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useDeals } from "@/hooks/useDeal";
import { DealCard } from "@/components/deals/DealCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatGEN, cn } from "@/lib/utils";
import {
  PlusCircle, LayoutDashboard, Brain, Banknote, Clock,
  RefreshCw, ArrowRight, TrendingUp
} from "lucide-react";

function StatCard({
  label, value, sub, icon: Icon, accent, index
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent?: string; index: number;
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
            <div className={cn("flex size-8 items-center justify-center rounded-lg", accent ?? "bg-[var(--color-surface-raised)]")}>
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

export default function DashboardPage() {
  const { deals, stats, loading, refresh } = useDeals();

  const activeDeals = deals.filter((d) =>
    ["FUNDED", "SUBMITTED", "DISPUTED"].includes(d.status)
  );
  const recentDeals = [...deals]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <LayoutDashboard className="size-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-semibold">Overview</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={refresh}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          </Button>
          <Link href="/create">
            <Button size="sm" className="gap-1.5">
              <PlusCircle className="size-3.5" />
              New Deal
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active Deals" value={String(stats.activeDeals)} sub="In progress" icon={TrendingUp} index={0} />
          <StatCard label="Pending Reviews" value={String(stats.pendingReviews)} sub="Awaiting AI verdict" icon={Clock} index={1} />
          <StatCard label="Total Deals" value={stats.escrowVolume} sub="All time" icon={Banknote} index={2} />
          <StatCard label="AI Resolution Rate" value={`${stats.aiResolutionRate}%`} sub="Auto-resolved by AI" icon={Brain} index={3} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shimmer-bg" />
          ))}
        </div>
      )}

      {/* Active deals + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active deals — 2 cols */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Active Deals</h3>
            <span className="tabular text-xs text-[var(--color-muted-foreground)]">
              {activeDeals.length} deal{activeDeals.length !== 1 ? "s" : ""}
            </span>
          </div>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shimmer-bg" />
              ))}
            </div>
          ) : activeDeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-[var(--color-border)] text-center">
              <LayoutDashboard className="size-8 text-[var(--color-muted-foreground)] mb-3 opacity-40" />
              <p className="text-sm font-medium text-[var(--color-muted-foreground)]">No active deals</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1 mb-4">Create a deal to get started</p>
              <Link href="/create">
                <Button size="sm" className="gap-1.5">
                  <PlusCircle className="size-3.5" />
                  Create Deal
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeDeals.map((deal, i) => (
                <DealCard key={deal.id} deal={deal} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Recent activity — 1 col */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Recent Deals</h3>
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
    </div>
  );
}
