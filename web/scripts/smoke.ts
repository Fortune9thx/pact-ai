// End-to-end smoke test of the Eristic lifecycle against the live Studionet
// deployment. Drives one claim through: stake FOR -> challenge + stake AGAINST
// -> submit_for_review -> adjudicate -> verify verdict + reasoning recorded.
//
// Uses the deploy key (or any key in .deploy-key / GL_PRIVATE_KEY) for all
// writes. Same key for both sides — testnet smoke test, not a fairness test.

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, createAccount } from "genlayer-js";
import { studionet, testnetBradbury } from "genlayer-js/chains";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");

// Load .env.local so NEXT_PUBLIC_CHAIN is available when running via tsx directly.
try {
  const envLocal = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
  for (const line of envLocal.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1].trim()] = m[2].trim();
  }
} catch { /* .env.local absent — fine */ }

const target = process.env.NEXT_PUBLIC_CHAIN === "bradbury" ? "bradbury" : "studionet";
const chain  = target === "bradbury" ? testnetBradbury : studionet;
const deployFile = resolve(REPO_ROOT, `deployments.${target}.json`);
if (!existsSync(deployFile)) {
  console.error(`No deployment found for ${target}: ${deployFile}`);
  process.exit(1);
}
const D = JSON.parse(readFileSync(deployFile, "utf8"));

const REGISTRY = D.claim_registry as `0x${string}`;
const STAKE_MGR = D.stake_manager as `0x${string}`;
const ADJ = D.adjudication as `0x${string}`;

// If a claim id is passed, smoke that. Otherwise create a fresh text-only
// claim so we don't depend on external URLs surviving (prior adjudicate runs
// crashed on a 404'd seed URL — URL resilience is a follow-up task).
const ARG_CLAIM_ID = process.argv[2] ? Number(process.argv[2]) : null;
const STAKE_AMOUNT = 100_000_000_000_000_000n; // 0.1 GEN

const FRESH_STATEMENT = (
  "Code reviewed by an AI assistant catches more security bugs than the same " +
  "code reviewed only by humans of equivalent seniority."
);
const FRESH_ARGUMENT = (
  "Multiple studies of AI-assisted code review (Cursor, Copilot Workspace, " +
  "Greptile) show 20-40% lift in caught vulnerabilities versus human-only " +
  "review at the same time budget. AI is tireless across an entire diff; " +
  "human reviewers fatigue and skim. The gap widens for boring-but-critical " +
  "categories like input validation and authn/authz misuse."
);
const FRESH_EVIDENCE = (
  "quote: 'AI-assisted PR review caught 31% more CWE-89 issues vs human-only review' " +
  "— Greptile state of code review 2026"
  + " | quote: 'Cursor reviewer found 18 additional bugs in our test set of " +
  "100 PRs where the human reviewer missed them.' — anthropic.com/research/code-review"
);

// Per-seed counter-arguments. When smoking an existing seed claim, picking
// the right counter makes the dispute substantive and the resulting verdict
// genuinely interesting. Fallback at the end is used for fresh / unknown
// claims (where the validator will rightly call out the topic mismatch).
const PER_CLAIM_COUNTER: Record<number, { argument: string; evidence: string }> = {
  1: {
    argument:
      "Ethereum's existing oracle and ZK-coprocessor stack already handles " +
      "subjective inputs via off-chain attestations; GenLayer just renames " +
      "the trust assumption. Validators running LLMs are still trusted " +
      "parties — you've moved the oracle problem from Chainlink to a " +
      "validator set, not eliminated it. Calling consensus-of-LLMs a " +
      "'verdict' is rebranding, not a new capability.",
    evidence:
      "quote: 'All oracle solutions push the trust assumption to a smaller " +
      "trusted set rather than removing it.' — Vitalik Buterin, EthResearch 2024" +
      " | quote: 'LLMs reach the same wrong answer for the same reasons.' " +
      "— Anthropic safety researcher, on validator-of-LLMs designs",
  },
  2: {
    argument:
      "Junior roles aren't being eliminated; they're shifting to mid-level " +
      "supervised by AI. Layoff data conflates juniors with QA outsourcing " +
      "cuts. New-grad SWE postings in the US were up 6% YoY through Q1 " +
      "2026 even with Copilot adoption — net effect is augmentation, not " +
      "replacement. Calling that 'replacement within 24 months' is " +
      "extrapolation beyond the evidence.",
    evidence:
      "quote: 'New-grad SWE postings (US): +6.1% YoY' — LinkedIn Workforce " +
      "Report Q1 2026" +
      " | quote: 'AI tools are best modeled as productivity multipliers, " +
      "not seat eliminators, in the 24-month horizon.' — Gartner 2026",
  },
  3: {
    argument:
      "Bitcoin's energy consumption was justified at $30k. At $200k+ the " +
      "security budget vastly exceeds any realistic attack cost — the " +
      "marginal energy is securing already-safe value. The same security " +
      "guarantees are achievable with rotating committee proof-of-stake " +
      "at <0.1% of the energy footprint. 'Cost of attack scales with hash " +
      "rate' is true but irrelevant once attack cost exceeds attacker " +
      "budget by 100x.",
    evidence:
      "quote: 'Ethereum's PoS transition reduced energy 99.95% with no " +
      "security incidents in 2 years post-merge.' — ethereum.org 2024" +
      " | quote: 'Security budget should scale with attack cost, not " +
      "asset value.' — staking economics research, Paradigm 2025",
  },
  4: {
    argument:
      "User counts plateau because the protocols are still pre-network-effect, " +
      "not because users don't want decentralization. Bluesky tripled MAU in " +
      "2025 once it added quote-posts and search. The 'algorithmic feed' " +
      "argument confuses cause and effect — Twitter's algorithm is the " +
      "*reason* users want to leave, not the reason they stay. Federation " +
      "just hasn't crossed the threshold yet.",
    evidence:
      "quote: 'Bluesky MAU 4.2M -> 13.1M between Jan and Dec 2025' — " +
      "Bluesky transparency report" +
      " | quote: 'When asked, 71% of X power users cite algorithm " +
      "manipulation as their primary frustration.' — Pew 2025",
  },
  5: {
    argument:
      "Regulatory capture would predict the labs *opposing* safety research " +
      "publication — instead they're the ones funding it. If lobbying were " +
      "the motive, the cheaper play is to oppose any regulation at all, " +
      "as the open-source coalition is doing. The 'moat' framing conflates " +
      "honest belief in real risk with strategic positioning, with no way " +
      "to distinguish them empirically.",
    evidence:
      "quote: 'Anthropic published its Responsible Scaling Policy with " +
      "specific commitments that constrain its own deployment freedom.' " +
      "— anthropic.com/rsp" +
      " | quote: 'Frontier model labs cumulatively published 240+ safety " +
      "papers in 2025, vs ~40 from the open-source AI sector.' — " +
      "Stanford AI Index 2026",
  },
};

