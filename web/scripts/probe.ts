// Minimal probe: deploy the canonical hello-world contract from the docs.
// If this fails too, the issue is not in our contracts — it's in how we're
// calling deployContract (constructor args encoding, calldata, etc.).

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");

function loadKey(): `0x${string}` {
  const f = process.env.GL_PRIVATE_KEY;
  if (f) return f as `0x${string}`;
  const txt = readFileSync(resolve(__dirname, "..", ".deploy-key"), "utf8");
  for (const l of txt.split(/\r?\n/)) {
    const t = l.trim();
    if (t.startsWith("0x")) return t as `0x${string}`;
    const m = t.match(/^(?:PRIVATE_KEY|GL_PRIVATE_KEY)\s*=\s*(0x[0-9a-fA-F]+)/);
    if (m) return m[1] as `0x${string}`;
  }
  throw new Error("no key");
}

async function main() {
  const target = process.argv[2] ?? "_hello.py";
  const argList: any[] = process.argv[2] === "_hello.py" || !process.argv[2] ? ["world"] : [];
  const code = readFileSync(resolve(REPO_ROOT, "contracts", target), "utf8");
  const client = createClient({ chain: studionet, account: createAccount(loadKey()) });
  console.log(`deploying ${target}...`);
  const txHash = await client.deployContract({ code, args: argList });
  console.log("tx:", txHash);

  // Poll until FINALIZED
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const tx: any = await client.getTransaction({ hash: txHash });
    const s = tx?.statusName ?? tx?.status;
    process.stdout.write(`\r  status: ${s}        `);
    if (s === "FINALIZED" || s === 7) {
      process.stdout.write("\n");
      const leader = tx?.consensus_data?.leader_receipt?.[0] ?? tx?.consensus_data?.leader_receipt;
      console.log("execution_result:", leader?.execution_result);
      console.log("result          :", JSON.stringify(leader?.result));
      console.log("stderr          :", leader?.genvm_result?.stderr);
      console.log("stdout          :", leader?.genvm_result?.stdout);
      console.log("to_address      :", tx?.to_address);
      return;
    }
  }
  console.log("\n  timed out");
}

main().catch((e) => { console.error(e); process.exit(1); });
