"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDeal } from "@/hooks/useDeal";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useWallet } from "@/hooks/useWallet";
import { getInviteUrl } from "@/lib/invite";
import {
  PlusCircle, Info, Zap, Copy, CheckCircle2,
  ArrowRight, Share2, ExternalLink, Sparkles,
  Brain, Shield, Layers, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Data ────────────────────────────────────────────────────────── */

const PROMPT_EXAMPLES = [
  { label: "Logo design",      text: "Design a dark luxury streetwear logo with minimalist sans-serif typography and no gradients." },
  { label: "Brand identity",   text: "Create a minimalist brand identity for a premium coffee subscription: wordmark + icon." },
  { label: "SaaS copy",        text: "Write a short-form landing page for a B2B SaaS analytics tool: professional, concise, conversion-focused." },
  { label: "Digital art",      text: "Illustrate a digital art piece with cyberpunk aesthetic, neon-accented, dark palette." },
];

const AI_GUARD_ITEMS = [
  {
    icon: Brain,
    title: "Brief Parsing",
    description: "LLM validators dissect your brief into measurable criteria: style, quality, and deliverable scope.",
  },
  {
    icon: Layers,
    title: "Multi-Validator Consensus",
    description: "Multiple independent GenLayer nodes evaluate simultaneously. No single point of bias.",
  },
  {
    icon: Eye,
    title: "Equivalence Principle",
    description: "Validators agree on meaning, not exact output. Subjective decisions reach objective consensus.",
  },
  {
    icon: Shield,
    title: "You Decide",
    description: "AI verdict is advisory. You always hold final authority to approve, reject, or override.",
  },
];

/* ── Types ───────────────────────────────────────────────────────── */

type Step = "brief" | "terms" | "share";

/* ── AI Guard Panel ──────────────────────────────────────────────── */

function AIGuardPanel() {
  return (
    <div className="hidden lg:block sticky top-6">
      <div
        className="rounded-2xl bg-white overflow-hidden"
        style={{
          border: "1px solid rgba(188,162,255,0.35)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 24px rgba(188,162,255,0.10)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 pt-5 pb-4"
          style={{ borderBottom: "1px solid rgba(188,162,255,0.2)" }}
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <div
              className="flex size-7 items-center justify-center rounded-lg"
              style={{ background: "rgba(17,15,255,0.08)" }}
            >
              <Shield className="size-3.5" style={{ color: "#110FFF" }} />
            </div>
            <h4 className="text-sm font-bold" style={{ color: "#282B5D" }}>
              AI Evaluation Guard
            </h4>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: "#8888AA" }}>
            Powered by GenLayer LLM validators. Your brief becomes the evaluation standard.
          </p>
        </div>

        {/* Items */}
        <div className="p-5 flex flex-col gap-4">
          {AI_GUARD_ITEMS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-3">
              <div
                className="flex size-7 items-center justify-center rounded-lg shrink-0 mt-0.5"
                style={{ background: "rgba(188,162,255,0.14)" }}
              >
                <Icon className="size-3.5" style={{ color: "#110FFF" }} />
              </div>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "#282B5D" }}>
                  {title}
                </p>
                <p className="text-[11px] leading-relaxed" style={{ color: "#8888AA" }}>
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Network badge */}
        <div className="px-5 pb-5">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: "rgba(17,15,255,0.04)",
              border: "1px solid rgba(17,15,255,0.10)",
            }}
          >
            <span
              className="relative flex size-1.5"
            >
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                style={{ background: "#110FFF" }}
              />
              <span
                className="relative inline-flex rounded-full size-1.5"
                style={{ background: "#110FFF" }}
              />
            </span>
            <p className="text-[11px] font-semibold" style={{ color: "#110FFF" }}>
              GenLayer Bradbury
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */

