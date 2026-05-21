"use client";

import { useStore } from "@/store/useStore";
import { CheckCircle2, XCircle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const stepConfig = {
  idle: null,
  signing: { icon: Loader2, color: "text-[var(--color-primary)]", spin: true, label: "Waiting for signature" },
  broadcasting: { icon: Loader2, color: "text-[var(--color-primary)]", spin: true, label: "Broadcasting transaction" },
  confirming: { icon: Loader2, color: "text-[var(--color-status-funded)]", spin: true, label: "Confirming on-chain" },
  confirmed: { icon: CheckCircle2, color: "text-[var(--color-verdict-pass)]", spin: false, label: "Confirmed" },
  failed: { icon: XCircle, color: "text-[var(--color-destructive)]", spin: false, label: "Failed" },
};

export function TransactionStatus() {
  const { transaction, clearTransaction } = useStore();

  if (!transaction || transaction.step === "idle") return null;

  const config = stepConfig[transaction.step];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        key="tx-status"
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm"
      >
        <div className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card-hover)]">
          <Icon
            className={cn("size-4 mt-0.5 shrink-0", config.color, config.spin && "animate-spin")}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
              {transaction.label}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
              {config.label}
              {transaction.hash && (
                <span className="font-mono ml-1 opacity-60">
                  · {transaction.hash.slice(0, 8)}...
                </span>
              )}
            </p>
            {transaction.error && (
              <p className="text-xs text-[var(--color-destructive)] mt-1 leading-relaxed">
                {transaction.error}
              </p>
            )}
          </div>
          {(transaction.step === "confirmed" || transaction.step === "failed") && (
            <button
              onClick={clearTransaction}
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors shrink-0"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
