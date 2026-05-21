import { getReadClient, CONTRACT_ADDRESS } from "./genlayer";
import type { Deal, DashboardStats } from "./types";

// ── Field normalization (contract returns snake_case) ─────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDeal(raw: any): Deal {
  return {
    ...raw,
    submissionDescription: raw.submission_description ?? raw.submissionDescription ?? "",
    deadline: raw.deadline_days ?? raw.deadline ?? 0,
    aiVerdict: raw.ai_verdict ?? raw.aiVerdict ?? null,
  } as Deal;
}

// ── Read contract state ───────────────────────────────────────────

export async function getDeal(dealId: string): Promise<Deal | null> {
  try {
    const client = getReadClient();
    const result = await client.readContract({
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
    const client = getReadClient();
    const result = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_all_deals",
      args: [],
    });
    return ((result as unknown as unknown[]) ?? []).map(normalizeDeal);
  } catch {
    return [];
  }
}

export async function getDealsForBuyer(address: string): Promise<Deal[]> {
  try {
    const client = getReadClient();
    const result = await client.readContract({
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
    const client = getReadClient();
    const result = await client.readContract({
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
  try {
    const client = getReadClient();
    const result = (await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_stats",
      args: [],
    })) as {
      active_deals: number;
      pending_reviews: number;
      total_deals: number;
      ai_resolution_rate: number;
    };

    return {
      activeDeals: result.active_deals ?? 0,
      pendingReviews: result.pending_reviews ?? 0,
      escrowVolume: String(result.total_deals ?? 0),
      aiResolutionRate: result.ai_resolution_rate ?? 0,
    };
  } catch {
    return { activeDeals: 0, pendingReviews: 0, escrowVolume: "0", aiResolutionRate: 0 };
  }
}
