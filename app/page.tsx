"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WalletConnection } from "@/components/wallet/WalletConnection";
import {
  Zap, Brain, Shield, ArrowRight, CheckCircle2, Clock,
  PenTool, ImageIcon, FileText, Code2,
  Activity, Lock, GitBranch, Cpu, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer";
import type { ReactNode } from "react";

/* ── Brand tokens ────────────────────────────────────────────────── */
const ELECTRIC = "#110FFF";
const LAVENDER  = "#BCA2FF";
const DEEP      = "#282B5D";
const BORDER    = "rgba(40,43,93,0.12)";
const BORDER_SOFT = "rgba(202,202,202,0.4)";

/* ── Animation variants ─────────────────────────────────────────── */
const SPRING = [0.25, 1, 0.5, 1] as [number, number, number, number];
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.42, delay: i * 0.08, ease: SPRING } }),
};
const fadeIn = {
  hidden: { opacity: 0 },
  show: (i = 0) => ({ opacity: 1, transition: { duration: 0.4, delay: i * 0.06, ease: SPRING } }),
};

/* ── MagneticCard ────────────────────────────────────────────────── */
function MagneticCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
  }, []);
  const leave = useCallback(() => {
    const el = ref.current; if (!el) return;
    el.style.setProperty("--mouse-x", "50%"); el.style.setProperty("--mouse-y", "50%");
  }, []);
  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave}
      className={cn("magnetic-card rounded-xl", className)}>
      {children}
    </div>
  );
}

