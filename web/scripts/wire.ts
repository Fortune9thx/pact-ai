// One-shot recovery script — calls ADJ.wire(registry, stake_manager) after
// waiting for a specific tx to FINALIZE (freeing a pending-tx slot on Bradbury).
//
// Usage:
//   npx tsx scripts/wire.ts
//
// Reads addresses from deployments.bradbury.partial.json and waits for the
// StakeManager deploy tx to FINALIZE before submitting the final wire call.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");

function need(env: string): string {
  const fromEnv = process.env[env];
  if (fromEnv) return fromEnv;
  try {
    const txt = readFileSync(resolve(__dirname, "..", ".deploy-key"), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      if (t.startsWith("0x")) return t;
      const m = t.match(/^(?:PRIVATE_KEY|GL_PRIVATE_KEY)\s*=\s*(0x[0-9a-fA-F]+)\s*$/);
      if (m) return m[1];
    }
  } catch { /* file missing */ }
  console.error(`missing ${env}`);
  process.exit(1);
}

async function main() {
  const partial = JSON.parse(
    readFileSync(resolve(REPO_ROOT, "deployments.bradbury.partial.json"), "utf8"),
  );

  // Addresses may be absent from older partial logs (pre-fix). Accept them as
  // CLI overrides: npx tsx scripts/wire.ts 0xSM 0xADJ 0xREG
  const [, , cliSm, cliAdj, cliReg] = process.argv;
  const smAddr   = (cliSm  || partial.stake_manager)   as `0x${string}`;
  const adjAddr  = (cliAdj || partial.adjudication)    as `0x${string}`;
  const regAddr  = (cliReg || partial.claim_registry)  as `0x${string}`;
  const smHash   = partial.tx_log.find((t: any) => t.step.includes("stake_manager"))?.hash as `0x${string}`;

  if (!smAddr || !adjAddr || !regAddr || !smHash) {
    console.error(
      "Missing addresses. Either run deploy:bradbury first (it now saves addresses to partial.json),\n" +
      "or pass them on the CLI:\n" +
      "  npx tsx scripts/wire.ts 0xSM_ADDR 0xADJ_ADDR 0xREG_ADDR\n",
      { smAddr, adjAddr, regAddr, smHash },
    );
    process.exit(1);
  }

  console.log("StakeManager  ", smAddr);
  console.log("Adjudication  ", adjAddr);
  console.log("ClaimRegistry ", regAddr);
  console.log("SM tx hash    ", smHash);

  const pk = need("GL_PRIVATE_KEY") as `0x${string}`;
  const account = createAccount(pk);
  const client = createClient({ chain: testnetBradbury, account });

  const POLL_MS = 5000;
  const DEADLINE_MIN = 45;

  async function waitFor(hash: `0x${string}`, label: string, until: "ACCEPTED" | "FINALIZED") {
    const deadline = Date.now() + DEADLINE_MIN * 60_000;
    const DONE = until === "ACCEPTED"
      ? new Set(["ACCEPTED", "FINALIZED"])
      : new Set(["FINALIZED"]);
    let last = "", lastTick = Date.now();
    while (Date.now() < deadline) {
      try {
        const tx: any = await client.getTransaction({ hash });
        const s = tx?.statusName ?? String(tx?.status ?? "?");
        if (s !== last) {
          const elapsed = Math.round((Date.now() - lastTick) / 1000);
          process.stdout.write(`\r  ${label} status: ${s}  (+${elapsed}s)        `);
          last = s; lastTick = Date.now();
        }
        if (DONE.has(s)) { process.stdout.write("\n"); return tx; }
        if (s === "CANCELED" || s === "UNDETERMINED") {
          process.stdout.write("\n");
          throw new Error(`${label} terminal: ${s}`);
        }
      } catch (e: any) {
        if (!String(e?.message ?? "").includes("not found")) { /* keep polling */ }
      }
      await new Promise(r => setTimeout(r, POLL_MS));
    }
    throw new Error(`${label} timed out after ${DEADLINE_MIN} min`);
  }

  // Wait for SM to FINALIZE — drops pending count from 4 to 3, making room.
  console.log("\nWaiting for StakeManager to FINALIZE (opens a pending-tx slot) ...");
  await waitFor(smHash, "[SM]", "FINALIZED");

  // Now submit ADJ.wire — pending count: ADJ(A) + REG(A) + wire(pending) = 3 ≤ 4
  console.log("\nCalling adjudication.wire(registry, stakeManager) ...");
  const wireTx = await client.writeContract({
    address: adjAddr,
    functionName: "wire",
    args: [regAddr, smAddr],
    value: 0n,
    leaderOnly: true,
  });
  console.log("  wire tx:", wireTx);
  await waitFor(wireTx, "[wire]", "ACCEPTED");

  // Write final deployment record
  const out = {
    chain: "bradbury",
    chain_id: testnetBradbury.id,
    deployer: account.address,
    deployed_at: partial.deployed_at,
    completed_at: new Date().toISOString(),
    tx_log: [...partial.tx_log, { step: "wire adjudication", hash: wireTx, status: "ACCEPTED" }],
    stake_manager: smAddr,
    adjudication: adjAddr,
    claim_registry: regAddr,
  };

  const deploymentsPath = resolve(REPO_ROOT, "deployments.bradbury.json");
  writeFileSync(deploymentsPath, JSON.stringify(out, null, 2));
  console.log(`\nwrote ${deploymentsPath}`);

  const envPath = resolve(__dirname, "..", ".env.local");
  writeFileSync(envPath,
    `NEXT_PUBLIC_CHAIN=bradbury\n` +
    `NEXT_PUBLIC_REGISTRY=${regAddr}\n` +
    `NEXT_PUBLIC_STAKE_MANAGER=${smAddr}\n` +
    `NEXT_PUBLIC_ADJUDICATION=${adjAddr}\n`,
  );
  console.log(`wrote ${envPath}`);
  console.log("\ndone. Restart `npm run dev` to pick up the new env.");
}

main().catch(e => { console.error("\nWIRE FAILED\n", e); process.exit(1); });
