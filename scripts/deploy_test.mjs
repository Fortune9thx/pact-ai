import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient, createAccount, chains } from "genlayer-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Usage: node scripts/deploy_test.mjs [contract_filename]
const contractFile = process.argv[2] || "vibecheck.py";
const CONTRACT_CODE = readFileSync(resolve(__dirname, "../contracts", contractFile), "utf8");

const DEPLOYER_KEY = process.env.DEPLOYER_KEY;
if (!DEPLOYER_KEY) throw new Error("DEPLOYER_KEY missing from .env.local");

const account = createAccount(DEPLOYER_KEY);
const client = createClient({ chain: chains.testnetBradbury, account });

console.log("Deploying:", contractFile);
console.log("Deployer:", account.address);

const hash = await client.deployContract({ code: CONTRACT_CODE, args: [] });
console.log("Deploy TX:", hash);
console.log("Polling explorer for execution_result (every 6s, up to 5min)...");

const EXPLORER = "https://explorer-bradbury.genlayer.com/api/v1/transactions/" + hash;

for (let i = 0; i < 50; i++) {
  await new Promise((r) => setTimeout(r, 6000));
  let body;
  try {
    const res = await fetch(EXPLORER);
    body = await res.text();
  } catch { process.stdout.write("x"); continue; }

  const execResult = (body.match(/"execution_result":"([^"]*)"/) || [])[1];
  const deployed = (body.match(/"deployed_contract_address":"(0x[0-9a-fA-F]{40})"/) || [])[1];
  const matStatus = (body.match(/"materialized_status":"([^"]*)"/) || [])[1];

  if (execResult === "finished_with_return" && deployed) {
    console.log(`\n✅ SUCCESS — finished_with_return`);
    console.log("CONTRACT ADDRESS:", deployed);
    process.exit(0);
  }
  if (execResult === "finished_with_error") {
    console.log(`\n❌ FAILED — finished_with_error (deterministic Python/schema error at deploy)`);
    process.exit(1);
  }
  process.stdout.write(`.${matStatus || "?"}[${execResult || "not_voted"}] `);
}
console.log("\nTimed out waiting for consensus. TX:", hash);
