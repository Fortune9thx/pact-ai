"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletConnection } from "@/components/wallet/WalletConnection";
import {
  Zap, Brain, Shield, ArrowRight, CheckCircle2, Clock,
  Banknote, PenTool, ImageIcon, FileText, Code2
} from "lucide-react";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.1 } }),
};

const steps = [
  { n: "01", title: "Buyer creates a deal", description: "Describe the creative work, set your quality standards in plain language, and fund escrow with GEN tokens.", icon: PenTool },
  { n: "02", title: "Seller submits work", description: "Deliver the completed work via URL or file upload. The submission is recorded on-chain.", icon: ImageIcon },
  { n: "03", title: "AI evaluates quality", description: "GenLayer's AI validators analyze the submission against the brief — style, alignment, and quality.", icon: Brain },
  { n: "04", title: "Escrow resolves", description: "If the work passes, escrow is released to the seller. If not, the buyer is refunded. No manual intervention.", icon: Banknote },
];

const useCases = [
  { icon: ImageIcon, title: "Logo & Brand Design", description: "Specify style, tone, and aesthetic. AI verifies visual quality standards." },
  { icon: FileText, title: "Copywriting & Content", description: "Define tone of voice and message. AI checks alignment and quality." },
  { icon: Code2, title: "Code & Technical Work", description: "Describe functionality requirements. AI validates implementation quality." },
  { icon: PenTool, title: "Creative Campaigns", description: "Brief creative direction. AI evaluates conceptual and visual execution." },
];

const verdictExample = {
  prompt: "Create a dark luxury streetwear logo with minimalist sans-serif typography.",
  verdict: "PASS",
  confidence: 91,
  reasoning: "The submission strongly matches the requested luxury streetwear aesthetic through high-contrast monochrome palette, precise geometric letterforms, and restrained compositional balance. The typography demonstrates mastery of negative space consistent with luxury brand standards.",
  scores: [{ label: "Style Match", v: 94 }, { label: "Prompt Alignment", v: 89 }, { label: "Quality", v: 92 }],
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--color-muted-foreground)] w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-[var(--color-surface-overlay)]">
        <motion.div
          className="h-full rounded-full bg-[var(--color-verdict-pass)]"
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true }}
        />
      </div>
      <span className="tabular text-xs font-semibold text-[var(--color-verdict-pass)] w-8 text-right">{value}</span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/25">
              <Zap className="size-3.5 text-[var(--color-primary)]" />
            </div>
            <span className="text-sm font-semibold tracking-tight">VibeCheck</span>
            <Badge variant="default" className="text-[10px] px-1.5 py-0">Testnet</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <WalletConnection />
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="gradient-hero absolute inset-0 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/8 mb-6">
              <span className="relative flex size-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-50" />
                <span className="relative inline-flex rounded-full size-1.5 bg-[var(--color-primary)]" />
              </span>
              <span className="text-xs font-medium text-[var(--color-primary)]">Live on GenLayer Studionet</span>
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-5xl md:text-6xl font-bold tracking-tight text-[var(--color-foreground)] leading-[1.08] mb-5 text-balance"
          >
            Smart contracts that<br />
            <span className="text-[var(--color-primary)]">understand nuance.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto mb-9 leading-relaxed text-balance"
          >
            VibeCheck enables AI-powered escrow resolution for creative work, subjective agreements,
            and quality-based outcomes — enforced on-chain by GenLayer&apos;s intelligent contracts.
          </motion.p>

          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/create">
              <Button size="xl" className="gap-2 w-full sm:w-auto">
                Create a Deal
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="xl" variant="secondary" className="gap-2 w-full sm:w-auto">
                View Dashboard
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={4}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10"
          >
            {[
              { icon: Shield, text: "Trustless escrow" },
              { icon: Brain, text: "AI-powered verdicts" },
              { icon: CheckCircle2, text: "On-chain resolution" },
              { icon: Clock, text: "No manual disputes" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                <Icon className="size-3.5 text-[var(--color-primary)]" />
                {text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="py-20 border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold tracking-tight mb-3">How it works</h2>
            <p className="text-[var(--color-muted-foreground)] max-w-xl mx-auto">
              Four steps from brief to resolution, handled entirely on-chain.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map(({ n, title, description, icon: Icon }, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }} viewport={{ once: true }}
                className="relative p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/30 transition-colors group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="tabular text-xs font-bold text-[var(--color-muted-foreground)]">{n}</span>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-surface-raised)] group-hover:bg-[var(--color-primary)]/10 transition-colors">
                    <Icon className="size-4 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition-colors" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-2">{title}</h3>
                <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Verdict Demo ───────────────────────────────────── */}
      <section className="py-20 border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold tracking-tight mb-3">Why subjective contracts matter</h2>
            <p className="text-[var(--color-muted-foreground)] max-w-xl mx-auto">
              Traditional smart contracts can&apos;t evaluate &quot;quality&quot; or &quot;style.&quot; GenLayer&apos;s AI-powered
              intelligent contracts can.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }} viewport={{ once: true }}
            className="max-w-2xl mx-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden"
          >
            {/* Brief */}
            <div className="p-5 border-b border-[var(--color-border)]">
              <p className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide mb-1.5">Creative Brief</p>
              <p className="text-sm text-[var(--color-foreground)] italic">&quot;{verdictExample.prompt}&quot;</p>
            </div>

            {/* Verdict header */}
            <div className="flex items-center gap-3 p-5 border-b border-[var(--color-border)] bg-[var(--color-verdict-pass)]/5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--color-verdict-pass)]/15">
                <CheckCircle2 className="size-5 text-[var(--color-verdict-pass)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[var(--color-verdict-pass)]">Work Approved</p>
                  <span className="text-[10px] text-[var(--color-muted-foreground)] bg-[var(--color-surface-overlay)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
                    AI Verdict · {verdictExample.confidence}% confidence
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">Escrow released to seller automatically</p>
              </div>
            </div>

            {/* Reasoning */}
            <div className="p-5 border-b border-[var(--color-border)]">
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
          </motion.div>
        </div>
      </section>

      {/* ── Use Cases ─────────────────────────────────────────── */}
      <section className="py-20 border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold tracking-tight mb-3">Built for creative work</h2>
            <p className="text-[var(--color-muted-foreground)] max-w-xl mx-auto">
              Any agreement where quality is subjective — VibeCheck makes it objective.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {useCases.map(({ icon: Icon, title, description }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }} viewport={{ once: true }}
                className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 mb-4">
                  <Icon className="size-4 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-sm font-semibold mb-1.5">{title}</h3>
                <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-24 border-t border-[var(--color-border)]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }} viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Ready to resolve creative<br />disputes on-chain?
            </h2>
            <p className="text-[var(--color-muted-foreground)] mb-8 leading-relaxed">
              Get free GEN tokens from the testnet faucet and start your first deal in under two minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/create">
                <Button size="xl" className="gap-2 w-full sm:w-auto">
                  Start your first deal
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <a
                href="https://testnet-faucet.genlayer.foundation/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  Get testnet GEN
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border)] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="size-3.5 text-[var(--color-primary)]" />
            <span className="text-sm font-semibold">VibeCheck</span>
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
