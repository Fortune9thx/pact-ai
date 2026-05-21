import { createClient, createAccount, chains } from "genlayer-js";
import { TransactionStatus } from "genlayer-js/types";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTRACT_CODE = readFileSync(resolve(__dirname, "../contracts/test_full_v2.py"), "utf8");
const DEPLOYER_KEY = "0x638043bf64303c82c42d912d233f5d93fe0fd726a78d47cca47a6f0e7d049b71";

const account = createAccount(DEPLOYER_KEY);
const client = createClient({ chain: chains.studionet, account });

console.log("Deployer:", account.address);
console.log("Deploying contract...");

const hash = await client.deployContract({
  code: CONTRACT_CODE,
  args: [],
});
console.log("Deploy TX:", hash);

await client.waitForTransactionReceipt({
  hash,
  status: TransactionStatus.ACCEPTED,
  retries: 80,
});

const tx = await client.getTransaction({ hash });
console.log("\nDeploy TX details:", JSON.stringify(tx, null, 2));
