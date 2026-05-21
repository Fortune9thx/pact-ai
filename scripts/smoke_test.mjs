import { createClient, createAccount, generatePrivateKey, chains } from "genlayer-js";
import { TransactionStatus } from "genlayer-js/types";

const CONTRACT = "0x05946e93b23c9a79014A95A4Dd220133966f76be";
const BUYER_KEY  = "0x638043bf64303c82c42d912d233f5d93fe0fd726a78d47cca47a6f0e7d049b71";

// Generate a fresh seller account each run
const SELLER_KEY = generatePrivateKey();
const sellerAccount = createAccount(SELLER_KEY);
const SELLER = sellerAccount.address;

async function write(client, functionName, args, retries = 40) {
  const hash = await client.writeContract({
    address: CONTRACT,
    functionName,
    args,
    value: BigInt(0),
  });
  await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, retries });
  return hash;
}

async function read(client, functionName, args = []) {
  return client.readContract({ address: CONTRACT, functionName, args });
}

async function run() {
  const buyerAccount = createAccount(BUYER_KEY);
  const buyerClient = createClient({ chain: chains.studionet, account: buyerAccount });
  const sellerClient = createClient({ chain: chains.studionet, account: sellerAccount });

  console.log("Buyer (deployer):", buyerAccount.address);
  console.log("Seller (fresh):  ", SELLER);

  const stats0 = await read(buyerClient, "get_stats");
  const nextId = `deal_${String(Number(stats0.total_deals) + 1).padStart(6, "0")}`;
  console.log(`\nStarting deal ${nextId}. Total deals before: ${stats0.total_deals}`);

  // 1. Buyer creates deal
  console.log("\n[1] create_deal...");
  await write(buyerClient, "create_deal", [
    SELLER,
    "Design a modern SaaS landing page with hero, pricing, and CTA sections",
    30,
    100,
  ]);
  const d1 = await read(buyerClient, "get_deal", [nextId]);
  console.log("    Status:", d1.status, "✓ (expected: FUNDED)");

  // 2. Seller submits work
  console.log("\n[2] submit_work (as seller)...");
  await write(sellerClient, "submit_work", [
    nextId,
    "https://dribbble.com/shots/23432940-SaaS-Landing-Page",
    "Modern SaaS landing page with glassmorphism hero, pricing table, animated CTAs",
  ]);
  const d2 = await read(buyerClient, "get_deal", [nextId]);
  console.log("    Status:", d2.status, "✓ (expected: SUBMITTED)");

  // 3. Buyer disputes → triggers AI evaluation (can take 1-3 min for consensus)
  console.log("\n[3] dispute_deal (as buyer) → triggers AI (may take 1-3 min)...");
  await write(buyerClient, "dispute_deal", [nextId], 80);
  const d3 = await read(buyerClient, "get_deal", [nextId]);
  console.log("    Status:", d3.status);
  if (d3.ai_verdict) {
    console.log("    AI result:", d3.ai_verdict.result);
    console.log("    Confidence:", d3.ai_verdict.confidence + "%");
    console.log("    Style match:", d3.ai_verdict.style_match);
    console.log("    Prompt align:", d3.ai_verdict.prompt_alignment);
    console.log("    Quality:", d3.ai_verdict.quality_match);
    console.log("    Reasoning:", d3.ai_verdict.reasoning);
  } else {
    console.log("    AI verdict: still pending (consensus in progress)");
  }

  const stats1 = await read(buyerClient, "get_stats");
  console.log("\n=== FINAL STATS ===");
  console.log(stats1);
}

run().catch(console.error);
