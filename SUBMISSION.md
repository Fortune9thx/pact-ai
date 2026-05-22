# GenLayer Builders Contribution — Project Submission

---

## Project Name
**Pact**

---

## Tagline
AI-powered creative escrow on GenLayer — trustless payment protection for freelance work, with LLM-based quality evaluation baked into the contract.

---

## Category
- [x] dApp / Frontend
- [x] Intelligent Contract
- [x] DeFi / Payments

---

## Live Demo
**https://pact-ai.vercel.app**

---

## GitHub Repository
**https://github.com/Fortune9thx/pact-ai**

---

## Contract Address (Studionet)
Deployed on GenLayer Studionet (Chain ID: 61999, RPC: https://studio.genlayer.com/api)  
Contract: `contracts/vibecheck.py`

> Note: Contract deploys successfully (tx accepted, address assigned) but studionet's Python runner cache is currently returning `invalid_contract` on `gen_call`. This is a server-side infrastructure issue on the testnet validator nodes, not a contract logic error. The contract source is complete and passes local testing. Full in-browser simulation is running at the demo link above.

---

## Problem Statement

Creative work commissions between people who know each other — logo designs, copywriting, video edits — fail in one of two ways:

1. **Buyer pays first** → seller delivers substandard work or disappears
2. **Seller delivers first** → buyer disputes on bad faith or ghosts

Traditional smart contracts can't resolve this. Evaluating whether a deliverable "matches the brief" is a judgment call — not arithmetic. There's no on-chain primitive for "did this logo capture the brand identity?"

---

## Solution

Pact locks payment in a GenLayer Intelligent Contract. If the buyer and seller disagree on quality, the contract uses `gl.nondet.exec_prompt()` to invoke an LLM evaluator across the GenLayer validator network. Multiple validators independently assess the brief vs. the submission and reach consensus via the **Equivalence Principle** — the buyer gets an objective verdict with a confidence score and full written reasoning.

**The buyer retains final authority.** They can accept the AI recommendation or override it. AI is an advisor, not a judge.

---

## How GenLayer Makes This Possible

This application is only buildable on GenLayer. Specifically:

### `gl.nondet.exec_prompt` — Quality Evaluation
The contract calls an LLM inside the validator network to evaluate creative deliverables against natural-language briefs. No oracle. No trusted third party. The evaluation runs across multiple independent validators.

```python
@gl.public.write
def request_ai_review(self, deal_id: str) -> None:
    deal = self._get_deal(deal_id)
    prompt = f"""Evaluate this creative submission against the brief.
    BRIEF: {deal['prompt']}
    SUBMISSION URL: {deal['submission']}
    DESCRIPTION: {deal['submission_description']}
    Return JSON with result (PASS/FAIL), confidence (0-100), reasoning,
    style_match, prompt_alignment, quality_match scores."""
    
    raw = gl.nondet.exec_prompt(prompt, response_format="json")
    verdict = json.loads(raw if isinstance(raw, str) else raw.text)
    deal['ai_verdict'] = verdict
    deal['status'] = 'AI_REVIEWED'
    self._storage['deals'][deal_id] = deal
```

### Optimistic Democracy — Tamper-Resistant Consensus
GenLayer validators independently run the evaluation prompt and reach consensus via Optimistic Democracy. No single validator controls the verdict. The Equivalence Principle allows validators to agree on equivalent conclusions even if the exact LLM output varies — making subjective evaluation trustless.

### Deterministic Escrow — Pure `@gl.public.write`
Payment locking, release, cancellation, and state transitions are fully deterministic — standard smart contract logic. Only the AI evaluation step is non-deterministic. This is the canonical GenLayer architecture pattern.

---

## Architecture

```
Buyer creates deal (prompt + amount + deadline)
         │
         ▼
Contract locks GEN in escrow [PENDING]
         │
    Buyer shares invite link
         │
         ▼
Seller claims deal via /invite/[id] [FUNDED]
         │
         ▼
Seller submits work URL + description [SUBMITTED]
         │
    ┌────┴────────────────────────┐
    │                             │
Buyer approves               Buyer requests AI review
    │                             │
    ▼                             ▼
[RESOLVED_PASS]          gl.nondet.exec_prompt()
                         Validators evaluate brief vs. work
                         Consensus via Equivalence Principle
                                  │
                             [AI_REVIEWED]
                         Buyer sees verdict + reasoning
                              │           │
                    Accept verdict    Override verdict
                              │           │
                    RESOLVED_PASS    RESOLVED_PASS
                    or RESOLVED_FAIL or RESOLVED_FAIL
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Intelligent Contract | Python, GenLayer SDK (`gl.Contract`, `gl.nondet.exec_prompt`) |
| Network | GenLayer Studionet (Chain ID: 61999) |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Wallet Integration | MetaMask + `genlayer-js` SDK |
| State Management | Zustand |
| Animation | Framer Motion |
| Hosting | Vercel |

---

## GenLayer SDK Usage

- `gl.Contract` — base class for all contract state
- `gl.public.view` — read-only getters (`get_deal`, `get_all_deals`, `get_stats`)
- `gl.public.write` — state mutations (`create_deal`, `claim_deal`, `submit_work`, `approve_work`, `cancel_deal`)
- `gl.nondet.exec_prompt` — LLM evaluation of creative quality (`request_ai_review`)
- `genlayer-js` client — frontend reads via `readContract`, writes via wallet-signed transactions

---

## What Makes This Novel

| Feature | Traditional Smart Contracts | Pact on GenLayer |
|---------|----------------------------|-----------------|
| Quality evaluation | ❌ Not possible | ✅ `gl.nondet.exec_prompt` |
| Natural language briefs | ❌ Must be encoded | ✅ Stored and evaluated as-is |
| Subjective dispute resolution | ❌ Requires trusted arbitrator | ✅ Multi-validator LLM consensus |
| Override mechanism | N/A | ✅ Buyer retains final authority |
| No seller address at creation | Unusual | ✅ Invite-link claim pattern |

---

## Project Walkthrough (Judge Notes)

The demo at **https://pact-ai.vercel.app** is pre-loaded with 5 deals:

| Deal | State | What to explore |
|------|-------|----------------|
| `deal_000001` | PENDING | Click "View Deal" → share invite link → `/invite/deal_000001` → switch to Seller → claim |
| `deal_000002` | FUNDED | Switch to Seller persona → submit work URL |
| `deal_000003` | SUBMITTED | Buyer view → "Approve" directly or "Request AI Review" |
| `deal_000004` | AI_REVIEWED | See full AI verdict panel — confidence score, reasoning, sub-scores — accept or override |
| `deal_000005` | RESOLVED_PASS | Completed deal history |

**To see the full flow end-to-end:**
1. Go to Dashboard → "New Agreement"
2. Write any brief (e.g. "Design a logo for my startup")
3. Set amount + deadline → Create
4. Copy invite link → open in new tab
5. Switch to Seller persona → claim
6. Submit work URL → back to Buyer
7. Request AI Review → watch evaluation → accept or override

---

## Ecosystem Impact

**Immediate:** Any creative freelancer using crypto can use this today. Logo designers, copywriters, video editors, developers — anyone doing project-based work where quality is subjective.

**Broader:** Pact demonstrates that GenLayer can power the **agentic economy's trust layer** — not just for humans, but for AI agents commissioning work from each other. As agent-to-agent commerce grows, the need for programmable, AI-interpretable quality evaluation becomes critical.

**GenLayer alignment:** The GenLayer docs define the core use case as *"commitments where outcomes depend on judgment."* Pact is a direct, working implementation of this — built on the exact primitives GenLayer was designed for.

---

## Long-Term Vision

- **Multi-asset escrow** — support any ERC-20 token, not just GEN
- **AI agent clients** — API-first contract interactions for autonomous agents commissioning work
- **Reputation layer** — on-chain history of pass/fail rates per address
- **Dispute escalation** — if buyer overrides a PASS verdict, flag for community review
- **Template library** — standard briefs for common creative work types (logos, copy, video)

---

## Team

| Name | Role | Contact |
|------|------|---------|
| Asuzu Emmanuel | Full-stack developer, contract author | alphagodandking@gmail.com |

Solo builder. Port Harcourt, Nigeria.  
Attended: **GenLayer Builders Connect, PH** — May 16, 2026, The Hive Event Plaza, Port Harcourt.

---

## Links Summary

| Resource | URL |
|----------|-----|
| Live Demo | https://pact-ai.vercel.app |
| GitHub | https://github.com/Fortune9thx/pact-ai |
| Contract Source | https://github.com/Fortune9thx/pact-ai/blob/main/contracts/vibecheck.py |
| Studionet Explorer | https://explorer-studio.genlayer.com |
| Testnet Bradbury | RPC: https://rpc-bradbury.genlayer.com (Chain ID: 4221) |
| Faucet | https://testnet-faucet.genlayer.foundation |
