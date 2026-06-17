# Eristic — Operator Runbook

Single source of truth for deploying and operating Eristic on **GenLayer
Studionet** (hosted simulator, instant finality — the dev/demo target) with
**Bradbury** (real validator network) reserved for the production
showcase via `npm run deploy:bradbury`.

No Docker. No Python. No simulator install.

---

## 0. Prereqs

| Tool | Min version | Check |
|---|---|---|
| Node.js | 20.x | `node -v` |
| npm | 10.x | `npm -v` |
| Funded testnet account | — | studionet usually has built-in funding; for Bradbury hit `https://testnet-faucet.genlayer.foundation` |
| MetaMask + GenLayer Snap | latest | required only to drive the Arena UI as an end-user |

---

## 1. Install

```powershell
cd "C:\Users\Asuzu Emmanuel\eristic\web"
npm install
```

---

## 2. Deploy

Put your private key in **one** of:

- env var: `$env:GL_PRIVATE_KEY = "0x..."`
- gitignored file: create `web/.deploy-key` with one line containing the key

Then:

```powershell
npm run deploy            # studionet (default, ~3 min)
npm run deploy:bradbury   # bradbury (~2.5 h, waits for FINALIZED per step)
```

What `npm run deploy` does (see [scripts/deploy.ts](web/scripts/deploy.ts)):

1. Deploys `StakeManager` (no constructor args).
2. Deploys `AdjudicationContract` (no constructor args).
3. Deploys `ClaimRegistry(stake_manager, adjudication)`.
4. `StakeManager.set_registry(registry)` — gates `lock_stake` / `distribute_rewards`.
5. `AdjudicationContract.wire(registry, stake_manager)` — closes the loop.
6. Writes `deployments.<target>.json` + `web/.env.local`. Restart `npm run dev`
   to pick up the new addresses.

Each step polls the consensus until `FINALIZED`, then checks
`consensus_data.leader_receipt[0].execution_result` — if a deploy lands at
the EVM layer but GenVM rejects it (silent-orphan deploy, the bug that
ate one night), the script throws immediately with the decoded reason.

---

## 3. Smoke checklist

```powershell
npm run status           # verify gen_call works on each contract
npm run seed             # populate Arena with 5 hand-crafted claims
npm run smoke            # create a fresh claim, drive full lifecycle, print verdict
npm run smoke -- 1       # drive an existing claim id through the lifecycle
npm run dev              # boot the Arena UI
```

`npm run smoke` exercises every contract option end-to-end:

- `create_claim` → `stake_for_claim` (payable)
- `challenge` + `stake_against_claim` (payable)
- `submit_for_review` (triggers cross-contract `lock_stake` via `emit()`)
- `adjudicate` (validator LLM, eq_principle_prompt_comparative, real URL fetching via `gl.nondet.web.render`, cross-contract `record_verdict` + `distribute_rewards`)
- Returns the resolved verdict + validator reasoning

---

## 4. Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| `silent-orphan: execution_result=ERROR · reason=invalid_contract` | Comment lines between the `Depends` pragma and `from genlayer import *` | Move comments below the import. The pragma must be line 1, blank line, then the import. |
| `silent-orphan: ... AttributeError: 'str' object has no attribute 'as_bytes'` | Constructor stored an `Address`-typed param without wrapping | Take the param as `str`, wrap with `Address(...)` before assigning |
| `silent-orphan: ... NondetException: WEBPAGE_LOAD_FAILED` | A cited URL 404s and the fetch wasn't wrapped defensively | The fetch closure must catch its own exceptions and return a placeholder string so all validators see the same result and `strict_eq` passes |
| `Cannot find module 'genlayer-js'` from a script under `/tmp/` | Spawned from outside `web/` | Run from `web/` and use `npx tsx scripts/<file>.ts` |
| `adjudicate timed out` | `waitFinalized` ceiling too short for URL-heavy claims | Raise the retry budget (smoke.ts uses 240 × 5s = 20 min) |
| Header reads "Registry address not set" after deploy | `npm run dev` was running before deploy wrote `.env.local` | Restart `npm run dev` |

---

## 5. Re-deploy (clean slate)

```powershell
npm run deploy           # overwrites deployments.studionet.json + .env.local
npm run seed             # repopulate claims
```

Old contracts get orphaned on-chain; no teardown needed.

---

## 6. Key handling

- The deploy key is hot. Use a key that holds **only** the testnet GEN needed
  for deploys. Treat it as compromised the moment you paste it into a shell.
- `.env.local`, `.deploy-key`, `*.key` are all gitignored.
- `deployments.*.json` records public addresses + tx hashes — safe to commit.
  If you'd rather not (private demo), add to `.gitignore`.

---

## 7. Layout

```
eristic/
├── contracts/                       # GenLayer intelligent contracts (Python)
│   ├── claim_registry.py            # lifecycle + tip jar + cross-contract emit
│   ├── stake_manager.py             # payable totals + lock/settle
│   └── adjudication_contract.py     # LLM verdict + URL fetch + eq_principle
├── web/
│   ├── app/                         # Arena (Next.js 15 app router)
│   │   ├── page.tsx                 # /  — live claim feed (the Arena)
│   │   ├── claim/[id]/page.tsx      # battlefield view + verdict + reasoning
│   │   └── create/page.tsx          # filing form
│   ├── components/
│   │   ├── Sidebar.tsx              # nav + create + connect + balance pill
│   │   ├── ClaimRow.tsx             # row with stake distribution bar
│   │   ├── RightPanel.tsx           # trending / pools / verdicts / activity
│   │   ├── ClaimActions.tsx         # STAKE / TIP / CHALLENGE / REVIEW / ADJUDICATE
│   │   ├── ConnectButton.tsx        # MetaMask Snap connect + GEN balance
│   │   ├── TxToasts.tsx             # live tx pending/finalized chips
│   │   ├── AutoRefresh.tsx          # 15s router.refresh()
│   │   └── MyStakes.tsx             # wallet-aware "my stakes" filter
│   ├── lib/
│   │   ├── genlayer.ts              # publicClient + read helpers
│   │   ├── wallet.ts                # MetaMask Snap client + write helpers
│   │   ├── contracts.ts             # ADDRS from env + Claim/Pool types
│   │   └── txQueue.ts               # in-memory tx pub/sub for toasts
│   ├── scripts/
│   │   ├── deploy.ts                # full 5-step deploy + FINALIZED gate
│   │   ├── seed.ts                  # populate 5 hand-crafted demo claims
│   │   ├── smoke.ts                 # drive lifecycle on one claim, print verdict
│   │   ├── status.ts                # gen_call + eth_getCode probe each contract
│   │   ├── poll_resolution.ts       # poll until a claim hits RESOLVED
│   │   └── probe.ts                 # diagnostic: deploy one file standalone
│   └── .env.local                   # generated by deploy
├── deployments.studionet.json       # generated by deploy
├── deployments.bradbury.json        # generated by deploy:bradbury
└── README.md
```
