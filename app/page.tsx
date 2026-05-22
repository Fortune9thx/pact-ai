"use client";

import Link from "next/link";
import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WalletConnection } from "@/components/wallet/WalletConnection";
import {
  Zap, Brain, Shield, ArrowRight, CheckCircle2, Clock,
  Banknote, PenTool, ImageIcon, FileText, Code2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/* ── Brand constants (GenLayer design kit) ─────────────────────── */
const ELECTRIC  = "#110FFF";
const LAVENDER  = "#BCA2FF";
const DEEP      = "#282B5D";
const BORDER    = "rgba(202,202,202,0.4)";

/* ── Animation variants ─────────────────────────────────────────── */
const EASE_SPRING = [0.25, 1, 0.5, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.09, ease: EASE_SPRING },
  }),
};

/* ── MagneticCard — cursor-tracking gradient border ─────────────── */
function MagneticCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }, []);

  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--mouse-x", "50%");
    el.style.setProperty("--mouse-y", "50%");
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={cn("magnetic-card", className)}
    >
      {children}
    </div>
  );
}

/* ── Score bar (verdict demo) ───────────────────────────────────── */
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--color-muted-foreground)] w-32 shrink-0">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-[var(--color-surface-raised)]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${LAVENDER}, ${ELECTRIC})` }}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true }}
        />
      </div>
      <span
        className="tabular text-xs font-semibold w-8 text-right"
        style={{ color: ELECTRIC }}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Data ───────────────────────────────────────────────────────── */
const steps = [
  { n: "01", title: "Write your brief", description: "Describe the work in plain language. Set escrow in GEN. Get a shareable invite link, no seller wallet needed.", icon: PenTool },
  { n: "02", title: "Invite your creative", description: "Send the link via Discord, WhatsApp, or email. They preview the agreement and accept with one click.", icon: ArrowRight },
  { n: "03", title: "Review the delivery", description: "Approve work directly to release payment. If you need a second opinion, request an AI review.", icon: CheckCircle2 },
  { n: "04", title: "AI advises, you decide", description: "GenLayer AI evaluates style, alignment, and quality against your brief. You make the final call.", icon: Brain },
];

const useCases = [
  { icon: ImageIcon, title: "Logo & Brand Design", description: "Hire a designer from Twitter. Send a Pact link. Get protected delivery with AI as your quality check." },
  { icon: FileText, title: "Copywriting & Content", description: "Brief a writer from your network. Escrow protects both sides. No payment before delivery." },
  { icon: Code2, title: "Code & Technical Work", description: "Commission a developer. Clear requirements in the brief. AI validates against your spec if needed." },
  { icon: PenTool, title: "Creative Campaigns", description: "Work with agencies or freelancers you know. Pact adds a trust layer without the overhead." },
];

const valueBlocks = [
  { icon: Shield,       title: "No upfront wallet",  sub: "Share a link, not an address" },
  { icon: Brain,        title: "AI review on demand", sub: "Advisory, not autonomous" },
  { icon: CheckCircle2, title: "You decide",          sub: "Buyer retains final control" },
  { icon: Clock,        title: "Dispute protection",  sub: "AI explains every recommendation" },
];

const verdictExample = {
  prompt: "Create a dark luxury streetwear logo with minimalist sans-serif typography.",
  verdict: "PASS",
  confidence: 91,
  reasoning: "The submission strongly matches the requested luxury streetwear aesthetic through high-contrast monochrome palette, precise geometric letterforms, and restrained compositional balance. The typography demonstrates mastery of negative space consistent with luxury brand standards.",
  scores: [
    { label: "Style Match",       v: 94 },
    { label: "Prompt Alignment",  v: 89 },
    { label: "Quality",           v: 92 },
  ],
};

