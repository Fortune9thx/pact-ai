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

Pact's contract uses this for `request_ai_review`:

```python
@gl.public.write
def request_ai_review(self, deal_id: str) -> None:
    deal = self._get_deal(deal_id)
    
    prompt = f"""You are evaluating a creative work submission...
    
    ORIGINAL BRIEF: {deal['prompt']}
    SUBMISSION URL: {deal['submission']}
    SELLER'S DESCRIPTION: {deal['submission_description']}
    
    Return JSON: {{ "result": "PASS" or "FAIL", "confidence": 0-100,
    "reasoning": "...", "style_match": 0-100,
    "prompt_alignment": 0-100, "quality_match": 0-100 }}"""
    
    raw = gl.nondet.exec_prompt(prompt, response_format="json")
    verdict = json.loads(raw if isinstance(raw, str) else raw.text)
    deal['ai_verdict'] = verdict
    deal['status'] = 'AI_REVIEWED'
```

The verdict is advisory. The buyer then calls `release_after_ai` to accept it or `override_ai` to overrule it — preserving human final authority.

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

The app runs in **demo mode** by default (`NEXT_PUBLIC_DEMO_MODE=true`) — all contract interactions are simulated in-browser using localStorage. No wallet required.

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

## Demo flows

The live demo at [pact-ai.vercel.app](https://pact-ai.vercel.app) is pre-loaded with 5 deals across all lifecycle states:

| Deal | State | What to try |
|------|-------|-------------|
| `deal_000001` | PENDING | Visit `/invite/deal_000001`, switch to Seller, claim the deal |
| `deal_000002` | FUNDED | Switch to Seller, submit work |
| `deal_000003` | SUBMITTED | As Buyer, approve directly or request AI review |
| `deal_000004` | AI_REVIEWED | See the AI verdict panel, accept or override |
| `deal_000005` | RESOLVED_PASS | View completed deal history |

**Create a new deal** — click "New Agreement", write a brief, set amount and deadline, copy the invite link.

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
