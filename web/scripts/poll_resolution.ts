import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const __dirname = dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(readFileSync(resolve(__dirname, "..", "..", "deployments.studionet.json"), "utf8"));

const CLAIM_ID = Number(process.argv[2] ?? "1");

(async () => {
  const client: any = createClient({ chain: studionet });
  let last = "";
  for (let i = 0; i < 240; i++) {
    try {
      const raw = (await client.readContract({ address: D.claim_registry, functionName: "get_claim", args: [CLAIM_ID] })) as string;
      const c = JSON.parse(raw);
      const status = `state=${c.state} verdict=${c.verdict || "-"}`;
      if (status !== last) { console.log(`[t+${i*5}s] ${status}`); last = status; }
      if (c.state === "RESOLVED") {
        console.log("\n=== VERDICT ==="); console.log(JSON.stringify(c, null, 2));
        return;
      }
    } catch (e: any) { /* transient */ }
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log("(20 min elapsed; not resolved)");
})();
