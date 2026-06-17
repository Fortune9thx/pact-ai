# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from dataclasses import dataclass
import json


OPEN = "OPEN"
UNDER_CHALLENGE = "UNDER_CHALLENGE"
UNDER_REVIEW = "UNDER_REVIEW"
RESOLVED = "RESOLVED"
CLOSED = "CLOSED"

VALID_NEXT = {
    OPEN: (UNDER_CHALLENGE, CLOSED),
    UNDER_CHALLENGE: (UNDER_REVIEW, CLOSED),
    UNDER_REVIEW: (RESOLVED,),
    RESOLVED: (CLOSED,),
    CLOSED: (),
}


# Stub for cross-contract calls into StakeManager.
@gl.contract_interface
class _StakeManagerIface:
    class View:
        pass
    class Write:
        def lock_stake(self, claim_id: u256) -> None: ...
        def distribute_rewards(self, claim_id: u256, verdict: str) -> None: ...


@allow_storage
@dataclass
class Claim:
    id: u256
    author: Address
    statement: str
    state: str
    evidence_for: str
    evidence_against: str
    arguments_for: str
    arguments_against: str
    verdict: str
    confidence: u256
    evidence_weight: u256
    reasoning: str
    tips: u256          # payable tip-jar: cumulative GEN tipped to this claim


