import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { createClient, createAccount, chains } from "genlayer-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTRACT_CODE = readFileSync(resolve(__dirname, "../contracts/vibecheck.py"), "utf8");

const DEPLOYER_KEY = process.env.DEPLOYER_KEY;
if (!DEPLOYER_KEY) throw new Error("DEPLOYER_KEY missing from .env");

const account = createAccount(DEPLOYER_KEY);
const client = createClient({ chain: chains.testnetBradbury, account });

console.log("Deployer:", account.address);
console.log("Deploying contract...");

const hash = await client.deployContract({
  code: CONTRACT_CODE,
  args: [],
});
console.log("Deploy TX:", hash);

// waitForTransactionReceipt is broken on Bradbury (isDecidedState never matches).
// Poll getTransaction directly for the contract address.
console.log("Waiting for contract address (polling every 4s, up to 2min)...");
let contractAddress = null;
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 4000));
  try {
    const tx = await client.getTransaction({ hash });
    const addr = tx?.recipient ?? tx?.to ?? tx?.contract_address ?? tx?.data?.contract_address;
    if (addr && addr !== "0x0000000000000000000000000000000000000000") {
      contractAddress = addr;
      console.log("\n✅ CONTRACT ADDRESS:", contractAddress);
      console.log("\nUpdate .env.local → NEXT_PUBLIC_CONTRACT_ADDRESS=" + contractAddress);
      console.log("\nUpdate Vercel (Git Bash):");
      console.log(`  printf '${contractAddress}' | npx vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS production`);
      console.log("  npx vercel --prod");
      console.log("  npx vercel alias set <hash>.vercel.app pact-ai.vercel.app");
      console.log("\nFull TX:", JSON.stringify(tx, null, 2));
      break;
    }
    process.stdout.write(".");
  } catch {}
}

if (!contractAddress) {
  console.log("\nAddress not confirmed yet. TX hash:", hash);
  console.log("Re-run: node -e \"import('./scripts/deploy.mjs')\" or check explorer manually.");
}
