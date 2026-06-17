// Deep probe of the deployed contracts. Answers three questions at once:
//   1. Is there bytecode on-chain at all?   (eth_getCode)
//   2. Does the intelligent-contract layer see it?  (gen_call / readContract)
//   3. How long ago was the deploy recorded?
//
// Diagnostic legend:
//   ✓ FINALIZED  — code on-chain AND gen_call succeeds. Ready to use.
//   … PENDING    — code on-chain, gen_call still says "not found"
//                  (appeal window open or finalization not yet propagated)
//   ✗ MISSING    — no code at the address. Tx was likely UNDETERMINED/CANCELED;
//                  redeploy required.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "genlayer-js";
import { studionet, testnetBradbury } from "genlayer-js/chains";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");

// Pick whichever deployment file exists. Studionet first (the dev default);
// fall back to bradbury for production-target diagnostics.
const studionetPath = resolve(REPO_ROOT, "deployments.studionet.json");
const bradburyPath  = resolve(REPO_ROOT, "deployments.bradbury.json");
const path = existsSync(studionetPath) ? studionetPath : bradburyPath;
const deployments = JSON.parse(readFileSync(path, "utf8"));
const chain = deployments.chain === "bradbury" ? testnetBradbury : studionet;
const client: any = createClient({ chain });

async function hasBytecode(address: string): Promise<boolean> {
  try {
    const code = await client.getBytecode({ address: address as `0x${string}` });
    return !!code && code !== "0x" && code.length > 4;
  } catch {
    // Some genlayer-js builds expose getCode instead.
    try {
      const code = await client.request({
        method: "eth_getCode",
        params: [address, "latest"],
      });
      return !!code && code !== "0x";
    } catch {
      return false;
    }
  }
}

async function genCallProbe(label: string, address: string): Promise<{ ok: boolean; detail: string }> {
  try {
    if (label === "ClaimRegistry") {
      const r = await client.readContract({
        address: address as `0x${string}`,
        functionName: "list_ids",
        args: [],
      });
      return { ok: true, detail: `list_ids -> ${r}` };
    }
    if (label === "StakeManager") {
      const r = await client.readContract({
        address: address as `0x${string}`,
        functionName: "get_pool",
        args: [1],
      });
      // Parse the pool to surface settled/locked flags + protocol revenue
      let detail = `get_pool(1) -> ${String(r).slice(0, 60)}`;
      try {
        const rev = await client.readContract({
          address: address as `0x${string}`,
          functionName: "get_protocol_revenue",
          args: [],
        });
        detail += ` · protocol_revenue=${rev}`;
      } catch { /* method may not exist on older deploys */ }
      return { ok: true, detail };
    }
    return { ok: true, detail: "(no probe view defined)" };
  } catch (e: any) {
    const msg = (e?.shortMessage ?? e?.message ?? String(e)).split("\n")[0];
    return { ok: false, detail: msg };
  }
}

async function probe(label: string, address: string) {
  const onChain = await hasBytecode(address);
  const gen = await genCallProbe(label, address);

  let icon = "?";
  let state = "";
  if (gen.ok)         { icon = "✓"; state = "FINALIZED"; }
  else if (onChain)   { icon = "…"; state = "PENDING";   }
  else                { icon = "✗"; state = "MISSING";   }

  console.log(`  ${icon} ${label.padEnd(20)} ${address}`);
  console.log(`     state: ${state}  ·  bytecode: ${onChain ? "yes" : "no"}`);
  console.log(`     read:  ${gen.detail}\n`);
}

(async () => {
  const deployedAt = new Date(deployments.deployed_at);
  const ageMin = Math.round((Date.now() - deployedAt.getTime()) / 60_000);
  console.log(`probing ${deployments.chain} deployment from ${deployments.deployed_at}`);
  console.log(`age: ${ageMin} min\n`);

  await probe("StakeManager", deployments.stake_manager);
  await probe("AdjudicationContract", deployments.adjudication);
  await probe("ClaimRegistry", deployments.claim_registry);

  console.log("Diagnosis:");
  console.log("  ✓ FINALIZED → ready, run `npm run seed` and refresh the Arena.");
  console.log("  … PENDING   → on-chain, appeal window still open. Keep waiting.");
  console.log("  ✗ MISSING   → tx never landed; redeploy with `npm run deploy`.");
})();
