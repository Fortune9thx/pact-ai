"use client";

import { useCallback, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { createWriteClient, CONTRACT_ADDRESS, type Eip1193Provider } from "@/lib/genlayer";
import { useStore } from "@/store/useStore";
import type { Transaction } from "@/lib/types";

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

export function useWallet() {
  const { wallet, setWallet, disconnectWallet, setTransaction, clearTransaction } = useStore();
  const { address: wagmiAddress, isConnected: wagmiConnected, connector } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  // When MetaMask connects, the user's real EOA *is* the on-chain identity.
  // No key derivation, no session key, no invisible auto-fauceted account:
  // every transaction is signed by MetaMask against this visible address.
  useEffect(() => {
    if (!wagmiConnected || !wagmiAddress) return;
    let cancelled = false;
    fetchBalance(wagmiAddress).then((bal) => {
      if (cancelled) return;
      setWallet({
        address: wagmiAddress,
        walletAddress: wagmiAddress,
        isConnected: true,
        balance: bal,
        chainName: "GenLayer Bradbury",
      });
    });
    return () => { cancelled = true; };
  }, [wagmiConnected, wagmiAddress, setWallet]);

  // Mirror wagmi disconnect into our store.
  useEffect(() => {
    if (!wagmiConnected && wallet.isConnected) disconnectWallet();
  }, [wagmiConnected, wallet.isConnected, disconnectWallet]);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
    disconnectWallet();
  }, [wagmiDisconnect, disconnectWallet]);

  const refreshBalance = useCallback(async () => {
    if (!wagmiAddress) return;
    const bal = await fetchBalance(wagmiAddress);
    setWallet({ balance: bal });
  }, [wagmiAddress, setWallet]);

  const executeWrite = useCallback(
    async ({ functionName, args, value, label }: {
      functionName: string; args: unknown[]; value?: bigint; label: string;
    }): Promise<string> => {
      if (!wagmiAddress || !connector) throw new Error("Wallet not connected");

      // EIP-1193 provider from the active wallet connector — this is what
      // surfaces the MetaMask signature popup for each transaction.
      const provider = (await connector.getProvider()) as Eip1193Provider;

      const tx: Transaction = { hash: "", step: "signing", label };
      setTransaction(tx);

      try {
        const client = createWriteClient(wagmiAddress, provider);
        setTransaction({ ...tx, step: "broadcasting" });

        const hash = await client.writeContract({
          address: CONTRACT_ADDRESS,
          functionName,
          args,
          value: value ?? BigInt(0),
        } as Parameters<typeof client.writeContract>[0]);

        setTransaction({ hash: hash as string, step: "confirmed", label });
        setTimeout(clearTransaction, 4000);
        // Escrow debits the user's real balance — refresh it after a write.
        void refreshBalance();
        return hash as string;
      } catch (err) {
        const error = err instanceof Error ? err.message : "Transaction failed";
        setTransaction({ ...tx, step: "failed", error });
        throw err;
      }
    },
    [wagmiAddress, connector, setTransaction, clearTransaction, refreshBalance]
  );

  return { wallet, disconnect, executeWrite, refreshBalance };
}
