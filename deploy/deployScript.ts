/**
 * VibeCheck — Deployment Reference
 *
 * GenLayer Intelligent Contracts are deployed via the GenLayer CLI,
 * not via a JS script. Use the commands below.
 *
 * ── Prerequisites ──────────────────────────────────────────────
 *   npm install -g genlayer
 *   genlayer init     (first time — sets up local Studio or testnet)
 *
 * ── Deploy to Studionet (hosted dev) ───────────────────────────
 *   genlayer deploy --contract contracts/vibecheck.py
 *
 * ── Deploy to TestnetBradbury (production-like AI/LLM) ─────────
 *   genlayer deploy \
 *     --contract contracts/vibecheck.py \
 *     --network testnetBradbury
 *
 * ── After deployment ───────────────────────────────────────────
 *   Copy the contract address to .env.local:
 *   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
 *
 * ── Interact with deployed contract ────────────────────────────
 *   # Read a deal
 *   genlayer call --function get_deal --args '["deal_000001"]'
 *
 *   # Write (requires funded account)
 *   genlayer write \
 *     --function create_deal \
 *     --args '["0xSELLER_ADDRESS", "Dark luxury logo", 7]' \
 *     --value 1000000000000000000
 *
 *   # Check receipt
 *   genlayer receipt <TX_HASH>
 *
 * ── Faucet ─────────────────────────────────────────────────────
 *   Get free GEN tokens: https://testnet-faucet.genlayer.foundation/
 */

export {};