const FALLBACK_COUNTER = {
  argument:
    "The submitted evidence doesn't support the asserted causal claim. " +
    "Correlation is not causation, the sample size is insufficient, and " +
    "the cited sources are either unreachable or off-topic. A reasonable " +
    "reader would conclude the claim is unproven, not proven.",
  evidence:
    "quote: 'Strong claims require strong evidence; the burden is on the " +
    "claimant.' — Hitchens's razor",
};

const counter = PER_CLAIM_COUNTER[ARG_CLAIM_ID ?? -1] ?? FALLBACK_COUNTER;
const COUNTER_ARGUMENT = counter.argument;
const COUNTER_EVIDENCE = counter.evidence;

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
  throw new Error("no deploy key");
}

// On Bradbury, stop at ACCEPTED — state is committed, nonce consumed, 30-min
// READY_TO_FINALIZE window skipped. On studionet, finality is instant so we
// still reach FINALIZED quickly.
const SMOKE_DONE = target === "bradbury"
  ? new Set(["ACCEPTED", "FINALIZED"])
  : new Set(["FINALIZED"]);
// Bradbury: 45 min per call (adjudicate w/ URL fetching can be slow).
// Studionet: 5 min ceiling.
const SMOKE_MAX_ITERS = target === "bradbury" ? 540 : 60; // × 5s each

const SMOKE_SUCCESS: ReadonlySet<string | number> = new Set([
  "SUCCESS", "FINISHED_WITH_RETURN", "FINISHED_WITH_VOID", 0,
]);

async function waitFinalized(client: any, hash: `0x${string}`, label: string) {
  let lastStatus = "";
  for (let i = 0; i < SMOKE_MAX_ITERS; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    try {
      const tx: any = await client.getTransaction({ hash });
      const s = tx?.statusName ?? String(tx?.status ?? "?");
      if (s !== lastStatus) {
        process.stdout.write(`\r  ${label}: ${s}              `);
        lastStatus = s;
      }
      if (SMOKE_DONE.has(s)) {
        process.stdout.write("\n");
        const lr = tx?.consensus_data?.leader_receipt?.[0] ?? tx?.consensus_data?.leader_receipt;
        const execResult = lr?.execution_result;
        if (execResult != null && !SMOKE_SUCCESS.has(execResult)) {
          console.error(`  EXEC FAILED: ${execResult}`);
          console.error("  stderr:", (lr.genvm_result?.stderr ?? "").slice(-1000));
          throw new Error(`${label} reverted: ${execResult}`);
        }
        if (lr?.genvm_result?.stdout) {
          console.log(`  stdout: ${lr.genvm_result.stdout.trim()}`);
        }
        return tx;
      }
      if (s === "CANCELED" || s === "UNDETERMINED") {
        throw new Error(`${label} terminal status ${s}`);
      }
    } catch (e: any) {
      if (!String(e?.message ?? "").includes("not found")) {
        // ignore transient — keep polling
      }
    }
  }
  throw new Error(`${label} timed out`);
}

async function read(client: any, address: `0x${string}`, functionName: string, args: any[] = []) {
  return await client.readContract({ address, functionName, args });
}

