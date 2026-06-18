# { "Seq": [{ "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }] }
import json
from genlayer import *


class VibeCheck(gl.Contract):
    deals_json: str
    deal_count: u256

    def __init__(self) -> None:
        self.deal_count = u256(0)
        self.deals_json = "{}"

    def _load(self) -> dict:
        return json.loads(self.deals_json)

    def _save(self, deals: dict) -> None:
        self.deals_json = json.dumps(deals)

    @gl.public.view
    def get_deal_count(self) -> int:
        return int(self.deal_count)

    @gl.public.view
    def get_all_deals(self) -> list:
        return list(self._load().values())

    @gl.public.view
    def get_deal(self, deal_id: str) -> dict:
        deals = self._load()
        assert deal_id in deals, "Deal not found"
        return deals[deal_id]

    @gl.public.view
    def get_deals_for_buyer(self, buyer: str) -> list:
        return [d for d in self._load().values() if d.get("buyer") == buyer]

    @gl.public.view
    def get_deals_for_seller(self, seller: str) -> list:
        return [d for d in self._load().values() if d.get("seller") == seller]

    @gl.public.view
    def get_pending_deals(self) -> list:
        return [d for d in self._load().values() if d.get("status") == "PENDING"]

    @gl.public.write
    def create_deal(self, prompt: str, deadline_days: int, amount_gen: str) -> str:
        buyer = gl.message.sender_address.as_hex

        self.deal_count += u256(1)
        deal_id = "deal_" + str(int(self.deal_count)).zfill(6)

        deal = {
            "id": deal_id,
            "buyer": buyer,
            "seller": "",
            "prompt": prompt.strip(),
            "submission": "",
            "submission_description": "",
            "amount": amount_gen,
            "status": "PENDING",
            "ai_verdict": None,
            "deadline_days": deadline_days,
        }
        deals = self._load()
        deals[deal_id] = deal
        self._save(deals)
        return deal_id

    @gl.public.write
    def claim_deal(self, deal_id: str) -> None:
        deals = self._load()
        assert deal_id in deals, "Deal not found"
        deal = deals[deal_id]
        sender = gl.message.sender_address.as_hex
        assert deal["status"] == "PENDING", "Not open"
        assert deal["seller"] == "", "Already claimed"
        assert sender != deal["buyer"], "Cannot claim own deal"
        deal["seller"] = sender
        deal["status"] = "FUNDED"
        deals[deal_id] = deal
        self._save(deals)

    @gl.public.write
    def submit_work(self, deal_id: str, submission_url: str, description: str) -> None:
        deals = self._load()
        assert deal_id in deals, "Deal not found"
        deal = deals[deal_id]
        assert gl.message.sender_address.as_hex == deal["seller"], "Only seller"
        assert deal["status"] == "FUNDED", "Must be active"
        deal["submission"] = submission_url.strip()
        deal["submission_description"] = description.strip()
        deal["status"] = "SUBMITTED"
        deals[deal_id] = deal
        self._save(deals)

    @gl.public.write
    def approve_work(self, deal_id: str) -> None:
        deals = self._load()
        assert deal_id in deals, "Deal not found"
        deal = deals[deal_id]
        assert gl.message.sender_address.as_hex == deal["buyer"], "Only buyer"
        assert deal["status"] == "SUBMITTED", "Work must be submitted"
        deal["status"] = "RESOLVED_PASS"
        deals[deal_id] = deal
        self._save(deals)

    @gl.public.write
    def cancel_deal(self, deal_id: str) -> None:
        deals = self._load()
        assert deal_id in deals, "Deal not found"
        deal = deals[deal_id]
        assert gl.message.sender_address.as_hex == deal["buyer"], "Only buyer"
        assert deal["status"] in ["PENDING", "FUNDED"], "Cannot cancel"
        deal["status"] = "CANCELLED"
        deals[deal_id] = deal
        self._save(deals)

    @gl.public.write
    def request_ai_review(self, deal_id: str) -> None:
        deals = self._load()
        assert deal_id in deals, "Deal not found"
        deal = deals[deal_id]
        assert gl.message.sender_address.as_hex == deal["buyer"], "Only buyer"
        assert deal["status"] == "SUBMITTED", "Work must be submitted"
        ai_prompt = (
            "You are an impartial expert evaluator.\n"
            "ORIGINAL BRIEF:\n" + deal["prompt"] + "\n\n"
            "SUBMISSION URL: " + deal["submission"] + "\n"
            "DESCRIPTION: " + deal["submission_description"] + "\n\n"
            "Evaluate whether the submission satisfies the brief.\n"
            "Return ONLY valid JSON:\n"
            '{"result": "PASS" or "FAIL", "confidence": integer 0-100, "reasoning": "explanation"}'
        )
        verdict = yield gl.exec_prompt_call(
            ai_prompt,
            schema={
                "type": "object",
                "properties": {
                    "result": {"type": "string"},
                    "confidence": {"type": "integer"},
                    "reasoning": {"type": "string"},
                },
                "required": ["result", "confidence", "reasoning"],
            },
        )
        if isinstance(verdict, str):
            verdict = json.loads(verdict)
        verdict["result"] = str(verdict.get("result", "FAIL")).upper()
        if verdict["result"] not in ("PASS", "FAIL"):
            verdict["result"] = "FAIL"
        deal["ai_verdict"] = verdict
        deal["status"] = "AI_REVIEWED"
        deals[deal_id] = deal
        self._save(deals)

    @gl.public.write
    def release_after_ai(self, deal_id: str) -> None:
        deals = self._load()
        assert deal_id in deals, "Deal not found"
        deal = deals[deal_id]
        assert gl.message.sender_address.as_hex == deal["buyer"], "Only buyer"
        assert deal["status"] == "AI_REVIEWED", "AI review required"
        verdict = deal.get("ai_verdict") or {}
        if str(verdict.get("result", "FAIL")).upper() == "PASS":
            deal["status"] = "RESOLVED_PASS"
        else:
            deal["status"] = "RESOLVED_FAIL"
        deals[deal_id] = deal
        self._save(deals)

    @gl.public.write
    def override_ai(self, deal_id: str, release: bool) -> None:
        deals = self._load()
        assert deal_id in deals, "Deal not found"
        deal = deals[deal_id]
        assert gl.message.sender_address.as_hex == deal["buyer"], "Only buyer"
        assert deal["status"] == "AI_REVIEWED", "AI review required"
        deal["status"] = "RESOLVED_PASS" if release else "RESOLVED_FAIL"
        deals[deal_id] = deal
        self._save(deals)
