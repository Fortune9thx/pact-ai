// Seed the live Arena with hand-crafted demo claims.
//
// Usage:
//   npm run seed
//
// Reads the deploy key from web/.deploy-key or $env:GL_PRIVATE_KEY (same as
// the deploy script). Reads contract addresses from deployments.bradbury.json.
//
// Why pre-seeded claims: every screenshot, demo, and end-to-end smoke test of
// Eristic starts from an empty Arena unless we hand it some content. Real
// create_claim calls cost 10–30 min each to finalize on Bradbury — manual
// seeding through the UI is painful. This script fires them all in parallel,
// returns immediately, and you wake up tomorrow to a populated Arena.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, createAccount } from "genlayer-js";
import { studionet, testnetBradbury } from "genlayer-js/chains";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");

function loadKey(): `0x${string}` {
  const fromEnv = process.env.GL_PRIVATE_KEY;
  if (fromEnv) return fromEnv as `0x${string}`;
  try {
    const txt = readFileSync(resolve(__dirname, "..", ".deploy-key"), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      if (t.startsWith("0x")) return t as `0x${string}`;
      const m = t.match(/^(?:PRIVATE_KEY|GL_PRIVATE_KEY)\s*=\s*(0x[0-9a-fA-F]+)\s*$/);
      if (m) return m[1] as `0x${string}`;
    }
  } catch { /* fall through */ }
  console.error("missing GL_PRIVATE_KEY (env or web/.deploy-key)");
  process.exit(1);
}

interface Seed {
  statement: string;
  argument: string;     // initial FOR argument
  evidence: string;     // pipe-delimited URIs / quotes
}

// Each claim is something a GenLayer validator can plausibly reason about:
// has a defensible side, has counter-arguments, has external evidence the
// validator can interpret. Avoid pure opinion ("X is good"); favour
// falsifiable framings ("X will happen by Y"). This is what the protocol
// is *for* — disputes Ethereum can't adjudicate because there's no
// deterministic oracle.
//
// Each claim includes at least one REACHABLE URL (typically Wikipedia) so
// the validator demonstrates real `gl.nondet.web.render` fetching alongside
// the resilient handling of 404'd sources.
const SEEDS: Seed[] = [
  {
    statement:
      "GenLayer's optimistic democracy can resolve subjective disputes that " +
      "Ethereum smart contracts fundamentally cannot.",
    argument:
      "Ethereum smart contracts are deterministic — every node must reach the " +
      "same output from the same input. Disputes over natural-language evidence " +
      "(was this tweet defamatory? did this startup fake metrics?) have no " +
      "deterministic answer, so Ethereum can only resolve them via off-chain " +
      "oracles trusted by humans. GenLayer's validator network runs LLMs and " +
      "reconciles their judgments through an equivalence principle, producing " +
      "an on-chain verdict that is both subjective and verifiable.",
    evidence:
      "https://en.wikipedia.org/wiki/Smart_contract" +
      " | https://genlayer.com" +
      " | quote: 'Intelligent contracts can read natural-language inputs and " +
      "produce non-deterministic outputs through validator consensus.'",
  },
  {
    statement:
      "AI coding assistants will replace the majority of junior software " +
      "engineering roles within 24 months.",
    argument:
      "GitHub Copilot adoption, Cursor's enterprise growth, and Anthropic's " +
      "Claude Code release have all compressed the time-to-PR for routine work " +
      "by 40-70% in published benchmarks. Junior roles are concentrated in " +
      "exactly the work being compressed: writing tests, scaffolding endpoints, " +
      "translating designs to components. Layoff data from Q1 2026 shows the " +
      "junior-band reductions are 3x the senior-band rate at the FAANG layer.",
    evidence:
      "https://en.wikipedia.org/wiki/GitHub_Copilot" +
      " | https://layoffs.fyi" +
      " | https://www.bls.gov/oes/current/oes151252.htm" +
      " | quote: 'Junior-band reductions are 3x the senior-band rate at the FAANG layer' " +
      "— Q1 2026 layoffs analysis",
  },
  {
    statement:
      "Bitcoin's energy consumption is justified by the security properties " +
      "it provides as a non-state monetary network.",
    argument:
      "Cost of attack scales linearly with hash rate, which scales linearly " +
      "with energy expenditure. Reducing energy reduces security symmetrically. " +
      "For a $1T+ asset that must resist nation-state seizure, the security " +
      "budget needs to be in the tens of billions per year — that's the " +
      "intended design, not a flaw. Comparing Bitcoin's energy to YouTube or " +
      "Christmas lights misses the threat model.",
    evidence:
      "https://en.wikipedia.org/wiki/Environmental_impact_of_bitcoin" +
      " | https://ccaf.io/cbnsi/cbeci" +
      " | quote: 'Cost of attack scales linearly with hash rate, which scales " +
      "linearly with energy expenditure' — Bitcoin security model whitepaper" +
      " | quote: 'For a $1T+ asset that must resist nation-state seizure, the " +
      "security budget needs to be in the tens of billions per year' — NYDIG research",
  },
  {
    statement:
      "Decentralized social networks have failed to displace incumbents " +
      "because users prefer algorithmic feeds, not censorship resistance.",
    argument:
      "Mastodon, Bluesky, Farcaster, and Nostr have all plateaued at <2% of " +
      "their addressable market despite multiple Twitter/X exodus events. " +
      "Power users self-select for the protocols; mainstream users do not " +
      "follow. The differentiator they offer (no central moderator) is not the " +
      "feature mainstream users say they want — surveys consistently show " +
      "preference for relevance, not control. The decentralized stack has " +
      "weaker algorithmic ranking, which is the actual product.",
    evidence:
      "https://en.wikipedia.org/wiki/Decentralized_social_network" +
      " | https://en.wikipedia.org/wiki/Mastodon_(social_network)" +
      " | quote: 'Users do not migrate for principles; they migrate for " +
      "better recommendations.' — a16z social state report 2026" +
      " | quote: 'Mastodon plateaued at under 2% of its addressable market " +
      "despite multiple Twitter exodus events.'",
  },
  {
    statement:
      "The leading AI labs publicly fund safety research primarily to entrench " +
      "regulatory moats, not because they believe the risks they describe.",
    argument:
      "Every major lab has spent more on lobbying for compute-threshold and " +
      "licensing regimes than on adversarial-robustness research. The proposed " +
      "frameworks favour incumbents with capital to comply and disadvantage " +
      "open-source releases that could competitively displace them. Internal " +
      "communications surfaced via litigation suggest revenue protection is a " +
      "stated motivation. This is regulatory capture wearing a safety mask.",
    evidence:
      "https://en.wikipedia.org/wiki/Regulatory_capture" +
      " | https://en.wikipedia.org/wiki/AI_safety" +
      " | quote: 'Every major lab has spent more on lobbying for compute-threshold " +
      "and licensing regimes than on adversarial-robustness research.'" +
      " | quote (court filing): 'Compute-threshold licensing would impose " +
      "compliance costs that effectively exclude all non-funded competitors.'",
  },
];

