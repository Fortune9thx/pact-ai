/**
 * demo-store.ts
 * LocalStorage-backed contract simulation for demo/hackathon mode.
 * Provides full CRUD for deals without a live GenLayer node.
 */

import type { Deal, DealStatus, AIVerdict, DashboardStats } from "./types";

export const DEMO_BUYER   = "0xbbe0bf384d3ec8e5966a892cdd033e67eb556aa2"; // deployer key
export const DEMO_SELLER  = "0x1234567890abcdef1234567890abcdef12345678"; // second persona
const LS_KEY = "pact_demo_deals_v4";

const NOW = Math.floor(Date.now() / 1000);

const SEED_DEALS: Deal[] = [
  {
    id: "deal_000001",
    buyer: DEMO_BUYER,
    seller: "",
    prompt:
      "Design a logo for 'Lumina Studio' — a photography brand. Clean, minimal, uses soft light/lens metaphors. Deliverable: SVG + 3 colour variants.",
    submission: "",
    submissionDescription: "",
    amount: "120",
    status: "PENDING",
    aiVerdict: null,
    createdAt: NOW - 1800,
    deadline: 14,
  },
  {
    id: "deal_000002",
    buyer: DEMO_BUYER,
    seller: DEMO_SELLER,
    prompt:
      "Create a 30-second animated intro for a YouTube channel 'TechTalk Daily'. Aesthetic: dark background, cyan/purple gradients, kinetic typography. Export as MP4 1080p.",
    submission: "",
    submissionDescription: "",
    amount: "250",
    status: "FUNDED",
    aiVerdict: null,
    createdAt: NOW - 86400,
    deadline: 10,
  },
  {
    id: "deal_000003",
    buyer: DEMO_BUYER,
    seller: DEMO_SELLER,
    prompt:
      "Write copy for a SaaS landing page — 'Fieldly', a field-service management app targeting SMB plumbers and electricians. Hero headline + 3 feature blurbs + CTA. Tone: direct, no jargon.",
    submission: "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OhQ8R9oyE",
    submissionDescription:
      "Delivered full landing-page copy including hero headline ('Fix it. Bill it. Done.'), 3 feature blocks with subheads, and primary + secondary CTAs. Word count ~280.",
    amount: "180",
    status: "SUBMITTED",
    aiVerdict: null,
    createdAt: NOW - 172800,
    deadline: 7,
  },
  {
    id: "deal_000004",
    buyer: DEMO_BUYER,
    seller: DEMO_SELLER,
    prompt:
      "Produce 10 social-media graphics for @FitnessByMaya Instagram. Brand colours: coral #FF6B6B + cream #FFF5E1. Content: motivational quotes. Sizes: 1:1 and 9:16. Deliverable: Canva export + PNG zip.",
    submission: "https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j",
    submissionDescription:
      "Delivered 10 square + 10 story-size graphics. All use approved coral/cream palette. Canva link included for future editing, plus high-res PNG zip.",
    amount: "95",
    status: "AI_REVIEWED",
    aiVerdict: {
      result: "PASS",
      confidence: 87,
      reasoning:
        "The submitted graphics closely follow the stated creative brief. Brand colours are correctly applied throughout. Both 1:1 and 9:16 formats are present. Quote content is on-brand and motivational. Minor suggestion: two quotes have slightly small font sizes on mobile, but this does not materially affect the brief requirements.",
      styleMatch: 91,
      promptAlignment: 88,
      qualityMatch: 82,
      evaluatedAt: NOW - 600,
    },
    createdAt: NOW - 259200,
    deadline: 5,
  },
  {
    id: "deal_000005",
    buyer: DEMO_SELLER,   // reversed — so current user is the SELLER on this one
    seller: DEMO_BUYER,
    prompt:
      "Illustrate 6 isometric icons for a project-management dashboard: Tasks, Calendar, Chat, Reports, Team, Settings. Style: flat colour, 256×256px SVG.",
    submission: "https://figma.com/file/abc123/isometric-icons",
    submissionDescription:
      "All 6 icons delivered as individual SVG files. Isometric perspective, consistent grid, flat colours per brand guide.",
    amount: "75",
    status: "RESOLVED_PASS",
    aiVerdict: null,
    createdAt: NOW - 432000,
    deadline: 5,
  },
];

// ── storage helpers ───────────────────────────────────────────────────

function load(): Deal[] {
  if (typeof window === "undefined") return SEED_DEALS;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return SEED_DEALS;
    const parsed: Deal[] = JSON.parse(raw);
    // If someone cleared storage or corrupted it, fall back to seed
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_DEALS;
    return parsed;
  } catch {
    return SEED_DEALS;
  }
}

