import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DealStatus, VerdictResult } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatGEN(amount: string | bigint, decimals = 4): string {
  const value = typeof amount === "bigint" ? Number(amount) / 1e18 : parseFloat(amount);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatUSD(genAmount: string, genPrice = 2.4): string {
  const value = parseFloat(genAmount) * genPrice;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export function formatDeadline(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return "Expired";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

export function statusLabel(status: DealStatus): string {
  const labels: Record<DealStatus, string> = {
    CREATED: "Created",
    FUNDED: "Funded",
    SUBMITTED: "Submitted",
    DISPUTED: "Disputed",
    RESOLVED_PASS: "Approved",
    RESOLVED_FAIL: "Rejected",
    CANCELLED: "Cancelled",
  };
  return labels[status] ?? status;
}

export function statusColor(status: DealStatus): string {
  const colors: Record<DealStatus, string> = {
    CREATED: "text-muted-foreground",
    FUNDED: "text-[var(--color-status-funded)]",
    SUBMITTED: "text-[var(--color-primary)]",
    DISPUTED: "text-[var(--color-status-disputed)]",
    RESOLVED_PASS: "text-[var(--color-status-resolved)]",
    RESOLVED_FAIL: "text-[var(--color-destructive)]",
    CANCELLED: "text-muted-foreground",
  };
  return colors[status] ?? "text-foreground";
}

export function verdictColor(verdict: string): string {
  if (verdict === "PASS") return "text-[var(--color-verdict-pass)]";
  if (verdict === "FAIL") return "text-[var(--color-verdict-fail)]";
  return "text-[var(--color-verdict-pending)]";
}

export function confidenceLabel(score: number): string {
  if (score >= 90) return "Very High";
  if (score >= 75) return "High";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Low";
  return "Very Low";
}

export function generateDealId(): string {
  return `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`;
}
