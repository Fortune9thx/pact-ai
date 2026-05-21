"use client";

import { useCallback, useEffect, useState } from "react";
import { getDeal, getAllDeals, getDealsForBuyer, getDealsForSeller, getStats } from "@/lib/contract";
import { useStore } from "@/store/useStore";
import { useWallet } from "./useWallet";
import { CONTRACT_ADDRESS } from "@/lib/genlayer";
import type { Deal, DashboardStats, CreateDealParams, SubmitWorkParams } from "@/lib/types";

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

  const myDeals = useCallback(async () => {
    if (!wallet.address) return { buying: [], selling: [] };
    const [buying, selling] = await Promise.all([
      getDealsForBuyer(wallet.address),
      getDealsForSeller(wallet.address),
    ]);
    return { buying, selling };
  }, [wallet.address]);

  useEffect(() => {
    if (CONTRACT_ADDRESS) {
      refresh();
    }
  }, [refresh]);

  return { deals, stats, loading, refresh, myDeals };
}

export function useDeal(dealId: string | null) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDeal = useCallback(async () => {
    if (!dealId || !CONTRACT_ADDRESS) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await getDeal(dealId);
      setDeal(result);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchDeal();
  }, [fetchDeal]);

  return { deal, loading, refetch: fetchDeal };
}

export function useCreateDeal() {
  const { executeWrite } = useWallet();
  const { refresh } = useDeals();

  return useCallback(
    async ({ seller, prompt, deadline, amount }: CreateDealParams) => {
      const amountGEN = Math.floor(parseFloat(amount));
      const hash = await executeWrite({
        functionName: "create_deal",
        args: [seller, prompt, deadline, amountGEN],
        label: "Creating deal and funding escrow",
      });
      await refresh();
      return hash;
    },
    [executeWrite, refresh]
  );
}

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

export function useDisputeDeal() {
  const { executeWrite } = useWallet();

  return useCallback(
    async (dealId: string) => {
      await executeWrite({
        functionName: "dispute_deal",
        args: [dealId],
        label: "Opening dispute",
      });
      return executeWrite({
        functionName: "run_ai_verdict",
        args: [dealId],
        label: "Requesting AI verdict",
      });
    },
    [executeWrite]
  );
}

export function useRequestVerdict() {
  const { executeWrite } = useWallet();

  return useCallback(
    async (dealId: string) => {
      return executeWrite({
        functionName: "run_ai_verdict",
        args: [dealId],
        label: "Requesting AI verdict",
      });
    },
    [executeWrite]
  );
}
