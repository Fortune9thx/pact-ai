# Pact — AI-Powered Creative Escrow

**Live demo → [pact-ai.vercel.app](https://pact-ai.vercel.app)**

Pact is escrow infrastructure for creative work you're already doing. No marketplace, no strangers — just protection for deals with people you already know.

---

## The problem

When you commission a logo, copy, or animation from a freelancer, you either pay upfront (and risk not getting the work) or pay on delivery (and the freelancer risks not getting paid). Disputes are awkward, slow, and have no objective resolution.

## The solution

Pact locks payment in escrow via a GenLayer intelligent contract. If the buyer and seller disagree on quality, an AI evaluator reads the original brief and the submitted work, then gives an objective recommendation — with reasoning and a confidence score. The **buyer always makes the final call** — AI is an advisor, not a judge.

---

## How it works

1. **Buyer creates a deal** — writes the creative brief, sets an amount and deadline. No need to know the seller's wallet address.
2. **Share an invite link** — the buyer gets a unique URL to share via Discord, WhatsApp, email, anywhere.
3. **Seller accepts** — opens the link, reviews the brief and terms, connects a wallet, and claims the deal. Escrow activates.
4. **Work is delivered** — seller submits a URL + description.
5. **Buyer decides** — approve directly (instant release) or request AI review.
6. **AI review** (optional) — GenLayer validators run an LLM evaluation against the brief. Buyer then accepts the recommendation or overrides it.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Smart contract | GenLayer Intelligent Contract (Python) |
| AI evaluation | `gl.nondet.exec_prompt` — multi-validator LLM consensus |
| Frontend | Next.js 16, Tailwind CSS v4, Framer Motion |
| Wallet | MetaMask / GenLayer JS SDK |
| Deploy | Vercel |

---

## Contract

The intelligent contract is in [`contracts/vibecheck.py`](contracts/vibecheck.py).

Key methods:
- `create_deal(prompt, deadline_days, amount_gen)` — no seller address needed
- `claim_deal(deal_id)` — seller registers via invite link
- `submit_work(deal_id, url, description)`
- `approve_work(deal_id)` — buyer direct approval
- `request_ai_review(deal_id)` — triggers GenLayer AI evaluation
- `release_after_ai(deal_id)` — buyer accepts AI recommendation
- `override_ai(deal_id, release)` — buyer overrides AI verdict
- `cancel_deal(deal_id)`

### GenLayer studionet note

> The contract deploys successfully on GenLayer studionet (tx accepted, address assigned) but the Python runner cache on the validator nodes is currently returning `invalid_contract` on execution. This is a server-side infrastructure issue with the studionet network — not a contract logic error. The contract source is complete and correct.
>
> The live demo uses a full in-browser simulation (`lib/demo-store.ts`) with realistic seeded data so all flows are fully interactive.

---

## Running locally

```bash
npm install
npm run dev
```

To connect to a live GenLayer contract (when studionet is healthy):

```bash
# Deploy
npx genlayer network set studionet
npx genlayer deploy --contract contracts/vibecheck.py

# Update .env.local
NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed_address>
NEXT_PUBLIC_DEMO_MODE=false
```

---

## Demo flows to try

1. **Dashboard** — pre-loaded with 5 deals in various states
2. **AI verdict** — open deal `deal_000004`, see the advisory panel, accept or override
3. **Invite flow** — visit `/invite/deal_000001`, switch to Seller persona, claim the deal
4. **Create deal** — click "New Agreement", walk through the 3-step flow, copy the invite link

---

## License

MIT
