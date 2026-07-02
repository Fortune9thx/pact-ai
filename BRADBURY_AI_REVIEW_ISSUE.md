# Bradbury: `gl.exec_prompt_call` — leader/validator execution hash divergence

**Status:** Reproduced on every attempt. Blocking `request_ai_review` on Testnet Bradbury only. Same contract, same schema, works fine on Studionet.

## TL;DR

Calling `gl.exec_prompt_call(...)` with a JSON-schema-constrained prompt on **Testnet Bradbury** consistently produces a transaction where the leader validator succeeds with one execution hash, and the *other* validators in the round all agree with *each other* but disagree with the leader — a clean 1-vs-4 split that resolves to `DISAGREE`. This is not intermittent; it has happened on every `request_ai_review` call made against our deployed contract on Bradbury.

The same contract, same prompt, same schema, deployed to **Studionet** instead, gets 5/5 unanimous `AGREE` and reaches `FINALIZED`. So this doesn't look like a bug in our schema or prompt — it looks like a Bradbury-specific runtime issue.

## Context

We're building an escrow app (Pact) where a buyer and seller settle a dispute via an AI verdict. The contract calls out to an LLM through `gl.exec_prompt_call`, constrained to a binary `PASS`/`FAIL` enum (we deliberately moved off free-form JSON after an earlier consensus-fragility issue — see below).

```python
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
```

Contract pinned to:
```
{ "Seq": [{ "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }] }
```

Deployed contract on Bradbury: `0xF099bDabD5dD15f9cde9532c276Dc2De1602595f`

## What we observed

Example transaction: `0xd8048f6e2f7e4cadca14139d0bab4902d44ce3d01aad77995a2edce7fd2c3995`

- `status`: `ACCEPTED` (5)
- `resultName`: `DISAGREE`
- 5 round validators, all voted (`votesCommitted: 5`, `votesRevealed: 5`)
- `validatorVotesName`: `["DISAGREE", "DISAGREE", "DISAGREE", "DISAGREE", "DISAGREE"]` — i.e. all 5 *validators* disagree with the **leader's** result
- `validatorResultHash`: identical across **all 5 validators** (`0x4914c34e...`) — they agree with *each other*
- The leader's own execution hash differs from that shared validator hash

This pattern — leader diverges from a unanimous validator set — repeated across multiple separate `request_ai_review` calls, different deal IDs, different prompts. We have never seen `request_ai_review` reach `AI_REVIEWED` on this Bradbury deployment.

## What we ruled out

- **Not a schema problem.** We went from free-form JSON (6 fields, caused validators to disagree on *phrasing* even when they agreed on judgment) to a binary `PASS`/`FAIL` enum specifically to eliminate ambiguity. That fix is *proven correct* — deployed the identical contract to Studionet and got 5/5 unanimous `AGREE`, `FINALIZED`, on the first try.
- **Not a prompt problem.** Same prompt structure works on Studionet.
- **Not a one-off timeout/flake.** Reproduced on every attempt across several separate transactions and deal submissions.
- **Not our contract's business logic.** The divergence is specifically in the `gl.exec_prompt_call` non-deterministic block — everything else in the contract (escrow locking, `emit_transfer`, deterministic `@gl.public.write` methods) works correctly and consistently on Bradbury.

## Working theory

Bradbury's currently-pinned GenVM/runtime build appears to execute the LLM call differently for the leader vs. the validator set — possibly a model/provider config difference, a nondeterminism source (e.g. LLM sampling temperature/seed handling) that isn't being pinned the same way for leader vs. validators, or a version skew between validator nodes on Bradbury specifically.

## What we're using instead (workaround)

Our contract also exposes `approve_work(deal_id)` — the buyer can directly approve without triggering an AI call. This uses the same real GEN escrow-release path (`emit_transfer`) and works fine on Bradbury (confirmed end-to-end, including the GEN balance actually increasing in the seller's wallet after finalization). This lets us demo/ship the escrow half of the product on Bradbury while `request_ai_review` stays broken there.

## Question for the community / GenLayer team

- Has anyone else seen leader/validator execution-hash divergence specifically on `gl.exec_prompt_call` on Bradbury?
- Is this a known issue with the currently-pinned runtime build, and is there a newer `Depends` hash that fixes it? (We tried deploying fresh with a different/newer pin and hit `FINISHED_WITH_ERROR` on Bradbury instead — so we're not sure what pin is currently accepted there.)
- Is there a way to inspect *why* the leader and validators diverged — e.g. actual LLM provider/response logs per-validator — rather than just the resulting hash mismatch?

---

*Written after a review round flagged escrow-realism and consensus-fragility issues in our contract. Both are fixed and independently verified on-chain (real `emit_transfer` GEN movement confirmed, binary-enum consensus confirmed 5/5 on Studionet) — this doc is specifically about the one remaining blocker, which appears to be a Bradbury runtime issue outside our contract's control.*
