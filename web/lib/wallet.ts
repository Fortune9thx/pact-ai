// Wallet client — runs in the browser only. GenLayer ships its own MetaMask
// Snap; `client.connect()` triggers the snap install / account selection and
// returns once the client is signing-ready.

"use client";

import { createClient } from "genlayer-js";
import { localnet, studionet, testnetBradbury } from "genlayer-js/chains";
import { ADDRS } from "./contracts";
import { trackTx } from "./txQueue";

const target = process.env.NEXT_PUBLIC_CHAIN ?? "studionet";
const chain =
  target === "localnet" ? localnet :
  target === "bradbury" ? testnetBradbury :
  studionet;

let cached: ReturnType<typeof createClient> | null = null;

export async function getWalletClient() {
  if (cached) return cached;
  const c = createClient({ chain });
  // Connect via MetaMask Snap. Throws if user rejects or MetaMask is absent.
  await c.connect();
  if (typeof (c as any).initializeConsensusSmartContract === "function") {
    await (c as any).initializeConsensusSmartContract();
  }
  cached = c;
  return c;
}

export async function getConnectedAddress(): Promise<string | null> {
  if (!cached) return null;
  // genlayer-js attaches the active account once connected.
  const acct = (cached as any).account;
  return acct?.address ?? null;
}

// --- write helpers ------------------------------------------------------

export async function createClaim(statement: string, argument: string, evidence: string) {
  const c = await getWalletClient();
  const preview = statement.slice(0, 40) + (statement.length > 40 ? "…" : "");
  return trackTx("create_claim", `file claim · "${preview}"`, () =>
    c.writeContract({
      address: ADDRS.registry as `0x${string}`,
      functionName: "create_claim",
      args: [statement, argument, evidence],
      value: 0n,
    }) as Promise<`0x${string}`>,
  );
}

export async function stake(claimId: number, side: "FOR" | "AGAINST", amountWei: bigint) {
  const c = await getWalletClient();
  return trackTx(
    side === "FOR" ? "stake_for" : "stake_against",
    `stake ${side} · #${claimId} · ${(Number(amountWei) / 1e18).toFixed(2)} GEN`,
    () => c.writeContract({
      address: ADDRS.stakeManager as `0x${string}`,
      functionName: side === "FOR" ? "stake_for_claim" : "stake_against_claim",
      args: [claimId],
      value: amountWei,
    }) as Promise<`0x${string}`>,
  );
}

export async function challenge(claimId: number, counterArg: string, counterEvidence: string) {
  const c = await getWalletClient();
  return trackTx("challenge", `challenge · #${claimId}`, () =>
    c.writeContract({
      address: ADDRS.registry as `0x${string}`,
      functionName: "challenge",
      args: [claimId, counterArg, counterEvidence],
      value: 0n,
    }) as Promise<`0x${string}`>,
  );
}

export async function addEvidence(claimId: number, side: "FOR" | "AGAINST", evidence: string, argument: string) {
  const c = await getWalletClient();
  return trackTx("other", `add evidence ${side} · #${claimId}`, () =>
    c.writeContract({
      address: ADDRS.registry as `0x${string}`,
      functionName: "add_evidence",
      args: [claimId, side, evidence, argument],
      value: 0n,
    }) as Promise<`0x${string}`>,
  );
}

export async function submitForReview(claimId: number) {
  const c = await getWalletClient();
  return trackTx("submit_for_review", `submit for review · #${claimId}`, () =>
    c.writeContract({
      address: ADDRS.registry as `0x${string}`,
      functionName: "submit_for_review",
      args: [claimId],
      value: 0n,
    }) as Promise<`0x${string}`>,
  );
}

export async function adjudicate(claimId: number) {
  const c = await getWalletClient();
  return trackTx("adjudicate", `adjudicate · #${claimId}`, () =>
    c.writeContract({
      address: ADDRS.adjudication as `0x${string}`,
      functionName: "adjudicate",
      args: [claimId],
      value: 0n,
    }) as Promise<`0x${string}`>,
  );
}

export async function tipClaim(claimId: number, amountWei: bigint) {
  // Payable demo write — anyone can throw GEN onto a claim they like.
  // Bookkeeping only; the tip sits with the registry.
  const c = await getWalletClient();
  return trackTx(
    "other",
    `tip · #${claimId} · ${(Number(amountWei) / 1e18).toFixed(2)} GEN`,
    () => c.writeContract({
      address: ADDRS.registry as `0x${string}`,
      functionName: "tip_claim",
      args: [claimId],
      value: amountWei,
    }) as Promise<`0x${string}`>,
  );
}

export function parseGen(input: string): bigint {
  // 18-decimal native unit. Accepts "0.25", "10", etc.
  if (!input.trim()) return 0n;
  const [whole, frac = ""] = input.trim().split(".");
  const padded = (frac + "000000000000000000").slice(0, 18);
  return BigInt(whole || "0") * 10n ** 18n + BigInt(padded || "0");
}
