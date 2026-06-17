// Deploy Eristic.
//
// Default target: Studionet (hosted simulator, instant finality — for
// development and iteration). Switch to Bradbury (real validator network,
// 10–30 min per tx) only when you're ready to show it to anyone.
//
//   npm run deploy             # studionet (default, fast)
//   npm run deploy:bradbury    # bradbury  (slow, production-like)
//
// Writes:
//   ../deployments.<target>.json   (canonical record)
//   .env.local                     (NEXT_PUBLIC_* values for the Arena)

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, createAccount } from "genlayer-js";
import { studionet, testnetBradbury } from "genlayer-js/chains";

const target = process.argv.includes("--bradbury") || process.env.ERISTIC_TARGET === "bradbury"
  ? "bradbury" as const
  : "studionet" as const;
const chain = target === "bradbury" ? testnetBradbury : studionet;

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const CONTRACTS = resolve(REPO_ROOT, "contracts");

function read(name: string): string {
  return readFileSync(resolve(CONTRACTS, name), "utf8");
}

function need(env: string): string {
  // 1. Env var wins.
  const fromEnv = process.env[env];
  if (fromEnv) return fromEnv;

  // 2. Fall back to web/.deploy-key (gitignored). Accepts either:
  //      0xabcdef...
  //    or a dotenv-style line:
  //      PRIVATE_KEY=0xabcdef...
  //      GL_PRIVATE_KEY=0xabcdef...
  try {
    const txt = readFileSync(resolve(__dirname, "..", ".deploy-key"), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      if (t.startsWith("0x")) return t;
      const m = t.match(/^(?:PRIVATE_KEY|GL_PRIVATE_KEY)\s*=\s*(0x[0-9a-fA-F]+)\s*$/);
      if (m) return m[1];
    }
  } catch { /* file missing — fall through to error below */ }

  console.error(
    `missing ${env}. Either:\n` +
    `  1. set the env var:        $env:${env} = "0x..."\n` +
    `  2. or create web/.deploy-key with one line:   0xabcdef...   (gitignored)`,
  );
  process.exit(1);
}

