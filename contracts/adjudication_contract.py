# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


# Cross-contract interface stubs — the contract talks to its sibling
# Registry and StakeManager via gl.contract_interface() proxies.
@gl.contract_interface
class _Registry:
    class View:
        def get_claim(self, claim_id: u256) -> str: ...
    class Write:
        def record_verdict(
            self,
            claim_id: u256,
            verdict: str,
            confidence: u256,
            evidence_weight: u256,
            reasoning: str,
        ) -> None: ...


@gl.contract_interface
class _StakeMgr:
    class View:
        pass
    class Write:
        def distribute_rewards(self, claim_id: u256, verdict: str) -> None: ...


class AdjudicationContract(gl.Contract):
    owner: Address
    registry: Address
    stake_manager: Address

    def __init__(self):
        self.owner = gl.message.sender_address

    @gl.public.write
    def wire(self, registry: str, stake_manager: str) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("only owner")
        self.registry = Address(registry)
        self.stake_manager = Address(stake_manager)

    @gl.public.write
    def retry_settle(
        self,
        claim_id: u256,
        verdict: str,
        confidence: u256,
        evidence_weight: u256,
        reasoning: str,
    ) -> None:
        # Emergency escape hatch for when adjudicate() finalized but its
        # triggered record_verdict + distribute_rewards txs got CANCELED by
        # consensus (a real failure mode we hit on studionet). Owner-only.
        # Re-fires the same cross-contract emits without re-running the LLM.
        # The owner is responsible for using the same verdict the original
        # adjudicate would have produced — typically read from the cancelled
        # tx's leader_receipt off-chain.
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("only owner")
        if verdict not in ("SUPPORTED", "NOT_SUPPORTED", "PARTIAL", "INSUFFICIENT"):
            raise gl.vm.UserError("bad verdict")
        _Registry(self.registry).emit(value=u256(0)).record_verdict(
            claim_id, verdict, confidence, evidence_weight, reasoning,
        )
        _StakeMgr(self.stake_manager).emit(value=u256(0)).distribute_rewards(
            claim_id, verdict,
        )
        print(f"retry_settle claim_id={int(claim_id)} verdict={verdict}")

    @gl.public.write
    def adjudicate(self, claim_id: u256) -> None:
        # Pull the dispute package from the registry. Re-fetching on-chain
        # means callers can't lie about what validators see.
        raw = _Registry(self.registry).view().get_claim(claim_id)
        claim = json.loads(raw)
        if claim["state"] != "UNDER_REVIEW":
            raise gl.vm.UserError("claim not under review")

        print(f"adjudicate begin claim_id={int(claim_id)}")

        # Step 1: per-URL evidence fetching. For each URL in the evidence
        # strings, validators independently retrieve the page text and
        # summarize the relevant claim it makes. The summaries (not the URL
        # strings) are what feeds into the verdict prompt — so validators
        # reason about *actual content*, not what they imagine lives at a URL.
        evidence_for_summary = _summarize_evidence(
            claim["evidence_for"], claim["statement"], "FOR"
        )
        evidence_against_summary = _summarize_evidence(
            claim["evidence_against"], claim["statement"], "AGAINST"
        )

        # Step 2: verdict. Multiple validators independently reason and the
        # comparative equivalence principle reconciles their structured
        # outputs.
        verdict = self._reason(
            claim, evidence_for_summary, evidence_against_summary
        )

        print(f"adjudicate result claim_id={int(claim_id)} verdict={verdict['verdict']}")

        # Commit verdict to the registry. The registry's record_verdict will
        # itself trigger stake_manager.distribute_rewards so the "only
        # registry" gate is satisfied — keeps the trust path single-source.
        _Registry(self.registry).emit(value=u256(0)).record_verdict(
            u256(int(claim["id"])),
            verdict["verdict"],
            u256(int(verdict["confidence"])),
            u256(int(verdict["evidence_weight"])),
            verdict["reasoning"],
        )

    def _reason(self, claim: dict, ev_for: str, ev_against: str) -> dict:
        prompt = _build_verdict_prompt(claim, ev_for, ev_against)

        def run() -> str:
            raw = gl.nondet.exec_prompt(prompt)
            return _extract_json(raw)

        raw = gl.eq_principle.prompt_comparative(
            run,
            (
                "Two verdicts are equivalent iff: "
                "(a) the `verdict` field is identical, "
                "(b) `confidence` values are within 1500 basis points, "
                "(c) `evidence_weight` values are within 2000 basis points. "
                "Reasoning text may differ in wording but must reach the same conclusion."
            ),
        )
        parsed = json.loads(raw)
        v = parsed.get("verdict", "INSUFFICIENT")
        if v not in ("SUPPORTED", "NOT_SUPPORTED", "PARTIAL", "INSUFFICIENT"):
            v = "INSUFFICIENT"
        return {
            "verdict": v,
            "confidence": _clamp_bps(parsed.get("confidence", 0)),
            "evidence_weight": _clamp_bps(parsed.get("evidence_weight", 0)),
            "reasoning": str(parsed.get("reasoning", ""))[:4000],
        }


