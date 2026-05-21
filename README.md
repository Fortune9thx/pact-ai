# VibeCheck

> Smart contracts that understand creative intent.

AI-powered escrow and dispute resolution for creative work, built on [GenLayer](https://genlayer.com) testnet.

---

## What it does

VibeCheck lets buyers and sellers agree on creative work (logos, copy, code, design) with escrow enforced and disputes resolved automatically by an on-chain AI judge.

| Step | Who | What |
|------|-----|-------|
| 1 | Buyer | Creates a deal with a creative brief + funds escrow in GEN |
| 2 | Seller | Submits completed work via URL |
| 3 | AI | Evaluates style, alignment, and quality against the brief |
| 4 | Contract | Releases escrow to seller (PASS) or refunds buyer (FAIL) |

---

## Tech stack

- **Frontend** — Next.js 16, Tailwind CSS v4, Framer Motion
- **Chain** — [GenLayer](https://genlayer.com) studionet / testnet Bradbury
- **Smart contract** — `contracts/vibecheck.py` (GenLayer intelligent contract)
- **SDK** — `genlayer-js`

---

## Local development

### 1. Clone and install

```bash
git clone <repo>
cd vibecheck
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GENLAYER_RPC_URL` | RPC endpoint (studionet: `http://localhost:4000/api/rpc`) |
| `NEXT_PUBLIC_NETWORK` | `studionet` or `bradbury` |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed contract address |
| `NEXT_PUBLIC_DEMO_MODE` | `true` to auto-connect without MetaMask |
| `NEXT_PUBLIC_DEMO_KEY` | Demo wallet private key (testnet only, no real funds) |
| `DEPLOYER_KEY` | Deployer key for `deploy/deploy.ts` (server-side only) |

### 3. Deploy the contract (first time)

Requires [GenLayer Studio](https://studio.genlayer.com) running locally or access to testnet Bradbury.

```bash
npx ts-node deploy/deploy.ts
# Outputs: Contract deployed at 0x...
# Add this address to NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Import to Vercel

Go to [vercel.com/new](https://vercel.com/new) and import the repository.

### 3. Add environment variables

In Vercel project settings → Environment Variables, add all variables from `.env.example`:

```
NEXT_PUBLIC_GENLAYER_RPC_URL=https://rpc.testnet.genlayer.com
NEXT_PUBLIC_NETWORK=bradbury
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_KEY=0x...
```

> **Note:** `DEPLOYER_KEY` is only needed for contract deployment, not the web app.

### 4. Deploy

Vercel auto-builds on push. The app is fully static-compatible except for `/deal/[id]` and `/submit/[id]` which are server-rendered.

---

## Smart contract

The core logic lives in `contracts/vibecheck.py`. It's a GenLayer *intelligent contract* — it uses an LLM call to evaluate whether submitted work meets the creative brief before releasing escrow.

Key functions:

| Function | Caller | Description |
|----------|--------|-------------|
| `create_deal(seller, prompt, deadline, amount)` | Buyer | Creates and funds escrow |
| `submit_work(deal_id, url, description)` | Seller | Submits deliverable |
| `dispute_deal(deal_id)` | Buyer | Opens dispute |
| `run_ai_verdict(deal_id)` | Anyone | Triggers AI evaluation |

---

## Project structure

```
app/
  (app)/          # Authenticated app shell (sidebar + header)
    dashboard/    # Deal overview and stats
    create/       # New deal form
    deal/[id]/    # Deal detail + AI verdict
    submit/[id]/  # Work submission form
  page.tsx        # Landing page
components/
  deals/          # DealCard
  layout/         # Sidebar, Header, MobileNav
  ui/             # Design system primitives
  wallet/         # WalletConnection, TransactionStatus
contracts/        # vibecheck.py (GenLayer intelligent contract)
deploy/           # Deployment script
hooks/            # useDeal, useWallet
lib/              # Contract ABI, types, utils
store/            # Zustand global state
```