export default function CreateDealPage() {
  const createDeal = useCreateDeal();
  const { wallet } = useWallet();
  const { openConnectModal } = useConnectModal();
  const router = useRouter();

  const [step, setStep]               = useState<Step>("brief");
  const [prompt, setPrompt]           = useState("");
  const [amount, setAmount]           = useState("");
  const [deadline, setDeadline]       = useState("7");
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [createdDealId, setCreatedDealId] = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);
  const [briefFocused, setBriefFocused] = useState(false);

  const validateBrief = () => {
    const e: Record<string, string> = {};
    if (prompt.trim().length < 20) e.prompt = "Describe the work in at least 20 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateTerms = () => {
    const e: Record<string, string> = {};
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      e.amount = "Enter a positive GEN amount (e.g. 5 or 0.5)";
    } else {
      const balance = parseFloat(wallet.balance || "0");
      if (!isNaN(balance) && amt > balance) {
        e.amount = `Exceeds wallet balance (${balance} GEN available)`;
      }
    }
    const d = parseInt(deadline);
    if (isNaN(d) || d < 1 || d > 90) e.deadline = "Deadline must be 1-90 days";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNextToBrief = () => { if (validateBrief()) setStep("terms"); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTerms()) return;
    setLoading(true);
    try {
      const dealId = await createDeal({ prompt: prompt.trim(), deadline: parseInt(deadline), amount });
      setCreatedDealId(dealId);
      setStep("share");
      // Redirect to the deal page so the user can see all deal options immediately
      router.push(`/deal/${dealId}`);
    } catch (err) {
      console.error("Create deal failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const inviteUrl = createdDealId ? getInviteUrl(createdDealId) : "";

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [inviteUrl]);

  const STEPS = [
    { key: "brief", label: "Creative Brief", n: 1 },
    { key: "terms", label: "Escrow Terms",   n: 2 },
  ] as const;

  const currentIdx = step === "brief" ? 0 : step === "terms" ? 1 : 2;

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* ── Page header ── */}
        <div className="flex items-center gap-2.5 mb-8">
          <PlusCircle className="size-5" style={{ color: "#110FFF" }} />
          <h2 className="text-lg font-bold tracking-tight" style={{ color: "#282B5D" }}>
            New Protected Agreement
          </h2>
        </div>

        {/* ── Stepper ── */}
        {step !== "share" && (
          <div className="flex items-center mb-8">
            {STEPS.map((s, i) => {
              const isDone   = currentIdx > i;
              const isActive = currentIdx === i;
              return (
                <div key={s.key} className="flex items-center">
                  <div className="flex items-center gap-2.5">
                    {/* Circle */}
                    <div
                      className="flex size-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 shrink-0"
                      style={{
                        background: isDone || isActive ? "#110FFF" : "#EDEDF8",
                        color:      isDone || isActive ? "#fff"    : "#AAAACC",
                        boxShadow:  isActive            ? "0 0 0 3px rgba(17,15,255,0.15)" : "none",
                      }}
                    >
                      {isDone ? <CheckCircle2 className="size-3.5" /> : s.n}
                    </div>
                    {/* Label */}
                    <div>
                      <p
                        className="text-xs font-semibold tracking-tight transition-colors duration-300"
                        style={{
                          color: isActive ? "#282B5D" : isDone ? "#110FFF" : "#AAAACC",
                        }}
                      >
                        {s.label}
                      </p>
                    </div>
                  </div>
                  {/* Connector */}
                  {i < STEPS.length - 1 && (
                    <div
                      className="mx-5 h-px w-14 rounded-full transition-all duration-500"
                      style={{ background: isDone ? "#110FFF" : "#E2E2EE" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Steps ── */}
        <AnimatePresence mode="wait">

          {/* Step 1: Creative Brief */}
          {step === "brief" && (
            <motion.div
              key="brief"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start"
            >
              {/* ── Left: Brief card ── */}
              <div
                className="rounded-2xl bg-white overflow-hidden transition-all duration-500"
                style={{
                  border: "1px solid var(--color-border)",
                  boxShadow: briefFocused
                    ? "0 0 0 1.5px rgba(188,162,255,0.55), 0 8px 40px rgba(188,162,255,0.20), 0 24px 64px rgba(17,15,255,0.10)"
                    : "0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)",
                }}
              >
                {/* Card header */}
                <div className="px-6 pt-6 pb-5" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <h3 className="text-base font-bold" style={{ color: "#282B5D" }}>
                    Creative Brief
                  </h3>
                  <p className="text-sm mt-0.5" style={{ color: "#8888AA" }}>
                    Describe exactly what you need. The AI uses this to evaluate the work if a dispute arises.
                  </p>
                </div>

                {/* Card body */}
                <div className="px-6 py-5 flex flex-col gap-5">
                  {/* Textarea with focus tracking via wrapper */}
                  <div
                    onFocus={() => setBriefFocused(true)}
                    onBlur={() => setBriefFocused(false)}
                  >
                    <Textarea
                      label="What do you need created?"
                      placeholder="Describe the style, tone, quality standards, and any specific requirements..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      maxLength={500}
                      error={errors.prompt}
                      className="min-h-[160px]"
                    />
                  </div>

                  {/* Char counter */}
                  <p className="text-[11px] -mt-3 text-right" style={{ color: "#AAAACC" }}>
                    {prompt.length} / 500
                  </p>

                  {/* Micro-pill quick fills */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "#AAAACC" }}>
                      Quick fill
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PROMPT_EXAMPLES.map((ex) => {
                        const isSelected = prompt === ex.text;
                        return (
                          <button
                            key={ex.label}
                            type="button"
                            onClick={() => setPrompt(ex.text)}
                            className="text-xs px-3.5 py-1.5 rounded-full transition-all duration-200 select-none"
                            style={{
                              border: `1px solid ${isSelected ? "#BCA2FF" : "var(--color-border)"}`,
                              background: isSelected ? "rgba(188,162,255,0.10)" : "transparent",
                              color:      isSelected ? "#282B5D"                : "#8888AA",
                              transform:  "scale(1)",
                            }}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget;
                              el.style.borderColor = "#BCA2FF";
                              el.style.transform   = "scale(1.05)";
                              el.style.color       = "#282B5D";
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget;
                              el.style.borderColor = isSelected ? "#BCA2FF" : "var(--color-border)";
                              el.style.transform   = "scale(1)";
                              el.style.color       = isSelected ? "#282B5D" : "#8888AA";
                            }}
                          >
                            {ex.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card footer — button inside, bottom-right */}
                <div
                  className="px-6 pb-6 flex justify-end"
                  style={{ borderTop: "1px solid var(--color-border)", paddingTop: "20px" }}
                >
                  <Button
                    size="lg"
                    className="gap-2"
                    style={{ minWidth: "210px" }}
                    onClick={handleNextToBrief}
                  >
                    Set Escrow Terms
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>

              {/* ── Right: AI Guard ── */}
              <AIGuardPanel />
            </motion.div>
          )}

          {/* Step 2: Escrow Terms */}
          {step === "terms" && (
            <motion.form
              key="terms"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start"
            >
              {/* ── Left: Terms card ── */}
              <div className="flex flex-col gap-4">

                {/* Brief preview strip */}
                <div
                  className="flex items-start justify-between gap-4 px-4 py-3 rounded-xl"
                  style={{
                    border: "1px solid rgba(17,15,255,0.14)",
                    background: "rgba(17,15,255,0.03)",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#110FFF" }}>
                      Creative Brief
                    </p>
                    <p className="text-sm leading-relaxed line-clamp-2 italic" style={{ color: "#282B5D" }}>
                      &ldquo;{prompt}&rdquo;
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("brief")}
                    className="text-xs shrink-0 mt-0.5 transition-colors duration-150"
                    style={{ color: "#AAAACC" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#110FFF")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#AAAACC")}
                  >
                    Edit
                  </button>
                </div>

                {/* Terms form card */}
                <div
                  className="rounded-2xl bg-white overflow-hidden"
                  style={{
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="px-6 pt-6 pb-5" style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <h3 className="text-base font-bold" style={{ color: "#282B5D" }}>Escrow Terms</h3>
                    <p className="text-sm mt-0.5" style={{ color: "#8888AA" }}>
                      Set the payment amount and deadline. Funds lock in escrow until the work is approved.
                    </p>
                  </div>

                  <div className="px-6 py-5 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="5"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        suffix="GEN"
                        error={errors.amount}
                      />
                      <Input
                        label="Deadline"
                        type="number"
                        min="1"
                        max="90"
                        placeholder="7"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        suffix="days"
                        error={errors.deadline}
                      />
                    </div>

                    <div
                      className="flex items-start gap-2.5 p-3 rounded-lg"
                      style={{
                        background: "rgba(17,15,255,0.04)",
                        border: "1px solid rgba(17,15,255,0.10)",
                      }}
                    >
                      <Info className="size-3.5 mt-0.5 shrink-0" style={{ color: "#110FFF" }} />
                      <div>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: "#282B5D" }}>How it works</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#8888AA" }}>
                          Real GEN tokens lock in the smart contract. Approve to release to the seller,
                          cancel to get a full refund, or request an AI review for a second opinion.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Button inside card, bottom-right */}
                  <div
                    className="px-6 pb-6 flex justify-end"
                    style={{ borderTop: "1px solid var(--color-border)", paddingTop: "20px" }}
                  >
                    {!wallet.isConnected ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => openConnectModal?.()}
                        className="gap-2"
                        style={{ minWidth: "220px" }}
                      >
                        Connect Wallet to Continue
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        loading={loading}
                        className="gap-2"
                        style={{ minWidth: "220px" }}
                      >
                        {!loading && <Zap className="size-4" />}
                        {loading ? "Creating Agreement..." : "Lock Escrow and Get Invite Link"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Right: AI Guard ── */}
              <AIGuardPanel />
            </motion.form>
          )}

          {/* Step 3: Share invite */}
          {step === "share" && createdDealId && (
            <motion.div
              key="share"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5 max-w-2xl"
            >
              {/* Success header */}
              <div className="flex flex-col items-center text-center py-8 px-6 rounded-2xl border border-[var(--color-verdict-pass)]/25 bg-[var(--color-verdict-pass)]/6">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--color-verdict-pass)]/15 mb-3">
                  <CheckCircle2 className="size-7 text-[var(--color-verdict-pass)]" />
                </div>
                <h3 className="text-lg font-bold" style={{ color: "#282B5D" }}>Agreement created</h3>
                <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                  Escrow is locked. Send the invite link to your creative.
                </p>
                <span className="font-mono text-xs text-[var(--color-muted-foreground)] mt-2 bg-[var(--color-surface-raised)] px-2.5 py-1 rounded-lg">
                  {createdDealId}
                </span>
              </div>

              {/* Invite link card */}
              <div
                className="rounded-2xl bg-white overflow-hidden"
                style={{
                  border: "1px solid var(--color-border)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Share2 className="size-4" style={{ color: "#110FFF" }} />
                    <h4 className="text-base font-bold" style={{ color: "#282B5D" }}>Share with your creative</h4>
                  </div>
                  <p className="text-sm" style={{ color: "#8888AA" }}>
                    Send via Discord, WhatsApp, Twitter/X, Telegram, or email. No crypto setup required on their end.
                  </p>
                </div>

                <div className="px-6 py-5 flex flex-col gap-4">
                  {/* Link display */}
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                    <span className="font-mono text-xs text-[var(--color-foreground)] flex-1 truncate">
                      {inviteUrl}
                    </span>
                    <button
                      onClick={copyLink}
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all shrink-0",
                        copied
                          ? "bg-[var(--color-verdict-pass)]/12 text-[var(--color-verdict-pass)]"
                          : "text-white"
                      )}
                      style={!copied ? { background: "#110FFF" } : undefined}
                    >
                      {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? "Copied!" : "Copy link"}
                    </button>
                  </div>

                  {/* Share platform hints */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Discord",   hint: "Paste in DM" },
                      { label: "WhatsApp",  hint: "Send in chat" },
                      { label: "Twitter/X", hint: "DM the link" },
                      { label: "Telegram",  hint: "Share in chat" },
                    ].map(({ label, hint }) => (
                      <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                        <div className="size-1.5 rounded-full" style={{ background: "#BCA2FF" }} />
                        <div>
                          <p className="text-xs font-semibold text-[var(--color-foreground)]">{label}</p>
                          <p className="text-[10px] text-[var(--color-muted-foreground)]">{hint}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI note */}
                  <div
                    className="flex items-start gap-2.5 p-3 rounded-lg"
                    style={{
                      background: "rgba(188,162,255,0.08)",
                      border: "1px solid rgba(188,162,255,0.25)",
                    }}
                  >
                    <Sparkles className="size-3.5 shrink-0 mt-0.5" style={{ color: "#110FFF" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#8888AA" }}>
                      If a dispute arises, the AI will review the work against your brief and give you a
                      recommendation with a confidence score. You make the final call.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <div className="flex gap-3">
                <Link href={`/deal/${createdDealId}`} className="flex-1">
                  <Button variant="secondary" size="lg" className="w-full gap-2">
                    <ExternalLink className="size-4" />
                    View Deal
                  </Button>
                </Link>
                <Link href="/dashboard" className="flex-1">
                  <Button size="lg" className="w-full gap-2">
                    Go to Dashboard
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
