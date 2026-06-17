// In-memory pub/sub for pending Bradbury transactions. Wallet helpers push
// here when they get a tx hash; the <TxToasts/> client component subscribes
// and renders the live status pill. No state library on purpose — toasts
// don't need to survive a hard refresh; the explorer link is the durable record.

"use client";

export type TxKind =
  | "create_claim" | "stake_for" | "stake_against"
  | "challenge" | "submit_for_review" | "adjudicate" | "other";

export type TxStatus =
  | "SUBMITTING" | "PENDING" | "PROPOSING" | "COMMITTING" | "REVEALING"
  | "ACCEPTED" | "FINALIZED" | "UNDETERMINED" | "CANCELED" | "ERROR";

export interface TxItem {
  id: string;           // local id (random) — toast key
  hash?: `0x${string}`; // tx hash once the wallet returns it
  kind: TxKind;
  label: string;        // short human label, e.g. "stake FOR · #14"
  status: TxStatus;
  error?: string;
  createdAt: number;
}

type Listener = (items: TxItem[]) => void;

const items: TxItem[] = [];
const listeners = new Set<Listener>();

function emit() { for (const l of listeners) l([...items]); }

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  l([...items]);
  return () => { listeners.delete(l); };
}

export function pushTx(kind: TxKind, label: string): string {
  const id = Math.random().toString(36).slice(2, 10);
  items.unshift({ id, kind, label, status: "SUBMITTING", createdAt: Date.now() });
  emit();
  return id;
}

export function setTxHash(id: string, hash: `0x${string}`) {
  const it = items.find((i) => i.id === id);
  if (it) { it.hash = hash; it.status = "PENDING"; emit(); }
}

export function setTxStatus(id: string, status: TxStatus, error?: string) {
  const it = items.find((i) => i.id === id);
  if (it) {
    it.status = status;
    if (error) it.error = error;
    emit();
  }
}

export function dismissTx(id: string) {
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) { items.splice(idx, 1); emit(); }
}

// Convenience wrapper: run a wallet call, surface its lifecycle.
// Returns the tx hash (or throws). Caller doesn't have to know about the queue.
export async function trackTx<T extends `0x${string}`>(
  kind: TxKind,
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const id = pushTx(kind, label);
  try {
    const hash = await fn();
    setTxHash(id, hash);
    // Poll status in the background — don't block the caller.
    void pollUntilTerminal(id, hash);
    return hash;
  } catch (e: any) {
    setTxStatus(id, "ERROR", e?.shortMessage ?? e?.message ?? String(e));
    throw e;
  }
}

async function pollUntilTerminal(id: string, hash: `0x${string}`) {
  const { getWalletClient } = await import("./wallet");
  const c: any = await getWalletClient().catch(() => null);
  if (!c) { setTxStatus(id, "ERROR", "wallet client unavailable"); return; }
  // Cap at 90 min — past that, surface as stuck.
  const deadline = Date.now() + 90 * 60_000;
  while (Date.now() < deadline) {
    try {
      const tx: any = await c.getTransaction({ hash });
      const s = (tx?.statusName ?? "PENDING") as TxStatus;
      setTxStatus(id, s);
      if (s === "FINALIZED") return;
      if (s === "CANCELED" || s === "UNDETERMINED" || s === "ERROR") return;
    } catch { /* transient — keep polling */ }
    await new Promise((r) => setTimeout(r, 8000));
  }
  setTxStatus(id, "ERROR", "polling timeout after 90 min");
}
