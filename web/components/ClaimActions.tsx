"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Claim } from "@/lib/contracts";
import { stake, challenge, submitForReview, adjudicate, tipClaim, parseGen } from "@/lib/wallet";

type Action = "stake" | "challenge" | "review" | "adjudicate" | "tip";

export function ClaimActions({ claim }: { claim: Claim }) {
  const [tab, setTab] = useState<Action>("stake");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const canStake      = claim.state === "OPEN" || claim.state === "UNDER_CHALLENGE";
  const canChallenge  = claim.state === "OPEN" || claim.state === "UNDER_CHALLENGE";
  const canReview     = claim.state === "UNDER_CHALLENGE";
  const canAdjudicate = claim.state === "UNDER_REVIEW";
  const canTip        = claim.state !== "CLOSED";

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setErr(null);
    try {
      await fn();
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const TABS: { key: Action; label: string; enabled: boolean }[] = [
    { key: "stake",      label: "Stake",         enabled: canStake },
    { key: "tip",        label: "Tip",            enabled: canTip },
    { key: "challenge",  label: "Challenge",      enabled: canChallenge },
    { key: "review",     label: "Submit Review",  enabled: canReview },
    { key: "adjudicate", label: "Adjudicate",     enabled: canAdjudicate },
  ];

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "#111010", border: "1px solid rgba(255,255,255,0.09)" }}>

      {/* Header */}
      <div className="px-6 pt-5 pb-0">
        <p className="text-[10px] font-mono tracking-[0.35em] uppercase mb-4"
          style={{ color: "rgba(237,235,230,0.28)" }}>
          Actions
        </p>

        {/* Underline tabs */}
        <div className="flex items-center gap-0 overflow-x-auto"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button key={t.key}
                onClick={() => t.enabled && setTab(t.key)}
                disabled={!t.enabled}
                className="px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all duration-150 relative"
                style={{
                  color: !t.enabled
                    ? "rgba(237,235,230,0.15)"
                    : active ? "#edebe6" : "rgba(237,235,230,0.4)",
                  borderBottom: active ? "2px solid #8b5cf6" : "2px solid transparent",
                  cursor: t.enabled ? "pointer" : "not-allowed",
                }}>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 py-5">
        {tab === "stake"      && <StakeForm     id={claim.id} disabled={!canStake || busy}      run={run} />}
        {tab === "tip"        && <TipForm       id={claim.id} disabled={!canTip || busy}        run={run} />}
        {tab === "challenge"  && <ChallengeForm id={claim.id} disabled={!canChallenge || busy}  run={run} />}
        {tab === "review"     && (
          <ConfirmAction
            label="Lock the pool and send this dispute to GenLayer validators for AI reasoning."
            disabled={!canReview || busy}
            onConfirm={() => run(() => submitForReview(claim.id))}
            cta="Submit for Review"
            ctaColor="#8b5cf6"
          />
        )}
        {tab === "adjudicate" && (
          <ConfirmAction
            label="Trigger validator reasoning. Verdict and reasoning will be written on-chain."
            disabled={!canAdjudicate || busy}
            onConfirm={() => run(() => adjudicate(claim.id))}
            cta="Adjudicate"
            ctaColor="#8b5cf6"
          />
        )}
        {err && (
          <div className="mt-4 text-xs font-mono px-3 py-2 rounded-lg"
            style={{ color: "#f87171", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {err}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shared input style ── */
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "#edebe6",
  fontSize: "14px",
  outline: "none",
};

/* ── STAKE ── */
function StakeForm({ id, disabled, run }: {
  id: number; disabled: boolean; run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [side, setSide] = useState<"FOR" | "AGAINST">("FOR");
  const [amount, setAmount] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => stake(id, side, parseGen(amount))); }}
      className="space-y-4">
      {/* Side toggle */}
      <div>
        <p className="text-[10px] font-mono tracking-widest uppercase mb-2"
          style={{ color: "rgba(237,235,230,0.3)" }}>Side</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setSide("FOR")}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold font-mono tracking-widest uppercase transition-all"
            style={{
              background: side === "FOR" ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${side === "FOR" ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.08)"}`,
              color: side === "FOR" ? "#a78bfa" : "rgba(237,235,230,0.35)",
            }}>
            FOR
          </button>
          <button type="button" onClick={() => setSide("AGAINST")}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold font-mono tracking-widest uppercase transition-all"
            style={{
              background: side === "AGAINST" ? "rgba(239,68,68,0.14)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${side === "AGAINST" ? "rgba(239,68,68,0.45)" : "rgba(255,255,255,0.08)"}`,
              color: side === "AGAINST" ? "#f87171" : "rgba(237,235,230,0.35)",
            }}>
            AGAINST
          </button>
        </div>
      </div>
      {/* Amount */}
      <div>
        <p className="text-[10px] font-mono tracking-widest uppercase mb-2"
          style={{ color: "rgba(237,235,230,0.3)" }}>Amount (GEN)</p>
        <input value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="10.0" inputMode="decimal" style={inputStyle} />
      </div>
      <button type="submit" disabled={disabled || !amount}
        className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
        style={{
          background: side === "FOR" ? "#6d28d9" : "#991b1b",
          color: "#fff",
          boxShadow: side === "FOR" ? "0 0 20px rgba(109,40,217,0.35)" : "0 0 20px rgba(153,27,27,0.35)",
        }}>
        Stake {side}
      </button>
    </form>
  );
}

