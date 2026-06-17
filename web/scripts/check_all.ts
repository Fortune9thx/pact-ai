import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
const __dirname = dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(readFileSync(resolve(__dirname, "..", "..", "deployments.studionet.json"), "utf8"));
(async () => {
  const c: any = createClient({ chain: studionet });
  const raw = (await c.readContract({ address: D.claim_registry, functionName: "list_ids", args: [] })) as string;
  const ids = JSON.parse(raw) as number[];
  console.log(`total claims: ${ids.length} — [${ids.join(", ")}]`);
  for (const id of ids) {
    try {
      const j = JSON.parse((await c.readContract({ address: D.claim_registry, functionName: "get_claim", args: [id] })) as string);
      console.log(`  #${id}: ${j.state.padEnd(15)} ${j.verdict || "-"} ${j.verdict ? `(${(j.confidence/100).toFixed(0)}%)` : ""}`);
    } catch (e: any) { console.log(`  #${id}: ERR ${e?.message?.slice(0, 50)}`); }
  }
})();