function save(deals: Deal[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(deals));
}

function getAll(): Deal[] {
  return load();
}

function get(dealId: string): Deal | null {
  return load().find((d) => d.id === dealId) ?? null;
}

function upsert(updated: Deal) {
  const deals = load();
  const idx = deals.findIndex((d) => d.id === updated.id);
  if (idx >= 0) deals[idx] = updated;
  else deals.push(updated);
  save(deals);
}

// ── counter ────────────────────────────────────────────────────────────

function nextCount(): number {
  const deals = load();
  if (deals.length === 0) return 1;
  const max = Math.max(...deals.map((d) => parseInt(d.id.replace("deal_", ""), 10) || 0));
  return max + 1;
}

// ── simulated delay ────────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

// ── AI verdict generator ───────────────────────────────────────────────

function generateAIVerdict(deal: Deal): AIVerdict {
  // Deterministic based on deal id so same deal always gets same verdict
  const seed = deal.id.charCodeAt(deal.id.length - 1);
  const base = 60 + (seed % 30); // 60–89
  const styleMatch      = Math.min(100, base + ((seed * 3) % 15));
  const promptAlignment = Math.min(100, base + ((seed * 7) % 12));
  const qualityMatch    = Math.min(100, base + ((seed * 5) % 18));
  const avg = Math.round((styleMatch + promptAlignment + qualityMatch) / 3);
  const result: "PASS" | "FAIL" = avg >= 65 ? "PASS" : "FAIL";
  const confidence = Math.min(98, avg + 5);

  const passReasons = [
    `The submission addresses all major requirements in the brief. Style alignment is strong (${styleMatch}/100), prompt coverage is solid (${promptAlignment}/100), and overall quality meets expectations (${qualityMatch}/100). Recommended confidence: ${confidence}%.`,
    `Creative work meets the stated brief. Visual style and content are well-matched. Minor areas for improvement noted but none block approval. Confidence: ${confidence}%.`,
  ];
  const failReasons = [
    `The submission does not fully satisfy the brief. Prompt alignment score (${promptAlignment}/100) falls below the threshold. Key deliverables appear missing or incomplete. Confidence in rejection: ${confidence}%.`,
    `Quality and style benchmarks were not met (avg ${avg}/100 vs required 65). Suggest requesting revision before payment release.`,
  ];

  return {
    result,
    confidence,
    reasoning: result === "PASS" ? passReasons[seed % 2] : failReasons[seed % 2],
    styleMatch,
    promptAlignment,
    qualityMatch,
    evaluatedAt: Math.floor(Date.now() / 1000),
  };
}

// ── Public API (mirrors lib/contract.ts + write operations) ────────────

