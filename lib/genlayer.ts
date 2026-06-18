import { createClient, createAccount, chains } from "genlayer-js";

const activeChain =
  process.env.NEXT_PUBLIC_NETWORK === "bradbury"
    ? chains.testnetBradbury
    : chains.studionet;

export const BRADBURY_RPC_DIRECT = "https://rpc-bradbury.genlayer.com";

export type LocalAccount = ReturnType<typeof createAccount>;

export function getProxyRpcUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/rpc`;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pact-ai.vercel.app";
  return `${appUrl}/api/rpc`;
}

// LocalAccount path: genlayer-js uses its own HTTP fetch with Date.now() integer IDs.
// This bypasses the wallet's RPC transport, avoiding Bradbury's rejection of UUID string IDs.
export function createGenLayerClient(account: LocalAccount) {
  return createClient({
    chain: activeChain,
    endpoint: getProxyRpcUrl(),
    account,
  } as Parameters<typeof createClient>[0]);
}

export { createAccount };

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
