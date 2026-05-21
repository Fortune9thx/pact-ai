import { createClient, createAccount, generatePrivateKey, chains } from "genlayer-js";
import { TransactionStatus } from "genlayer-js/types";

const CONTRACT = "0x05946e93b23c9a79014A95A4Dd220133966f76be";
const BUYER_KEY = "0x638043bf64303c82c42d912d233f5d93fe0fd726a78d47cca47a6f0e7d049b71";

const buyerAccount = createAccount(BUYER_KEY);
const sellerAccount = createAccount(generatePrivateKey());
const buyerClient = createClient({ chain: chains.studionet, account: buyerAccount });
const sellerClient = createClient({ chain: chains.studionet, account: sellerAccount });

async function write(client, fn, args, retries = 80) {
  const hash = await client.writeContract({ address: CONTRACT, functionName: fn, args, value: BigInt(0) });
  console.log(`  ${fn} TX: ${hash}`);
  await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, retries });
  return hash;
}

async function poll(dealId, maxMs = 300000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const deal = await buyerClient.readContract({ address: CONTRACT, functionName: "get_deal", args: [dealId] });
    const elapsed = Math.round((Date.now()-start)/1000);
    console.log(`  [${elapsed}s] ${dealId} status=${deal.status} verdict=${deal.ai_verdict?.result ?? 'pending'}`);
    if (["RESOLVED_PASS", "RESOLVED_FAIL"].includes(deal.status)) return deal;
    await new Promise(r => setTimeout(r, 5000));
  }
  return null;
}

// Get current deal count
const stats = await buyerClient.readContract({ address: CONTRACT, functionName: "get_stats", args: [] });
const dealId = `deal_${String(Number(stats.total_deals) + 1).padStart(6, "0")}`;
console.log(`Creating ${dealId} with seller ${sellerAccount.address}`);

// Create deal
await write(buyerClient, "create_deal", [
  sellerAccount.address,
  "Design a modern dark-themed SaaS landing page with glassmorphism hero section, 3-tier pricing table, and animated CTA buttons",
  14,
  50,
]);

// Submit work — use a raw pastebin/gist URL that returns plain static text
// Using a URL that will 404 so all validators fall back to the description (consistent)
await write(sellerClient, "submit_work", [
  dealId,
  "https://vibecheck-demo.invalid/submission",  // intentional 404 → description fallback
  "Dark SaaS landing page featuring glassmorphism hero with animated gradient, 3-tier pricing (Starter/Pro/Enterprise), animated CTA buttons with hover effects, and mobile-responsive layout. Built with Next.js and Tailwind CSS. Figma design link: figma.com/demo",
]);

console.log("\nDisputingdeal (status → DISPUTED)...");
await write(buyerClient, "dispute_deal", [dealId], 100);

console.log("\nTriggering AI verdict...");
const disputeHash = await write(buyerClient, "run_ai_verdict", [dealId], 100);

console.log("\nPolling for AI resolution (up to 5 min)...");
const resolved = await poll(dealId);

if (resolved) {
  console.log("\n=== AI VERDICT ===");
  console.log("Deal:       ", dealId);
  console.log("Result:     ", resolved.ai_verdict.result);
  console.log("Confidence: ", resolved.ai_verdict.confidence + "%");
  console.log("Style:      ", resolved.ai_verdict.style_match);
  console.log("Alignment:  ", resolved.ai_verdict.prompt_alignment);
  console.log("Quality:    ", resolved.ai_verdict.quality_match);
  console.log("Reasoning:  ", resolved.ai_verdict.reasoning);
  console.log("\nFinal status:", resolved.status);
} else {
  // Check transaction result
  const txReceipt = await buyerClient.getTransaction({ hash: disputeHash }).catch(() => null);
  console.log("Dispute TX result:", txReceipt?.result_name, "status:", txReceipt?.status_name);
  console.log("Still pending — check deal status again later.");
}
