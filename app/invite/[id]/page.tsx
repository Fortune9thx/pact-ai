"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDeal, useClaimDeal } from "@/hooks/useDeal";
import { useWallet } from "@/hooks/useWallet";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatGEN, truncateAddress } from "@/lib/utils";
import { DEMO_SELLER } from "@/lib/demo-store";
import {
  Shield, Zap, CheckCircle2, AlertTriangle, Clock,
  Banknote, FileText, Wallet, ArrowRight, ExternalLink, UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/* ── helpers ── */
function badgeVariant(status: string) {
  const map: Record<string, string> = {
    PENDING: "funded", FUNDED: "default", CANCELLED: "destructive",
    SUBMITTED: "default", RESOLVED_PASS: "resolved", RESOLVED_FAIL: "destructive",
  };
  return (map[status] ?? "secondary") as "default" | "secondary" | "funded" | "resolved" | "destructive";
}

export default function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { deal, loading } = useDeal(id);
  const { wallet, connect } = useWallet();
  const { setWallet } = useStore();
  const claimDeal = useClaimDeal();

  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // If already FUNDED (someone else claimed or current user already claimed), redirect
  const isClaimed = deal && deal.status !== "PENDING";
  const isAlreadyMySeller = deal && wallet.address &&
    deal.seller.toLowerCase() === wallet.address.toLowerCase();

  useEffect(() => {
    if (isAlreadyMySeller && deal?.status === "FUNDED") {
      router.push(`/deal/${id}`);
    }
  }, [isAlreadyMySeller, deal?.status, id, router]);

  const handleClaim = async () => {
    if (!wallet.isConnected) { connect(); return; }
    setClaiming(true);
    setClaimError(null);
    try {
      await claimDeal(id);
      setClaimed(true);
      setTimeout(() => router.push(`/deal/${id}`), 1800);
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Failed to claim deal. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shimmer-bg" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!deal) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="size-8 text-[var(--color-muted-foreground)] mx-auto mb-3" />
          <h2 className="text-base font-semibold mb-1">Agreement not found</h2>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
            This invite link may be invalid or the deal was cancelled.
          </p>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  /* ── Already claimed by someone else ── */
  if (isClaimed && !isAlreadyMySeller) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-muted)] mx-auto mb-3">
            <Shield className="size-6 text-[var(--color-muted-foreground)]" />
          </div>
          <h2 className="text-base font-semibold mb-1">This deal is no longer open</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Status: <span className="font-medium">{deal.status}</span>
          </p>
        </div>
      </div>
    );
  }

  /* ── Claimed success ── */
  if (claimed) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--color-verdict-pass)]/15 mx-auto mb-4">
            <CheckCircle2 className="size-7 text-[var(--color-verdict-pass)]" />
          </div>
          <h2 className="text-lg font-semibold mb-1">You&apos;re in!</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Taking you to the deal page…
          </p>
        </motion.div>
      </div>
    );
  }

  /* ── Main invite view ── */
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Minimal nav */}
      <nav className="border-b border-[var(--color-border)] bg-white/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-[var(--color-primary)]">
            <Zap className="size-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-[var(--color-foreground)]">Pact</span>
        </div>
        <Badge variant={badgeVariant(deal.status)} className="text-[10px]">
          Open for acceptance
        </Badge>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Intro */}
          <div className="mb-5">
            <p className="text-xs font-medium text-[var(--color-primary)] uppercase tracking-wide mb-1">
              You&apos;ve been invited
            </p>
            <h1 className="text-xl font-bold text-[var(--color-foreground)] leading-snug">
              Review &amp; accept a protected creative agreement
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1.5">
              Funds are held in escrow — you get paid when the work is approved.
            </p>
          </div>

          {/* Brief card */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="size-4 text-[var(--color-primary)]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Creative Brief
              </span>
            </div>
            <p className="text-sm text-[var(--color-foreground)] leading-relaxed italic">
              &ldquo;{deal.prompt}&rdquo;
            </p>
          </div>

          {/* Terms strip */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex flex-col gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-center">
              <Banknote className="size-4 text-[var(--color-primary)] mx-auto" />
              <p className="tabular text-sm font-bold text-[var(--color-foreground)]">
                {formatGEN(deal.amount)} GEN
              </p>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">Escrow</p>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-center">
              <Clock className="size-4 text-[var(--color-primary)] mx-auto" />
              <p className="tabular text-sm font-bold text-[var(--color-foreground)]">
                {deal.deadline}d
              </p>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">Deadline</p>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-center">
              <Shield className="size-4 text-[var(--color-primary)] mx-auto" />
              <p className="text-sm font-bold text-[var(--color-foreground)]">AI</p>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">Protected</p>
            </div>
          </div>

          {/* Buyer info */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] mb-5">
            <div className="size-6 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center">
              <Wallet className="size-3.5 text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">Buyer</p>
              <p className="font-mono text-xs text-[var(--color-foreground)]">
                {truncateAddress(deal.buyer, 6)}
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 mb-5">
            <p className="text-xs font-semibold text-[var(--color-foreground)] mb-3">How this works</p>
            <div className="flex flex-col gap-2.5">
              {[
                { n: "1", text: "Accept the agreement — your wallet is registered as the seller" },
                { n: "2", text: "Complete the creative work and submit a URL" },
                { n: "3", text: "Buyer reviews and approves — escrow is released to you" },
                { n: "4", text: "If disputed, AI reviews the work against the brief objectively" },
              ].map(({ n, text }) => (
                <div key={n} className="flex items-start gap-3">
                  <div className="flex size-5 items-center justify-center rounded-full bg-[var(--color-primary)]/10 shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-[var(--color-primary)]">{n}</span>
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {claimError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-destructive)]/8 border border-[var(--color-destructive)]/20 mb-4">
              <AlertTriangle className="size-3.5 text-[var(--color-destructive)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--color-destructive)]">{claimError}</p>
            </div>
          )}

          {/* CTA */}
          {!wallet.isConnected ? (
            <div className="flex flex-col gap-3">
              <Button size="lg" className="w-full gap-2" onClick={connect}>
                <Wallet className="size-4" />
                Connect Wallet to Accept
              </Button>
              <p className="text-center text-xs text-[var(--color-muted-foreground)]">
                You&apos;ll need a Web3 wallet (MetaMask, etc.) to accept and receive payment.
              </p>
            </div>
          ) : wallet.address?.toLowerCase() === deal.buyer.toLowerCase() ? (
            <div className="flex flex-col gap-3">
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-lg border",
                "border-[var(--color-status-disputed)]/25 bg-[var(--color-status-disputed)]/8"
              )}>
                <AlertTriangle className="size-3.5 text-[var(--color-status-disputed)] shrink-0" />
                <p className="text-xs text-[var(--color-foreground)]">
                  You created this deal — you can&apos;t also be the seller.
                </p>
              </div>
              {IS_DEMO && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setWallet({
                    address: DEMO_SELLER as `0x${string}`,
                    balance: "50.0000",
                    chainName: "Demo Mode (Seller)",
                  })}
                >
                  <UserCheck className="size-3.5" />
                  Switch to Seller persona (demo)
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Button size="lg" className="w-full gap-2" onClick={handleClaim} loading={claiming}>
                {!claiming && <CheckCircle2 className="size-4" />}
                {claiming ? "Accepting Agreement…" : "Accept & Start Working"}
              </Button>
              <div className="flex items-center gap-1.5">
                <div className="flex size-4 items-center justify-center rounded-full bg-[var(--color-primary)]/10 shrink-0">
                  <Wallet className="size-2.5 text-[var(--color-primary)]" />
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Connected as{" "}
                  <span className="font-mono text-[var(--color-foreground)]">
                    {truncateAddress(wallet.address!, 6)}
                  </span>
                </p>
              </div>
              <Link href={`/deal/${id}`} className="w-full">
                <Button variant="ghost" size="sm" className="w-full gap-1.5 text-[var(--color-muted-foreground)]">
                  <ExternalLink className="size-3.5" />
                  Preview deal page
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
