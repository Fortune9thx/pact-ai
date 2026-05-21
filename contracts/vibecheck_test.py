# { "Depends": "py-genlayer:latest" }
# VibeCheck — GenLayer Intelligent Contract
# AI-powered escrow and dispute resolution for creative work.

import json
from dataclasses import dataclass
from genlayer import *


STATUS_FUNDED        = "FUNDED"
STATUS_SUBMITTED     = "SUBMITTED"
STATUS_DISPUTED      = "DISPUTED"
STATUS_RESOLVED_PASS = "RESOLVED_PASS"
STATUS_RESOLVED_FAIL = "RESOLVED_FAIL"
STATUS_CANCELLED     = "CANCELLED"


@allow_storage
@dataclass
class Deal:
    id: str
    buyer: str
    seller: str
    prompt: str
    submission: str
    submission_description: str
    amount: int
    status: str
    has_verdict: bool
    verdict_result: str
    verdict_confidence: int
    verdict_reasoning: str
    verdict_style: int
    verdict_alignment: int
    verdict_quality: int
    deadline_days: int


class VibeCheck(gl.Contract):
    deals: TreeMap[str, Deal]
    deal_count: int

    def __init__(self):
        self.deal_count = 0

    @gl.public.view
    def get_deal(self, deal_id: str) -> dict:
        assert deal_id in self.deals, "Deal not found"
        return self._deal_to_dict(self.deals[deal_id])

    @gl.public.view
    def get_all_deals(self) -> list:
        return [self._deal_to_dict(d) for d in self.deals.values()]

    @gl.public.view
    def get_deals_for_buyer(self, buyer: str) -> list:
        return [self._deal_to_dict(d) for d in self.deals.values() if d.buyer == buyer]

    @gl.public.view
    def get_deals_for_seller(self, seller: str) -> list:
        return [self._deal_to_dict(d) for d in self.deals.values() if d.seller == seller]

    @gl.public.view
    def get_deal_count(self) -> int:
        return self.deal_count

    @gl.public.view
    def get_stats(self) -> dict:
        all_deals = list(self.deals.values())
        total = len(all_deals)
        resolved = sum(1 for d in all_deals if d.status in [STATUS_RESOLVED_PASS, STATUS_RESOLVED_FAIL])
        active = sum(1 for d in all_deals if d.status in [STATUS_FUNDED, STATUS_SUBMITTED, STATUS_DISPUTED])
        pending = sum(1 for d in all_deals if d.status in [STATUS_SUBMITTED, STATUS_DISPUTED])
        return {
            "total_deals": total,
            "active_deals": active,
            "pending_reviews": pending,
            "ai_resolution_rate": int(resolved / total * 100) if total > 0 else 0,
        }

    @gl.public.write
    def create_deal(self, seller: str, prompt: str, deadline_days: int, amount_gen: int) -> str:
        buyer = str(gl.message.sender_address)
        assert buyer != seller, "Buyer cannot be the seller"
        assert len(prompt.strip()) >= 20, "Prompt must be at least 20 characters"
        assert 1 <= deadline_days <= 90, "Deadline must be 1-90 days"
        assert amount_gen > 0, "Escrow amount must be positive"

        self.deal_count += 1
        deal_id = f"deal_{self.deal_count:06d}"

        self.deals[deal_id] = Deal(
            id=deal_id,
            buyer=buyer,
            seller=seller,
            prompt=prompt.strip(),
            submission="",
            submission_description="",
            amount=amount_gen,
            status=STATUS_FUNDED,
            has_verdict=False,
            verdict_result="",
            verdict_confidence=0,
            verdict_reasoning="",
            verdict_style=0,
            verdict_alignment=0,
            verdict_quality=0,
            deadline_days=deadline_days,
        )
        return deal_id

    @gl.public.write
    def submit_work(self, deal_id: str, submission_url: str, description: str) -> None:
        assert deal_id in self.deals, "Deal not found"
        deal = self.deals[deal_id]
        sender = str(gl.message.sender_address)
        assert sender == deal.seller, "Only the seller can submit work"
        assert deal.status == STATUS_FUNDED, f"Deal must be FUNDED, got {deal.status}"
        assert len(submission_url.strip()) > 0, "Submission URL required"
        assert len(description.strip()) >= 10, "Description must be at least 10 characters"

        self.deals[deal_id].submission = submission_url.strip()
        self.deals[deal_id].submission_description = description.strip()
        self.deals[deal_id].status = STATUS_SUBMITTED

    @gl.public.write
    def dispute_deal(self, deal_id: str) -> None:
        assert deal_id in self.deals, "Deal not found"
        deal = self.deals[deal_id]
        sender = str(gl.message.sender_address)
        assert sender == deal.buyer, "Only the buyer can dispute"
        assert deal.status == STATUS_SUBMITTED, "Work must be submitted first"
        assert deal.submission != "", "No submission to dispute"
        self.deals[deal_id].status = STATUS_DISPUTED
        self._run_ai_evaluation(deal_id)

    @gl.public.write
    def request_verdict(self, deal_id: str) -> None:
        assert deal_id in self.deals, "Deal not found"
        deal = self.deals[deal_id]
        sender = str(gl.message.sender_address)
        assert sender in [deal.buyer, deal.seller], "Only deal participants can request verdict"
        assert deal.status in [STATUS_SUBMITTED, STATUS_DISPUTED], "Deal must be submitted or disputed"
        assert deal.submission != "", "No submission to evaluate"
        if deal.status == STATUS_SUBMITTED:
            self.deals[deal_id].status = STATUS_DISPUTED
        self._run_ai_evaluation(deal_id)

    @gl.public.write
    def cancel_deal(self, deal_id: str) -> None:
        assert deal_id in self.deals, "Deal not found"
        deal = self.deals[deal_id]
        sender = str(gl.message.sender_address)
        assert sender == deal.buyer, "Only the buyer can cancel"
        assert deal.status == STATUS_FUNDED, "Can only cancel funded deals"
        self.deals[deal_id].status = STATUS_CANCELLED

    def _run_ai_evaluation(self, deal_id: str) -> None:
        deal = self.deals[deal_id]
        prompt_text = deal.prompt
        submission_url = deal.submission
        description = deal.submission_description

        def evaluate() -> str:
            try:
                web_data = gl.get_webpage(submission_url, mode="text")
                content_preview = web_data[:2000]
            except Exception:
                content_preview = f"[URL unavailable]\n{description}"

            task = f"""You are VibeCheck AI, a creative quality evaluator for a smart contract escrow platform.

Evaluate whether this submission matches the buyer's creative brief.

BUYER'S BRIEF: "{prompt_text}"
SELLER'S URL: {submission_url}
SELLER'S DESCRIPTION: {description}
CONTENT PREVIEW: {content_preview[:1000]}

Score each dimension 0-100:
- style_match: Does the style match the brief?
- prompt_alignment: Does it address the requirements?
- quality_match: Is the quality professional?

PASS if average >= 65 AND no dimension < 45. FAIL otherwise.

Respond ONLY with valid JSON (no markdown, no extra text):
{{"result":"PASS or FAIL","confidence":0-100,"style_match":0-100,"prompt_alignment":0-100,"quality_match":0-100,"reasoning":"2-3 sentence explanation"}}"""

            raw = gl.exec_prompt(task).strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.dumps(json.loads(raw.strip()), sort_keys=True)

        raw_result = gl.eq_principle_strict_eq(evaluate)

        try:
            v = json.loads(raw_result)
        except Exception:
            v = {
                "result": "FAIL", "confidence": 0,
                "style_match": 0, "prompt_alignment": 0, "quality_match": 0,
                "reasoning": "AI evaluation failed. Manual review required.",
            }

        result = v.get("result", "FAIL")
        self.deals[deal_id].has_verdict = True
        self.deals[deal_id].verdict_result = result
        self.deals[deal_id].verdict_confidence = int(v.get("confidence", 0))
        self.deals[deal_id].verdict_reasoning = str(v.get("reasoning", ""))
        self.deals[deal_id].verdict_style = int(v.get("style_match", 0))
        self.deals[deal_id].verdict_alignment = int(v.get("prompt_alignment", 0))
        self.deals[deal_id].verdict_quality = int(v.get("quality_match", 0))
        self.deals[deal_id].status = STATUS_RESOLVED_PASS if result == "PASS" else STATUS_RESOLVED_FAIL

    def _deal_to_dict(self, d: Deal) -> dict:
        verdict = None
        if d.has_verdict:
            verdict = {
                "result": d.verdict_result,
                "confidence": d.verdict_confidence,
                "reasoning": d.verdict_reasoning,
                "style_match": d.verdict_style,
                "prompt_alignment": d.verdict_alignment,
                "quality_match": d.verdict_quality,
            }
        return {
            "id": d.id,
            "buyer": d.buyer,
            "seller": d.seller,
            "prompt": d.prompt,
            "submission": d.submission,
            "submission_description": d.submission_description,
            "amount": d.amount,
            "status": d.status,
            "ai_verdict": verdict,
            "deadline_days": d.deadline_days,
        }
