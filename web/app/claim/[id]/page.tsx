import Link from "next/link";
import { readClaim, readPool } from "@/lib/genlayer";
import type { Claim, Pool } from "@/lib/contracts";
import { ClaimActions } from "@/components/ClaimActions";
import { ConnectButton } from "@/components/ConnectButton";

export const dynamic = "force-dynamic";

function splitItems(s: string): string[] {
  return s.split("|").map((x) => x.trim()).filter(Boolean);
}

function fmtGen(wei: number) {
  return (wei / 1e18).toFixed(2);
}

const STATE_CFG: Record<string, { label: string; color: string; dot: string }> = {
  OPEN:            { label: "Open",        color: "#f59e0b", dot: "#f59e0b" },
  UNDER_CHALLENGE: { label: "Challenged",  color: "#ef4444", dot: "#ef4444" },
  UNDER_REVIEW:    { label: "In Review",   color: "#8b5cf6", dot: "#8b5cf6" },
  RESOLVED:        { label: "Resolved",    color: "#22c55e", dot: "#22c55e" },
  CLOSED:          { label: "Closed",      color: "#52525b", dot: "#52525b" },
};

export default async function ClaimDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cid = Number(id);
  const [claim, pool] = await Promise.all([
    readClaim(cid),
    readPool(cid).catch(() => null as Pool | null),
  ]);

  const cfg = STATE_CFG[claim.state] ?? STATE_CFG.CLOSED;
  const total = pool ? pool.total_for + pool.total_against : 0;
  const forPct = total > 0 ? Math.round((pool!.total_for / total) * 100) : 50;

  return (
    <div className="min-h-screen" style={{ background: "#0a0909" }}>

      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ background: "rgba(10,9,9,0.88)", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/arena"
            className="flex items-center gap-2 text-xs font-mono transition-colors hover:text-[#edebe6]"
            style={{ color: "rgba(237,235,230,0.35)" }}>
            ← Arena
          </Link>
          <Link href="/"
            className="text-sm font-bold font-mono tracking-[0.35em]"
            style={{ color: "#edebe6", textShadow: "0 0 16px rgba(139,92,246,0.6)" }}>
            ERISTIC
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono tracking-widest hidden sm:block"
              style={{ color: "rgba(237,235,230,0.2)" }}>
              CLAIM #{claim.id}
            </span>
            <ConnectButton />
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-5">

        {/* ── CLAIM HERO ── */}
        <div className="rounded-xl overflow-hidden"
          style={{ background: "#111010", border: "1px solid rgba(255,255,255,0.09)" }}>
          {/* state colour strip */}
          <div className="h-[3px]" style={{ background: cfg.color, opacity: 0.6 }} />

          <div className="px-6 py-6">
            {/* meta row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono tracking-widest"
                  style={{ color: "rgba(237,235,230,0.25)" }}>#{claim.id}</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold tracking-wide uppercase"
                  style={{
                    color: cfg.color,
                    background: `${cfg.dot}14`,
                    border: `1px solid ${cfg.dot}40`,
                  }}>
                  {claim.state === "UNDER_REVIEW" && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70"
                        style={{ background: cfg.color }} />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5"
                        style={{ background: cfg.color }} />
                    </span>
                  )}
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-5 text-xs font-mono"
                style={{ color: "rgba(237,235,230,0.3)" }}>
                <span>
                  by{" "}
                  <span style={{ color: "rgba(237,235,230,0.65)" }}>
                    {claim.author.slice(0, 6)}…{claim.author.slice(-4)}
                  </span>
                </span>
                {pool && (
                  <span style={{ color: "#f59e0b" }}>
                    {fmtGen(total)} GEN · {pool.positions} stakers
                  </span>
                )}
              </div>
            </div>

            {/* Statement */}
            <h1 className="text-xl font-semibold leading-snug mb-5"
              style={{ color: "#edebe6" }}>
              {claim.statement}
            </h1>

            {/* FOR / AGAINST bar */}
            {total > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono"
                  style={{ color: "rgba(237,235,230,0.3)" }}>
                  <span style={{ color: "#a78bfa" }}>FOR — {fmtGen(pool!.total_for)} GEN ({forPct}%)</span>
                  <span style={{ color: "#f87171" }}>AGAINST — {fmtGen(pool!.total_against)} GEN ({100 - forPct}%)</span>
                </div>
                <div className="h-2.5 w-full rounded-full overflow-hidden flex"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full transition-all duration-700"
                    style={{ width: `${forPct}%`, background: "linear-gradient(90deg,#6d28d9,#8b5cf6)" }} />
                  <div className="h-full transition-all duration-700"
                    style={{ width: `${100 - forPct}%`, background: "linear-gradient(90deg,#b91c1c,#ef4444)" }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── FOR / AGAINST COLUMNS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SidePanel
            title="FOR"
            accentColor="#8b5cf6"
            stake={pool?.total_for ?? 0}
            argument={claim.arguments_for}
            evidence={splitItems(claim.evidence_for)}
            settlement={
              pool?.settled
                ? pool.winning_side === "FOR" ? "WON"
                : pool.winning_side === "NONE" ? "REFUNDED" : "LOST"
                : null
            }
          />
          <SidePanel
            title="AGAINST"
            accentColor="#ef4444"
            stake={pool?.total_against ?? 0}
            argument={claim.arguments_against}
            evidence={splitItems(claim.evidence_against)}
            settlement={
              pool?.settled
                ? pool.winning_side === "AGAINST" ? "WON"
                : pool.winning_side === "NONE" ? "REFUNDED" : "LOST"
                : null
            }
          />
        </div>

        {/* ── ADJUDICATION PANEL ── */}
        <div className="rounded-xl overflow-hidden"
          style={{ background: "#111010", border: "1px solid rgba(255,255,255,0.09)" }}>
          <div className="px-6 py-4 border-b flex items-center gap-3"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase"
              style={{ color: "rgba(237,235,230,0.3)" }}>
              GenLayer Adjudication
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>
              AI Consensus
            </span>
          </div>
          <div className="px-6 py-5">
            {claim.state === "RESOLVED"
              ? <VerdictPanel claim={claim} />
              : <ValidatorProgress state={claim.state} />
            }
          </div>
        </div>

        {/* ── ACTIONS ── */}
        {claim.state !== "RESOLVED" && claim.state !== "CLOSED" && (
          <ClaimActions claim={claim} />
        )}
      </div>
    </div>
  );
}

/* ── SIDE PANEL ── */
function SidePanel({
  title, accentColor, stake, argument, evidence, settlement,
}: {
  title: string; accentColor: string; stake: number;
  argument: string; evidence: string[];
  settlement: "WON" | "LOST" | "REFUNDED" | null;
}) {
  const settleStyle =
    settlement === "WON"      ? { color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.25)"   } :
    settlement === "LOST"     ? { color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)"   } :
    settlement === "REFUNDED" ? { color: "#a1a1aa", bg: "rgba(161,161,170,0.08)", border: "rgba(161,161,170,0.2)"  } :
    null;

  return (
    <div className="rounded-xl flex flex-col overflow-hidden"
      style={{ background: "#111010", border: "1px solid rgba(255,255,255,0.09)" }}>
      {/* top accent line */}
      <div className="h-[2px]" style={{ background: accentColor, opacity: 0.5 }} />

      <div className="px-5 py-4 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold font-mono tracking-widest"
              style={{ color: accentColor }}>
              {title}
            </span>
            {settlement && settleStyle && (
              <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-full"
                style={{ color: settleStyle.color, background: settleStyle.bg, border: `1px solid ${settleStyle.border}` }}>
                {settlement}
              </span>
            )}
          </div>
          <span className="text-sm font-mono font-semibold tabular-nums"
            style={{ color: stake > 0 ? "#edebe6" : "rgba(237,235,230,0.2)" }}>
            {fmtGen(stake)} GEN
          </span>
        </div>

        {/* Argument */}
        <div className="mb-5">
          <p className="text-[10px] font-mono tracking-widest uppercase mb-2"
            style={{ color: "rgba(237,235,230,0.25)" }}>Argument</p>
          <p className="text-sm leading-relaxed"
            style={{ color: argument ? "rgba(237,235,230,0.78)" : "rgba(237,235,230,0.2)" }}>
            {argument || <em>No argument submitted</em>}
          </p>
        </div>

        {/* Evidence */}
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase mb-2"
            style={{ color: "rgba(237,235,230,0.25)" }}>Evidence</p>
          {evidence.length === 0 ? (
            <p className="text-sm italic" style={{ color: "rgba(237,235,230,0.2)" }}>None submitted</p>
          ) : (
            <ul className="space-y-2">
              {evidence.map((e, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="font-mono tabular-nums shrink-0 mt-0.5"
                    style={{ color: "rgba(237,235,230,0.2)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="break-all leading-relaxed"
                    style={{ color: "rgba(237,235,230,0.65)" }}>
                    {e.startsWith("http") ? (
                      <a href={e} target="_blank" rel="noopener noreferrer"
                        className="underline decoration-dotted transition-colors"
                        style={{ color: "#a78bfa" }}>
                        {e}
                      </a>
                    ) : e}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── VALIDATOR PROGRESS ── */
function ValidatorProgress({ state }: { state: Claim["state"] }) {
  const steps = [
    { label: "Claim filed",         done: true },
    { label: "Challenge submitted", done: state !== "OPEN" },
    { label: "Validators reviewing", done: state === "RESOLVED", live: state === "UNDER_REVIEW" },
    { label: "Consensus reached",   done: state === "RESOLVED" },
  ];
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: s.done ? "rgba(34,197,94,0.15)" : s.live ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${s.done ? "rgba(34,197,94,0.4)" : s.live ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)"}`,
            }}>
            {s.done
              ? <span style={{ color: "#22c55e", fontSize: 10 }}>✓</span>
              : s.live
              ? <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#8b5cf6" }} />
              : <span className="h-1.5 w-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
            }
          </div>
          <span className="text-sm"
            style={{ color: s.done ? "#edebe6" : s.live ? "#a78bfa" : "rgba(237,235,230,0.3)" }}>
            {s.label}
          </span>
          {s.live && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" }}>
              processing
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── VERDICT PANEL ── */
function VerdictPanel({ claim }: { claim: Claim }) {
  const v = claim.verdict;
  const vColor =
    v === "SUPPORTED"     ? "#22c55e" :
    v === "NOT_SUPPORTED" ? "#ef4444" :
    v === "PARTIAL"       ? "#a78bfa" : "#a1a1aa";
  const ringColor =
    v === "SUPPORTED"     ? "#22c55e" :
    v === "NOT_SUPPORTED" ? "#ef4444" :
    v === "PARTIAL"       ? "#8b5cf6" : "#71717a";

  return (
    <div className="space-y-6">
      {/* Verdict + ring */}
      <div className="flex items-center gap-8">
        <ConfidenceRing confidence={claim.confidence} evidenceWeight={claim.evidence_weight} color={ringColor} />
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase mb-2"
            style={{ color: "rgba(237,235,230,0.3)" }}>Final Verdict</p>
          <p className="text-3xl font-bold tracking-wide"
            style={{ color: vColor, textShadow: `0 0 24px ${vColor}55` }}>
            {v === "NOT_SUPPORTED" ? "Not Supported" : v}
          </p>
          <div className="mt-3 flex items-center gap-6 text-xs font-mono"
            style={{ color: "rgba(237,235,230,0.35)" }}>
            <span>Confidence <span className="ml-1" style={{ color: vColor }}>
              {(claim.confidence / 100).toFixed(1)}%
            </span></span>
            <span>Evidence weight <span className="ml-1" style={{ color: "rgba(237,235,230,0.6)" }}>
              {(claim.evidence_weight / 100).toFixed(1)}%
            </span></span>
          </div>
        </div>
      </div>

      {/* Reasoning */}
      {claim.reasoning && (
        <div className="pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[10px] font-mono tracking-widest uppercase mb-3"
            style={{ color: "rgba(237,235,230,0.25)" }}>Validator Reasoning</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "rgba(237,235,230,0.72)" }}>
            {claim.reasoning}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── CONFIDENCE RING ── */
function ConfidenceRing({ confidence, evidenceWeight, color }: {
  confidence: number; evidenceWeight: number; color: string;
}) {
  const size = 96, cx = 48, cy = 48;
  const rO = 40, rI = 28;
  const cO = 2 * Math.PI * rO, cI = 2 * Math.PI * rI;
  const conf = Math.max(0, Math.min(1, confidence / 10000));
  const ev   = Math.max(0, Math.min(1, evidenceWeight / 10000));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={cx} cy={cy} r={rO} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
      <circle cx={cx} cy={cy} r={rI} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
      <circle cx={cx} cy={cy} r={rO} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${conf * cO} ${cO}`} transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={rI} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.45"
        strokeDasharray={`${ev * cI} ${cI}`} transform={`rotate(-90 ${cx} ${cy})`} />
    </svg>
  );
}
