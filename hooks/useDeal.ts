"use client";

import { useCallback, useEffect, useState } from "react";
import { getDeal, getAllDeals, getDealsForBuyer, getDealsForSeller, getStats } from "@/lib/contract";
import { useStore } from "@/store/useStore";
import { useWallet } from "./useWallet";
import { CONTRACT_ADDRESS } from "@/lib/genlayer";
import type { Deal, DashboardStats, CreateDealParams, SubmitWorkParams } from "@/lib/types";

// ── Fetch all deals (used by dashboard store) ─────────────────────

export function useDeals() {
  const { deals, setDeals } = useStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { wallet } = useWallet();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [allDeals, dashStats] = await Promise.all([getAllDeals(), getStats()]);
      setDeals(allDeals);
      setStats(dashStats);
    } finally {
      setLoading(false);
    }
  }, [setDeals]);

  /** Returns deals split by buyer / seller role for current wallet. */
  const myDeals = useCallback(async () => {
    if (!wallet.address) return { buying: [] as Deal[], selling: [] as Deal[] };
    const [buying, selling] = await Promise.all([
      getDealsForBuyer(wallet.address),
      getDealsForSeller(wallet.address),
    ]);
    return { buying, selling };
  }, [wallet.address]);

  useEffect(() => {
    if (CONTRACT_ADDRESS) refresh();
  }, [refresh]);

  return { deals, stats, loading, refresh, myDeals };
}

// ── Single deal ───────────────────────────────────────────────────

export function useDeal(dealId: string | null) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDeal = useCallback(async () => {
    if (!dealId || !CONTRACT_ADDRESS) { setLoading(false); return; }
    setLoading(true);
    try {
      const result = await getDeal(dealId);
      setDeal(result);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => { fetchDeal(); }, [fetchDeal]);

  return { deal, loading, refetch: fetchDeal };
}

// ── Write hooks ───────────────────────────────────────────────────

/**
 * Create a deal without specifying a seller.
 * Returns the generated deal_id (derived from deal_count, not the tx hash).
 */
export function useCreateDeal() {
  const { executeWrite } = useWallet();
  const { refresh } = useDeals();

  return useCallback(
    async ({ prompt, deadline, amount }: CreateDealParams): Promise<string> => {
      const amountGEN = Math.floor(parseFloat(amount));
      await executeWrite({
        functionName: "create_deal",
        args: [prompt, deadline, amountGEN],
        label: "Creating protected agreement",
      });
      await refresh();
      // Re-fetch deal count to derive the new deal_id
      const { getReadClient } = await import("@/lib/genlayer");
      const count = await getReadClient().readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_deal_count",
        args: [],
      }) as number;
      return `deal_${String(count).padStart(6, "0")}`;
    },
    [executeWrite, refresh]
  );
}

/** Seller claims an open deal via invite link. */
export function useClaimDeal() {
  const { executeWrite } = useWallet();

  return useCallback(
    async (dealId: string) => {
      return executeWrite({
        functionName: "claim_deal",
        args: [dealId],
        label: "Claiming deal",
      });
    },
    [executeWrite]
  );
}

/** Seller submits completed work. */
export function useSubmitWork() {
  const { executeWrite } = useWallet();

  return useCallback(
    async ({ dealId, submissionUrl, description }: SubmitWorkParams) => {
      return executeWrite({
        functionName: "submit_work",
        args: [dealId, submissionUrl, description],
        label: "Submitting work",
      });
    },
    [executeWrite]
  );
}

/** Buyer directly approves submitted work (no dispute). */
export function useApproveWork() {
  const { executeWrite } = useWallet();

  return useCallback(
    async (dealId: string) => {
      return executeWrite({
        functionName: "approve_work",
        args: [dealId],
        label: "Approving work & releasing payment",
      });
    },
    [executeWrite]
  );
}

/**
 * Buyer requests AI review of submitted work.
 * AI provides verdict + reasoning + confidence score.
 * Buyer retains final decision.
 */
export function useRequestAIReview() {
  const { executeWrite } = useWallet();

  return useCallback(
    async (dealId: string) => {
      return executeWrite({
        functionName: "request_ai_review",
        args: [dealId],
        label: "Requesting AI review — this may take 1–2 minutes",
      });
    },
    [executeWrite]
  );
}

/** Buyer accepts AI recommendation — funds move per AI verdict. */
export function useReleaseAfterAI() {
  const { executeWrite } = useWallet();

  return useCallback(
    async (dealId: string) => {
      return executeWrite({
        functionName: "release_after_ai",
        args: [dealId],
        label: "Accepting AI recommendation",
      });
    },
    [executeWrite]
  );
}

/** Buyer overrides AI recommendation with their own decision. */
export function useOverrideAI() {
  const { executeWrite } = useWallet();

  return useCallback(
    async (dealId: string, release: boolean) => {
      return executeWrite({
        functionName: "override_ai",
        args: [dealId, release],
        label: release ? "Releasing payment" : "Requesting refund",
      });
    },
    [executeWrite]
  );
}

/** Buyer cancels a deal (PENDING or FUNDED). */
export function useCancelDeal() {
  const { executeWrite } = useWallet();

  return useCallback(
    async (dealId: string) => {
      return executeWrite({
        functionName: "cancel_deal",
        args: [dealId],
        label: "Cancelling deal",
      });
    },
    [executeWrite]
  );
}
