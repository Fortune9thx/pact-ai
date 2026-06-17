"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClaim } from "@/lib/wallet";

export default function CreateClaim() {
  const [statement, setStatement] = useState("");
  const [argument, setArgument]   = useState("");
  const [evidence, setEvidence]   = useState("");
  const [busy, setBusy]           = useState(false);
  const [err, setErr]             = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await createClaim(statement, argument, evidence);
      router.push("/arena");
      router.refresh();
    } catch (err: unknown) {
      setErr(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const steps = [
    { n: 1, label: "Write your claim",   done: statement.length > 10 },
    { n: 2, label: "Make your argument", done: argument.length > 20 },
    { n: 3, label: "Add evidence",       done: evidence.length > 5  },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0a0909" }}>

      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ background: "rgba(10,9,9,0.88)", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/arena"
            className="text-xs font-mono transition-colors"
            style={{ color: "rgba(237,235,230,0.35)" }}>
            ← Arena
          </Link>
          <Link href="/"
            className="text-sm font-bold font-mono tracking-[0.35em]"
            style={{ color: "#edebe6", textShadow: "0 0 16px rgba(139,92,246,0.6)" }}>
            ERISTIC
          </Link>
          <span className="text-[10px] font-mono tracking-widest"
            style={{ color: "rgba(237,235,230,0.2)" }}>
            NEW CLAIM
          </span>
        </div>
      </header>

      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6 sm:gap-8 items-start">

        {/* ── FORM ── */}
        <div>
          {/* Page title */}
          <div className="mb-8">
            <p className="text-[10px] font-mono tracking-[0.4em] uppercase mb-3"
              style={{ color: "rgba(237,235,230,0.3)" }}>
              File a Claim
            </p>
            <h1 className="font-bold leading-tight"
              style={{ fontSize: "clamp(28px, 3.5vw, 44px)", color: "#edebe6", letterSpacing: "-0.02em" }}>
              Make your case,<br />
              let the chain decide.
            </h1>
          </div>

          <form onSubmit={submit} className="space-y-5">

            {/* Statement */}
            <FieldCard
              label="Claim Statement"
              hint="A clear, falsifiable assertion"
              required>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                required rows={2} maxLength={400}
                placeholder="e.g. AI coding assistants will replace junior devs within 18 months."
                style={textareaStyle} />
              <div className="flex justify-end mt-1.5">
                <span className="text-[10px] font-mono tabular-nums"
                  style={{ color: "rgba(237,235,230,0.2)" }}>
                  {statement.length}/400
                </span>
              </div>
            </FieldCard>

            {/* Argument FOR */}
            <FieldCard
              label="Your Argument"
              labelAccent="FOR"
              labelAccentColor="#a78bfa"
              hint="Make the case — validators will read this">
              <textarea
                value={argument}
                onChange={(e) => setArgument(e.target.value)}
                required rows={6} maxLength={2000}
                placeholder="Walk through your reasoning and cite specific examples…"
                style={textareaStyle} />
            </FieldCard>

            {/* Evidence */}
            <FieldCard
              label="Evidence"
              hint="URLs or quotes, one per line">
              <textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value.replace(/\n/g, " | "))}
                rows={4}
                placeholder={"https://example.com/study\nhttps://github.com/…\nquote: 'Direct quote'"}
                style={{ ...textareaStyle, fontFamily: "monospace", fontSize: "12px" }} />
              <p className="mt-1.5 text-[10px] font-mono"
                style={{ color: "rgba(237,235,230,0.2)" }}>
                Each line becomes a separate evidence item. URLs are fetched by validators.
              </p>
            </FieldCard>

            {/* Error */}
            {err && (
              <div className="px-4 py-3 rounded-lg text-xs font-mono"
                style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {err}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Link href="/arena"
                className="px-5 py-2.5 rounded-lg text-sm transition-all"
                style={{ color: "rgba(237,235,230,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>
                Cancel
              </Link>
              <button type="submit"
                disabled={busy || !statement || !argument}
                className="px-7 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                style={{
                  background: "#7c3aed",
                  color: "#fff",
                  boxShadow: "0 0 28px rgba(124,58,237,0.4)",
                }}>
                {busy ? "Filing claim…" : "File Claim →"}
              </button>
            </div>
          </form>
        </div>

        {/* ── SIDE GUIDE ── */}
        <aside className="space-y-4 md:sticky md:top-20">

          {/* Progress checklist */}
          <div className="rounded-xl p-5"
            style={{ background: "#111010", border: "1px solid rgba(255,255,255,0.09)" }}>
            <p className="text-[10px] font-mono tracking-[0.35em] uppercase mb-4"
              style={{ color: "rgba(237,235,230,0.3)" }}>Progress</p>
            <div className="space-y-3">
              {steps.map((s) => (
                <div key={s.n} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: s.done ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${s.done ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)"}`,
                    }}>
                    {s.done
                      ? <span style={{ color: "#22c55e", fontSize: 10 }}>✓</span>
                      : <span className="text-[9px] font-mono" style={{ color: "rgba(237,235,230,0.25)" }}>{s.n}</span>
                    }
                  </div>
                  <span className="text-sm"
                    style={{ color: s.done ? "#edebe6" : "rgba(237,235,230,0.3)" }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-xl p-5"
            style={{ background: "#111010", border: "1px solid rgba(255,255,255,0.09)" }}>
            <p className="text-[10px] font-mono tracking-[0.35em] uppercase mb-4"
              style={{ color: "rgba(237,235,230,0.3)" }}>How it works</p>
            <div className="space-y-4">
              {[
                { icon: "①", text: "File your claim with evidence" },
                { icon: "②", text: "Others stake FOR or AGAINST" },
                { icon: "③", text: "A challenger disputes the claim" },
                { icon: "④", text: "GenLayer AI validators reach consensus" },
                { icon: "⑤", text: "Winners receive the losing pool" },
              ].map((item) => (
                <div key={item.icon} className="flex gap-3">
                  <span className="font-mono shrink-0"
                    style={{ color: "#8b5cf6", fontSize: 13 }}>{item.icon}</span>
                  <span className="text-xs leading-relaxed"
                    style={{ color: "rgba(237,235,230,0.5)" }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-xl p-5"
            style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <p className="text-[10px] font-mono tracking-[0.35em] uppercase mb-3"
              style={{ color: "#a78bfa" }}>Tips for strong claims</p>
            <ul className="space-y-2 text-xs leading-relaxed"
              style={{ color: "rgba(237,235,230,0.45)" }}>
              <li>• Be specific — vague claims get split verdicts</li>
              <li>• Link primary sources over opinion pieces</li>
              <li>• Acknowledge counterarguments preemptively</li>
              <li>• Include dates so validators can verify timing</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

const textareaStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "10px",
  padding: "12px 14px",
  color: "#edebe6",
  fontSize: "14px",
  lineHeight: "1.65",
  outline: "none",
  resize: "none",
};

function FieldCard({
  label, labelAccent, labelAccentColor, hint, required, children,
}: {
  label: string;
  labelAccent?: string;
  labelAccentColor?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-5"
      style={{ background: "#111010", border: "1px solid rgba(255,255,255,0.09)" }}>
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "#edebe6" }}>
            {label}
          </span>
          {labelAccent && (
            <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-full"
              style={{
                color: labelAccentColor,
                background: `${labelAccentColor}18`,
                border: `1px solid ${labelAccentColor}35`,
              }}>
              {labelAccent}
            </span>
          )}
          {required && (
            <span style={{ color: "#ef4444", fontSize: 12 }}>*</span>
          )}
        </div>
        {hint && (
          <span className="text-[10px] font-mono"
            style={{ color: "rgba(237,235,230,0.25)" }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
