"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getConnectedAddress, getWalletClient } from "@/lib/wallet";
import { readStakerPositions, readClaim, type StakerPosition } from "@/lib/genlayer";
import type { Claim } from "@/lib/contracts";

type Row = StakerPosition & { claim: Claim };

const STATE_LABEL: Record<string, string> = {
  OPEN: "Open", UNDER_CHALLENGE: "Challenged",
  UNDER_REVIEW: "In Review", RESOLVED: "Resolved", CLOSED: "Closed",
};
const STATE_COLOR: Record<string, string> = {
  OPEN: "#f59e0b", UNDER_CHALLENGE: "#ef4444",
  UNDER_REVIEW: "#8b5cf6", RESOLVED: "#22c55e", CLOSED: "#52525b",
};

function fmtGen(wei: number) {
  return (wei / 1e18).toFixed(2);
}

export function MyStakes() {
  const [rows,    setRows]    = useState<Row[] | null>(null);
  const [addr,    setAddr]    = useState<string | null>(null);
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState<string | null>(null);

  const load = useCallback(async (address: string) => {
    const positions = await readStakerPositions(address);
    const claims    = await Promise.all(positions.map((p) => readClaim(p.claim_id)));
    setRows(positions.map((p, i) => ({ ...p, claim: claims[i] })));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const a = await getConnectedAddress();
        if (!a) { setRows([]); return; }
        setAddr(a);
        await load(a);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [load]);

  async function connect() {
    setBusy(true); setErr(null);
    try {
      await getWalletClient();
      const a = await getConnectedAddress();
      if (!a) throw new Error("No account returned");
      setAddr(a);
      await load(a);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  /* ── NOT CONNECTED ── */
  if (!addr && rows !== null) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2"
          style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: "rgba(237,235,230,0.7)" }}>
            Connect your wallet
          </p>
          <p className="text-xs" style={{ color: "rgba(237,235,230,0.3)" }}>
            to view your stake history and PnL
          </p>
        </div>
        <button onClick={connect} disabled={busy}
          className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: "#7c3aed", color: "#fff", boxShadow: "0 0 24px rgba(124,58,237,0.35)" }}>
          {busy ? "Connecting…" : "Connect Wallet"}
        </button>
        {err && (
          <p className="text-xs font-mono" style={{ color: "#f87171" }}>{err}</p>
        )}
      </div>
    );
  }

  /* ── LOADING ── */
  if (rows === null) {
    return (
      <div className="flex flex-col gap-3 py-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl h-20 animate-pulse"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }} />
        ))}
      </div>
    );
  }

  /* ── ERROR ── */
  if (err) {
    return (
      <div className="py-10 px-4 text-sm font-mono rounded-lg"
        style={{ color: "#f87171", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
        {err}
      </div>
    );
  }

  /* ── EMPTY ── */
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <p className="text-sm font-medium" style={{ color: "rgba(237,235,230,0.35)" }}>
          No stakes found for{" "}
          <span style={{ color: "rgba(237,235,230,0.65)" }}>
            {addr?.slice(0, 6)}…{addr?.slice(-4)}
          </span>
        </p>
        <Link href="/arena"
          className="px-6 py-2.5 rounded-full text-sm font-semibold"
          style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" }}>
          Find a claim to stake →
        </Link>
      </div>
    );
  }

  /* ── SUMMARY ROW ── */
  const totalStaked = rows.reduce((s, r) => s + r.for + r.against, 0);
  const won  = rows.filter((r) => r.settled && r.winning_side !== "NONE" &&
    ((r.winning_side === "FOR" && r.for > 0) || (r.winning_side === "AGAINST" && r.against > 0)));
  const lost = rows.filter((r) => r.settled && r.winning_side !== "NONE" &&
    !((r.winning_side === "FOR" && r.for > 0) || (r.winning_side === "AGAINST" && r.against > 0)));

  return (
    <div>
      {/* Address + summary */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#22c55e" }} />
          <span className="text-[11px] font-mono" style={{ color: "rgba(237,235,230,0.4)" }}>
            {addr?.slice(0, 6)}…{addr?.slice(-4)}
          </span>
        </div>
        <div className="flex items-center gap-5 text-xs font-mono">
          <span style={{ color: "rgba(237,235,230,0.3)" }}>
            {fmtGen(totalStaked)} GEN staked
          </span>
          {won.length > 0 && (
            <span style={{ color: "#22c55e" }}>{won.length} won</span>
          )}
          {lost.length > 0 && (
            <span style={{ color: "#f87171" }}>{lost.length} lost</span>
          )}
        </div>
      </div>

      {/* Stake rows */}
      <div className="flex flex-col gap-3">
        {rows.map((r) => {
          const isWon      = r.settled && r.winning_side !== "NONE" &&
            ((r.winning_side === "FOR" && r.for > 0) || (r.winning_side === "AGAINST" && r.against > 0));
          const isLost     = r.settled && r.winning_side !== "NONE" && !isWon;
          const isRefunded = r.settled && r.winning_side === "NONE";
          const stateColor = STATE_COLOR[r.claim.state] ?? "#52525b";

          const outcomeColor = isWon ? "#22c55e" : isLost ? "#ef4444" : isRefunded ? "#a1a1aa" : stateColor;
          const outcomeLabel = isWon ? "WON" : isLost ? "LOST" : isRefunded ? "REFUNDED"
            : STATE_LABEL[r.claim.state] ?? r.claim.state;

          return (
            <Link key={r.claim_id} href={`/claim/${r.claim_id}`}
              className="block rounded-xl overflow-hidden transition-all duration-150"
              style={{ background: "#111010", border: "1px solid rgba(255,255,255,0.09)" }}>
              {/* top accent */}
              <div className="h-[2px]" style={{ background: outcomeColor, opacity: 0.5 }} />

              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  {/* Claim statement */}
                  <p className="text-sm leading-snug line-clamp-2 flex-1"
                    style={{ color: "rgba(237,235,230,0.82)" }}>
                    {r.claim.statement}
                  </p>
                  {/* Outcome badge */}
                  <span className="shrink-0 text-[10px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-full"
                    style={{
                      color: outcomeColor,
                      background: `${outcomeColor}14`,
                      border: `1px solid ${outcomeColor}40`,
                    }}>
                    {outcomeLabel}
                  </span>
                </div>

                {/* Stake breakdown */}
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-[10px] font-mono tabular-nums"
                    style={{ color: "rgba(237,235,230,0.2)" }}>
                    #{r.claim_id}
                  </span>
                  {r.for > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#8b5cf6" }} />
                      <span style={{ color: "#a78bfa" }}>FOR {fmtGen(r.for)} GEN</span>
                    </span>
                  )}
                  {r.against > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#ef4444" }} />
                      <span style={{ color: "#f87171" }}>AGAINST {fmtGen(r.against)} GEN</span>
                    </span>
                  )}
                  <span className="ml-auto" style={{ color: "rgba(237,235,230,0.2)" }}>→</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
