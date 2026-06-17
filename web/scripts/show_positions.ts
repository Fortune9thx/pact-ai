import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
const __dirname = dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(readFileSync(resolve(__dirname, "..", "..", "deployments.studionet.json"), "utf8"));
(async () => {
  const c: any = createClient({ chain: studionet });
  const addr = process.argv[2] ?? "0xC6E6d3b2acCaECeCeB40Ad4bD3dF123DDCB4e537";
  const raw = (await c.readContract({ address: D.stake_manager, functionName: "get_positions_by_staker", args: [addr] })) as string;
  console.log(raw);
})();
