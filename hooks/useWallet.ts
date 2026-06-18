"use client";

import { useCallback, useEffect, useRef } from "react";
import { keccak256 } from "viem";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { createGenLayerClient, createAccount, CONTRACT_ADDRESS, type LocalAccount } from "@/lib/genlayer";
import { useStore } from "@/store/useStore";
import type { Transaction } from "@/lib/types";

const SIGN_MSG =
  "Pact Protocol: Authorize GenLayer testnet signing\n\nThis generates a signing key for on-chain transactions.\nNo funds are transferred by signing this message.";

function getSessionKey(): `0x${string}` | null {
  try { return localStorage.getItem("pact_session_key") as `0x${string}` | null; } catch { return null; }
}

async function fetchBalance(address: string): Promise<string> {
  try {
    const res = await fetch("https://rpc-bradbury.genlayer.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"] }),
    });
    const { result } = await res.json();
    return (Number(BigInt(result ?? "0x0")) / 1e18).toFixed(4);
  } catch { return "0.0000"; }
}

async function requestFaucet(address: string): Promise<void> {
  try {
    await fetch("/api/faucet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
  } catch { /* non-fatal */ }
}

export function useWallet() {
  const { wallet, setWallet, disconnectWallet, setTransaction, clearTransaction } = useStore();
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const derivingRef = useRef(false);

  // When wagmi connects, derive the GenLayer signing key
  useEffect(() => {
    if (!wagmiConnected || !wagmiAddress || derivingRef.current) return;
    const sessionKey = getSessionKey();
    const storedWallet = localStorage.getItem("pact_wallet_address");

    if (sessionKey && storedWallet?.toLowerCase() === wagmiAddress.toLowerCase()) {
      // Restore from existing session
      const account = createAccount(sessionKey);
      fetchBalance(account.address).then((bal) => {
        setWallet({
          address: account.address,
          walletAddress: wagmiAddress,
          isConnected: true,
          balance: bal,
          chainName: "GenLayer Bradbury",
        });
      });
      return;
    }

    // New connection — derive key via personal_sign
    derivingRef.current = true;
    (async () => {
      try {
        const sig = await signMessageAsync({ message: SIGN_MSG });
        const derivedKey = keccak256(sig as `0x${string}`);
        const account = createAccount(derivedKey);

        localStorage.setItem("pact_session_key", derivedKey);
        localStorage.setItem("pact_wallet_address", wagmiAddress);

        const bal = await fetchBalance(account.address);
        setWallet({
          address: account.address,
          walletAddress: wagmiAddress,
          isConnected: true,
          balance: bal,
          chainName: "GenLayer Bradbury",
        });

        const balWei = BigInt(Math.round(parseFloat(bal) * 1e18));
        if (balWei < BigInt("50000000000000000")) {
          requestFaucet(account.address).then(async () => {
            await new Promise((r) => setTimeout(r, 6000));
            const newBal = await fetchBalance(account.address);
            setWallet({ balance: newBal });
          });
        }
      } catch (err) {
        console.error("Key derivation failed:", err);
        wagmiDisconnect();
      } finally {
        derivingRef.current = false;
      }
    })();
  }, [wagmiConnected, wagmiAddress, signMessageAsync, setWallet, wagmiDisconnect]);

  // When wagmi disconnects, clear our state too
  useEffect(() => {
    if (!wagmiConnected && wallet.isConnected) {
      disconnectWallet();
      try {
        localStorage.removeItem("pact_session_key");
        localStorage.removeItem("pact_wallet_address");
      } catch { /* ignore */ }
    }
  }, [wagmiConnected, wallet.isConnected, disconnectWallet]);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
    disconnectWallet();
    try {
      localStorage.removeItem("pact_session_key");
      localStorage.removeItem("pact_wallet_address");
    } catch { /* ignore */ }
  }, [wagmiDisconnect, disconnectWallet]);

  const executeWrite = useCallback(
    async ({ functionName, args, value, label }: {
      functionName: string; args: unknown[]; value?: bigint; label: string;
    }): Promise<string> => {
      const sessionKey = getSessionKey();
      if (!sessionKey || !wallet.address) throw new Error("Wallet not connected");

      const account = createAccount(sessionKey);
      const tx: Transaction = { hash: "", step: "signing", label };
      setTransaction(tx);

      try {
        const client = createGenLayerClient(account);
        setTransaction({ ...tx, step: "broadcasting" });

        const hash = await client.writeContract({
          address: CONTRACT_ADDRESS,
          functionName,
          args,
          value: value ?? BigInt(0),
        } as Parameters<typeof client.writeContract>[0]);

        setTransaction({ hash: hash as string, step: "confirmed", label });
        setTimeout(clearTransaction, 4000);
        return hash as string;
      } catch (err) {
        const error = err instanceof Error ? err.message : "Transaction failed";
        setTransaction({ ...tx, step: "failed", error });
        throw err;
      }
    },
    [wallet.address, setTransaction, clearTransaction]
  );

  return { wallet, disconnect, executeWrite };
}
