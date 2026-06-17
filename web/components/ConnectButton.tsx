"use client";

import { useEffect, useState } from "react";
import { getWalletClient, getConnectedAddress } from "@/lib/wallet";

const FAUCET = "https://testnet-faucet.genlayer.foundation";

export function ConnectButton() {
  const [addr, setAddr] = useState<string | null>(null);
  const [bal,  setBal]  = useState<bigint | null>(null);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState<string | null>(null);

  useEffect(() => {
    getConnectedAddress().then(setAddr).catch(() => {});
  }, []);

  useEffect(() => {
    if (!addr) return;
    let alive = true;
    const fetchBal = async () => {
      try {
        const c: any = await getWalletClient();
        const b = await c.getBalance({ address: addr as `0x${string}` });
        if (alive) setBal(BigInt(b ?? 0));
      } catch { /* transient */ }
    };
    fetchBal();
    const id = setInterval(fetchBal, 20_000);
    return () => { alive = false; clearInterval(id); };
  }, [addr]);

  async function connect() {
    setBusy(true); setErr(null);
    try {
      await getWalletClient();
      setAddr(await getConnectedAddress());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (addr) {
    const empty  = bal !== null && bal === 0n;
    const genStr =
      bal === null ? "…"
      : bal === 0n  ? "0"
      : (Number(bal) / 1e18).toFixed(bal < 10n ** 16n ? 4 : 2);

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#22c55e" }} />
          <span style={{ color: "rgba(237,235,230,0.6)" }}>
            {addr.slice(0, 6)}…{addr.slice(-4)}
          </span>
          <span style={{ color: empty ? "#f87171" : "rgba(237,235,230,0.4)" }}
            className="tabular-nums">
            {genStr} GEN
          </span>
        </div>
        {empty && (
          <a href={FAUCET} target="_blank" rel="noreferrer"
            className="text-[10px] font-mono px-3 py-1.5 rounded-full transition-all"
            style={{
              color: "#a78bfa",
              border: "1px solid rgba(139,92,246,0.25)",
              background: "rgba(139,92,246,0.08)",
            }}>
            Faucet ↗
          </a>
        )}
        {err && <span className="text-[10px] font-mono" style={{ color: "#f87171" }}>{err}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={connect} disabled={busy}
        className="px-4 py-1.5 rounded-full text-sm font-medium transition-all disabled:opacity-50"
        style={{
          background: "rgba(139,92,246,0.15)",
          border: "1px solid rgba(139,92,246,0.3)",
          color: "#a78bfa",
        }}>
        {busy ? "Connecting…" : "Connect Wallet"}
      </button>
      {err && <span className="text-[10px] font-mono" style={{ color: "#f87171" }}>{err}</span>}
    </div>
  );
}