/* ══════════════════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] relative">

      {/* Blueprint grid — fixed behind everything */}
      <div
        className="fixed inset-0 pointer-events-none blueprint-grid"
        style={{ opacity: 0.65 }}
        aria-hidden="true"
      />

      {/* Hero radial glow */}
      <div className="gradient-hero absolute inset-0 pointer-events-none" aria-hidden="true" />

      {/* ── Glassmorphism Nav ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 surface-glass relative">
        {/* Razor-thin gradient border bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent 0%, rgba(17,15,255,0.18) 50%, transparent 100%)` }}
          aria-hidden="true"
        />
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-7 items-center justify-center rounded-lg border"
              style={{ background: `${ELECTRIC}14`, borderColor: `${ELECTRIC}30` }}
            >
              <Zap className="size-3.5" style={{ color: ELECTRIC }} />
            </div>
            <span className="text-sm font-semibold tracking-tight" style={{ color: DEEP }}>Pact</span>
            <span
              className="hidden sm:inline text-[10px] font-medium px-2 py-0.5 rounded-full border"
              style={{ color: DEEP, borderColor: BORDER, background: "rgba(255,255,255,0.7)" }}
            >
              {process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? "Demo" : "Testnet"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-xs">Dashboard</Button>
            </Link>
            <WalletConnection />
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-5 md:px-8 pt-14 pb-20 text-center">

          {/* Network status pill — centered, 24px above headline */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="mb-6">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: "#FFFFFF",
                border: `1px solid ${BORDER}`,
                fontFamily: "Switzer, Inter, sans-serif",
              }}
            >
              {/* Pulsing dot */}
              <span className="relative flex size-2">
                <span
                  className="absolute inline-flex size-full rounded-full opacity-50"
                  style={{
                    background: ELECTRIC,
                    animation: "pulse-dot 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
                  }}
                />
                <span
                  className="relative inline-flex size-2 rounded-full"
                  style={{ background: ELECTRIC }}
                />
              </span>
              <span
                className="text-[12px] font-medium leading-none"
                style={{ color: DEEP }}
              >
                {process.env.NEXT_PUBLIC_DEMO_MODE === "true"
                  ? "Interactive Demo: Try all flows live"
                  : "Live on GenLayer Studionet"}
              </span>
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-5xl md:text-[64px] font-bold leading-[1.15] mb-5 text-balance"
            style={{
              letterSpacing: "-0.03em",
              color: DEEP,
            }}
          >
            Smart contracts that{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(90deg, ${DEEP}, ${ELECTRIC})` }}
            >
              understand nuance.
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto mb-9 leading-relaxed text-balance"
          >
            Escrow protection for creative work you&apos;re already doing. Invite your designer, writer, or developer
            via link, no crypto knowledge required. AI helps resolve disputes if they arise. You decide.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/create">
              <Button
                size="xl"
                className="gap-2 w-full sm:w-auto"
                style={{ background: ELECTRIC }}
              >
                Protect my next project
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="xl"
                variant="secondary"
                className="gap-2 w-full sm:w-auto bg-white border"
                style={{ borderColor: BORDER, color: DEEP }}
              >
                View Dashboard
              </Button>
            </Link>
          </motion.div>

          {/* ── Interactive Value Blocks ───────────────────────────── */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={4}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-12"
          >
            {valueBlocks.map(({ icon: Icon, title, sub }) => (
              <MagneticCard key={title}>
                <div
                  className="elevating-card p-4 rounded-xl bg-white cursor-default text-left"
                  style={{ border: `1px solid ${BORDER}` }}
                >
                  <div
                    className="flex size-8 items-center justify-center rounded-lg mb-3"
                    style={{ background: `${ELECTRIC}10` }}
                  >
                    <Icon className="size-4" style={{ color: ELECTRIC }} />
                  </div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: DEEP }}>{title}</p>
                  <p className="text-[11px] leading-snug text-[var(--color-muted-foreground)]">{sub}</p>
                </div>
              </MagneticCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="py-20 border-t" style={{ borderColor: BORDER }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2
              className="text-3xl font-bold mb-3"
              style={{ letterSpacing: "-0.025em", color: DEEP }}
            >
              How it works
            </h2>
            <p className="text-[var(--color-muted-foreground)] max-w-xl mx-auto">
              Built for people who already work together and want protection without friction.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map(({ n, title, description, icon: Icon }, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }} viewport={{ once: true }}
              >
                <MagneticCard>
                  <div
                    className="elevating-card h-full p-5 rounded-xl bg-white cursor-default"
                    style={{ border: `1px solid ${BORDER}` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="tabular text-xs font-bold"
                        style={{ color: `${ELECTRIC}90` }}
                      >
                        {n}
                      </span>
                      <div
                        className="flex size-8 items-center justify-center rounded-lg transition-colors"
                        style={{ background: `${ELECTRIC}0D` }}
                      >
                        <Icon className="size-4" style={{ color: ELECTRIC }} />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: DEEP }}>{title}</h3>
                    <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">{description}</p>
                  </div>
                </MagneticCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Verdict Demo ───────────────────────────────────────── */}
      <section className="py-20 border-t" style={{ borderColor: BORDER }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2
              className="text-3xl font-bold mb-3"
              style={{ letterSpacing: "-0.025em", color: DEEP }}
            >
              AI as your review assistant
            </h2>
            <p className="text-[var(--color-muted-foreground)] max-w-xl mx-auto">
              When quality is disputed, the AI evaluates against your brief and gives a recommendation.
              You retain full control: approve, reject, or override.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }} viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <MagneticCard>
              <div
                className="elevating-card rounded-2xl bg-white overflow-hidden"
                style={{ border: `1px solid ${BORDER}` }}
              >
                {/* Brief */}
                <div className="p-5 border-b" style={{ borderColor: BORDER }}>
                  <p className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-widest mb-1.5">
                    Creative Brief
                  </p>
                  <p className="text-sm italic" style={{ color: DEEP }}>
                    &quot;{verdictExample.prompt}&quot;
                  </p>
                </div>

                {/* Verdict */}
                <div
                  className="flex items-center gap-3 p-5 border-b"
                  style={{ borderColor: BORDER, background: "rgba(17,15,255,0.03)" }}
                >
                  <div
                    className="flex size-9 items-center justify-center rounded-xl"
                    style={{ background: "rgba(17,15,255,0.08)" }}
                  >
                    <CheckCircle2 className="size-5" style={{ color: ELECTRIC }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold" style={{ color: ELECTRIC }}>Work Approved</p>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full border"
                        style={{
                          color: "var(--color-muted-foreground)",
                          background: "#FFFFFF",
                          borderColor: BORDER,
                        }}
                      >
                        AI Verdict · {verdictExample.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                      AI recommends approval. Buyer confirms to release escrow
                    </p>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="p-5 border-b" style={{ borderColor: BORDER }}>
                  <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                    {verdictExample.reasoning}
                  </p>
                </div>

                {/* Scores */}
                <div className="p-5 flex flex-col gap-3">
                  {verdictExample.scores.map((s) => (
                    <ScoreBar key={s.label} label={s.label} value={s.v} />
                  ))}
                </div>
              </div>
            </MagneticCard>
          </motion.div>
        </div>
      </section>

      {/* ── Use Cases ─────────────────────────────────────────────── */}
      <section className="py-20 border-t" style={{ borderColor: BORDER }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2
              className="text-3xl font-bold mb-3"
              style={{ letterSpacing: "-0.025em", color: DEEP }}
            >
              For the work you&apos;re already doing
            </h2>
            <p className="text-[var(--color-muted-foreground)] max-w-xl mx-auto">
              Pact works with existing relationships, not a new marketplace to join.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {useCases.map(({ icon: Icon, title, description }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.07 }} viewport={{ once: true }}
              >
                <MagneticCard>
                  <div
                    className="elevating-card h-full p-5 rounded-xl bg-white cursor-default"
                    style={{ border: `1px solid ${BORDER}` }}
                  >
                    <div
                      className="flex size-9 items-center justify-center rounded-xl mb-4"
                      style={{ background: `${ELECTRIC}0D` }}
                    >
                      <Icon className="size-4" style={{ color: ELECTRIC }} />
                    </div>
                    <h3 className="text-sm font-semibold mb-1.5" style={{ color: DEEP }}>{title}</h3>
                    <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">{description}</p>
                  </div>
                </MagneticCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 border-t" style={{ borderColor: BORDER }}>
        <div className="max-w-2xl mx-auto px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }} viewport={{ once: true }}
          >
            <MagneticCard>
              <div
                className="elevating-card rounded-2xl bg-white p-10 text-center"
                style={{ border: `1px solid ${BORDER}` }}
              >
                <h2
                  className="text-4xl font-bold mb-4"
                  style={{ letterSpacing: "-0.03em", color: DEEP }}
                >
                  Protect your next<br />creative agreement
                </h2>
                <p className="text-[var(--color-muted-foreground)] mb-8 leading-relaxed max-w-md mx-auto">
                  Write the brief, lock escrow, send an invite link. Your creative accepts in seconds, no crypto setup required on their end.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/create">
                    <Button
                      size="xl"
                      className="gap-2 w-full sm:w-auto"
                      style={{ background: ELECTRIC }}
                    >
                      Create a protected agreement
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                  <a
                    href="https://testnet-faucet.genlayer.foundation/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="xl"
                      variant="outline"
                      className="w-full sm:w-auto"
                      style={{ borderColor: BORDER, color: DEEP }}
                    >
                      Get testnet GEN
                    </Button>
                  </a>
                </div>
              </div>
            </MagneticCard>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t py-8" style={{ borderColor: BORDER }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="size-3.5" style={{ color: ELECTRIC }} />
            <span className="text-sm font-semibold" style={{ color: DEEP }}>Pact</span>
            <span className="text-xs text-[var(--color-muted-foreground)]">· Built on GenLayer</span>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Powered by GenLayer intelligent contracts · AI validators running on Studionet
          </p>
        </div>
      </footer>

    </div>
  );
}
