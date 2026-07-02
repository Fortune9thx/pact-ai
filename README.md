# Pact — AI-Powered Creative Escrow on GenLayer

**Live demo → [vibecheck-mocha-one.vercel.app](https://vibecheck-mocha-one.vercel.app)**  
**Contract source → [`contracts/vibecheck.py`](contracts/vibecheck.py)**  
**GitHub → [github.com/Fortune9thx/pact-ai](https://github.com/Fortune9thx/pact-ai)**

---

## What it is

Pact is escrow infrastructure for creative work built entirely on GenLayer Intelligent Contracts. When a buyer commissions creative work — a logo, landing page copy, animation — payment is locked in escrow. If the buyer and seller disagree on quality, a GenLayer AI evaluator reads the original brief and the submitted deliverable, then returns an objective recommendation with a confidence score and full reasoning. The buyer always makes the final call; AI is an advisor, not a judge.

No marketplace. No strangers. Just protection for deals with people you already know.

---

## The problem

Creative commissions between people who know each other fail in predictable ways:

- Buyer pays upfront → seller disappears or delivers poor work
- Seller delivers first → buyer ghosts or disputes on bad faith
- Disputes go nowhere — there's no objective standard for "did this meet the brief?"

Traditional smart contracts can't help here. Evaluating whether a logo "captures a photography brand" or copy "uses direct, no-jargon tone" requires judgment — not arithmetic.

---

## How GenLayer solves it

GenLayer's `gl.nondet.exec_prompt()` lets the contract call an LLM inside a decentralized validator network. Multiple validators independently run the same prompt and reach consensus via the **Equivalence Principle** — they don't need identical outputs, just equivalent conclusions. This makes subjective quality evaluation trustless and tamper-resistant.

Pact's contract uses this for `request_ai_review`. Two separate fixes were needed to make this reliable, in order:

**1. Binary verdict, not free-form JSON.** Early iterations let the LLM return 6 free-form fields. Validators running the same prompt could reach the same underlying judgment but phrase it slightly differently, which broke consensus even when everyone agreed on the actual verdict. Constraining `result` to a fixed `PASS`/`FAIL` enum removes that ambiguity.

**2. Explicit non-comparative equivalence principle.** GenLayer offers three consensus strategies for non-deterministic calls (`strict_eq`, `prompt_comparative`, `prompt_non_comparative`). The contract now explicitly picks `prompt_non_comparative`: the leader runs the LLM call once, and validators judge the leader's output against stated criteria instead of independently re-running the prompt and demanding byte-identical text back. This matters because the verdict still contains a free-form `reasoning` field — an LLM will never phrase that identically twice, so any principle that requires exact reproduction will spuriously fail even when every validator agrees on the substance.

```python
@gl.public.write
def request_ai_review(self, deal_id: str) -> None:
    deal = self._get_deal(deal_id)
    pt, su, sd = deal["prompt"], deal["submission"], deal["submission_description"]

    def run() -> str:
        p = (
            "Evaluate submission against brief.\n"
            "BRIEF: " + pt + "\nURL: " + su + "\nNOTES: " + sd + "\n"
            "PASS if it fits. FAIL otherwise.\n"
            'JSON only: {"result":"PASS or FAIL","confidence":0-100,"reasoning":"..."}'
        )
        r = gl.nondet.exec_prompt(p).strip()
        i, j = r.find("{"), r.rfind("}")
        return r[i:j + 1] if i != -1 and j != -1 else r

    raw_result = gl.eq_principle.prompt_non_comparative(
        run,
        task="Judge if a submission satisfies a brief; return PASS/FAIL, confidence, reasoning.",
        criteria='Valid JSON: "result" is PASS or FAIL, "confidence" 0-100, "reasoning" non-empty and relevant. Wording may vary.',
    )
    verdict = json.loads(raw_result)
    deal["ai_verdict"] = verdict
    deal["status"] = "AI_REVIEWED"
```

The verdict is advisory. The buyer then calls `release_after_ai` to accept it or `override_ai` to overrule it — preserving human final authority. The buyer can also skip AI entirely and call `approve_work` for direct approval.

---

## Current status (verified on-chain)

This project went through a review round that flagged two issues. Both are fixed and independently verified on-chain, including a full working run of `request_ai_review` on **Testnet Bradbury itself** — see below for exactly what was tested and how.

### 1. Escrow was state-only → now real GEN token transfers

Previously, `create_deal` only recorded an escrow amount in contract storage without actually moving funds — the "locked" GEN was fictional. This is fixed:

- `create_deal` is `@gl.public.write.payable` and asserts `gl.message.value == expected_wei` — the buyer must send real GEN with the transaction, or it reverts.
- Every resolution path (`approve_work`, `release_after_ai`, `override_ai`, `cancel_deal`) calls `_Wallet(Address(recipient)).emit_transfer(value=...)` — a real EVM-level value transfer, not a storage flag.
- **Verified on Bradbury**: a full `create_deal` → `claim_deal` → `submit_work` → `approve_work` run confirmed the contract balance moved by exactly the escrowed amount and the seller's wallet balance increased accordingly.

**Important nuance:** `emit_transfer` messages execute at transaction **FINALIZED**, not **ACCEPTED**. GenLayer's finality window exists so an accepted result can still be appealed and overturned — releasing funds before that window closes would make an appeal unable to claw back a wrongly-sent transfer. On Bradbury this finality window has been observed to take **10–60+ minutes**. The frontend reflects this: after an approval action, the UI shows "finalizes on-chain in a few minutes" rather than claiming the payout has already arrived, because it hasn't yet.

### 2. Consensus fragility → binary enum + explicit non-comparative principle

Previously, `request_ai_review` asked the LLM to return open-ended JSON with 6 free-form fields and relied on the SDK's default equivalence handling for the call. Validators running the same prompt could reach the same *judgment* but phrase it slightly differently, breaking consensus even when everyone agreed on the underlying verdict. Two changes fixed this (see the code sample above):

1. Constrained `result` to a two-value enum (`PASS`/`FAIL`) instead of free-form text.
2. Switched to an explicit `gl.eq_principle.prompt_non_comparative(...)` call with a `task`/`criteria` pair, so validators judge the leader's output against stated criteria rather than demanding it reproduce identically — which a `reasoning` field never will, word-for-word, across separate LLM calls.

**Verified on both networks:**
- **Studionet**: 5/5 validators unanimous, `FINALIZED`.
- **Bradbury**: two independent full-lifecycle runs (`create_deal` → `claim_deal` → `submit_work` → `request_ai_review`), each ending in `status: AI_REVIEWED` with a genuine parsed verdict (`result`, `confidence`, `reasoning` all populated from the LLM's actual response) — not a fallback/error value.

### A note on why this took longer than the schema fix alone

Along the way, a separate and unrelated problem masked the real fix for a while: the pinned GenVM runtime (`py-genlayer:1jb45aa8y...`) silently rejects contract deployments over roughly **9.2 KB of source**, failing with a generic `invalid_contract` error that gives no indication it's a size limit rather than a logic error. The original contract (and an early attempt at this same non-comparative fix) both happened to sit right at or just past that boundary, so every fresh deployment attempt failed regardless of whether the code itself was correct — which is also the likely explanation for why fresh Bradbury deployments were failing with `FINISHED_WITH_ERROR` earlier in this project's history. The current `contracts/vibecheck.py` is deliberately kept lean (no doc-comment bloat, short local variable names inside the AI-review closure, trimmed prompt/criteria text) specifically to stay under that ceiling without removing any contract functionality — every method from the original design is still present.

---

## Deal lifecycle

```
PENDING ──(seller claims)──► FUNDED ──(seller submits)──► SUBMITTED
                                                               │
                              ┌────────────────────────────────┤
                              │                                 │
                         (buyer approves)            (buyer requests AI)
                              │                                 │
                         RESOLVED_PASS                    AI_REVIEWED
                                                               │
                              ┌────────────────────────────────┤
                              │                                 │
                     (accept recommendation)           (override verdict)
                              │                                 │
                    RESOLVED_PASS / FAIL             RESOLVED_PASS / FAIL
```

---

## Contract methods

| Method | Who calls it | What it does |
|--------|-------------|--------------|
| `create_deal(prompt, deadline_days, amount_gen)` | Buyer | Locks escrow, no seller address needed |
| `claim_deal(deal_id)` | Seller | Registers via invite link, activates escrow |
| `submit_work(deal_id, url, description)` | Seller | Submits deliverable URL + description |
| `approve_work(deal_id)` | Buyer | Direct approval, releases payment |
| `request_ai_review(deal_id)` | Buyer | Triggers GenLayer LLM evaluation |
| `release_after_ai(deal_id)` | Buyer | Accepts AI recommendation |
| `override_ai(deal_id, release)` | Buyer | Overrides AI verdict |
| `cancel_deal(deal_id)` | Buyer | Cancels PENDING or FUNDED deal |
| `get_deal(deal_id)` | Anyone | Returns full deal state |
| `get_deals_for_buyer(address)` | Anyone | Returns all buyer's deals |
| `get_deals_for_seller(address)` | Anyone | Returns all seller's deals |
| `get_stats()` | Anyone | Returns dashboard stats |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Intelligent Contract | GenLayer (Python), `gl.nondet.exec_prompt` |
| Consensus | Optimistic Democracy — multi-validator LLM equivalence |
| Frontend | Next.js 16, Tailwind CSS v4, TypeScript |
| Wallet | MetaMask + GenLayer JS SDK (`genlayer-js`) |
| Deployment | Vercel (frontend), GenLayer Studionet (contract) |

---

## GenLayer Network Details

### Testnet Bradbury (production-like)
| Field | Value |
|-------|-------|
| RPC URL | `https://rpc-bradbury.genlayer.com` |
| Chain ID | `4221` |
| Explorer | [explorer-bradbury.genlayer.com](https://explorer-bradbury.genlayer.com) |
| Faucet | [testnet-faucet.genlayer.foundation](https://testnet-faucet.genlayer.foundation) |
| Token | GEN |

### Studionet (hosted dev, no setup)
| Field | Value |
|-------|-------|
| RPC URL | `https://studio.genlayer.com/api` |
| Chain ID | `61999` |
| Explorer | [explorer-studio.genlayer.com](https://explorer-studio.genlayer.com) |
| Faucet | Built-in 💧 button in Studio account selector |
| Token | GEN |

### Localnet (offline dev)
| Field | Value |
|-------|-------|
| RPC URL | `http://localhost:4000/api` |
| Chain ID | `61127` |
| Setup | `genlayer init && genlayer up` |

---

## Why this fits GenLayer's design space

GenLayer's documentation defines its core use case as *"commitments where outcomes depend on judgment"* — specifically calling out **performance/milestone adjudication** and **agentic-commerce disputes**. Pact is a direct implementation of this:

- The contract brief is natural language — only `gl.nondet.exec_prompt` can evaluate it
- Escrow logic is deterministic (lock, release, cancel) — pure `@gl.public.write`
- AI evaluation is non-deterministic — validators independently prompt an LLM and reach consensus via the Equivalence Principle
- Final resolution is always human — the buyer retains override authority

This split (deterministic escrow + non-deterministic AI advisory) is the canonical GenLayer architecture pattern.

---

## Running locally

```bash
git clone https://github.com/Fortune9thx/pact-ai
cd pact-ai
npm install
npm run dev
```

The app can run in **demo mode** (`NEXT_PUBLIC_DEMO_MODE=true`) — all contract interactions are simulated in-browser using localStorage, no wallet required. The live deployment runs against the real Bradbury contract (`NEXT_PUBLIC_DEMO_MODE=false`) instead — see [Current status](#current-status-verified-on-chain) above for what's been verified on that deployment.

### Connect to live GenLayer contract

```bash
# Install GenLayer CLI
npm install -g genlayer

# Deploy to Studionet
genlayer network set studionet
genlayer deploy --contract contracts/vibecheck.py

# Update environment
echo "NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed_address>" >> .env.local
echo "NEXT_PUBLIC_DEMO_MODE=false" >> .env.local
echo "NEXT_PUBLIC_RPC_URL=https://studio.genlayer.com/api" >> .env.local

npm run dev
```

### Connect to Testnet Bradbury

```bash
genlayer network set testnet-bradbury
genlayer deploy --contract contracts/vibecheck.py

# Get GEN from faucet: https://testnet-faucet.genlayer.foundation
```

---

## Try it live

[vibecheck-mocha-one.vercel.app](https://vibecheck-mocha-one.vercel.app) runs against the real deployed
contract on Bradbury (`0xBb9a90D4A4850498E22776cb713a46cc6a796aba`). Deal IDs
are sequential and grow as people use it — check the dashboard for the current
list rather than relying on a fixed set of pre-loaded deals.

**Full lifecycle, including AI review, works end-to-end on this deployment:**

1. Click "New Agreement" — write a brief, set a GEN amount, get an invite link. This locks real GEN in escrow (`create_deal` is payable).
2. Open the invite link as the seller, claim the deal, submit work.
3. As buyer, either click **"Request AI Review"** to get a real GenLayer LLM-consensus verdict (typically resolves within a minute or two), then accept or override it — or click **"Approve & Release Payment"** to skip AI and resolve directly. Both paths release escrow via the same real `emit_transfer` mechanism; the GEN transfer itself finalizes on-chain within a few to several minutes after approval, per Bradbury's finality window.

---

## Project structure

```
contracts/
  vibecheck.py          # GenLayer Intelligent Contract (main)
  test_*.py             # Contract unit tests

deploy/
  deployScript.ts       # TypeScript deployment automation

scripts/
  deploy.mjs            # CLI deploy helper
  smoke_test.mjs        # End-to-end smoke test
  trigger_verdict.mjs   # Manual AI verdict trigger

lib/
  contract.ts           # Read functions (routes to demo or live)
  demo-store.ts         # LocalStorage-backed simulation
  genlayer.ts           # GenLayer JS client setup
  types.ts              # TypeScript interfaces

hooks/
  useWallet.ts          # Wallet state + write execution
  useDeal.ts            # Deal read/write hooks

app/
  (app)/dashboard/      # Main dashboard
  (app)/deal/[id]/      # Deal detail + actions
  (app)/create/         # New deal wizard
  invite/[id]/          # Shareable seller invite page
```

---

## License

MIT — build on it.
