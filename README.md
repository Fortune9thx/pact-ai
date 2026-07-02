# Pact — AI-Powered Creative Escrow on GenLayer

**Live demo → [pact-ai.vercel.app](https://pact-ai.vercel.app)**  
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

Pact's contract uses this for `request_ai_review`. The schema is deliberately
constrained to a **binary `PASS`/`FAIL` enum** — early iterations let the
validators return free-form JSON, which caused validators to disagree on
exact wording/formatting even when they agreed on the underlying verdict.
Constraining `result` to two fixed tokens forces the Equivalence Principle to
compare on outcome, not phrasing:

```python
@gl.public.write
def request_ai_review(self, deal_id: str) -> None:
    deal = self._get_deal(deal_id)
    ai_prompt = (
        "You are Pact AI Review. Evaluate this creative submission objectively.\n\n"
        "CREATIVE BRIEF:\n" + deal["prompt"] + "\n\n"
        "SUBMISSION URL: " + deal["submission"] + "\n"
        "SELLER DESCRIPTION: " + deal["submission_description"] + "\n\n"
        "PASS if it satisfies the brief. FAIL otherwise.\n\n"
        'Return ONLY valid JSON: {"result": "PASS" or "FAIL", "confidence": 0-100, "reasoning": "..."}'
    )
    verdict = yield gl.exec_prompt_call(
        ai_prompt,
        schema={
            "type": "object",
            "properties": {
                "result":     {"type": "string", "enum": ["PASS", "FAIL"]},
                "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
                "reasoning":  {"type": "string"},
            },
            "required": ["result", "confidence", "reasoning"],
        },
    )
    deal["ai_verdict"] = verdict
    deal["status"] = "AI_REVIEWED"
```

The verdict is advisory. The buyer then calls `release_after_ai` to accept it or `override_ai` to overrule it — preserving human final authority. The buyer can also skip AI entirely and call `approve_work` for direct approval.

---

## Current status (verified on-chain)

This project went through a review round that flagged two issues. Both are now fixed and independently verified on-chain — see below for exactly what was tested and how.

### 1. Escrow was state-only → now real GEN token transfers

Previously, `create_deal` only recorded an escrow amount in contract storage without actually moving funds — the "locked" GEN was fictional. This is fixed:

- `create_deal` is `@gl.public.write.payable` and asserts `gl.message.value == expected_wei` — the buyer must send real GEN with the transaction, or it reverts.
- Every resolution path (`approve_work`, `release_after_ai`, `override_ai`, `cancel_deal`) calls `_Wallet(Address(recipient)).emit_transfer(value=...)` — a real EVM-level value transfer, not a storage flag.
- **Verified on Bradbury**: contract balance increased by exactly 1 GEN on `create_deal`, and the `approve_work` transaction was independently confirmed by inspecting its raw transaction data — it queued an `emit_transfer` message for exactly 1 GEN to the seller's address, with all 5 validators voting `AGREE` and `txExecutionResultName: "FINISHED_WITH_RETURN"`.

**Important nuance:** `emit_transfer` messages execute at transaction **FINALIZED**, not **ACCEPTED**. GenLayer's finality window exists so an accepted result can still be appealed and overturned — releasing funds before that window closes would make an appeal unable to claw back a wrongly-sent transfer. On Bradbury this finality window has been observed to take **10–60+ minutes**. The frontend reflects this: after an approval action, the UI shows "finalizes on-chain in a few minutes" rather than claiming the payout has already arrived, because it hasn't yet.

### 2. Consensus fragility → binary enum schema

Previously, `request_ai_review` asked the LLM to return open-ended JSON with 6 free-form fields. Validators running the same prompt could reach the same *judgment* but phrase it slightly differently, breaking the Equivalence Principle and causing spurious `DISAGREE` votes. Fixed by constraining `result` to a two-value enum (`PASS`/`FAIL`) as shown above.

**Verified on GenLayer Studionet**: 5/5 validators returned unanimous agreement, transaction reached `FINALIZED`.

### Known limitation: `request_ai_review` on Bradbury specifically

The binary-schema fix is correct and proven (see above), but as of this writing, calling `request_ai_review` on **Testnet Bradbury** reliably fails — not because the schema is wrong, but because of a runtime issue independent of this contract: the leader validator executes `gl.exec_prompt_call` successfully, but the other validators in the round get a *different* execution hash from each other's own vote (unanimous among themselves, but diverging from the leader), producing a `DISAGREE` result. This has been reproduced consistently and traced to Bradbury's currently-pinned GenVM runtime — every attempted `request_ai_review` transaction on the live Bradbury contract has hit this, none have completed.

Until Bradbury's pinned runtime is updated, use `approve_work` for direct buyer approval (bypasses AI, releases escrow immediately via the same real `emit_transfer` path) to exercise the full escrow lifecycle end-to-end. The AI consensus mechanism itself is proven correct on Studionet; this is a network/runtime issue, not a contract defect.

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

[pact-ai.vercel.app](https://pact-ai.vercel.app) runs against the real deployed
contract on Bradbury (`0xF099bDabD5dD15f9cde9532c276Dc2De1602595f`). Deal IDs
are sequential and grow as people use it — check the dashboard for the current
list rather than relying on a fixed set of pre-loaded deals.

**Recommended path to see the full lifecycle** (given the [known Bradbury AI
limitation](#known-limitation-request_ai_review-on-bradbury-specifically) above):

1. Click "New Agreement" — write a brief, set a GEN amount, get an invite link. This locks real GEN in escrow (`create_deal` is payable).
2. Open the invite link as the seller, claim the deal, submit work.
3. As buyer, click **"Approve & Release Payment"** (not "Request AI Review" — that path currently fails on Bradbury; see above). The deal resolves to `RESOLVED_PASS` immediately, and the GEN transfer finalizes on-chain within a few to several minutes afterward.
4. To see the AI verdict UI itself (schema, confidence score, reasoning) without depending on Bradbury's runtime, deploy the same contract to **Studionet** — `request_ai_review` completes there in under a minute with unanimous validator agreement.

---

## Project structure

```
contracts/
  vibecheck.py          # GenLayer Intelligent Contract (main)
  vibecheck_fixed.py    # Iteration variant
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
