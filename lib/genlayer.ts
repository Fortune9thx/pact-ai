import { createClient, chains } from "genlayer-js";
import type { Address } from "viem";

const activeChain =
  process.env.NEXT_PUBLIC_NETWORK === "bradbury"
    ? chains.testnetBradbury
    : chains.studionet;

export const BRADBURY_RPC_DIRECT = "https://rpc-bradbury.genlayer.com";

/** Minimal EIP-1193 provider shape (MetaMask / injected wallets). */
export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
}

export function getProxyRpcUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/rpc`;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pact-ai.vercel.app";
  return `${appUrl}/api/rpc`;
}

/**
 * Write client bound to the user's injected wallet (MetaMask).
 *
 * The user's real EOA (`address`) is the on-chain sender, and `provider` is the
 * EIP-1193 provider from their wallet. genlayer-js routes only wallet methods
 * (eth_sendTransaction, personal_sign, eth_requestAccounts) through the
 * provider — so MetaMask shows a confirmation popup for every write and the
 * user's *visible* GEN balance funds the payable escrow. All other RPC traffic
 * still goes through genlayer-js's own transport against `endpoint`, so the
 * wallet's RPC id format never reaches Bradbury.
 */
export function createWriteClient(address: Address, provider: Eip1193Provider) {
  return createClient({
    chain: activeChain,
    endpoint: getProxyRpcUrl(),
    account: address,
    provider,
  } as Parameters<typeof createClient>[0]);
}

/** Read client — view calls only, no account/signing, so no wallet prompts. */
export function getReadClient() {
  return createClient({
    chain: activeChain,
    endpoint: BRADBURY_RPC_DIRECT,
  });
}

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "") as `0x${string}`;

export const BRADBURY_CHAIN_PARAMS = {
  chainId: "0x107D",
  chainName: "GenLayer Bradbury Testnet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: ["https://rpc-bradbury.genlayer.com"],
  blockExplorerUrls: ["https://explorer-bradbury.genlayer.com"],
} as const;

export { activeChain };
