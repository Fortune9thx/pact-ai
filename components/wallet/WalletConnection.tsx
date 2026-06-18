"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWallet } from "@/hooks/useWallet";
import { truncateAddress } from "@/lib/utils";
import { Copy, LogOut, ExternalLink, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function WalletConnection() {
  const { wallet, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const copyAddress = () => {
    const addr = wallet.walletAddress ?? wallet.address;
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayAddress = wallet.walletAddress ?? wallet.address ?? "";

  if (!wallet.isConnected) {
    return <ConnectButton showBalance={false} chainStatus="icon" />;
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
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-verdict-pass)] opacity-40" />
          <span className="relative inline-flex rounded-full size-2 bg-[var(--color-verdict-pass)]" />
        </span>
        <span className="font-mono text-xs text-[var(--color-foreground)]">
          {truncateAddress(displayAddress)}
        </span>
        <span className="tabular text-xs text-[var(--color-muted-foreground)] hidden sm:inline">
          {parseFloat(wallet.balance).toFixed(2)} GEN
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 w-64 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card-hover)] overflow-hidden animate-[fade-in_0.15s_ease-out]">

            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-muted-foreground)] mb-0.5">Connected to</p>
              <p className="text-xs font-medium text-[var(--color-primary)]">{wallet.chainName}</p>
            </div>

            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-muted-foreground)] mb-1">Address</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[var(--color-foreground)] flex-1 break-all">
                  {displayAddress}
                </span>
                <button onClick={copyAddress} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors shrink-0">
                  {copied ? <CheckCircle2 className="size-3.5 text-[var(--color-verdict-pass)]" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--color-muted-foreground)]">Balance</p>
                <p className="tabular text-sm font-semibold text-[var(--color-foreground)]">
                  {parseFloat(wallet.balance).toFixed(4)} GEN
                </p>
              </div>
            </div>

            <div className="p-2 flex flex-col gap-0.5">
              <a
                href={`https://explorer-bradbury.genlayer.com/address/${wallet.address}`}
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
