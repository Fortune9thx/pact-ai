import { createClient, createAccount, chains } from "genlayer-js";

const activeChain =
  process.env.NEXT_PUBLIC_NETWORK === "bradbury"
    ? chains.testnetBradbury
    : chains.studionet;

// Demo account for studionet transactions (testnet only, no real funds)
const DEMO_KEY = process.env.NEXT_PUBLIC_DEMO_KEY as `0x${string}` | undefined;
export const demoAccount = DEMO_KEY ? createAccount(DEMO_KEY) : null;

export function createGenLayerClient() {
  if (typeof window !== "undefined" && window.ethereum) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createClient({ chain: activeChain, provider: window.ethereum as any });
  }
  if (demoAccount) {
    return createClient({ chain: activeChain, account: demoAccount });
  }
  return createClient({ chain: activeChain });
}

let readClient: ReturnType<typeof createClient> | null = null;

export function getReadClient() {
  if (!readClient) {
    readClient = createClient({ chain: activeChain });
  }
  return readClient;
}

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "") as `0x${string}`;

export { activeChain };
