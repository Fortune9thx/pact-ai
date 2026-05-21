"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCreateDeal } from "@/hooks/useDeal";
import { useWallet } from "@/hooks/useWallet";
import { PlusCircle, Info, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const PROMPT_EXAMPLES = [
  "Create a dark luxury streetwear logo with minimalist sans-serif typography.",
  "Design a minimalist brand identity for a premium coffee subscription service.",
  "Write a short-form landing page copy for a B2B SaaS analytics tool — professional, concise, conversion-focused.",
  "Illustrate a digital art piece with cyberpunk aesthetic, neon-accented, dark palette.",
];

export default function CreateDealPage() {
  const router = useRouter();
  const createDeal = useCreateDeal();
  const { wallet, connect } = useWallet();

  const [seller, setSeller] = useState("");
  const [prompt, setPrompt] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("7");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!seller.match(/^0x[a-fA-F0-9]{40}$/)) e.seller = "Enter a valid Ethereum address";
    if (prompt.trim().length < 20) e.prompt = "Describe the work in at least 20 characters";
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) e.amount = "Enter a valid GEN amount";
    const d = parseInt(deadline);
    if (isNaN(d) || d < 1 || d > 90) e.deadline = "Deadline must be 1–90 days";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await createDeal({
        seller,
        prompt: prompt.trim(),
        deadline: parseInt(deadline),
        amount,
      });
      router.push("/dashboard");
    } catch (err) {
      console.error("Create deal failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-2.5 mb-6">
          <PlusCircle className="size-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-semibold">New Creative Deal</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Seller */}
          <Card>
            <CardHeader>
              <CardTitle>Counterparty</CardTitle>
              <CardDescription>Who will deliver the creative work?</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                label="Seller Address"
                placeholder="0x..."
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                error={errors.seller}
                hint="The wallet address of the creative you're hiring"
              />
            </CardContent>
          </Card>

          {/* Prompt */}
          <Card>
            <CardHeader>
              <CardTitle>Creative Brief</CardTitle>
              <CardDescription>
                Describe exactly what you want. The AI will use this to evaluate the submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Textarea
                label="Creative Prompt"
                placeholder="Describe the style, tone, quality standards, and any specific requirements..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={500}
                error={errors.prompt}
                className="min-h-[120px]"
              />

              {/* Examples */}
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)] mb-2">Example prompts:</p>
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

          {/* Escrow */}
          <Card>
            <CardHeader>
              <CardTitle>Escrow Terms</CardTitle>
              <CardDescription>Set the payment and deadline.</CardDescription>
            </CardHeader>
            <CardContent>
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

              {/* Info box */}
              <div className="flex items-start gap-2.5 mt-4 p-3 rounded-lg bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/15">
                <Info className="size-3.5 text-[var(--color-primary)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-[var(--color-foreground)] font-medium">How escrow works</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 leading-relaxed">
                    GEN tokens are locked in the smart contract. The AI evaluates the submission against
                    your brief. Funds are automatically released to the seller on approval, or refunded to
                    you if the work doesn&apos;t meet the standard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          {!wallet.isConnected ? (
            <Button type="button" size="lg" variant="secondary" onClick={connect} className="w-full gap-2">
              Connect Wallet to Continue
            </Button>
          ) : (
            <Button type="submit" size="lg" loading={loading} className="w-full gap-2">
              {!loading && <Zap className="size-4" />}
              {loading ? "Creating Deal…" : "Create Deal & Fund Escrow"}
            </Button>
          )}
        </form>
      </motion.div>
    </div>
  );
}
