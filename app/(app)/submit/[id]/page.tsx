"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDeal, useSubmitWork } from "@/hooks/useDeal";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadArea } from "@/components/upload/UploadArea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Send, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SubmitWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { deal, loading } = useDeal(id);
  const { wallet } = useWallet();
  const submitWork = useSubmitWork();

  const [submissionUrl, setSubmissionUrl] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!submissionUrl.trim()) e.url = "Provide a URL or upload a file";
    if (description.trim().length < 10) e.description = "Describe your work in at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitError(null);
    setSubmitting(true);
    try {
      await submitWork({ dealId: id, submissionUrl, description });
      router.push(`/deal/${id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-8 w-32 rounded-lg bg-[var(--color-surface-raised)] shimmer-bg mb-6" />
        <div className="h-80 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shimmer-bg" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-[var(--color-muted-foreground)]">Deal not found.</p>
        <Link href="/dashboard"><Button variant="ghost" size="sm" className="mt-4">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const isSeller = wallet.address?.toLowerCase() === deal.seller.toLowerCase();
  if (!isSeller) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-[var(--color-muted-foreground)]">Only the seller can submit work for this deal.</p>
        <Link href={`/deal/${id}`}><Button variant="ghost" size="sm" className="mt-4">View Deal</Button></Link>
      </div>
    );
  }

  if (deal.status !== "FUNDED") {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-[var(--color-muted-foreground)]">This deal is not accepting submissions (status: {deal.status}).</p>
        <Link href={`/deal/${id}`}><Button variant="ghost" size="sm" className="mt-4">View Deal</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-6">
          <Link href={`/deal/${id}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
              <ArrowLeft className="size-3.5" />
              Deal
            </Button>
          </Link>
          <h2 className="text-lg font-semibold">Submit Work</h2>
          <span className="font-mono text-xs text-[var(--color-muted-foreground)] hidden sm:inline">{id}</span>
        </div>

        {/* Brief reminder */}
        <Card className="mb-5 border-[var(--color-primary)]/25 bg-[var(--color-primary)]/8">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[var(--color-primary)] mb-1">Creative Brief</p>
            <p className="text-sm text-[var(--color-foreground)] italic leading-relaxed">
              &ldquo;{deal.prompt}&rdquo;
            </p>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Your Work</CardTitle>
              <CardDescription>Link to or upload the creative deliverable.</CardDescription>
            </CardHeader>
            <CardContent>
              <UploadArea
                onUrlChange={setSubmissionUrl}
                submissionUrl={submissionUrl}
              />
              {errors.url && <p className="text-xs text-[var(--color-destructive)] mt-2">{errors.url}</p>}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Notes</CardTitle>
              <CardDescription>Explain what you delivered and how it meets the brief. The AI will read this.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Textarea
                  label="Description"
                  placeholder="Describe what you created, the choices you made, and how you addressed the brief requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={600}
                  error={errors.description}
                  className="min-h-[140px]"
                />
                <div className="flex justify-end mt-1">
                  <span className={cn(
                    "text-[10px] tabular",
                    description.length > 540
                      ? description.length >= 600
                        ? "text-[var(--color-destructive)]"
                        : "text-[var(--color-status-disputed)]"
                      : "text-[var(--color-muted-foreground)]"
                  )}>
                    {description.length}/600
                  </span>
                </div>
              </div>

              {/* AI tip */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                <Info className="size-3.5 text-[var(--color-muted-foreground)] mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                  <span className="text-[var(--color-foreground)] font-medium">Tip:</span> The AI evaluates your description along with the submitted URL.
                  Be specific about how your work addresses the style, tone, and quality requirements in the brief.
                </p>
              </div>
            </CardContent>
          </Card>

          {submitError && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--color-destructive)]/8 border border-[var(--color-destructive)]/20">
              <Info className="size-3.5 text-[var(--color-destructive)] mt-0.5 shrink-0" />
              <p className="text-xs text-[var(--color-destructive)] leading-relaxed">{submitError}</p>
            </div>
          )}

          <Button type="submit" size="lg" loading={submitting} className="w-full gap-2">
            {!submitting && <Send className="size-4" />}
            {submitting ? "Submitting…" : "Submit Work On-Chain"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
