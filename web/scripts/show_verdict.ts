import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
const __dirname = dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(readFileSync(resolve(__dirname, "..", "..", "deployments.studionet.json"), "utf8"));
(async () => {
  const id = Number(process.argv[2] ?? 2);
  const c: any = createClient({ chain: studionet });
  const j = JSON.parse((await c.readContract({ address: D.claim_registry, functionName: "get_claim", args: [id] })) as string);
  console.log(`#${id}: ${j.statement}\n`);
  console.log(`verdict: ${j.verdict} · conf ${j.confidence/100}% · evw ${j.evidence_weight/100}%\n`);
  console.log("reasoning:");
  console.log(j.reasoning);
})();
