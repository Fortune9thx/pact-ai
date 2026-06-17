import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const __dirname = dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(readFileSync(resolve(__dirname, "..", "..", "deployments.studionet.json"), "utf8"));

function loadKey(): `0x${string}` {
  const env = process.env.GL_PRIVATE_KEY;
  if (env) return env as `0x${string}`;
  const txt = readFileSync(resolve(__dirname, "..", ".deploy-key"), "utf8");
  for (const l of txt.split(/\r?\n/)) {
    const t = l.trim();
    if (t.startsWith("0x")) return t as `0x${string}`;
    const m = t.match(/^(?:PRIVATE_KEY|GL_PRIVATE_KEY)\s*=\s*(0x[0-9a-fA-F]+)/);
    if (m) return m[1] as `0x${string}`;
  }
  throw new Error("no key");
}

const ID = Number(process.argv[2] ?? 4);

(async () => {
  const client: any = createClient({ chain: studionet, account: createAccount(loadKey()) });
  console.log(`re-adjudicating #${ID}...`);
  const tx = await client.writeContract({
    address: D.adjudication,
    functionName: "adjudicate",
    args: [ID],
    value: 0n,
  });
  console.log("tx:", tx);
  for (let i = 0; i < 240; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    try {
      const t: any = await client.getTransaction({ hash: tx });
      const s = t?.statusName ?? t?.status;
      process.stdout.write(`\r  ${s}              `);
      if (s === "FINALIZED") {
        process.stdout.write("\n");
        const lr = t?.consensus_data?.leader_receipt?.[0] ?? t?.consensus_data?.leader_receipt;
        console.log("exec:", lr?.execution_result);
        if (lr?.execution_result !== "SUCCESS") {
          console.log("stderr:", (lr?.genvm_result?.stderr ?? "").slice(-1500));
        } else {
          console.log("stdout:", lr?.genvm_result?.stdout?.trim() ?? "");
        }
        return;
      }
    } catch {}
  }
})();
