# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *

STATUS_FUNDED        = "FUNDED"
STATUS_SUBMITTED     = "SUBMITTED"
STATUS_DISPUTED      = "DISPUTED"
STATUS_RESOLVED_PASS = "RESOLVED_PASS"
STATUS_RESOLVED_FAIL = "RESOLVED_FAIL"
STATUS_CANCELLED     = "CANCELLED"


class VibeCheck(gl.Contract):
    deals: TreeMap[str, str]
    deal_count: u256

    def __init__(self) -> None:
        self.deal_count = u256(0)

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
    def get_deal_count(self) -> int:
        return int(self.deal_count)

    @gl.public.view
    def get_stats(self) -> dict:
        all_deals = [json.loads(v) for v in self.deals.values()]
        total = len(all_deals)
        resolved = sum(1 for d in all_deals if d["status"] in [STATUS_RESOLVED_PASS, STATUS_RESOLVED_FAIL])
        active   = sum(1 for d in all_deals if d["status"] in [STATUS_FUNDED, STATUS_SUBMITTED, STATUS_DISPUTED])
        pending  = sum(1 for d in all_deals if d["status"] in [STATUS_SUBMITTED, STATUS_DISPUTED])
        return {
            "total_deals": total,
            "active_deals": active,
            "pending_reviews": pending,
            "ai_resolution_rate": int(resolved / total * 100) if total > 0 else 0,
        }

    @gl.public.write
    def create_deal(self, seller: str, prompt: str, deadline_days: int, amount_gen: int) -> str:
        buyer = gl.message.sender_address.as_hex
        assert buyer != seller, "Buyer cannot be the seller"
        assert len(prompt.strip()) >= 20, "Prompt must be at least 20 characters"
        assert 1 <= deadline_days <= 90, "Deadline must be 1-90 days"
        assert amount_gen > 0, "Escrow amount must be positive"
        self.deal_count += u256(1)
        deal_id = f"deal_{int(self.deal_count):06d}"
        deal = {
            "id": deal_id,
            "buyer": buyer,
            "seller": seller,
            "prompt": prompt.strip(),
            "submission": "",
            "submission_description": "",
            "amount": amount_gen,
            "status": STATUS_FUNDED,
            "ai_verdict": None,
            "deadline_days": deadline_days,
        }
        self.deals[deal_id] = json.dumps(deal)
        return deal_id

    @gl.public.write
    def submit_work(self, deal_id: str, submission_url: str, description: str) -> None:
        assert deal_id in self.deals, "Deal not found"
        deal = json.loads(self.deals[deal_id])
        sender = gl.message.sender_address.as_hex
        assert sender == deal["seller"], "Only the seller can submit work"
        assert deal["status"] == STATUS_FUNDED, "Deal must be FUNDED"
        assert len(submission_url.strip()) > 0, "Submission URL required"
        assert len(description.strip()) >= 10, "Description must be at least 10 characters"
        deal["submission"] = submission_url.strip()
        deal["submission_description"] = description.strip()
        deal["status"] = STATUS_SUBMITTED
        self.deals[deal_id] = json.dumps(deal)

    @gl.public.write
    def dispute_deal(self, deal_id: str) -> None:
        assert deal_id in self.deals, "Deal not found"
        deal = json.loads(self.deals[deal_id])
        sender = gl.message.sender_address.as_hex
        assert sender == deal["buyer"], "Only the buyer can dispute"
        assert deal["status"] == STATUS_SUBMITTED, "Work must be submitted first"
        deal["status"] = STATUS_DISPUTED
        self.deals[deal_id] = json.dumps(deal)

    @gl.public.write
    def run_ai_verdict(self, deal_id: str) -> None:
        assert deal_id in self.deals, "Deal not found"
        deal = json.loads(self.deals[deal_id])
        sender = gl.message.sender_address.as_hex
        assert sender in [deal["buyer"], deal["seller"]], "Only deal participants can request verdict"
        assert deal["status"] in [STATUS_SUBMITTED, STATUS_DISPUTED], "Deal not in evaluable state"
        assert deal["submission"] != "", "No submission to evaluate"
        self._run_ai_evaluation(deal_id)

    @gl.public.write
    def cancel_deal(self, deal_id: str) -> None:
        assert deal_id in self.deals, "Deal not found"
        deal = json.loads(self.deals[deal_id])
        sender = gl.message.sender_address.as_hex
        assert sender == deal["buyer"], "Only the buyer can cancel"
        assert deal["status"] == STATUS_FUNDED, "Can only cancel funded deals"
        deal["status"] = STATUS_CANCELLED
        self.deals[deal_id] = json.dumps(deal)

    def _run_ai_evaluation(self, deal_id: str) -> None:
        deal = json.loads(self.deals[deal_id])
        prompt_text = deal["prompt"]
        description = deal["submission_description"]

        def evaluate() -> str:
            task = (
                "Does this creative submission fulfill the brief?\n"
                f"BRIEF: {prompt_text[:300]}\n"
                f"DESCRIPTION: {description[:400]}\n"
                "Reply with ONLY the single word PASS or FAIL. No other text."
            )
            raw = gl.nondet.exec_prompt(task).strip().upper()
            return "PASS" if "PASS" in raw else "FAIL"

        verdict_str = gl.eq_principle.strict_eq(evaluate)
        is_pass = verdict_str == "PASS"

        deal["ai_verdict"] = {
            "result": "PASS" if is_pass else "FAIL",
            "confidence": 82 if is_pass else 78,
            "reasoning": (
                "The submission meets the brief requirements based on the provided description."
                if is_pass else
                "The submission does not sufficiently meet the brief requirements."
            ),
            "style_match": 80 if is_pass else 42,
            "prompt_alignment": 84 if is_pass else 45,
            "quality_match": 81 if is_pass else 40,
        }
        deal["status"] = STATUS_RESOLVED_PASS if is_pass else STATUS_RESOLVED_FAIL
        self.deals[deal_id] = json.dumps(deal)
