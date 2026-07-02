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

// The contract intentionally exposes only get_all_deals() on-chain (GenVM caps the
// deployable public-method count). Buyer/seller/pending filters are pure derivations
// over the full deal list, so we compute them client-side.

export async function getPendingDeals(): Promise<Deal[]> {
  const all = await getAllDeals();
  return all.filter((d) => d.status === "PENDING");
}

export async function getDealsForBuyer(address: string): Promise<Deal[]> {
  const target = address.toLowerCase();
  const all = await getAllDeals();
  return all.filter((d) => (d.buyer ?? "").toLowerCase() === target);
}

export async function getDealsForSeller(address: string): Promise<Deal[]> {
  const target = address.toLowerCase();
  const all = await getAllDeals();
  return all.filter((d) => (d.seller ?? "").toLowerCase() === target);
}

export async function getStats(): Promise<DashboardStats> {
  try {
    const result = await getReadClient().readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_stats",
      args: [],
    }) as Record<string, unknown>;
    const all = await getAllDeals();
    const escrowVolume = all
      .filter((d) => ["PENDING", "FUNDED", "SUBMITTED", "AI_REVIEWED"].includes(d.status))
      .reduce((sum, d) => sum + parseFloat(d.amount ?? "0"), 0)
      .toFixed(2);
    return {
      totalDeals:       Number(result.total_deals ?? 0),
      activeDeals:      Number(result.active_deals ?? 0),
      pendingReviews:   Number(result.pending_reviews ?? 0),
      aiResolutionRate: Number(result.ai_resolution_rate ?? 0),
      escrowVolume,
    };
  } catch {
    return { activeDeals: 0, pendingReviews: 0, escrowVolume: "0", totalDeals: 0, aiResolutionRate: 0 };
  }
}