/* ── Feature Card (React-state hover glow) ──────────────────────── */
function FeatureCard({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="relative cursor-default" style={{ overflow: "visible", padding: "4px" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div aria-hidden="true" style={{
        position: "absolute", inset: "-4px", borderRadius: "16px",
        background: "linear-gradient(135deg, #BCA2FF 0%, #110FFF 100%)",
        filter: "blur(18px)", opacity: hov ? 0.22 : 0,
        transition: "opacity 0.3s cubic-bezier(0.25,1,0.5,1)", pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "relative", zIndex: 1, background: "#FFFFFF",
        border: "1px solid rgba(40,43,93,0.15)", borderRadius: "12px", padding: "1.25rem",
        boxShadow: hov ? "0 16px 32px -8px rgba(40,43,93,0.14)" : "0 1px 3px rgba(0,0,0,0.05)",
        transform: hov ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 0.3s cubic-bezier(0.25,1,0.5,1), box-shadow 0.3s ease", willChange: "transform",
      }}>
        <div className="mb-3 flex size-8 items-center justify-center rounded-lg" style={{ background: "rgba(17,15,255,0.08)" }}>
          <Icon className="size-4" style={{ color: "#110FFF" }} />
        </div>
        <p className="mb-0.5 text-xs font-bold" style={{ color: "#282B5D" }}>{title}</p>
        <p className="text-[11px] leading-snug" style={{ color: "#55597A" }}>{sub}</p>
      </div>
    </div>
  );
}

/* ── ScoreBar ────────────────────────────────────────────────────── */
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-xs text-[var(--color-muted-foreground)]">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-[var(--color-surface-raised)]">
        <motion.div className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${LAVENDER}, ${ELECTRIC})` }}
          initial={{ width: 0 }} whileInView={{ width: `${value}%` }}
          transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }} viewport={{ once: true }} />
      </div>
      <span className="tabular w-8 text-right text-xs font-semibold" style={{ color: ELECTRIC }}>{value}</span>
    </div>
  );
}

/* ── Illustrative Terminal Widget (right column) ────────────────────
   NOTE: this is a static, illustrative mockup of what deal activity looks
   like — it is NOT a live feed of on-chain events. Labeled "Preview" (not
   "Live") and the network stats below show the real deployed contract
   address so this can't be mistaken for fabricated on-chain proof. ── */
const FEED_ITEMS = [
  { id: "d_0041", action: "Deal funded",      amount: "120 GEN", ago: "example", status: "funded"   },
  { id: "d_0040", action: "AI verdict: PASS", amount: "250 GEN", ago: "example", status: "pass"     },
  { id: "d_0039", action: "Work submitted",   amount: "95 GEN",  ago: "example", status: "submit"   },
  { id: "d_0038", action: "Deal funded",      amount: "180 GEN", ago: "example", status: "funded"   },
  { id: "d_0037", action: "AI verdict: PASS", amount: "75 GEN",  ago: "example", status: "pass"     },
  { id: "d_0036", action: "Payment released", amount: "300 GEN", ago: "example", status: "released" },
];

const STATUS_DOT: Record<string, string> = {
  funded:   "#110FFF",
  pass:     "#22c55e",
  submit:   LAVENDER,
  released: "#22c55e",
};

function LiveTerminal() {
  const shortAddress = CONTRACT_ADDRESS
    ? `${CONTRACT_ADDRESS.slice(0, 6)}…${CONTRACT_ADDRESS.slice(-4)}`
    : "not deployed";

  const STATS = [
    { label: "Network",    value: "Bradbury" },
    { label: "Chain ID",   value: "4221" },
    { label: "Validators", value: "5" },
    { label: "Contract",   value: shortAddress },
  ];

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${BORDER}`, background: "#FFFFFF", boxShadow: "0 2px 16px rgba(40,43,93,0.06)" }}>

      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: BORDER, background: "rgba(40,43,93,0.02)" }}>
        <div className="flex items-center gap-2">
          <Activity className="size-3.5" style={{ color: ELECTRIC }} />
          <span className="text-xs font-bold tracking-tight" style={{ color: DEEP }}>Contract Activity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative inline-flex size-1.5 rounded-full" style={{ background: "#AAAACC" }} />
          <span className="text-[10px] font-medium" style={{ color: "#AAAACC" }}>Preview</span>
        </div>
      </div>

      {/* Network stats row */}
      <div className="grid grid-cols-4 border-b" style={{ borderColor: BORDER }}>
        {STATS.map(({ label, value }) => (
          <div key={label} className="px-3 py-2.5 border-r last:border-r-0" style={{ borderColor: BORDER }}>
            <p className="text-[9px] font-medium uppercase tracking-widest mb-0.5" style={{ color: "#AAAACC" }}>{label}</p>
            <p className="text-[11px] font-bold tabular" style={{ color: DEEP }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Event feed */}
      <div className="flex-1 overflow-hidden">
        {FEED_ITEMS.map((item, i) => (
          <motion.div key={item.id}
            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0"
            style={{ borderColor: BORDER }}>
            {/* Status dot */}
            <div className="size-1.5 rounded-full shrink-0" style={{ background: STATUS_DOT[item.status] ?? LAVENDER }} />
            {/* Deal ID + action */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold" style={{ color: `${ELECTRIC}99` }}>{item.id}</span>
                <span className="text-[11px] font-medium truncate" style={{ color: DEEP }}>{item.action}</span>
              </div>
            </div>
            {/* Amount + time */}
            <div className="text-right shrink-0">
              <p className="text-[11px] font-bold tabular" style={{ color: DEEP }}>{item.amount}</p>
              <p className="text-[9px]" style={{ color: "#AAAACC" }}>{item.ago}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Terminal footer */}
      <div className="px-4 py-3 border-t flex items-center justify-between"
        style={{ borderColor: BORDER, background: "rgba(17,15,255,0.02)" }}>
        <div className="flex items-center gap-1.5">
          <Cpu className="size-3" style={{ color: LAVENDER }} />
          <span className="text-[10px]" style={{ color: "#AAAACC" }}>
            LLM validators · Optimistic Democracy
          </span>
        </div>
        <Link href="/dashboard"
          className="text-[10px] font-semibold flex items-center gap-1 transition-colors"
          style={{ color: ELECTRIC }}>
          Open dashboard <ArrowRight className="size-2.5" />
        </Link>
      </div>
    </div>
  );
}

/* ── Static data ─────────────────────────────────────────────────── */
const valueBlocks = [
  { icon: Shield,       title: "No upfront wallet",   sub: "Share a link, not an address" },
  { icon: Brain,        title: "AI review on demand",  sub: "Advisory, not autonomous" },
  { icon: CheckCircle2, title: "You decide",           sub: "Buyer retains final control" },
  { icon: Clock,        title: "Dispute protection",   sub: "AI explains every recommendation" },
];

const steps = [
  { n: "01", title: "Write your brief",     description: "Describe the work in plain language. Set escrow in GEN. Get a shareable invite link, no seller wallet needed.", icon: PenTool },
  { n: "02", title: "Invite your creative", description: "Send the link via Discord, WhatsApp, or email. They preview the agreement and accept with one click.", icon: ArrowRight },
  { n: "03", title: "Review the delivery",  description: "Approve work directly to release payment. If you need a second opinion, request an AI review.", icon: CheckCircle2 },
  { n: "04", title: "AI advises, you decide", description: "GenLayer AI evaluates style, alignment, and quality against your brief. You make the final call.", icon: Brain },
];

const useCases = [
  { icon: ImageIcon, title: "Logo & Brand Design",    description: "Hire a designer from Twitter. Send a Pact link. Get protected delivery with AI as your quality check." },
  { icon: FileText,  title: "Copywriting & Content",  description: "Brief a writer from your network. Escrow protects both sides. No payment before delivery." },
  { icon: Code2,     title: "Code & Technical Work",  description: "Commission a developer. Clear requirements in the brief. AI validates against your spec if needed." },
  { icon: PenTool,   title: "Creative Campaigns",     description: "Work with agencies or freelancers you know. Pact adds a trust layer without the overhead." },
];

const verdictExample = {
  prompt: "Create a dark luxury streetwear logo with minimalist sans-serif typography.",
  confidence: 91,
  reasoning: "The submission strongly matches the requested luxury streetwear aesthetic through high-contrast monochrome palette, precise geometric letterforms, and restrained compositional balance. The typography demonstrates mastery of negative space consistent with luxury brand standards.",
  scores: [
    { label: "Style Match",      v: 94 },
    { label: "Prompt Alignment", v: 89 },
    { label: "Quality",          v: 92 },
  ],
};

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] relative">

      {/* Blueprint grid */}
      <div className="fixed inset-0 pointer-events-none blueprint-grid" style={{ opacity: 0.65 }} aria-hidden="true" />
      <div className="gradient-hero absolute inset-0 pointer-events-none" aria-hidden="true" />

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 surface-glass relative">
        <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent 0%, rgba(17,15,255,0.18) 50%, transparent 100%)` }}
          aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Pact" width={32} height={32} className="rounded-lg" priority />
            <span className="text-sm font-semibold tracking-tight" style={{ color: DEEP }}>Pact</span>
            <span className="hidden sm:inline text-[10px] font-medium px-2 py-0.5 rounded-full border"
              style={{ color: DEEP, borderColor: BORDER_SOFT, background: "rgba(255,255,255,0.7)" }}>
              {process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? "Demo" : "Testnet"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard"><Button variant="ghost" size="sm" className="text-xs">Dashboard</Button></Link>
            <WalletConnection />
          </div>
        </div>
      </nav>

      {/* ── Utility Deck — edge-to-edge metrics bar ───────────────── */}
      <div className="border-b" style={{ borderColor: BORDER, background: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {valueBlocks.map(({ icon: Icon, title, sub }, i) => (
              <motion.div key={title} variants={fadeIn} initial="hidden" animate="show" custom={i}
                className="flex items-center gap-3 px-4 py-3.5 cursor-default group border-r last:border-r-0"
                style={{ borderColor: BORDER }}>
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-[#110FFF]/10"
                  style={{ background: "rgba(17,15,255,0.06)" }}>
                  <Icon className="size-3.5" style={{ color: ELECTRIC }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight truncate" style={{ color: DEEP }}>{title}</p>
                  <p className="text-[10px] leading-tight truncate" style={{ color: "#AAAACC" }}>{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hero — asymmetric 8:4 split ──────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* ── LEFT: Authority Block ── */}
            <div className="lg:col-span-7 flex flex-col items-start">

              {/* Network status marker */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: "#FFFFFF", border: `1px solid ${BORDER}` }}>
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full rounded-full opacity-50"
                      style={{ background: ELECTRIC, animation: "pulse-dot 1.8s cubic-bezier(0.4,0,0.6,1) infinite" }} />
                    <span className="relative inline-flex size-2 rounded-full" style={{ background: ELECTRIC }} />
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: DEEP }}>
                    {process.env.NEXT_PUBLIC_DEMO_MODE === "true"
                      ? "Interactive Demo: Try all flows live"
                      : "Live on GenLayer Bradbury · Chain 4221"}
                  </span>
                </div>
              </motion.div>

              {/* Headline — left-aligned, no text-center */}
              <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
                className="text-5xl md:text-[60px] font-bold leading-[1.12] mb-5"
                style={{ letterSpacing: "-0.02em", color: DEEP }}>
                Smart contracts that{" "}
                <span style={{
                  background: `linear-gradient(90deg, ${DEEP} 0%, ${ELECTRIC} 100%)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  backgroundClip: "text", color: "transparent", display: "inline-block",
                }}>
                  understand nuance.
                </span>
              </motion.h1>

              {/* Sub-headline */}
              <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
                className="text-base md:text-lg leading-relaxed mb-8 max-w-xl"
                style={{ color: "#55597A" }}>
                Escrow protection for creative work you&apos;re already doing. Invite your designer,
                writer, or developer via link — no crypto knowledge required. AI helps resolve
                disputes. You decide.
              </motion.p>

              {/* CTAs — left-aligned stack */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
                className="flex flex-col sm:flex-row items-start gap-3">
                <Link href="/create">
                  <Button size="lg" className="gap-2" style={{ background: ELECTRIC }}>
                    Create a protected deal
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="secondary" className="gap-2 bg-white border"
                    style={{ borderColor: BORDER_SOFT, color: DEEP }}>
                    View Dashboard
                  </Button>
                </Link>
              </motion.div>

              {/* Trust strip */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}
                className="flex items-center gap-4 mt-8">
                {[
                  { icon: Lock,       label: "Escrow-secured" },
                  { icon: GitBranch,  label: "Open-source contract" },
                  { icon: TrendingUp, label: "GenLayer Bradbury" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon className="size-3" style={{ color: LAVENDER }} />
                    <span className="text-[11px] font-medium" style={{ color: "#8888AA" }}>{label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── RIGHT: Live Terminal Face ── */}
            <motion.div
              className="lg:col-span-5"
              variants={fadeUp} initial="hidden" animate="show" custom={2}>
              <LiveTerminal />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="py-20 border-t" style={{ borderColor: BORDER_SOFT }}>
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }} viewport={{ once: true }} className="mb-12">
            <h2 className="text-2xl font-bold mb-2" style={{ letterSpacing: "-0.025em", color: DEEP }}>How it works</h2>
            <p className="text-sm" style={{ color: "#55597A" }}>
              Built for people who already work together and want protection without friction.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map(({ n, title, description, icon: Icon }, i) => (
              <motion.div key={n} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }} viewport={{ once: true }}>
                <MagneticCard>
                  <div className="elevating-card h-full p-5 rounded-xl bg-white cursor-default overflow-hidden"
                    style={{ border: `1px solid ${BORDER_SOFT}` }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="tabular text-xs font-bold" style={{ color: `${ELECTRIC}90` }}>{n}</span>
                      <div className="flex size-8 items-center justify-center rounded-lg" style={{ background: `${ELECTRIC}0D` }}>
                        <Icon className="size-4" style={{ color: ELECTRIC }} />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: DEEP }}>{title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "#55597A" }}>{description}</p>
                  </div>
                </MagneticCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Verdict Demo ───────────────────────────────────────── */}
      <section className="py-20 border-t" style={{ borderColor: BORDER_SOFT }}>
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }} viewport={{ once: true }}>
              <h2 className="text-2xl font-bold mb-3" style={{ letterSpacing: "-0.025em", color: DEEP }}>
                AI as your review assistant
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#55597A" }}>
                When quality is disputed, the AI evaluates against your brief and gives a recommendation.
                You retain full control: approve, reject, or override.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: Brain,        text: "Brief parsed into measurable criteria" },
                  { icon: Cpu,          text: "Multiple validators reach consensus" },
                  { icon: CheckCircle2, text: "You hold final authority — always" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "rgba(17,15,255,0.08)" }}>
                      <Icon className="size-3.5" style={{ color: ELECTRIC }} />
                    </div>
                    <p className="text-sm" style={{ color: DEEP }}>{text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            {/* Right: verdict card */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }} viewport={{ once: true }}>
              <MagneticCard>
                <div className="elevating-card rounded-2xl bg-white overflow-hidden"
                  style={{ border: `1px solid ${BORDER_SOFT}` }}>
                  <div className="p-5 border-b" style={{ borderColor: BORDER_SOFT }}>
                    <p className="text-[10px] font-medium uppercase tracking-widest mb-1.5"
                      style={{ color: "#AAAACC" }}>Creative Brief</p>
                    <p className="text-sm italic" style={{ color: DEEP }}>&quot;{verdictExample.prompt}&quot;</p>
                  </div>
                  <div className="flex items-center gap-3 p-5 border-b"
                    style={{ borderColor: BORDER_SOFT, background: "rgba(17,15,255,0.02)" }}>
                    <div className="flex size-9 items-center justify-center rounded-xl"
                      style={{ background: "rgba(17,15,255,0.08)" }}>
                      <CheckCircle2 className="size-5" style={{ color: ELECTRIC }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: ELECTRIC }}>Work Approved</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border"
                          style={{ color: "#AAAACC", background: "#FFFFFF", borderColor: BORDER_SOFT }}>
                          AI Verdict · {verdictExample.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "#AAAACC" }}>
                        AI recommends approval. Buyer confirms to release escrow
                      </p>
                    </div>
                  </div>
                  <div className="p-5 border-b" style={{ borderColor: BORDER_SOFT }}>
                    <p className="text-xs leading-relaxed" style={{ color: "#55597A" }}>{verdictExample.reasoning}</p>
                  </div>
                  <div className="p-5 flex flex-col gap-3">
                    {verdictExample.scores.map(s => <ScoreBar key={s.label} label={s.label} value={s.v} />)}
                  </div>
                </div>
              </MagneticCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Use Cases ─────────────────────────────────────────────── */}
      <section className="py-20 border-t" style={{ borderColor: BORDER_SOFT }}>
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }} viewport={{ once: true }} className="mb-12">
            <h2 className="text-2xl font-bold mb-2" style={{ letterSpacing: "-0.025em", color: DEEP }}>
              For the work you&apos;re already doing
            </h2>
            <p className="text-sm" style={{ color: "#55597A" }}>
              Pact works with existing relationships, not a new marketplace to join.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {useCases.map(({ icon: Icon, title, description }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.07 }} viewport={{ once: true }}>
                <MagneticCard>
                  <div className="elevating-card h-full p-5 rounded-xl bg-white cursor-default overflow-hidden"
                    style={{ border: `1px solid ${BORDER_SOFT}` }}>
                    <div className="flex size-9 items-center justify-center rounded-xl mb-4"
                      style={{ background: `${ELECTRIC}0D` }}>
                      <Icon className="size-4" style={{ color: ELECTRIC }} />
                    </div>
                    <h3 className="text-sm font-semibold mb-1.5" style={{ color: DEEP }}>{title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "#55597A" }}>{description}</p>
                  </div>
                </MagneticCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="py-20 border-t" style={{ borderColor: BORDER_SOFT }}>
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }} viewport={{ once: true }}>
            <div className="rounded-2xl bg-white p-10 md:p-14"
              style={{ border: `1px solid ${BORDER}`, boxShadow: "0 2px 24px rgba(40,43,93,0.06)" }}>
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ letterSpacing: "-0.025em", color: DEEP }}>
                  Protect your next<br />creative agreement
                </h2>
                <p className="mb-8 leading-relaxed" style={{ color: "#55597A" }}>
                  Write the brief, lock escrow, send an invite link. Your creative accepts in seconds,
                  no crypto setup required on their end.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/create">
                    <Button size="lg" className="gap-2" style={{ background: ELECTRIC }}>
                      Create a protected agreement
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                  <a href="https://testnet-faucet.genlayer.foundation/" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" variant="outline" style={{ borderColor: BORDER_SOFT, color: DEEP }}>
                      Get testnet GEN
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t py-6" style={{ borderColor: BORDER_SOFT }}>
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Pact" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-semibold" style={{ color: DEEP }}>Pact</span>
            <span className="text-xs" style={{ color: "#AAAACC" }}>· Built on GenLayer</span>
          </div>
          <p className="text-xs" style={{ color: "#AAAACC" }}>
            Powered by GenLayer intelligent contracts · AI validators on Bradbury
          </p>
        </div>
      </footer>

    </div>
  );
}
