// Eristic deployed contract addresses on Bradbury.
// Populated by scripts/deploy.py — copy values into .env.local as
// NEXT_PUBLIC_REGISTRY / NEXT_PUBLIC_STAKE_MANAGER / NEXT_PUBLIC_ADJUDICATION.

export const ADDRS = {
  registry: process.env.NEXT_PUBLIC_REGISTRY ?? "",
  stakeManager: process.env.NEXT_PUBLIC_STAKE_MANAGER ?? "",
  adjudication: process.env.NEXT_PUBLIC_ADJUDICATION ?? "",
};

export type ClaimState =
  | "OPEN" | "UNDER_CHALLENGE" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";

export type Verdict = "" | "SUPPORTED" | "NOT_SUPPORTED" | "PARTIAL" | "INSUFFICIENT";

export interface Claim {
  id: number;
  author: string;
  statement: string;
  state: ClaimState;
  arguments_for: string;
  arguments_against: string;
  evidence_for: string;
  evidence_against: string;
  verdict: Verdict;
  confidence: number;       // basis points
  evidence_weight: number;  // basis points
  reasoning: string;
  tips: number;             // cumulative GEN tipped to this claim (wei)
  created_at: number;       // unix timestamp
}

export interface Pool {
  claim_id: number;
  locked: boolean;
  settled: boolean;
  winning_side: "" | "FOR" | "AGAINST" | "NONE";
  total_for: number;
  total_against: number;
  positions: number;
}
