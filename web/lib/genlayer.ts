// Thin wrapper around genlayer-js so pages don't import the SDK directly.
// Reads use a public client; writes need a wallet-connected client which the
// caller wires up via connectWallet().

import { unstable_cache } from "next/cache";
import { createClient } from "genlayer-js";
import { localnet, studionet, testnetBradbury } from "genlayer-js/chains";
import { ADDRS, type Claim, type Pool } from "./contracts";

// Same selector used by deploy.ts. studionet is the default dev target.
const target = process.env.NEXT_PUBLIC_CHAIN ?? "studionet";
const chain =
  target === "localnet" ? localnet :
  target === "bradbury" ? testnetBradbury :
  studionet;

export const publicClient = createClient({ chain });

type Addr = `0x${string}`;

export async function readClaim(id: number): Promise<Claim> {
  const raw = (await publicClient.readContract({
    address: ADDRS.registry as Addr,
    functionName: "get_claim",
    args: [id],
  })) as string;
  return JSON.parse(raw) as Claim;
}

export async function listClaimIds(): Promise<number[]> {
  const raw = (await publicClient.readContract({
    address: ADDRS.registry as Addr,
    functionName: "list_ids",
    args: [],
  })) as string;
  return JSON.parse(raw) as number[];
}

export async function readPool(id: number): Promise<Pool> {
  const raw = (await publicClient.readContract({
    address: ADDRS.stakeManager as Addr,
    functionName: "get_pool",
    args: [id],
  })) as string;
  return JSON.parse(raw) as Pool;
}

export interface StakerPosition {
  claim_id: number;
  for: number;
  against: number;
  settled: boolean;
  winning_side: "" | "FOR" | "AGAINST" | "NONE";
}

export async function readStakerPositions(addr: string): Promise<StakerPosition[]> {
  const raw = (await publicClient.readContract({
    address: ADDRS.stakeManager as Addr,
    functionName: "get_positions_by_staker",
    args: [addr],
  })) as string;
  return JSON.parse(raw) as StakerPosition[];
}

async function _fetchAllClaims(): Promise<Array<Claim & { pool: Pool }>> {
  const ids = await listClaimIds();
  const out = await Promise.all(
    ids.map(async (id) => {
      const [c, p] = await Promise.all([readClaim(id), readPool(id).catch(emptyPool(id))]);
      return { ...c, pool: p };
    }),
  );
  return out.sort((a, b) => b.created_at - a.created_at);
}

// Cache for 30 s — protects Bradbury from rate-limit errors on every render.
// router.refresh() / AutoRefresh will serve stale data within the window and
// revalidate in the background once the TTL expires.
export const fetchAllClaims = unstable_cache(
  _fetchAllClaims,
  ["all-claims", process.env.NEXT_PUBLIC_CHAIN ?? "studionet"],
  { revalidate: 30, tags: ["claims"] },
);

function emptyPool(id: number) {
  return (): Pool => ({
    claim_id: id, locked: false, settled: false, winning_side: "",
    total_for: 0, total_against: 0, positions: 0,
  });
}

// Stake / challenge / submit calls — call from a wallet-connected client.
// The page imports `getWalletClient()` and threads it in; genlayer-js wallet
// wiring varies by integration (MetaMask, Keplr-style, etc.) so the connector
// is left to the caller rather than hardcoded here.
