# Eristic

**Decentralized claim adjudication on GenLayer.**
People stake on claims. Others challenge. Validators reason. Consensus settles.
The contract stores not only the result, but the reasoning.

**Live:** [eristic.vercel.app](https://eristic.vercel.app) — deployed on **GenLayer Bradbury Testnet**.

> ⚠️ Testnet only. All GEN tokens have no real-world monetary value. Get free test GEN at [testnet-faucet.genlayer.foundation](https://testnet-faucet.genlayer.foundation).

```
ERISTIC                              ● 5 ACTIVE CLAIMS_
GENLAYER · STUDIONET

ARENA              [ 0.2 GEN ] GenLayer's optimistic democracy can resolve…  RESOLVED  #1
Active Claims      [ 0.0 GEN ] AI coding assistants will replace junior…   OPEN     #2
Under Review       [ 0.0 GEN ] Bitcoin's energy consumption is justified…  OPEN     #3
Resolved           [ 0.0 GEN ] Decentralized social networks have failed…  OPEN     #4
My Stakes          [ 0.0 GEN ] The leading AI labs publicly fund safety…   OPEN     #5

+ CREATE CLAIM
CONNECT WALLET
```

## What makes this Eristic and not a clone

The whole reason this app exists is the **adjudication moment**. When a
claim hits `UNDER_REVIEW` and someone calls `adjudicate(id)`, the contract:

1. Pulls the dispute package back on-chain (so the caller can't lie about it).
2. **Fetches every cited URL** via `gl.nondet.web.render`.
3. **Summarizes each fetched page** under `gl.eq_principle.prompt_non_comparative` —
   the leader produces the summary, validators check it's faithful to the
   page text rather than re-summarizing themselves.
4. **Reasons toward a verdict** under `gl.eq_principle.prompt_comparative` —
   every validator independently produces `{verdict, confidence, evidence_weight, reasoning}`
   and they reconcile under an explicit equivalence principle.
5. **Writes the verdict + the validators' actual reasoning** back to the
   registry, and triggers stake settlement via cross-contract `emit()`.

Example verdict, captured on Studionet:

> **PARTIAL** · confidence 68% · evidence weight 43%
>
> *"The claim is only partially substantiated. The strongest support is the
> user-quoted statement that 'Intelligent contracts can read natural-language
> inputs and produce non-deterministic outputs through validator consensus,'
> which does support that GenLayer is designed to handle subjective or
> non-deterministic inputs in a way Ethereum contracts ordinarily do not.
> However, the cited GenLayer whitepaper provided no usable text and the
> docs link failed, so there is little primary-source evidence here proving
> the stronger comparative claim that GenLayer can definitively resolve
> subjective disputes that Ethereum fundamentally cannot. The counter-evidence
> is weakly relevant: the quoted AI-reviewer false-positive and anecdotal
> Hacker News comment concern AI code review quality, not GenLayer's
> dispute-resolution mechanism specifically."*

A smart contract that **understood the dispute**, noticed dead links,
weighed evidence relevance, and gave a nuanced verdict. Ethereum can't.

## Architecture

```
┌─────────────────────────┐   create_claim, challenge, submit, tip
│      ClaimRegistry      │ ◀────────────────────────────────  Users / UI
│  ─────────────────────  │
│  state machine           │
│  Claim dataclass         │
│  cross-contract emit ───┼──▶ StakeManager.lock_stake
└──────────┬──────────────┘
           │ verdict written back
           ▼
┌─────────────────────────┐   adjudicate(id)
│  AdjudicationContract   │ ◀──────────────  Anyone
│  ─────────────────────  │
│  gl.nondet.web.render   │
│  gl.eq_principle.       │
│    prompt_comparative   │
│    prompt_non_comparative│
│    strict_eq             │
│  cross-contract emit ───┼──▶ Registry.record_verdict
│                         ├──▶ StakeManager.distribute_rewards
└─────────────────────────┘

┌─────────────────────────┐   stake_for, stake_against (payable), tip
│      StakeManager       │ ◀────────────────────────────────  Users / UI
│  ─────────────────────  │
│  total_for / against    │
│  locked / settled       │
└─────────────────────────┘
```

## Contracts ([`contracts/`](contracts/))

- **[`claim_registry.py`](contracts/claim_registry.py)** — lifecycle
  (`OPEN → UNDER_CHALLENGE → UNDER_REVIEW → RESOLVED → CLOSED`),
  `Claim` dataclass (`@allow_storage @dataclass`),
  `tip_claim` (payable demo write), cross-contract `emit()` to auto-lock
  pool on `submit_for_review`.
- **[`stake_manager.py`](contracts/stake_manager.py)** — payable
  `stake_for_claim` / `stake_against_claim`, pool totals (`TreeMap[u256, u256]`),
  lock/settle state, registry-gated `lock_stake` / `distribute_rewards`.
- **[`adjudication_contract.py`](contracts/adjudication_contract.py)** —
  subjective core. Per-URL fetch with defensive `try/except` inside the
  closure so `NondetException` on a dead URL produces a placeholder
  string and `strict_eq` still reaches equivalence. Verdict prompt
  under `prompt_comparative` with explicit equivalence-principle text.

Every contract option contributing to grading is exercised:

| Feature | Where |
|---|---|
| `@gl.public.view` | every contract |
| `@gl.public.write` | most methods |
| `@gl.public.write.payable` | `stake_for_claim`, `stake_against_claim`, `tip_claim` |
| `gl.eq_principle.prompt_comparative` | verdict |
| `gl.eq_principle.prompt_non_comparative` | per-URL summarization |
| `gl.eq_principle.strict_eq` | per-URL fetch |
| `gl.nondet.exec_prompt` | summarization + verdict |
| `gl.nondet.web.render(url, mode="text")` | evidence fetching |
| `gl.contract_interface` + `emit()` | cross-contract writes (auto-lock, record_verdict, distribute_rewards) |
| `gl.vm.UserError` | every revert path |
| `print()` for genvm_log | every state-changing write |
| `@allow_storage @dataclass` storage struct | `Claim` |
| `TreeMap` / primitive value types | pool maps |

## Quick start

```powershell
cd web
npm install
# put your studionet key in web/.deploy-key (one line, 0x...)
npm run deploy            # ~3 min on studionet
npm run seed              # populate 5 hand-crafted demo claims
npm run smoke             # drive one claim end-to-end, print verdict
npm run dev               # boot the Arena UI
```

Open `http://localhost:3000`. The homepage IS the Arena — no marketing,
no hero section. Just the live claim feed.

## Frontend ([`web/`](web/))

Next.js 15 App Router. Terminal-courtroom aesthetic — monospaced,
amber/blood/bone palette, scanline overlay. Reads come from
`createClient({chain: studionet})`; writes go through the MetaMask
GenLayer Snap.

- `/` — Arena. Live claim feed, sidebar filters, right-panel trending /
  largest pools / recent verdicts / validator activity (all derived from
  actual on-chain state, no mock data).
- `/claim/[id]` — battlefield view. FOR / AGAINST columns, validator
  status while `UNDER_REVIEW`, full verdict + reasoning when `RESOLVED`.
- `/create` — file a claim.

Live tx pending/finalized chips (`components/TxToasts.tsx`), 15s
auto-refresh of the Arena feed (`components/AutoRefresh.tsx`), wallet
balance pill with faucet link (`components/ConnectButton.tsx`).

## Deploy to Bradbury

When you're ready to demo on the real validator network:

```powershell
npm run deploy:bradbury   # ~2.5 hours; each step waits for FINALIZED
```

See [RUNBOOK.md](RUNBOOK.md) for the full operator guide, failure modes,
and key-handling rules.

## Status

- [x] Contracts deployed to Studionet ([`deployments.studionet.json`](deployments.studionet.json))
- [x] All GenLayer contract options exercised (web fetch, eq_principle,
      cross-contract emit, payable, dataclass storage, UserError)
- [x] Arena frontend live ([`web/`](web/)) with reads + writes + toasts +
      auto-refresh + balance pill
- [x] Lifecycle smoke-tested: one claim resolved with substantive
      validator reasoning citing specific evidence items
- [x] Bradbury testnet deployment ([`deployments.bradbury.json`](deployments.bradbury.json))
- [x] Mobile-responsive UI
- [x] Live at [eristic.vercel.app](https://eristic.vercel.app)
