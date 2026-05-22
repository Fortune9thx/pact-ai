"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCreateDeal } from "@/hooks/useDeal";
import { useWallet } from "@/hooks/useWallet";
import { getInviteUrl } from "@/lib/invite";
import {
  PlusCircle, Info, Zap, Copy, CheckCircle2,
  ArrowRight, Share2, ExternalLink, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PROMPT_EXAMPLES = [
  "Design a dark luxury streetwear logo with minimalist sans-serif typography and no gradients.",
  "Create a minimalist brand identity for a premium coffee subscription: wordmark + icon.",
  "Write a short-form landing page for a B2B SaaS analytics tool: professional, concise, conversion-focused.",
  "Illustrate a digital art piece with cyberpunk aesthetic, neon-accented, dark palette.",
];

type Step = "brief" | "terms" | "share";

export default function CreateDealPage() {
  const createDeal = useCreateDeal();
  const { wallet, connect } = useWallet();

  const [step, setStep] = useState<Step>("brief");
  const [prompt, setPrompt] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("7");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdDealId, setCreatedDealId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const validateBrief = () => {
    const e: Record<string, string> = {};
    if (prompt.trim().length < 20) e.prompt = "Describe the work in at least 20 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateTerms = () => {
    const e: Record<string, string> = {};
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) e.amount = "Enter a valid GEN amount";
    const d = parseInt(deadline);
    if (isNaN(d) || d < 1 || d > 90) e.deadline = "Deadline must be 1–90 days";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNextToBrief = () => {
    if (validateBrief()) setStep("terms");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTerms()) return;
    setLoading(true);
    try {
      const dealId = await createDeal({
        prompt: prompt.trim(),
        deadline: parseInt(deadline),
        amount,
      });
      setCreatedDealId(dealId);
      setStep("share");
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

  const STEP_META: Record<Step, { label: string; n: number }> = {
    brief:  { label: "Creative Brief",  n: 1 },
    terms:  { label: "Escrow Terms",    n: 2 },
    share:  { label: "Share Invite",    n: 3 },
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* Page header */}
        <div className="flex items-center gap-2.5 mb-6">
          <PlusCircle className="size-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-semibold">New Protected Agreement</h2>
        </div>

        {/* Step indicator */}
        {step !== "share" && (
          <div className="flex items-center gap-2 mb-6">
            {(["brief", "terms"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                    step === s || (s === "brief" && step === "terms")
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                  )}
                >
                  {s === "brief" && step === "terms" ? <CheckCircle2 className="size-3.5" /> : STEP_META[s].n}
                </div>
                <span className={cn(
                  "text-xs",
                  step === s ? "font-medium text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)]"
                )}>
                  {STEP_META[s].label}
                </span>
                {i < 1 && <ArrowRight className="size-3 text-[var(--color-muted-foreground)]" />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Step 1: Creative Brief ── */}
          {step === "brief" && (
            <motion.div
              key="brief"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-5"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Creative Brief</CardTitle>
                  <CardDescription>
                    Describe exactly what you need. The AI uses this to evaluate the work if a dispute arises.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Textarea
                    label="What do you need created?"
                    placeholder="Describe the style, tone, quality standards, and any specific requirements..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    maxLength={500}
                    error={errors.prompt}
                    className="min-h-[140px]"
                  />
                  <div>
                    <p className="text-xs text-[var(--color-muted-foreground)] mb-2">Quick-fill examples:</p>
                    <div className="flex flex-col gap-1.5">
                      {PROMPT_EXAMPLES.map((ex) => (
                        <button
                          key={ex}
                          type="button"
                          onClick={() => setPrompt(ex)}
                          className="text-left text-xs text-[var(--color-muted-foreground)] px-3 py-2 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)] transition-all leading-relaxed"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button size="lg" className="w-full gap-2" onClick={handleNextToBrief}>
                Set Escrow Terms
                <ArrowRight className="size-4" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 2: Escrow Terms ── */}
          {step === "terms" && (
            <motion.form
              key="terms"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-5"
            >
              {/* Brief preview */}
              <Card className="border-[var(--color-primary)]/15 bg-[var(--color-primary)]/3">
                <CardContent className="p-4">
                  <p className="text-[10px] font-medium text-[var(--color-primary)] uppercase tracking-wide mb-1.5">
                    Creative Brief
                  </p>
                  <p className="text-sm text-[var(--color-foreground)] leading-relaxed line-clamp-3 italic">
                    &ldquo;{prompt}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep("brief")}
                    className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] mt-2 transition-colors"
                  >
                    Edit brief
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Escrow Terms</CardTitle>
                  <CardDescription>
                    Set the payment amount and deadline. Funds are locked in escrow until the work is approved.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
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

                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/15">
                    <Info className="size-3.5 text-[var(--color-primary)] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[var(--color-foreground)]">How it works</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 leading-relaxed">
                        GEN tokens are held in escrow. You review the work when it&apos;s delivered. Approve it
                        to release payment, or request an AI review if you need a second opinion.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!wallet.isConnected ? (
                <Button type="button" size="lg" variant="secondary" onClick={connect} className="w-full gap-2">
                  Connect Wallet to Continue
                </Button>
              ) : (
                <Button type="submit" size="lg" loading={loading} className="w-full gap-2">
                  {!loading && <Zap className="size-4" />}
                  {loading ? "Creating Agreement…" : "Lock Escrow & Get Invite Link"}
                </Button>
              )}
            </motion.form>
          )}

          {/* ── Step 3: Share invite ── */}
          {step === "share" && createdDealId && (
            <motion.div
              key="share"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5"
            >
              {/* Success header */}
              <div className="flex flex-col items-center text-center py-6 px-4 rounded-2xl border border-[var(--color-verdict-pass)]/25 bg-[var(--color-verdict-pass)]/6">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-verdict-pass)]/15 mb-3">
                  <CheckCircle2 className="size-6 text-[var(--color-verdict-pass)]" />
                </div>
                <h3 className="text-base font-semibold text-[var(--color-foreground)]">Agreement created</h3>
                <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                  Escrow is locked. Now send the invite link to your creative.
                </p>
                <span className="font-mono text-xs text-[var(--color-muted-foreground)] mt-2 bg-[var(--color-surface-raised)] px-2 py-0.5 rounded">
                  {createdDealId}
                </span>
              </div>

              {/* Invite link card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Share2 className="size-4 text-[var(--color-primary)]" />
                    <CardTitle>Share with your creative</CardTitle>
                  </div>
                  <CardDescription>
                    Send this link via Discord, WhatsApp, Twitter/X, Telegram, or email. They can preview the
                    agreement and accept without needing any crypto knowledge upfront.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {/* Link display */}
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                    <span className="font-mono text-xs text-[var(--color-foreground)] flex-1 truncate">
                      {inviteUrl}
                    </span>
                    <button
                      onClick={copyLink}
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all shrink-0",
                        copied
                          ? "bg-[var(--color-verdict-pass)]/12 text-[var(--color-verdict-pass)]"
                          : "bg-[var(--color-primary)] text-white hover:opacity-90"
                      )}
                    >
                      {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  {/* Share hints */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Discord", hint: "Paste in DM" },
                      { label: "WhatsApp", hint: "Send in chat" },
                      { label: "Twitter/X", hint: "DM the link" },
                      { label: "Email", hint: "Paste in body" },
                    ].map(({ label, hint }) => (
                      <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                        <div className="size-1.5 rounded-full bg-[var(--color-primary)]/50" />
                        <div>
                          <p className="text-xs font-medium text-[var(--color-foreground)]">{label}</p>
                          <p className="text-[10px] text-[var(--color-muted-foreground)]">{hint}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI note */}
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--color-accent)]/8 border border-[var(--color-accent)]/20">
                    <Sparkles className="size-3.5 text-[var(--color-accent-foreground)] mt-0.5 shrink-0" />
                    <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                      If a dispute arises, the AI will review the work against your brief and give you a
                      recommendation with a confidence score. You make the final call.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
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
