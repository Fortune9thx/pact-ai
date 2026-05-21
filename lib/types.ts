export type DealStatus =
  | "CREATED"
  | "FUNDED"
  | "SUBMITTED"
  | "DISPUTED"
  | "RESOLVED_PASS"
  | "RESOLVED_FAIL"
  | "CANCELLED";

export type VerdictResult = "PASS" | "FAIL" | "PENDING";

export interface AIVerdict {
  result: "PASS" | "FAIL";
  confidence: number; // 0–100
  reasoning: string;
  styleMatch?: number;
  promptAlignment?: number;
  qualityMatch?: number;
  // snake_case variants from contract
  style_match?: number;
  prompt_alignment?: number;
  quality_match?: number;
  evaluatedAt?: number;
  evaluated_at?: number;
}

export interface Deal {
  id: string;
  buyer: string;
  seller: string;
  prompt: string;
  submission: string;
  submissionDescription: string;
  amount: string; // in GEN (as string to avoid bigint issues)
  status: DealStatus;
  aiVerdict: AIVerdict | null;
  createdAt: number;
  deadline: number;
}

export interface CreateDealParams {
  seller: string;
  prompt: string;
  deadline: number; // days
  amount: string;
}

export interface SubmitWorkParams {
  dealId: string;
  submissionUrl: string;
  description: string;
}

export interface DashboardStats {
  activeDeals: number;
  pendingReviews: number;
  escrowVolume: string;
  aiResolutionRate: number;
}

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
