import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
const __dirname = dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(readFileSync(resolve(__dirname, "..", "..", "deployments.studionet.json"), "utf8"));
(async () => {
  const c: any = createClient({ chain: studionet });
  const id = Number(process.argv[2] ?? 6);
  const raw = (await c.readContract({ address: D.stake_manager, functionName: "get_pool", args: [id] })) as string;
  console.log(raw);
})();