/* ── TIP ── */
function TipForm({ id, disabled, run }: {
  id: number; disabled: boolean; run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => tipClaim(id, parseGen(amount))); }}
      className="space-y-4">
      <div>
        <p className="text-[10px] font-mono tracking-widest uppercase mb-2"
          style={{ color: "rgba(237,235,230,0.3)" }}>Tip Amount (GEN)</p>
        <input value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="0.1" inputMode="decimal" style={inputStyle} />
      </div>
      <button type="submit" disabled={disabled || !amount}
        className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
        style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", color: "#fbbf24" }}>
        Send Tip
      </button>
    </form>
  );
}

/* ── CHALLENGE ── */
function ChallengeForm({ id, disabled, run }: {
  id: number; disabled: boolean; run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [arg, setArg] = useState("");
  const [ev, setEv] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => challenge(id, arg, ev)); }}
      className="space-y-4">
      <div>
        <p className="text-[10px] font-mono tracking-widest uppercase mb-2"
          style={{ color: "rgba(237,235,230,0.3)" }}>Counter-argument</p>
        <textarea value={arg} onChange={(e) => setArg(e.target.value)}
          rows={3} required maxLength={2000}
          placeholder="Make the case against this claim…"
          style={{ ...inputStyle, resize: "none" }} />
      </div>
      <div>
        <p className="text-[10px] font-mono tracking-widest uppercase mb-2"
          style={{ color: "rgba(237,235,230,0.3)" }}>Counter-evidence (one per line)</p>
        <textarea value={ev} onChange={(e) => setEv(e.target.value.replace(/\n/g, " | "))}
          rows={2} placeholder="https://… or quote: '…'"
          style={{ ...inputStyle, resize: "none" }} />
      </div>
      <button type="submit" disabled={disabled || !arg}
        className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
        style={{ background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171" }}>
        File Challenge
      </button>
    </form>
  );
}

/* ── CONFIRM ACTION ── */
function ConfirmAction({ label, disabled, onConfirm, cta, ctaColor }: {
  label: string; disabled: boolean; onConfirm: () => void; cta: string; ctaColor: string;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed" style={{ color: "rgba(237,235,230,0.6)" }}>
        {label}
      </p>
      <button onClick={onConfirm} disabled={disabled}
        className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
        style={{
          background: ctaColor,
          color: "#fff",
          boxShadow: `0 0 24px ${ctaColor}55`,
        }}>
        {cta}
      </button>
    </div>
  );
}
