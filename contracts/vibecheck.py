# { "Seq": [{ "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }] }
# Pact - AI-powered escrow with real GEN token transfers + stable binary-verdict consensus
import json
from genlayer import *


STATUS_PENDING       = "PENDING"
STATUS_FUNDED        = "FUNDED"
STATUS_SUBMITTED     = "SUBMITTED"
STATUS_AI_REVIEWED   = "AI_REVIEWED"
STATUS_RESOLVED_PASS = "RESOLVED_PASS"
STATUS_RESOLVED_FAIL = "RESOLVED_FAIL"
STATUS_CANCELLED     = "CANCELLED"


@gl.evm.contract_interface
class _Wallet:
    class View:
        pass
    class Write:
        pass


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
        return [d for d in self._load().values() if d.get("status") == STATUS_PENDING]

    @gl.public.view
    def get_stats(self) -> dict:
        all_deals = list(self._load().values())
        total    = len(all_deals)
        resolved = sum(1 for d in all_deals if d["status"] in [STATUS_RESOLVED_PASS, STATUS_RESOLVED_FAIL])
        active   = sum(1 for d in all_deals if d["status"] in [STATUS_FUNDED, STATUS_SUBMITTED, STATUS_AI_REVIEWED])
        pending  = sum(1 for d in all_deals if d["status"] == STATUS_AI_REVIEWED)
        return {
            "total_deals":        total,
            "active_deals":       active,
            "pending_reviews":    pending,
            "ai_resolution_rate": int(resolved / total * 100) if total > 0 else 0,
        }

    @gl.public.write.payable
    def create_deal(self, prompt: str, deadline_days: int, amount_gen: str) -> str:
        buyer = gl.message.sender_address.as_hex
        amount_float = float(amount_gen)
        assert amount_float > 0, "Escrow amount must be positive"
        expected_wei = u256(int(amount_float * (10 ** 18)))
        assert gl.message.value == expected_wei, "Must send exactly amount_gen GEN to fund escrow"
        self.deal_count += u256(1)
        deal_id = "deal_" + str(int(self.deal_count)).zfill(6)
        deal = {
            "id":                     deal_id,
            "buyer":                  buyer,
            "seller":                 "",
            "prompt":                 prompt.strip(),
            "submission":             "",
            "submission_description": "",
            "amount":                 amount_gen,
            "amount_wei":             int(gl.message.value),
            "status":                 STATUS_PENDING,
            "ai_verdict":             None,
            "deadline_days":          deadline_days,
        }
        deals = self._load()
        deals[deal_id] = deal
        self._save(deals)
        return deal_id

    @gl.public.write
    def cancel_deal(self, deal_id: str) -> None:
        deals = self._load()
        assert deal_id in deals, "Deal not found"
        deal = deals[deal_id]
        assert gl.message.sender_address.as_hex == deal["buyer"], "Only buyer"
        assert deal["status"] in [STATUS_PENDING, STATUS_FUNDED], "Cannot cancel at this stage"
        deal["status"] = STATUS_CANCELLED
        deals[deal_id] = deal
        self._save(deals)
        _Wallet(Address(deal["buyer"])).emit_transfer(value=u256(deal["amount_wei"]))

    @gl.public.write
    def request_ai_review(self, deal_id: str) -> None:
        deals = self._load()
        assert deal_id in deals, "Deal not found"
        deal = deals[deal_id]
        assert gl.message.sender_address.as_hex == deal["buyer"], "Only buyer"
        assert deal["status"] == STATUS_SUBMITTED, "Work must be submitted first"
        assert deal["submission"] != "", "No submission to review"

        ai_prompt = (
            "You are Pact AI Review. Evaluate this creative submission objectively.\n\n"
            "CREATIVE BRIEF:\n" + deal["prompt"] + "\n\n"
            "SUBMISSION URL: " + deal["submission"] + "\n"
            "SELLER DESCRIPTION: " + deal["submission_description"] + "\n\n"
            "PASS if it satisfies the brief. FAIL otherwise.\n\n"
            'Return ONLY valid JSON: {"result": "PASS" or "FAIL", "confidence": 0-100, "reasoning": "..."}'
        )

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

        if isinstance(verdict, str):
            verdict = json.loads(verdict)
        verdict["result"] = str(verdict.get("result", "FAIL")).upper()
        if verdict["result"] not in ("PASS", "FAIL"):
            verdict["result"] = "FAIL"

        deal["ai_verdict"] = verdict
        deal["status"] = STATUS_AI_REVIEWED
        deals[deal_id] = deal
        self._save(deals)

    @gl.public.write
    def claim_deal(self, deal_id: str) -> None:
        deals = self._load()
        assert deal_id in deals, "Deal not found"
        deal = deals[deal_id]
        sender = gl.message.sender_address.as_hex
        assert deal["status"] == STATUS_PENDING, "Deal not open"
        assert deal["seller"] == "", "Already claimed"
        assert sender != deal["buyer"], "Buyer cannot claim own deal"
        deal["seller"] = sender
        deal["status"] = STATUS_FUNDED
        deals[deal_id] = deal
        self._save(deals)

    @gl.public.write
    def release_after_ai(self, deal_id: str) -> None:
        deals = self._load()
        assert deal_id in deals, "Deal not found"
        deal = deals[deal_id]
        assert gl.message.sender_address.as_hex == deal["buyer"], "Only buyer"
        assert deal["status"] == STATUS_AI_REVIEWED, "AI review required first"
        verdict = deal.get("ai_verdict") or {}
        is_pass = str(verdict.get("result", "FAIL")).upper() == "PASS"
        deal["status"] = STATUS_RESOLVED_PASS if is_pass else STATUS_RESOLVED_FAIL
        deals[deal_id] = deal
        self._save(deals)
        if is_pass:
            _Wallet(Address(deal["seller"])).emit_transfer(value=u256(deal["amount_wei"]))
        else:
            _Wallet(Address(deal["buyer"])).emit_transfer(value=u256(deal["amount_wei"]))

    @gl.public.write
    def override_ai(self, deal_id: str, release: bool) -> None:
        deals = self._load()
        assert deal_id in deals, "Deal not found"
        deal = deals[deal_id]
        assert gl.message.sender_address.as_hex == deal["buyer"], "Only buyer"
        assert deal["status"] == STATUS_AI_REVIEWED, "AI review required first"
        deal["status"] = STATUS_RESOLVED_PASS if release else STATUS_RESOLVED_FAIL
        deals[deal_id] = deal
        self._save(deals)
        if release:
            _Wallet(Address(deal["seller"])).emit_transfer(value=u256(deal["amount_wei"]))
        else:
            _Wallet(Address(deal["buyer"])).emit_transfer(value=u256(deal["amount_wei"]))

    @gl.public.write
    def submit_work(self, deal_id: str, submission_url: str, description: str) -> None:
        deals = self._load()
        assert deal_id in deals, "Deal not found"
        deal = deals[deal_id]
        assert gl.message.sender_address.as_hex == deal["seller"], "Only seller"
        assert deal["status"] == STATUS_FUNDED, "Deal must be active"
        assert len(submission_url.strip()) > 0, "Submission URL required"
        assert len(description.strip()) >= 10, "Description too short"
        deal["submission"]             = submission_url.strip()
        deal["submission_description"] = description.strip()
        deal["status"]                 = STATUS_SUBMITTED
        deals[deal_id] = deal
        self._save(deals)

    @gl.public.write
    def approve_work(self, deal_id: str) -> None:
        deals = self._load()
        assert deal_id in deals, "Deal not found"
        deal = deals[deal_id]
        assert gl.message.sender_address.as_hex == deal["buyer"], "Only buyer"
        assert deal["status"] == STATUS_SUBMITTED, "Work must be submitted first"
        deal["status"] = STATUS_RESOLVED_PASS
        deals[deal_id] = deal
        self._save(deals)
        _Wallet(Address(deal["seller"])).emit_transfer(value=u256(deal["amount_wei"]))
