/**
 * Focused on-chain proof of Reviewer Issue #1 (real GEN escrow, not state-only).
 *
 *   create_deal (payable, msg.value = 1 GEN)  -> contract native balance +1 GEN
 *   cancel_deal                               -> contract refunds buyer, balance -1 GEN
 *
 * Buyer-only flow (no funded seller needed). Proves the contract takes real
 * custody of GEN via emit_transfer, which is exactly what the reviewer flagged.
 *
 * Usage: node scripts/test_escrow.mjs [CONTRACT_ADDRESS]
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient, createAccount, chains } from "genlayer-js";
import { TransactionStatus } from "genlayer-js/types";

const CONTRACT = process.argv[2] || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const DEPLOYER_KEY = process.env.DEPLOYER_KEY;
if (!CONTRACT || !DEPLOYER_KEY) { console.error("Need CONTRACT + DEPLOYER_KEY"); process.exit(1); }

const buyer = createAccount(DEPLOYER_KEY);
const client = createClient({ chain: chains.testnetBradbury, account: buyer });

const AMOUNT_GEN = 1;
const AMOUNT_WEI = BigInt(AMOUNT_GEN) * BigInt(10 ** 18);

async function bal(addr) {
  const res = await fetch("https://rpc-bradbury.genlayer.com", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [addr, "latest"] }),
  });
  const { result } = await res.json();
  return Number(BigInt(result ?? "0x0")) / 1e18;
}
async function write(fn, args, value = 0n) {
  const hash = await client.writeContract({ address: CONTRACT, functionName: fn, args, value });
  console.log(`    ${fn} TX: ${hash}`);
  await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, retries: 120 });
  return hash;
}
async function read(fn, args = []) { return client.readContract({ address: CONTRACT, functionName: fn, args }); }
const ok = (m) => console.log("  ✅ " + m);
const bad = (m) => { console.error("  ❌ " + m); process.exitCode = 1; };

(async () => {
  console.log("Contract:", CONTRACT, "\nBuyer:", buyer.address, "\n");

  const cBefore = await bal(CONTRACT);
  const bBefore = await bal(buyer.address);
  console.log(`Buyer balance:    ${bBefore} GEN`);
  console.log(`Contract balance: ${cBefore} GEN`);
  if (bBefore < AMOUNT_GEN + 0.05) { bad(`Buyer needs >= ${AMOUNT_GEN + 0.05} GEN (faucet the deployer wallet)`); process.exit(1); }

  const count = Number(await read("get_deal_count"));
  const dealId = `deal_${String(count + 1).padStart(6, "0")}`;
  console.log(`Next deal: ${dealId}\n`);

  console.log(`[1] create_deal — locking ${AMOUNT_GEN} GEN as msg.value ...`);
  await write("create_deal", ["Proof-of-escrow test brief for reviewer verification", 7, AMOUNT_GEN], AMOUNT_WEI);
  const d1 = await read("get_deal", [dealId]);
  d1.status === "PENDING" ? ok("deal PENDING") : bad(`status=${d1.status}`);
  const cAfterCreate = await bal(CONTRACT);
  const locked = cAfterCreate - cBefore;
  Math.abs(locked - AMOUNT_GEN) < 0.001
    ? ok(`contract native balance +${locked.toFixed(4)} GEN  <-- REAL escrow lock confirmed`)
    : bad(`contract balance delta ${locked.toFixed(4)} (expected +${AMOUNT_GEN})`);

  console.log(`\n[2] cancel_deal — contract should refund ${AMOUNT_GEN} GEN to buyer ...`);
  await write("cancel_deal", [dealId]);
  const d2 = await read("get_deal", [dealId]);
  d2.status === "CANCELLED" ? ok("deal CANCELLED") : bad(`status=${d2.status}`);
  const cAfterCancel = await bal(CONTRACT);
  const released = cAfterCreate - cAfterCancel;
  Math.abs(released - AMOUNT_GEN) < 0.001
    ? ok(`contract native balance -${released.toFixed(4)} GEN  <-- REAL transfer out confirmed`)
    : bad(`contract balance delta ${released.toFixed(4)} (expected -${AMOUNT_GEN})`);

  console.log(process.exitCode === 1
    ? "\n❌ escrow proof FAILED"
    : "\n✅ escrow proof PASSED — real GEN locked on create and returned on cancel (reviewer issue #1 resolved)");
})().catch((e) => { console.error("crashed:", e); process.exit(1); });
