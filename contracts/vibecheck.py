# v0.3.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
# Pact - GenLayer Intelligent Contract
# AI-powered escrow and dispute resolution for creative work.
# v0.3: invite flow — no seller upfront, AI as advisor not autonomous judge.

import json
from genlayer import *

STATUS_PENDING      = "PENDING"        # created by buyer, awaiting seller claim
STATUS_FUNDED       = "FUNDED"         # seller claimed, escrow active
STATUS_SUBMITTED    = "SUBMITTED"      # seller submitted work
STATUS_AI_REVIEWED  = "AI_REVIEWED"    # AI gave verdict, buyer decides
STATUS_RESOLVED_PASS = "RESOLVED_PASS" # buyer approved / accepted AI PASS
STATUS_RESOLVED_FAIL = "RESOLVED_FAIL" # buyer rejected / accepted AI FAIL
STATUS_CANCELLED    = "CANCELLED"


class VibeCheck(gl.Contract):
    deals: TreeMap[str, str]
    deal_count: u256

    def __init__(self) -> None:
        self.deal_count = u256(0)

    # ── Read ──────────────────────────────────────────────────────────

    @gl.public.view
    def get_deal(self, deal_id: str) -> dict:
        assert deal_id in self.deals, "Deal not found"
        return json.loads(self.deals[deal_id])

    @gl.public.view
    def get_all_deals(self) -> list:
        return [json.loads(v) for v in self.deals.values()]

    @gl.public.view
    def get_deals_for_buyer(self, buyer: str) -> list:
        return [json.loads(v) for v in self.deals.values() if json.loads(v)["buyer"] == buyer]

    @gl.public.view
    def get_deals_for_seller(self, seller: str) -> list:
        return [json.loads(v) for v in self.deals.values() if json.loads(v)["seller"] == seller]

    @gl.public.view
    def get_pending_deals(self) -> list:
        """All unclaimed deals (PENDING status, no seller yet)."""
        return [json.loads(v) for v in self.deals.values() if json.loads(v)["status"] == STATUS_PENDING]

    @gl.public.view
    def get_deal_count(self) -> int:
        return int(self.deal_count)

    @gl.public.view
    def get_stats(self) -> dict:
        all_deals = [json.loads(v) for v in self.deals.values()]
        total    = len(all_deals)
        resolved = sum(1 for d in all_deals if d["status"] in [STATUS_RESOLVED_PASS, STATUS_RESOLVED_FAIL])
        active   = sum(1 for d in all_deals if d["status"] in [STATUS_FUNDED, STATUS_SUBMITTED, STATUS_AI_REVIEWED])
        pending  = sum(1 for d in all_deals if d["status"] == STATUS_AI_REVIEWED)
        return {
            "total_deals":         total,
            "active_deals":        active,
            "pending_reviews":     pending,
            "ai_resolution_rate":  int(resolved / total * 100) if total > 0 else 0,
        }

    # ── Write — Buyer ─────────────────────────────────────────────────

    @gl.public.write
    def create_deal(self, prompt: str, deadline_days: int, amount_gen: int) -> str:
        """Buyer creates a protected agreement. No seller address needed — share the invite link."""
        buyer = gl.message.sender_address.as_hex
        assert len(prompt.strip()) >= 20, "Prompt must be at least 20 characters"
        assert 1 <= deadline_days <= 90, "Deadline must be 1-90 days"
        assert amount_gen > 0, "Escrow amount must be positive"

        self.deal_count += u256(1)
        deal_id = f"deal_{int(self.deal_count):06d}"
        deal = {
            "id":                     deal_id,
            "buyer":                  buyer,
            "seller":                 "",           # empty until claimed
            "prompt":                 prompt.strip(),
            "submission":             "",
            "submission_description": "",
            "amount":                 amount_gen,
            "status":                 STATUS_PENDING,
            "ai_verdict":             None,
            "deadline_days":          deadline_days,
        }
        self.deals[deal_id] = json.dumps(deal)
        return deal_id

    @gl.public.write
    def cancel_deal(self, deal_id: str) -> None:
        """Buyer cancels before work starts (PENDING or FUNDED)."""
        assert deal_id in self.deals, "Deal not found"
        deal = json.loads(self.deals[deal_id])
        sender = gl.message.sender_address.as_hex
        assert sender == deal["buyer"], "Only the buyer can cancel"
        assert deal["status"] in [STATUS_PENDING, STATUS_FUNDED], "Can only cancel before work is submitted"
        deal["status"] = STATUS_CANCELLED
        self.deals[deal_id] = json.dumps(deal)

    @gl.public.write
    def approve_work(self, deal_id: str) -> None:
        """Buyer approves submitted work — releases escrow to seller."""
        assert deal_id in self.deals, "Deal not found"
        deal = json.loads(self.deals[deal_id])
        sender = gl.message.sender_address.as_hex
        assert sender == deal["buyer"], "Only the buyer can approve"
        assert deal["status"] == STATUS_SUBMITTED, "Work must be submitted first"
        deal["status"] = STATUS_RESOLVED_PASS
        self.deals[deal_id] = json.dumps(deal)

    @gl.public.write
    def request_ai_review(self, deal_id: str) -> None:
        """Buyer requests an AI review of the submitted work.
        AI provides verdict + reasoning + confidence score.
        Buyer retains final decision — AI is an advisor, not a judge.
        """
        assert deal_id in self.deals, "Deal not found"
        deal = json.loads(self.deals[deal_id])
        sender = gl.message.sender_address.as_hex
        assert sender == deal["buyer"], "Only the buyer can request AI review"
        assert deal["status"] == STATUS_SUBMITTED, "Work must be submitted first"
        assert deal["submission"] != "", "No submission to review"
        # Run AI evaluation — stores verdict but does NOT auto-resolve
        self._run_ai_evaluation(deal_id)
        # Re-read after evaluation (state may have been written inside evaluate)
        deal = json.loads(self.deals[deal_id])
        deal["status"] = STATUS_AI_REVIEWED
        self.deals[deal_id] = json.dumps(deal)

    @gl.public.write
    def release_after_ai(self, deal_id: str) -> None:
        """Buyer accepts the AI recommendation — funds released per AI verdict."""
        assert deal_id in self.deals, "Deal not found"
        deal = json.loads(self.deals[deal_id])
        sender = gl.message.sender_address.as_hex
        assert sender == deal["buyer"], "Only the buyer can act on AI review"
        assert deal["status"] == STATUS_AI_REVIEWED, "AI review must be complete first"
        assert deal["ai_verdict"] is not None, "No AI verdict to release on"
        result = deal["ai_verdict"]["result"]
        deal["status"] = STATUS_RESOLVED_PASS if result == "PASS" else STATUS_RESOLVED_FAIL
        self.deals[deal_id] = json.dumps(deal)

    @gl.public.write
    def override_ai(self, deal_id: str, release: bool) -> None:
        """Buyer overrides the AI recommendation with their own decision."""
        assert deal_id in self.deals, "Deal not found"
        deal = json.loads(self.deals[deal_id])
        sender = gl.message.sender_address.as_hex
        assert sender == deal["buyer"], "Only the buyer can override"
        assert deal["status"] == STATUS_AI_REVIEWED, "AI review must be complete first"
        deal["status"] = STATUS_RESOLVED_PASS if release else STATUS_RESOLVED_FAIL
        self.deals[deal_id] = json.dumps(deal)

    # ── Write — Seller ────────────────────────────────────────────────

    @gl.public.write
    def claim_deal(self, deal_id: str) -> None:
        """Seller claims an open deal — registers their wallet as the seller."""
        assert deal_id in self.deals, "Deal not found"
        deal = json.loads(self.deals[deal_id])
        sender = gl.message.sender_address.as_hex
        assert deal["status"] == STATUS_PENDING, "Deal is no longer open for claiming"
        assert deal["seller"] == "", "Deal already claimed"
        assert sender != deal["buyer"], "Buyer cannot claim their own deal"
        deal["seller"] = sender
        deal["status"] = STATUS_FUNDED
        self.deals[deal_id] = json.dumps(deal)

    @gl.public.write
    def submit_work(self, deal_id: str, submission_url: str, description: str) -> None:
        """Seller submits completed work."""
        assert deal_id in self.deals, "Deal not found"
        deal = json.loads(self.deals[deal_id])
        sender = gl.message.sender_address.as_hex
        assert sender == deal["seller"], "Only the seller can submit work"
        assert deal["status"] == STATUS_FUNDED, "Deal must be active (FUNDED)"
        assert len(submission_url.strip()) > 0, "Submission URL required"
        assert len(description.strip()) >= 10, "Description must be at least 10 characters"
        deal["submission"]             = submission_url.strip()
        deal["submission_description"] = description.strip()
        deal["status"]                 = STATUS_SUBMITTED
        self.deals[deal_id] = json.dumps(deal)

    # ── AI evaluation (internal) ──────────────────────────────────────

    def _run_ai_evaluation(self, deal_id: str) -> None:
        deal          = json.loads(self.deals[deal_id])
        prompt_text   = deal["prompt"]
        submission_url = deal["submission"]
        description   = deal["submission_description"]

        def evaluate() -> str:
            try:
                content_preview = gl.nondet.web.render(submission_url, mode="text")[:2000]
            except Exception:
                content_preview = f"[URL unavailable]\n{description}"

            task = f"""You are Pact AI Review. Evaluate this creative submission objectively.

CREATIVE BRIEF: "{prompt_text}"
SUBMISSION URL: {submission_url}
SELLER DESCRIPTION: {description}
CONTENT PREVIEW: {content_preview[:500]}

Score 0-100 on each dimension:
- style_match: Does the work match the requested style/aesthetic?
- prompt_alignment: Does it address what was asked for?
- quality_match: Is the quality level appropriate?

RECOMMENDATION: PASS if average >= 65 and no dimension < 45. FAIL otherwise.

Respond ONLY with valid JSON:
{{"result":"PASS or FAIL","confidence":0-100,"style_match":0-100,"prompt_alignment":0-100,"quality_match":0-100,"reasoning":"2-3 sentence explanation of the recommendation"}}"""

            raw = gl.nondet.exec_prompt(task).strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.dumps(json.loads(raw.strip()), sort_keys=True)

        raw_result = gl.eq_principle.strict_eq(evaluate)

        try:
            v = json.loads(raw_result)
        except Exception:
            v = {
                "result": "FAIL", "confidence": 0,
                "style_match": 0, "prompt_alignment": 0, "quality_match": 0,
                "reasoning": "AI evaluation failed. Buyer should review manually.",
            }

        deal["ai_verdict"] = {
            "result":           v.get("result", "FAIL"),
            "confidence":       int(v.get("confidence", 0)),
            "reasoning":        str(v.get("reasoning", "")),
            "style_match":      int(v.get("style_match", 0)),
            "prompt_alignment": int(v.get("prompt_alignment", 0)),
            "quality_match":    int(v.get("quality_match", 0)),
        }
        # NOTE: status is set by the caller (request_ai_review), not here.
        # This keeps AI evaluation as advisory — buyer retains final decision.
        self.deals[deal_id] = json.dumps(deal)