async function main() {
  const pk = need("GL_PRIVATE_KEY") as `0x${string}`;
  const account = createAccount(pk);
  const client = createClient({ chain, account });

  console.log(`target   = ${target}`);
  console.log(`deployer = ${account.address}`);

  // v1.x deployContract returns a *transaction hash*. We have to wait for the
  // tx to be accepted by consensus and pull the contract address out of the
  // decoded receipt. `status: ACCEPTED` is enough for chaining; FINALIZED
  // would be safer but adds ~minutes per step.
  // Studionet is the hosted dev simulator: txs finalize in seconds.
  // Bradbury runs a real validator network + appeal window: 10–30 min per tx.
  // Same wait code; different budget per target.
  const POLL_MS = target === "studionet" ? 1500 : 5000;
  const POLL_MAX_MIN = target === "studionet" ? 5 : 45;

  async function waitForStatus(
    txHash: `0x${string}`,
    label: string,
    until: "ACCEPTED" | "FINALIZED",
  ): Promise<any> {
    const deadline = Date.now() + POLL_MAX_MIN * 60_000;
    let lastStatus = "";
    let lastTick = Date.now();
    // ACCEPTED means the leader has executed and the tx is in the appeal window.
    // The nonce is consumed at this point — safe to send the next tx.
    const DONE = until === "ACCEPTED"
      ? new Set(["ACCEPTED", "FINALIZED"])
      : new Set(["FINALIZED"]);
    while (Date.now() < deadline) {
      try {
        const tx: any = await client.getTransaction({ hash: txHash });
        const s = tx?.statusName ?? String(tx?.status ?? "?");
        if (s !== lastStatus) {
          const elapsed = Math.round((Date.now() - lastTick) / 1000);
          process.stdout.write(`\r  ${label} status: ${s}  (+${elapsed}s)        `);
          lastStatus = s;
          lastTick = Date.now();
        }
        if (DONE.has(s)) {
          process.stdout.write("\n");
          return tx;
        }
        if (s === "CANCELED" || s === "UNDETERMINED") {
          process.stdout.write("\n");
          throw new Error(`${label} terminal status ${s}`);
        }
      } catch (e: any) {
        if (!String(e?.message ?? "").includes("not found")) {
          // transient RPC failure — keep polling
        }
      }
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
    throw new Error(`${label} timed out after ${POLL_MAX_MIN} min waiting for ${until}`);
  }

  const waitFinalized = (txHash: `0x${string}`, label: string) =>
    waitForStatus(txHash, label, "FINALIZED");

  // Capture every tx we send so failures can be re-diagnosed without RPC
  // archaeology. Flushed to deployments.bradbury.json at the end.
  const txLog: Array<{ step: string; hash: string; status: string }> = [];

  // Flush partial tx_log to disk on every transition so a crash mid-deploy
  // leaves a recoverable record (otherwise we orphan contracts with no way
  // to look them up).
  function flushPartialLog(addresses: Partial<{ stake_manager: string; adjudication: string; claim_registry: string }> = {}) {
    const partial = {
      chain: target, chain_id: chain.id,
      deployer: account.address, deployed_at: new Date().toISOString(),
      tx_log: txLog, ...addresses, partial: true,
    };
    try {
      writeFileSync(resolve(REPO_ROOT, `deployments.${target}.partial.json`), JSON.stringify(partial, null, 2));
    } catch { /* not fatal */ }
  }

  async function deploy(
    label: string, file: string, args: any[] = [],
  ): Promise<{ addr: `0x${string}`; hash: `0x${string}` }> {
    console.log(`\n${label} ${file} ...`);
    // consensusMaxRotations: 1 — one validator round, no appeal escalation.
    // Deploy is deterministic (bytecode storage); a single consensus round is
    // sufficient. Cuts Bradbury wall-clock from ~30 min to ~10 min per deploy.
    const txHash = await client.deployContract({
      code: read(file), args,
      ...(target === "bradbury" ? { consensusMaxRotations: 1 } : {}),
    });
    txLog.push({ step: `${label} ${file}`, hash: txHash, status: "submitted" });
    flushPartialLog();
    const receipt = await waitForStatus(txHash, label, "ACCEPTED");
    txLog[txLog.length - 1].status = "ACCEPTED";
    flushPartialLog();

    // Reject silent-orphan deploys. Real execution status lives in
    // consensus_data.leader_receipt[0].execution_result.
    //
    // Success values vary by network/SDK:
    //  - Studio:   "SUCCESS"
    //  - Bradbury: "FINISHED_WITH_RETURN", "FINISHED_WITH_VOID"
    //  - Either:    0 (numeric enum)
    // Anything containing "ERROR" / "EXIT_CODE" / "REVERT" is failure.
    const leaderArr = (receipt as any)?.consensus_data?.leader_receipt;
    const leader = Array.isArray(leaderArr) ? leaderArr[0] : leaderArr;
    const execResult = leader?.execution_result
      ?? (receipt as any)?.txExecutionResultName
      ?? (receipt as any)?.txExecutionResult;
    const SUCCESS_VALUES: ReadonlySet<string | number> = new Set([
      "SUCCESS", "FINISHED_WITH_RETURN", "FINISHED_WITH_VOID", 0,
    ]);
    const isSuccess = execResult == null || SUCCESS_VALUES.has(execResult);
    if (!isSuccess) {
      // Surface the genvm error so we don't have to spelunk again next time.
      const stderr = leader?.genvm_result?.stderr;
      const errDesc = leader?.genvm_result?.error_description;
      // `result` may be a base64 string OR a pre-decoded object depending on
      // SDK version. Try both, fall back to JSON of whatever we got.
      let decoded = "";
      const r = leader?.result;
      if (typeof r === "string") {
        try { decoded = Buffer.from(r, "base64").toString("utf8").replace(/^[\x00-\x1f]+/, ""); }
        catch { decoded = r.slice(0, 200); }
      } else if (r != null) {
        decoded = JSON.stringify(r).slice(0, 300);
      }
      throw new Error(
        `${label} silent-orphan: execution_result=${execResult}` +
        (decoded ? ` · reason=${decoded}` : "") +
        (stderr ? ` · stderr=${stderr.slice(0, 200)}` : "") +
        (errDesc ? ` · ${errDesc}` : "")
      );
    }

    // Receipt shape varies by SDK + network. Walk every plausible location.
    // On Studio, deploys are CREATE-style and `to_address` is the new contract.
    const addr =
      receipt?.txDataDecoded?.contractAddress ??
      receipt?.data?.contractAddress ??
      receipt?.contract_address ??
      receipt?.contractAddress ??
      receipt?.to_address ??
      receipt?.recipient;
    if (!addr) {
      throw new Error(`${label} accepted but no contractAddress in receipt: ${JSON.stringify(receipt).slice(0, 800)}`);
    }
    console.log("       ", addr);
    return { addr: addr as `0x${string}`, hash: txHash };
  }

  async function call(label: string, address: `0x${string}`, functionName: string, args: any[]) {
    console.log(`\n${label} ${functionName} ...`);
    // leaderOnly: true — wiring calls just store an address; fully deterministic,
    // no need for multi-validator consensus. Near-instant on Bradbury.
    const txHash = await client.writeContract({
      address, functionName, args, value: 0n,
      ...(target === "bradbury" ? { leaderOnly: true } : {}),
    });
    txLog.push({ step: `${label} ${functionName}`, hash: txHash, status: "submitted" });
    // Wait for ACCEPTED only — same reasoning as deploy(): skips the 30-min
    // READY_TO_FINALIZE window. The state write is committed at ACCEPTED.
    const receipt = await waitForStatus(txHash, label, "ACCEPTED");
    txLog[txLog.length - 1].status = "ACCEPTED";
    // Bradbury returns FINISHED_WITH_VOID for void functions — must accept it.
    const leaderArr2 = (receipt as any)?.consensus_data?.leader_receipt;
    const leader2 = Array.isArray(leaderArr2) ? leaderArr2[0] : leaderArr2;
    const execResult =
      leader2?.execution_result ??
      (receipt as any)?.txExecutionResultName ??
      (receipt as any)?.txExecutionResult;
    const SUCCESS_VALUES2: ReadonlySet<string | number> = new Set([
      "SUCCESS", "FINISHED_WITH_RETURN", "FINISHED_WITH_VOID", 0,
    ]);
    if (execResult != null && !SUCCESS_VALUES2.has(execResult)) {
      throw new Error(`${label} accepted but execution result = ${execResult}`);
    }
  }

  // Deploy order (all sequential — same sender address = shared nonce space):
  //   A: StakeManager          (consensusMaxRotations:1, wait ACCEPTED → ~7 min)
  //   B: AdjudicationContract  (consensusMaxRotations:1, wait ACCEPTED → ~7 min)
  //   C: ClaimRegistry         (consensusMaxRotations:1, wait ACCEPTED → ~7 min)
  //   D: set_registry          (leaderOnly:true, wait ACCEPTED → ~30 sec)
  //   E: wire                  (leaderOnly:true, wait ACCEPTED → ~30 sec)
  //
  // Total ~25 min on Bradbury vs ~150 min original.
  // Stopping at ACCEPTED (not FINALIZED) skips the 30-min READY_TO_FINALIZE
  // window per tx — state is committed and nonce consumed at ACCEPTED.
  console.log("\nPhase A: deploying StakeManager ...");
  const { addr: stakeManager, hash: smHash } = await deploy("[1/3]", "stake_manager.py");
  flushPartialLog({ stake_manager: stakeManager });

  console.log("\nPhase B: deploying AdjudicationContract ...");
  const { addr: adjudication } = await deploy("[2/3]", "adjudication_contract.py");
  flushPartialLog({ stake_manager: stakeManager, adjudication });

  console.log("\nPhase C: deploying ClaimRegistry ...");
  const { addr: registry } = await deploy("[3/3]", "claim_registry.py", [stakeManager, adjudication]);
  flushPartialLog({ stake_manager: stakeManager, adjudication, claim_registry: registry });

  // Bradbury enforces a limit of 4 concurrent pending transactions per account.
  // After 3 deploys all sit in ACCEPTED/READY_TO_FINALIZE (3 pending), we have
  // room for 1 more. Submitting both wire calls immediately would push to 5 on
  // the second call and get reverted.
  //
  // Fix: wait for the first deploy (StakeManager, submitted earliest) to
  // FINALIZE before wiring. That drops pending count to 2, so both wire calls
  // can be submitted sequentially within the 4-tx limit:
  //   wire-1/2 submitted: ADJ + REG + wire-1/2 = 3 pending  ✓
  //   wire-2/2 submitted: ADJ + REG + wire-1/2 + wire-2/2 = 4 pending  ✓
  //
  // SM ACCEPTED at ~t+7 min, FINALIZED at ~t+37 min. Total: ~37 min vs 90 min.
  if (target === "bradbury") {
    console.log("\nPhase D: waiting for StakeManager to finalize (clears pending-tx slot) ...");
    await waitForStatus(smHash, "[SM-finalize]", "FINALIZED");
  }

  console.log("\nPhase E: wiring contracts ...");
  await call("[wire-1/2]", stakeManager, "set_registry", [registry]);
  await call("[wire-2/2]", adjudication, "wire",         [registry, stakeManager]);

  const out = {
    chain: target,
    chain_id: chain.id,
    deployer: account.address,
    deployed_at: new Date().toISOString(),
    tx_log: txLog,
    stake_manager: stakeManager,
    adjudication,
    claim_registry: registry,
  };

  const deploymentsPath = resolve(REPO_ROOT, `deployments.${target}.json`);
  writeFileSync(deploymentsPath, JSON.stringify(out, null, 2));
  console.log(`\nwrote ${deploymentsPath}`);

  const envPath = resolve(__dirname, "..", ".env.local");
  const envBody =
    `NEXT_PUBLIC_CHAIN=${target}\n` +
    `NEXT_PUBLIC_REGISTRY=${registry}\n` +
    `NEXT_PUBLIC_STAKE_MANAGER=${stakeManager}\n` +
    `NEXT_PUBLIC_ADJUDICATION=${adjudication}\n`;
  writeFileSync(envPath, envBody);
  console.log(`wrote ${envPath}`);
  console.log("\ndone. Restart `npm run dev` to pick up the new env.");
}

main().catch((e) => {
  console.error("\nDEPLOY FAILED");
  console.error(e);
  process.exit(1);
});