async function main() {
  const account = createAccount(loadKey());
  const client = createClient({ chain, account });
  console.log(`actor:    ${account.address}`);
  console.log(`registry: ${REGISTRY}\n`);

  let CLAIM_ID: number;

  if (ARG_CLAIM_ID === null) {
    console.log("[0] create_claim (text-only evidence)");
    const tx = await client.writeContract({
      address: REGISTRY,
      functionName: "create_claim",
      args: [FRESH_STATEMENT, FRESH_ARGUMENT, FRESH_EVIDENCE],
      value: 0n,
    });
    await waitFinalized(client, tx, "create_claim");
    // Read back the latest list_ids and use the newest one.
    const idsJson = (await read(client, REGISTRY, "list_ids", [])) as string;
    const ids = JSON.parse(idsJson) as number[];
    CLAIM_ID = ids[ids.length - 1];
    console.log(`     new claim id: #${CLAIM_ID}\n`);
  } else {
    CLAIM_ID = ARG_CLAIM_ID;
    console.log(`claim:    #${CLAIM_ID}\n`);
  }

  // ---- READ initial state -------------------------------------------
  const c0: any = JSON.parse(await read(client, REGISTRY, "get_claim", [CLAIM_ID]) as string);
  console.log(`[init] state=${c0.state}  statement="${c0.statement.slice(0, 60)}..."\n`);
  if (c0.state !== "OPEN") {
    console.log(`(claim already past OPEN — running what's still legal)`);
  }

  // ---- 1. STAKE FOR -------------------------------------------------
  if (c0.state === "OPEN" || c0.state === "UNDER_CHALLENGE") {
    console.log("[1] stake FOR (0.1 GEN)");
    const tx = await client.writeContract({
      address: STAKE_MGR,
      functionName: "stake_for_claim",
      args: [CLAIM_ID],
      value: STAKE_AMOUNT,
    });
    await waitFinalized(client, tx, "stake_for");
  }

  // ---- 2. CHALLENGE + STAKE AGAINST ---------------------------------
  const c1: any = JSON.parse(await read(client, REGISTRY, "get_claim", [CLAIM_ID]) as string);
  if (c1.state === "OPEN" || c1.state === "UNDER_CHALLENGE") {
    console.log("[2] challenge");
    const tx = await client.writeContract({
      address: REGISTRY,
      functionName: "challenge",
      args: [CLAIM_ID, COUNTER_ARGUMENT, COUNTER_EVIDENCE],
      value: 0n,
    });
    await waitFinalized(client, tx, "challenge");

    console.log("[2b] stake AGAINST (0.1 GEN)");
    const tx2 = await client.writeContract({
      address: STAKE_MGR,
      functionName: "stake_against_claim",
      args: [CLAIM_ID],
      value: STAKE_AMOUNT,
    });
    await waitFinalized(client, tx2, "stake_against");
  }

  // ---- 3. SUBMIT FOR REVIEW ----------------------------------------
  const c2: any = JSON.parse(await read(client, REGISTRY, "get_claim", [CLAIM_ID]) as string);
  if (c2.state === "UNDER_CHALLENGE") {
    console.log("[3] submit_for_review (auto-locks pool via cross-contract emit)");
    const tx = await client.writeContract({
      address: REGISTRY,
      functionName: "submit_for_review",
      args: [CLAIM_ID],
      value: 0n,
    });
    await waitFinalized(client, tx, "submit_for_review");
  }

  // ---- 4. ADJUDICATE -----------------------------------------------
  const c3: any = JSON.parse(await read(client, REGISTRY, "get_claim", [CLAIM_ID]) as string);
  if (c3.state === "UNDER_REVIEW") {
    console.log("[4] adjudicate — validators fetch URLs, summarize, reason");
    console.log("    (this is the LLM-heavy step; may take 1-3 min)");
    const tx = await client.writeContract({
      address: ADJ,
      functionName: "adjudicate",
      args: [CLAIM_ID],
      value: 0n,
    });
    await waitFinalized(client, tx, "adjudicate");
  }

  // ---- 5. VERIFY VERDICT --------------------------------------------
  console.log("\n[5] reading verdict...");
  const final: any = JSON.parse(await read(client, REGISTRY, "get_claim", [CLAIM_ID]) as string);
  console.log("\n========== FINAL STATE ==========");
  console.log("  state          :", final.state);
  console.log("  verdict        :", final.verdict || "(none)");
  console.log("  confidence     :", final.confidence, "bps");
  console.log("  evidence_weight:", final.evidence_weight, "bps");
  console.log("  reasoning      :");
  console.log("  " + (final.reasoning || "(none)").split("\n").join("\n  "));
  console.log("=================================");

  // pool
  const pool: any = JSON.parse(await read(client, STAKE_MGR, "get_pool", [CLAIM_ID]) as string);
  console.log("\npool:", pool);
}

main().catch((e) => { console.error("\nSMOKE FAILED:", e); process.exit(1); });
