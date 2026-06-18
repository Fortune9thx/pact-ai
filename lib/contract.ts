import { getReadClient, CONTRACT_ADDRESS } from "./genlayer";
import type { Deal, DashboardStats } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDeal(raw: any): Deal {
  return {
    ...raw,
    seller:                raw.seller ?? "",
    submissionDescription: raw.submission_description ?? raw.submissionDescription ?? "",
    deadline:              raw.deadline_days ?? raw.deadline ?? 0,
    amount:                raw.amount ?? "0",
    aiVerdict:             raw.ai_verdict ?? raw.aiVerdict ?? null,
  } as Deal;
}

export async function getDeal(dealId: string): Promise<Deal | null> {
  try {
    const result = await getReadClient().readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_deal",
      args: [dealId],
    });
    return normalizeDeal(result);
  } catch {
    return null;
  }
}

export async function getAllDeals(): Promise<Deal[]> {
  try {
    const result = await getReadClient().readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_all_deals",
      args: [],
    });
    return ((result as unknown as unknown[]) ?? []).map(normalizeDeal);
  } catch {
    return [];
  }
}

export async function getPendingDeals(): Promise<Deal[]> {
  try {
    const result = await getReadClient().readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_pending_deals",
      args: [],
    });
    return ((result as unknown as unknown[]) ?? []).map(normalizeDeal);
  } catch {
    return [];
  }
}

export async function getDealsForBuyer(address: string): Promise<Deal[]> {
  try {
    const result = await getReadClient().readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_deals_for_buyer",
      args: [address],
    });
    return ((result as unknown as unknown[]) ?? []).map(normalizeDeal);
  } catch {
    return [];
  }
}

export async function getDealsForSeller(address: string): Promise<Deal[]> {
  try {
    const result = await getReadClient().readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_deals_for_seller",
      args: [address],
    });
    return ((result as unknown as unknown[]) ?? []).map(normalizeDeal);
  } catch {
    return [];
  }
}

export async function getStats(): Promise<DashboardStats> {
  // get_stats does not exist on-chain; computed client-side from deals array
  return { activeDeals: 0, pendingReviews: 0, escrowVolume: "0", totalDeals: 0, aiResolutionRate: 0 };
}
