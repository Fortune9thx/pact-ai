"use client";

import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils";
import { Wallet, ChevronDown, Copy, LogOut, ExternalLink, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function WalletConnection() {
  const { wallet, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // In demo mode, suppress the button until after hydration (auto-connect fires in useWallet's useEffect)
  // This prevents the flash of "Connect Wallet" before the demo wallet appears.
  if (IS_DEMO && !mounted) return null;

  const copyAddress = () => {
    if (!wallet.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!wallet.isConnected) {
    return (
      <Button onClick={connect} size="sm" className="gap-2">
        <Wallet className="size-3.5" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 h-9 px-3 rounded-lg text-sm transition-all",
          "bg-[var(--color-surface-overlay)] border border-[var(--color-border)]",
          "hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-raised)]",
          open && "border-[var(--color-primary)]/40"
        )}
      >
        {/* Status dot */}
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-verdict-pass)] opacity-40" />
          <span className="relative inline-flex rounded-full size-2 bg-[var(--color-verdict-pass)]" />
        </span>
        <span className="font-mono text-xs text-[var(--color-foreground)]">
          {truncateAddress(wallet.address ?? "")}
        </span>
        <span className="tabular text-xs text-[var(--color-muted-foreground)] hidden sm:inline">
          {parseFloat(wallet.balance).toFixed(2)} GEN
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-[var(--color-muted-foreground)] transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 w-64 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card-hover)] overflow-hidden animate-[fade-in_0.15s_ease-out]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-muted-foreground)] mb-0.5">Connected to</p>
              <p className="text-xs font-medium text-[var(--color-primary)]">{wallet.chainName}</p>
            </div>

            {/* Address */}
            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-muted-foreground)] mb-1.5">Address</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[var(--color-foreground)] flex-1 truncate">
                  {wallet.address}
                </span>
                <button
                  onClick={copyAddress}
                  className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  {copied ? (
                    <CheckCircle2 className="size-3.5 text-[var(--color-verdict-pass)]" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Balance */}
            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--color-muted-foreground)]">Balance</p>
                <p className="tabular text-sm font-semibold text-[var(--color-foreground)]">
                  {parseFloat(wallet.balance).toFixed(4)} GEN
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2 flex flex-col gap-0.5">
              <a
                href={`https://explorer.genlayer.com/address/${wallet.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-foreground)] transition-colors"
              >
                <ExternalLink className="size-3.5" />
                View on Explorer
              </a>
              <button
                onClick={() => { disconnect(); setOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors"
              >
                <LogOut className="size-3.5" />
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
