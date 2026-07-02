import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseEther, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const DEPLOYER_KEY = process.env.DEPLOYER_KEY as `0x${string}`;
const FAUCET_AMOUNT = parseEther("0.5");
const MIN_BALANCE = parseEther("0.05");

const bradbury = defineChain({
  id: 4221,
  name: "GenLayer Bradbury Testnet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-bradbury.genlayer.com"] },
  },
});

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }
    if (!DEPLOYER_KEY) {
      return NextResponse.json({ error: "Faucet not configured" }, { status: 503 });
    }

    const transport = http("https://rpc-bradbury.genlayer.com");
    const publicClient = createPublicClient({ chain: bradbury, transport });

    const balance = await publicClient.getBalance({ address: address as `0x${string}` });
    if (balance >= MIN_BALANCE) {
      return NextResponse.json({ skipped: true });
    }

    const account = privateKeyToAccount(DEPLOYER_KEY);
    const walletClient = createWalletClient({ account, chain: bradbury, transport });

    // Force legacy tx — Bradbury may not support EIP-1559
    const gasPrice = await publicClient.getGasPrice();
    const hash = await walletClient.sendTransaction({
      to: address as `0x${string}`,
      value: FAUCET_AMOUNT,
      gasPrice,
      gas: BigInt(21000),
      type: "legacy",
    });

    // Don't await receipt — return immediately so Vercel doesn't timeout
    return NextResponse.json({ success: true, hash });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Faucet error";
    console.error("[faucet]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