class ClaimRegistry(gl.Contract):
    next_id: u256
    claims: TreeMap[u256, Claim]
    owner: Address
    stake_manager: Address
    adjudication: Address
    total_tips: u256

    def __init__(self, stake_manager: str, adjudication: str):
        self.next_id = u256(1)
        self.owner = gl.message.sender_address
        self.stake_manager = Address(stake_manager)
        self.adjudication = Address(adjudication)
        self.total_tips = u256(0)

    @gl.public.write
    def create_claim(self, statement: str, initial_argument: str, evidence: str) -> u256:
        if not statement:
            raise gl.vm.UserError("statement required")
        cid = self.next_id
        self.next_id = u256(int(self.next_id) + 1)
        self.claims[cid] = Claim(
            id=cid,
            author=gl.message.sender_address,
            statement=statement,
            state=OPEN,
            arguments_for=initial_argument,
            arguments_against="",
            evidence_for=evidence,
            evidence_against="",
            verdict="",
            confidence=u256(0),
            evidence_weight=u256(0),
            reasoning="",
            tips=u256(0),
        )
        print(f"create_claim id={int(cid)} author={gl.message.sender_address.as_hex}")
        return cid

    @gl.public.write
    def challenge(self, claim_id: u256, counter_argument: str, counter_evidence: str) -> None:
        c = self.claims[claim_id]
        if c.state not in (OPEN, UNDER_CHALLENGE):
            raise gl.vm.UserError("claim not challengeable")
        c.arguments_against = _append(c.arguments_against, counter_argument)
        c.evidence_against = _append(c.evidence_against, counter_evidence)
        self._transition(c, UNDER_CHALLENGE)

    @gl.public.write
    def add_evidence(self, claim_id: u256, side: str, evidence: str, argument: str) -> None:
        c = self.claims[claim_id]
        if c.state not in (OPEN, UNDER_CHALLENGE):
            raise gl.vm.UserError("evidence window closed")
        if side not in ("FOR", "AGAINST"):
            raise gl.vm.UserError("side must be FOR or AGAINST")
        if side == "FOR":
            c.evidence_for = _append(c.evidence_for, evidence)
            c.arguments_for = _append(c.arguments_for, argument)
        else:
            c.evidence_against = _append(c.evidence_against, evidence)
            c.arguments_against = _append(c.arguments_against, argument)

    @gl.public.write
    def submit_for_review(self, claim_id: u256) -> None:
        c = self.claims[claim_id]
        if c.state != UNDER_CHALLENGE:
            raise gl.vm.UserError("needs an open challenge")
        self._transition(c, UNDER_REVIEW)
        # Auto-lock the pool via cross-contract emit so no new stakes land
        # after validators start reasoning.
        _StakeManagerIface(self.stake_manager).emit(value=u256(0)).lock_stake(claim_id)

    @gl.public.write
    def record_verdict(
        self,
        claim_id: u256,
        verdict: str,
        confidence: u256,
        evidence_weight: u256,
        reasoning: str,
    ) -> None:
        if gl.message.sender_address != self.adjudication:
            raise gl.vm.UserError("only adjudicator")
        c = self.claims[claim_id]
        if c.state != UNDER_REVIEW:
            raise gl.vm.UserError("not under review")
        if verdict not in ("SUPPORTED", "NOT_SUPPORTED", "PARTIAL", "INSUFFICIENT"):
            raise gl.vm.UserError("bad verdict")
        c.verdict = verdict
        c.confidence = confidence
        c.evidence_weight = evidence_weight
        c.reasoning = reasoning
        self._transition(c, RESOLVED)
        print(f"record_verdict id={int(claim_id)} verdict={verdict} conf={int(confidence)}")
        # Trigger pool settlement from the registry so the stake manager's
        # "only registry" gate is satisfied — distribute_rewards rejects
        # calls from any other address.
        _StakeManagerIface(self.stake_manager).emit(value=u256(0)).distribute_rewards(claim_id, verdict)

    @gl.public.write
    def force_distribute(self, claim_id: u256) -> None:
        # Recovery hatch. If record_verdict succeeded (claim is RESOLVED) but
        # the triggered distribute_rewards got CANCELED by consensus, the
        # pool is stuck unsettled. Owner can re-trigger settlement using the
        # already-recorded verdict.
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("only owner")
        c = self.claims[claim_id]
        if c.state != RESOLVED:
            raise gl.vm.UserError("claim must be RESOLVED")
        if c.verdict not in ("SUPPORTED", "NOT_SUPPORTED", "PARTIAL", "INSUFFICIENT"):
            raise gl.vm.UserError("verdict missing")
        _StakeManagerIface(self.stake_manager).emit(value=u256(0)).distribute_rewards(claim_id, c.verdict)
        print(f"force_distribute claim_id={int(claim_id)} verdict={c.verdict}")

    @gl.public.write
    def close(self, claim_id: u256) -> None:
        c = self.claims[claim_id]
        if gl.message.sender_address != c.author and gl.message.sender_address != self.owner:
            raise gl.vm.UserError("not authorized")
        self._transition(c, CLOSED)

    @gl.public.write.payable
    def tip_claim(self, claim_id: u256) -> None:
        # Demo-grade payable: anyone can throw GEN onto a claim they like.
        # No state changes beyond bookkeeping; the value sits with the contract.
        v = u256(gl.message.value)
        if int(v) == 0:
            raise gl.vm.UserError("tip must include value")
        c = self.claims[claim_id]
        c.tips = u256(int(c.tips) + int(v))
        self.total_tips = u256(int(self.total_tips) + int(v))
        print(f"tip_claim id={int(claim_id)} amount={int(v)}")

    @gl.public.view
    def get_claim(self, claim_id: u256) -> str:
        c = self.claims[claim_id]
        return json.dumps({
            "id": int(c.id),
            "author": c.author.as_hex,
            "statement": c.statement,
            "state": c.state,
            "arguments_for": c.arguments_for,
            "arguments_against": c.arguments_against,
            "evidence_for": c.evidence_for,
            "evidence_against": c.evidence_against,
            "verdict": c.verdict,
            "confidence": int(c.confidence),
            "evidence_weight": int(c.evidence_weight),
            "reasoning": c.reasoning,
            "tips": int(c.tips),
        })

    @gl.public.view
    def list_ids(self) -> str:
        return json.dumps([int(k) for k in self.claims.keys()])

    @gl.public.view
    def get_total_tips(self) -> u256:
        return self.total_tips

    def _transition(self, c: Claim, new_state: str) -> None:
        if new_state not in VALID_NEXT[c.state]:
            raise gl.vm.UserError(f"invalid transition {c.state}->{new_state}")
        c.state = new_state


def _append(existing: str, addition: str) -> str:
    if not addition:
        return existing
    if not existing:
        return addition
    return existing + " | " + addition
