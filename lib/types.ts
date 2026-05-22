export type DealStatus =
  | "PENDING"        // buyer created — awaiting seller claim via invite link
  | "FUNDED"         // seller claimed — escrow active
  | "SUBMITTED"      // seller submitted work
  | "AI_REVIEWED"    // AI gave recommendation — buyer decides
  | "RESOLVED_PASS"  // buyer approved / accepted AI PASS — funds released
  | "RESOLVED_FAIL"  // buyer rejected / accepted AI FAIL — funds refunded
  | "CANCELLED";

export type VerdictResult = "PASS" | "FAIL" | "PENDING";

export interface AIVerdict {
  result: "PASS" | "FAIL";
  confidence: number; // 0–100
  reasoning: string;
  // camelCase (frontend)
  styleMatch?: number;
  promptAlignment?: number;
  qualityMatch?: number;
  // snake_case (from contract)
  style_match?: number;
  prompt_alignment?: number;
  quality_match?: number;
  evaluatedAt?: number;
  evaluated_at?: number;
}

export interface Deal {
  id: string;
  buyer: string;
  seller: string;       // empty string "" until claimed
  prompt: string;
  submission: string;
  submissionDescription: string;
  amount: string;       // in GEN (as string to avoid bigint issues)
  status: DealStatus;
  aiVerdict: AIVerdict | null;
  createdAt: number;
  deadline: number;
}

// ── Params ─────────────────────────────────────────────────────────

export interface CreateDealParams {
  prompt: string;
  deadline: number; // days
  amount: string;
  // NOTE: seller is NOT required upfront — share the invite link instead
}

export interface ClaimDealParams {
  dealId: string;
}

export interface SubmitWorkParams {
  dealId: string;
  submissionUrl: string;
  description: string;
}

export interface ApproveWorkParams {
  dealId: string;
}

export interface RequestAIReviewParams {
  dealId: string;
}

export interface ReleaseAfterAIParams {
  dealId: string;
}

export interface OverrideAIParams {
  dealId: string;
  release: boolean;
}

// ── Dashboard ──────────────────────────────────────────────────────

export interface DashboardStats {
  activeDeals: number;
  pendingReviews: number;
  escrowVolume: string;
  aiResolutionRate: number;
}

// ── Wallet / tx ────────────────────────────────────────────────────

export type TransactionStep =
  | "idle"
  | "signing"
  | "broadcasting"
  | "confirming"
  | "confirmed"
  | "failed";

export interface Transaction {
  hash: string;
  step: TransactionStep;
  label: string;
  error?: string;
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  balance: string;
  chainName: string;
}