export const demoStore = {
  /** Seed fresh data (call once on first load) */
  seed() {
    if (typeof window !== "undefined" && !window.localStorage.getItem(LS_KEY)) {
      save(SEED_DEALS);
    }
  },

  reset() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LS_KEY);
    }
  },

  // ── reads ────────────────────────────────────────────────────────

  async getDeal(dealId: string): Promise<Deal | null> {
    await delay(80);
    return get(dealId);
  },

  async getAllDeals(): Promise<Deal[]> {
    await delay(80);
    return getAll();
  },

  async getPendingDeals(): Promise<Deal[]> {
    await delay(80);
    return getAll().filter((d) => d.status === "PENDING");
  },

  async getDealsForBuyer(buyer: string): Promise<Deal[]> {
    await delay(80);
    return getAll().filter((d) => d.buyer.toLowerCase() === buyer.toLowerCase());
  },

  async getDealsForSeller(seller: string): Promise<Deal[]> {
    await delay(80);
    return getAll().filter((d) => d.seller.toLowerCase() === seller.toLowerCase());
  },

  async getStats(): Promise<DashboardStats> {
    await delay(80);
    const all = getAll();
    const active = all.filter((d) => ["FUNDED", "SUBMITTED", "AI_REVIEWED"].includes(d.status)).length;
    const pending = all.filter((d) => d.status === "AI_REVIEWED").length;
    const resolved = all.filter((d) => ["RESOLVED_PASS", "RESOLVED_FAIL"].includes(d.status)).length;
    const total = all.length;
    return {
      activeDeals: active,
      pendingReviews: pending,
      escrowVolume: String(all.reduce((s, d) => s + parseFloat(d.amount || "0"), 0)),
      totalDeals: total,
      aiResolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    };
  },

  async getDealCount(): Promise<number> {
    await delay(50);
    return getAll().length;
  },

  // ── writes ────────────────────────────────────────────────────────

  async createDeal(
    buyer: string,
    prompt: string,
    deadlineDays: number,
    amountGen: number
  ): Promise<string> {
    await delay(800); // simulate tx confirmation
    const count = nextCount();
    const dealId = `deal_${String(count).padStart(6, "0")}`;
    const deal: Deal = {
      id: dealId,
      buyer,
      seller: "",
      prompt: prompt.trim(),
      submission: "",
      submissionDescription: "",
      amount: String(amountGen),
      status: "PENDING",
      aiVerdict: null,
      createdAt: Math.floor(Date.now() / 1000),
      deadline: deadlineDays,
    };
    upsert(deal);
    return dealId;
  },

  async claimDeal(dealId: string, seller: string): Promise<void> {
    await delay(800);
    const deal = get(dealId);
    if (!deal) throw new Error("Deal not found");
    if (deal.status !== "PENDING") throw new Error("Deal is no longer open for claiming");
    if (deal.seller !== "") throw new Error("Deal already claimed");
    if (deal.buyer.toLowerCase() === seller.toLowerCase()) throw new Error("Buyer cannot claim their own deal");
    upsert({ ...deal, seller, status: "FUNDED" });
  },

  async submitWork(dealId: string, seller: string, submissionUrl: string, description: string): Promise<void> {
    await delay(800);
    const deal = get(dealId);
    if (!deal) throw new Error("Deal not found");
    if (deal.status !== "FUNDED") throw new Error("Deal must be active");
    if (deal.seller.toLowerCase() !== seller.toLowerCase()) throw new Error("Only seller can submit");
    upsert({ ...deal, submission: submissionUrl, submissionDescription: description, status: "SUBMITTED" });
  },

  async approveWork(dealId: string, buyer: string): Promise<void> {
    await delay(800);
    const deal = get(dealId);
    if (!deal) throw new Error("Deal not found");
    if (deal.status !== "SUBMITTED") throw new Error("Work must be submitted first");
    if (deal.buyer.toLowerCase() !== buyer.toLowerCase()) throw new Error("Only buyer can approve");
    upsert({ ...deal, status: "RESOLVED_PASS" });
  },

  async requestAIReview(dealId: string, buyer: string): Promise<void> {
    await delay(3500); // longer to simulate AI evaluation
    const deal = get(dealId);
    if (!deal) throw new Error("Deal not found");
    if (deal.status !== "SUBMITTED") throw new Error("Work must be submitted first");
    if (deal.buyer.toLowerCase() !== buyer.toLowerCase()) throw new Error("Only buyer can request AI review");
    const verdict = generateAIVerdict(deal);
    upsert({ ...deal, aiVerdict: verdict, status: "AI_REVIEWED" });
  },

  async releaseAfterAI(dealId: string, buyer: string): Promise<void> {
    await delay(800);
    const deal = get(dealId);
    if (!deal) throw new Error("Deal not found");
    if (deal.status !== "AI_REVIEWED") throw new Error("AI review must be complete");
    if (deal.buyer.toLowerCase() !== buyer.toLowerCase()) throw new Error("Only buyer can act");
    if (!deal.aiVerdict) throw new Error("No AI verdict");
    const status: DealStatus = deal.aiVerdict.result === "PASS" ? "RESOLVED_PASS" : "RESOLVED_FAIL";
    upsert({ ...deal, status });
  },

  async overrideAI(dealId: string, buyer: string, release: boolean): Promise<void> {
    await delay(800);
    const deal = get(dealId);
    if (!deal) throw new Error("Deal not found");
    if (deal.status !== "AI_REVIEWED") throw new Error("AI review must be complete");
    if (deal.buyer.toLowerCase() !== buyer.toLowerCase()) throw new Error("Only buyer can override");
    upsert({ ...deal, status: release ? "RESOLVED_PASS" : "RESOLVED_FAIL" });
  },

  async cancelDeal(dealId: string, buyer: string): Promise<void> {
    await delay(800);
    const deal = get(dealId);
    if (!deal) throw new Error("Deal not found");
    if (!["PENDING", "FUNDED"].includes(deal.status)) throw new Error("Cannot cancel at this stage");
    if (deal.buyer.toLowerCase() !== buyer.toLowerCase()) throw new Error("Only buyer can cancel");
    upsert({ ...deal, status: "CANCELLED" });
  },
};