# --- helpers --------------------------------------------------------

MAX_URLS_PER_SIDE = 3   # cap LLM cost per adjudication


def _summarize_evidence(blob: str, statement: str, side: str) -> str:
    """Fetch every URL in the evidence blob and summarize what it says
    about the claim. Returns a single string combining submitted text +
    fetched summaries, ready to feed into the verdict.

    Non-URL text passes through as-is. Per-URL fetch is wrapped in
    `gl.eq_principle.strict_eq` so all validators see the same page (or
    same error string) — fetch errors are caught INSIDE the closure so
    NondetException can't escape past strict_eq.

    Per-URL summarization uses `gl.eq_principle.prompt_non_comparative`:
    the leader produces the summary, validators only verify it's faithful
    to the fetched page (cheaper than every validator re-summarizing).
    """
    if not blob:
        return "(none submitted)"

    parts = []
    url_count = 0
    for raw_item in blob.split("|"):
        item = raw_item.strip()
        if not item:
            continue
        if item.startswith("http://") or item.startswith("https://"):
            if url_count >= MAX_URLS_PER_SIDE:
                parts.append(f"- SOURCE {item}\n  SUMMARY: [skipped: per-side URL cap reached]")
                continue
            url_count += 1
            summary = _fetch_and_summarize(item, statement, side)
            parts.append(f"- SOURCE {item}\n  SUMMARY: {summary}")
        else:
            parts.append(f"- USER QUOTE: {item}")
    return "\n".join(parts) if parts else "(none submitted)"


def _fetch_and_summarize(url: str, statement: str, side: str) -> str:
    def fetch() -> str:
        # NondetException for a 404/timeout would escape past the outer
        # try/except (it propagates inside strict_eq's lazy evaluation),
        # so catch it INSIDE the closure. The error string is the same
        # across validators, so strict_eq still reaches equivalence.
        try:
            page = gl.nondet.web.render(url, mode="text")
            return page[:8000] if page else "[fetch returned empty body]"
        except Exception as e:
            kind = type(e).__name__
            msg = str(e)[:300]
            return f"[FETCH_FAILED:{kind}] {msg}"

    page = gl.eq_principle.strict_eq(fetch)

    # If the fetch failed, skip the summarization LLM call and surface the
    # failure verbatim — saves a prompt round per dead URL.
    if isinstance(page, str) and page.startswith("[FETCH_FAILED"):
        return f"[unreachable] {page}"

    summary_prompt = f"""You are summarizing a web page for use as evidence in a dispute.

The claim under dispute is:
"{statement}"

The party citing this URL is arguing {side} the claim.

Read the page text below and produce a 1-3 sentence summary of what the
page actually says about this topic. Be faithful to the page; do not
invent facts not present. If the page is unrelated, say so explicitly.

PAGE TEXT:
{page}

Respond with ONLY the summary, no preamble."""

    def summarize() -> str:
        return gl.nondet.exec_prompt(summary_prompt)

    try:
        raw = gl.eq_principle.prompt_non_comparative(
            summarize,
            task=f"summarize a web page as evidence {side} the dispute",
            criteria=(
                "The summary must be 1-3 sentences. It must be faithful to the "
                "page text — do not assert facts the page does not say. If the "
                "page is unrelated to the claim, the summary must say so."
            ),
        )
        return raw.strip()[:600]
    except Exception as e:
        return f"[summary failed: {type(e).__name__}]"


def _build_verdict_prompt(claim: dict, ev_for: str, ev_against: str) -> str:
    return f"""You are an independent validator adjudicating a disputed claim.
Reason carefully. You will be compared against peer validators.

CLAIM:
{claim['statement']}

ARGUMENTS FOR:
{claim['arguments_for'] or '(none submitted)'}

ARGUMENTS AGAINST:
{claim['arguments_against'] or '(none submitted)'}

EVIDENCE FOR (URLs were fetched and summarized; direct quotes pass through):
{ev_for}

EVIDENCE AGAINST:
{ev_against}

Evaluate:
- Does the submitted evidence substantiate the claim?
- Are counter-arguments well-supported by their submitted evidence?
- Is the evidence ambiguous, insufficient, or partially supportive?

Return ONLY a JSON object — no prose, no markdown — with this exact shape:
{{
  "verdict": "SUPPORTED" | "NOT_SUPPORTED" | "PARTIAL" | "INSUFFICIENT",
  "confidence": <integer 0-10000 in basis points>,
  "evidence_weight": <integer 0-10000 reflecting how strong the evidence is>,
  "reasoning": "<2-5 sentences citing the strongest evidence items by content>"
}}"""


def _extract_json(s: str) -> str:
    start = s.find("{")
    end = s.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return '{"verdict":"INSUFFICIENT","confidence":0,"evidence_weight":0,"reasoning":"validator returned no parseable JSON"}'
    return s[start:end + 1]


def _clamp_bps(x) -> int:
    try:
        n = int(x)
    except Exception:
        return 0
    if n < 0:
        return 0
    if n > 10000:
        return 10000
    return n
