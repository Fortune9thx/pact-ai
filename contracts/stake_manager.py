# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from dataclasses import dataclass


# Cumulative protocol fee on the losing pool, in basis points.
FEE_BPS = 200
BPS = 10000


# Recipient interface for native value transfers. Mirrors the canonical
# faucet.py pattern — `gl.send_eth()` doesn't exist in current SDK, so
# we wrap each recipient in a contract_interface stub and emit_transfer.
@gl.evm.contract_interface
class _Recipient:
    class View:
        pass
    class Write:
        pass


@allow_storage
@dataclass
class Position:
    claim_id: u256     # which claim this position belongs to
    staker: Address
    amount: u256
    side: str          # "FOR" | "AGAINST"
    claimed: bool      # set true after settlement payout to prevent double-pay


class StakeManager(gl.Contract):
    owner: Address
    registry: Address

    # Per-claim aggregates.
    total_for: TreeMap[u256, u256]
    total_against: TreeMap[u256, u256]
    locked: TreeMap[u256, u256]            # 0/1 flag
    settled: TreeMap[u256, u256]           # 0/1 flag
    winning_side: TreeMap[u256, str]       # "FOR" | "AGAINST" | "NONE"

    # Flat positions table keyed by a global counter. Nested TreeMaps don't
    # auto-init their inner map (writing self.positions[cid][idx] raises
    # KeyError when cid is new), so we use a single flat map with claim_id
    # embedded in each Position. Iteration on payout is O(total positions);
    # acceptable for MVP cadence and trivially upgradable to indexed scans.
    positions: TreeMap[u256, Position]
    next_position_id: u256

    # Per-claim convenience counter (for the view layer; not load-bearing).
    position_count: TreeMap[u256, u256]

    # Accumulated protocol revenue (fees on losing pools). Owner can sweep.
    protocol_revenue: u256

    def __init__(self):
        self.owner = gl.message.sender_address
        self.next_position_id = u256(0)
        self.protocol_revenue = u256(0)

    @gl.public.write
    def set_registry(self, registry: str) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("only owner")
        self.registry = Address(registry)

    @gl.public.write.payable
    def stake_for_claim(self, claim_id: u256) -> None:
        self._stake(claim_id, "FOR")

    @gl.public.write.payable
    def stake_against_claim(self, claim_id: u256) -> None:
        self._stake(claim_id, "AGAINST")

    @gl.public.write
    def lock_stake(self, claim_id: u256) -> None:
        if gl.message.sender_address != self.registry:
            raise gl.vm.UserError("only registry")
        self.locked[claim_id] = u256(1)
        print(f"lock_stake claim_id={int(claim_id)}")

    @gl.public.write
    def distribute_rewards(self, claim_id: u256, verdict: str) -> None:
        if gl.message.sender_address != self.registry:
            raise gl.vm.UserError("only registry")
        if claim_id not in self.locked:
            raise gl.vm.UserError("pool not locked")
        if claim_id in self.settled:
            raise gl.vm.UserError("already settled")

        if verdict == "SUPPORTED":
            winning = "FOR"
        elif verdict == "NOT_SUPPORTED":
            winning = "AGAINST"
        else:
            # PARTIAL or INSUFFICIENT — refund all stakes. No fee.
            self._refund_all(claim_id)
            self.winning_side[claim_id] = "NONE"
            self.settled[claim_id] = u256(1)
            print(f"distribute_rewards claim_id={int(claim_id)} winner=NONE (refunded)")
            return

        self._payout_winners(claim_id, winning)
        self.winning_side[claim_id] = winning
        self.settled[claim_id] = u256(1)
        print(f"distribute_rewards claim_id={int(claim_id)} winner={winning}")

    @gl.public.write
    def sweep_revenue(self, recipient: str) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("only owner")
        amount = int(self.protocol_revenue)
        if amount == 0:
            raise gl.vm.UserError("no revenue")
        self.protocol_revenue = u256(0)
        _Recipient(Address(recipient)).emit_transfer(value=u256(amount))
        print(f"sweep_revenue to={recipient} amount={amount}")

    @gl.public.view
    def get_pool(self, claim_id: u256) -> str:
        tf = int(self.total_for[claim_id]) if claim_id in self.total_for else 0
        ta = int(self.total_against[claim_id]) if claim_id in self.total_against else 0
        is_locked = claim_id in self.locked
        is_settled = claim_id in self.settled
        winner = self.winning_side[claim_id] if claim_id in self.winning_side else ""
        n_positions = int(self.position_count[claim_id]) if claim_id in self.position_count else 0
        return (
            '{"claim_id":' + str(int(claim_id))
            + ',"locked":' + ("true" if is_locked else "false")
            + ',"settled":' + ("true" if is_settled else "false")
            + ',"winning_side":"' + winner + '"'
            + ',"total_for":' + str(tf)
            + ',"total_against":' + str(ta)
            + ',"positions":' + str(n_positions) + '}'
        )

    @gl.public.view
    def get_positions_by_staker(self, staker: str) -> str:
        # Address-vs-Address equality via != has been unreliable across SDK
        # versions; compare the hex strings instead. We take the input as
        # str so the caller's hex form is normalized to whatever the SDK
        # produces from `.as_hex` internally.
        target_hex = Address(staker).as_hex.lower()
        total = int(self.next_position_id)
        # claim_id -> (for, against, settled, winning_side)
        per_claim = {}
        for i in range(total):
            p = self.positions[u256(i)]
            if p.staker.as_hex.lower() != target_hex:
                continue
            key = int(p.claim_id)
            if key not in per_claim:
                per_claim[key] = [0, 0]
            if p.side == "FOR":
                per_claim[key][0] += int(p.amount)
            else:
                per_claim[key][1] += int(p.amount)
        out = "["
        first = True
        for cid, sums in per_claim.items():
            settled = u256(cid) in self.settled
            winner = self.winning_side[u256(cid)] if u256(cid) in self.winning_side else ""
            row = (
                '{"claim_id":' + str(cid)
                + ',"for":' + str(sums[0])
                + ',"against":' + str(sums[1])
                + ',"settled":' + ("true" if settled else "false")
                + ',"winning_side":"' + winner + '"}'
            )
            if not first:
                out += ","
            out += row
            first = False
        out += "]"
        return out

    @gl.public.view
    def get_protocol_revenue(self) -> u256:
        return self.protocol_revenue

    # ---- internal -----------------------------------------------------

    def _stake(self, claim_id: u256, side: str) -> None:
        amount = u256(gl.message.value)
        if int(amount) == 0:
            raise gl.vm.UserError("no value sent")
        if claim_id in self.locked:
            raise gl.vm.UserError("pool locked")

        pid = self.next_position_id
        self.positions[pid] = Position(
            claim_id=claim_id,
            staker=gl.message.sender_address,
            amount=amount,
            side=side,
            claimed=False,
        )
        self.next_position_id = u256(int(pid) + 1)

        # Per-claim count for the view layer.
        if claim_id in self.position_count:
            self.position_count[claim_id] = u256(int(self.position_count[claim_id]) + 1)
        else:
            self.position_count[claim_id] = u256(1)

        # Aggregate.
        if side == "FOR":
            cur = int(self.total_for[claim_id]) if claim_id in self.total_for else 0
            self.total_for[claim_id] = u256(cur + int(amount))
        else:
            cur = int(self.total_against[claim_id]) if claim_id in self.total_against else 0
            self.total_against[claim_id] = u256(cur + int(amount))
        print(f"stake claim_id={int(claim_id)} side={side} amount={int(amount)} pid={int(pid)}")

    def _payout_winners(self, claim_id: u256, winning: str) -> None:
        # Winners get back original stake + proportional share of losing pool
        # (after protocol fee). Losers get nothing.
        winning_total = int(self.total_for[claim_id]) if winning == "FOR" else int(self.total_against[claim_id])
        losing_total = int(self.total_against[claim_id]) if winning == "FOR" else int(self.total_for[claim_id])

        fee = (losing_total * FEE_BPS) // BPS
        reward_pool = losing_total - fee
        self.protocol_revenue = u256(int(self.protocol_revenue) + fee)

        if winning_total == 0:
            # No winners: the losing pool becomes protocol revenue.
            self.protocol_revenue = u256(int(self.protocol_revenue) + reward_pool)
            return

        total_positions = int(self.next_position_id)
        for i in range(total_positions):
            p = self.positions[u256(i)]
            if p.claim_id != claim_id or p.side != winning or p.claimed:
                continue
            share = (int(p.amount) * reward_pool) // winning_total
            payout = int(p.amount) + share
            p.claimed = True
            _Recipient(p.staker).emit_transfer(value=u256(payout))
            print(f"payout claim_id={int(claim_id)} pid={i} amount={payout}")

    def _refund_all(self, claim_id: u256) -> None:
        # PARTIAL / INSUFFICIENT: everyone gets their original stake back.
        total_positions = int(self.next_position_id)
        for i in range(total_positions):
            p = self.positions[u256(i)]
            if p.claim_id != claim_id or p.claimed:
                continue
            p.claimed = True
            _Recipient(p.staker).emit_transfer(value=p.amount)
            print(f"refund claim_id={int(claim_id)} pid={i} amount={int(p.amount)}")
