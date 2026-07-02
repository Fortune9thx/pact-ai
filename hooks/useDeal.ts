"use client";

import { useCallback, useEffect, useState } from "react";
import { getDeal, getAllDeals, getDealsForBuyer, getDealsForSeller, getStats } from "@/lib/contract";
import { useStore } from "@/store/useStore";
import { useWallet } from "./useWallet";
import { CONTRACT_ADDRESS, getReadClient } from "@/lib/genlayer";
import type { Deal, DashboardStats, CreateDealParams, SubmitWorkParams } from "@/lib/types";

export const PENDING_DEAL_KEY = "pact_pending_deal";

// ── Fetch all deals (dashboard store) ────────────────────────────────

export function useDeals() {
  const { deals, setDeals, upsertDeal } = useStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [allDeals, dashStats] = await Promise.all([getAllDeals(), getStats()]);
      setDeals(allDeals);
      setStats(dashStats);
      // If chain now has the pending deal, clear localStorage
      const raw = localStorage.getItem(PENDING_DEAL_KEY);
      if (raw && allDeals.length > 0) {
        try {
          const { deal } = JSON.parse(raw) as { deal: Deal; at: number };
          if (allDeals.some((d) => d.id === deal.id)) localStorage.removeItem(PENDING_DEAL_KEY);
        } catch { localStorage.removeItem(PENDING_DEAL_KEY); }
      }
    } finally {
      setLoading(false);
    }
  }, [setDeals]);

  useEffect(() => {
    if (!CONTRACT_ADDRESS) return;
    refresh();

    // Inject pending deal into store immediately, then poll until chain confirms it
    const raw = localStorage.getItem(PENDING_DEAL_KEY);
    if (!raw) return;
    let cancelled = false;
    (async () => {
      try {
        const { deal: pending, at } = JSON.parse(raw) as { deal: Deal; at: number };
        if (Date.now() - at > 5 * 60_000) { localStorage.removeItem(PENDING_DEAL_KEY); return; }
        upsertDeal(pending); // show immediately in dashboard
        for (let i = 0; i < 36 && !cancelled; i++) {
          if (i > 0) await new Promise((r) => setTimeout(r, 5000));
          const confirmed = await getDeal(pending.id);
          if (confirmed) { upsertDeal(confirmed); localStorage.removeItem(PENDING_DEAL_KEY); return; }
        }
      } catch { localStorage.removeItem(PENDING_DEAL_KEY); }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myDeals = useCallback(async (walletAddress: string) => {
    const addr = walletAddress.toLowerCase();
    const [buying, selling] = await Promise.all([
      getDealsForBuyer(addr),
      getDealsForSeller(addr),
    ]);
    return { buying, selling };
  }, []);

  return { deals, stats, loading, refresh, myDeals };
}

// ── Single deal ───────────────────────────────────────────────────────

export function useDeal(dealId: string | null) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isPending, setIsPending] = useState(false); // true = from localStorage, not chain
  const [loading, setLoading] = useState(true);

  const fetchDeal = useCallback(async () => {
    if (!dealId || !CONTRACT_ADDRESS) { setLoading(false); return; }
    setLoading(true);
    try {
      const onChain = await getDeal(dealId);
      if (onChain) {
        setDeal(onChain);
        setIsPending(false);
        localStorage.removeItem(PENDING_DEAL_KEY);
        return;
      }
      // Not on chain yet — show from localStorage while validators process it
      const raw = localStorage.getItem(PENDING_DEAL_KEY);
      if (raw) {
        const { deal: pending, at } = JSON.parse(raw) as { deal: Deal; at: number };
        if (pending.id === dealId && Date.now() - at < 5 * 60_000) {
          setDeal(pending);
          setIsPending(true);
        }
      }
    } catch { /* show nothing on hard error */ }
    finally { setLoading(false); }
  }, [dealId]);

  useEffect(() => { fetchDeal(); }, [fetchDeal]);

  // Poll every 5s while pending until chain confirms
  useEffect(() => {
    if (!isPending || !dealId) return;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 36 && !cancelled; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const onChain = await getDeal(dealId).catch(() => null);
        if (onChain && !cancelled) {
          setDeal(onChain);
          setIsPending(false);
          localStorage.removeItem(PENDING_DEAL_KEY);
          return;
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isPending, dealId]);

  return { deal, isPending, loading, refetch: fetchDeal };
}

// ── Write hooks ───────────────────────────────────────────────────────

export function useCreateDeal() {
  const { executeWrite } = useWallet();
  const { wallet } = useWallet();

  return useCallback(
    async ({ prompt, deadline, amount }: CreateDealParams): Promise<string> => {
      // Read deal count BEFORE creating — gives a reliable predicted ID regardless
      // of how long GenLayer validators take to finalize the transaction.
      let predictedId: string | null = null;
      try {
        const n = await getReadClient().readContract({
          address: CONTRACT_ADDRESS,
          functionName: "get_deal_count",
          args: [],
        }) as number;
        predictedId = `deal_${String(n + 1).padStart(6, "0")}`;
      } catch { /* non-fatal */ }

      // Store full pending deal BEFORE submitting — deal page shows it immediately
      if (predictedId && wallet.address) {
        const pending: Deal = {
          id: predictedId,
          buyer: wallet.address,
          seller: "",
          prompt,
          submission: "",
          submissionDescription: "",
          amount: String(parseFloat(amount)),
          status: "PENDING",
          aiVerdict: null,
          createdAt: Math.floor(Date.now() / 1000),
          deadline,
        };
        localStorage.setItem(PENDING_DEAL_KEY, JSON.stringify({ deal: pending, at: Date.now() }));
      }

      // Convert GEN → wei for on-chain escrow lock.
      // contract: amount_gen: str, gl.message.value must equal int(float(amount_gen) * 10**18)
      const amountFloat = parseFloat(amount);
      const amountWei = BigInt(Math.round(amountFloat * 10 ** 18));
      await executeWrite({
        functionName: "create_deal",
        args: [prompt, deadline, amountFloat],
        value: amountWei,
        label: "Creating protected agreement & locking GEN escrow",
      });

      // Return immediately after tx is submitted — don't wait for validator confirmation
      return predictedId ?? `deal_pending_${Date.now()}`;
    },
    [executeWrite, wallet.address]
  );
}

export function useClaimDeal() {
  const { executeWrite } = useWallet();
  return useCallback(
    async (dealId: string) =>
      executeWrite({ functionName: "claim_deal", args: [dealId], label: "Claiming deal" }),
    [executeWrite]
  );
}

export function useSubmitWork() {
  const { executeWrite } = useWallet();
  return useCallback(
    async ({ dealId, submissionUrl, description }: SubmitWorkParams) =>
      executeWrite({ functionName: "submit_work", args: [dealId, submissionUrl, description], label: "Submitting work" }),
    [executeWrite]
  );
}

export function useApproveWork() {
  const { executeWrite } = useWallet();
  return useCallback(
    async (dealId: string) =>
      executeWrite({ functionName: "approve_work", args: [dealId], label: "Approving work & releasing payment" }),
    [executeWrite]
  );
}

export function useRequestAIReview() {
  const { executeWrite } = useWallet();
  return useCallback(
    async (dealId: string) =>
      executeWrite({ functionName: "request_ai_review", args: [dealId], label: "Requesting AI review — validators evaluating (1–3 min)" }),
    [executeWrite]
  );
}

export function useReleaseAfterAI() {
  const { executeWrite } = useWallet();
  return useCallback(
    async (dealId: string) =>
      executeWrite({ functionName: "release_after_ai", args: [dealId], label: "Accepting AI recommendation" }),
    [executeWrite]
  );
}

export function useOverrideAI() {
  const { executeWrite } = useWallet();
  return useCallback(
    async (dealId: string, release: boolean) =>
      executeWrite({ functionName: "override_ai", args: [dealId, release], label: release ? "Releasing payment (overriding AI)" : "Requesting refund (overriding AI)" }),
    [executeWrite]
  );
}

export function useCancelDeal() {
  const { executeWrite } = useWallet();
  return useCallback(
    async (dealId: string) =>
      executeWrite({ functionName: "cancel_deal", args: [dealId], label: "Cancelling deal & refunding escrow" }),
    [executeWrite]
  );
}