async function main() {
  const studionetPath = resolve(REPO_ROOT, "deployments.studionet.json");
  const bradburyPath  = resolve(REPO_ROOT, "deployments.bradbury.json");
  const path = existsSync(studionetPath) ? studionetPath : bradburyPath;
  const deployments = JSON.parse(readFileSync(path, "utf8"));
  const registry = deployments.claim_registry as `0x${string}`;
  if (!registry) {
    console.error(`${path} missing claim_registry`);
    process.exit(1);
  }
  const chain = deployments.chain === "bradbury" ? testnetBradbury : studionet;

  const account = createAccount(loadKey());
  const client = createClient({ chain, account });

  console.log(`target:   ${deployments.chain}`);
  console.log(`seeding ${SEEDS.length} claims from ${account.address}`);
  console.log(`registry: ${registry}\n`);

  // Fire sequentially — testnet nonce management hates parallel sends from
  // the same account. Each call returns quickly (just the tx hash); the
  // ~10–30 min finalization happens on-chain in the background.
  for (let i = 0; i < SEEDS.length; i++) {
    const seed = SEEDS[i];
    const preview = seed.statement.slice(0, 60) + (seed.statement.length > 60 ? "…" : "");
    process.stdout.write(`  [${i + 1}/${SEEDS.length}] ${preview}\n          `);
    try {
      const hash = await client.writeContract({
        address: registry,
        functionName: "create_claim",
        args: [seed.statement, seed.argument, seed.evidence],
        value: 0n,
      });
      const explorer = deployments.chain === "bradbury"
        ? `https://explorer-bradbury.genlayer.com/tx/${hash}`
        : `https://studio.genlayer.com/tx/${hash}`;
      console.log(`tx ${hash}`);
      console.log(`          explorer: ${explorer}\n`);
    } catch (e: any) {
      console.log(`FAILED: ${e?.shortMessage ?? e?.message ?? String(e)}\n`);
    }
  }

  console.log("done. Claims will appear in the Arena once they finalize (~10–30 min each).");
}

main().catch((e) => {
  console.error("\nSEED FAILED");
  console.error(e);
  process.exit(1);
});
