"use client";

import { useCallback, useEffect } from "react";
import { createGenLayerClient, CONTRACT_ADDRESS, demoAccount } from "@/lib/genlayer";
import { TransactionStatus } from "genlayer-js/types";
import { useStore } from "@/store/useStore";
import type { Transaction } from "@/lib/types";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export function useWallet() {
  const { wallet, setWallet, disconnectWallet, setTransaction, clearTransaction } = useStore();

  const connect = useCallback(async () => {
    // Try MetaMask first
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = (await window.ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];

        if (accounts.length === 0) return;

        const address = accounts[0] as `0x${string}`;
        const balanceHex = (await window.ethereum.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        })) as string;

        const balanceWei = BigInt(balanceHex);
        const balanceGEN = (Number(balanceWei) / 1e18).toFixed(4);

        setWallet({ address, isConnected: true, balance: balanceGEN, chainName: "GenLayer Studionet" });
        return;
      } catch (err) {
        console.error("MetaMask connection failed:", err);
      }
    }

    // Fall back to demo account (studionet only)
    if (demoAccount) {
      setWallet({
        address: demoAccount.address as `0x${string}`,
        isConnected: true,
        balance: "1000.0000",
        chainName: "GenLayer Studionet (Demo)",
      });
    } else {
      alert("Please install MetaMask or configure a demo key.");
    }
  }, [setWallet]);

  const disconnect = useCallback(() => {
    disconnectWallet();
  }, [disconnectWallet]);

  // Auto-connect with demo account on mount if configured
  useEffect(() => {
    if (demoAccount && !wallet.isConnected) {
      setWallet({
        address: demoAccount.address as `0x${string}`,
        isConnected: true,
        balance: "1000.0000",
        chainName: "GenLayer Studionet (Demo)",
      });
    }
  }, [setWallet, wallet.isConnected]);

  // Listen for MetaMask account changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
      } else {
        setWallet({ address: accounts[0] as `0x${string}` });
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
  }, [disconnectWallet, setWallet]);

  const executeWrite = useCallback(
    async ({
      functionName,
      args,
      value,
      label,
    }: {
      functionName: string;
      args: unknown[];
      value?: bigint;
      label: string;
    }) => {
      if (!wallet.address) throw new Error("Wallet not connected");

      const tx: Transaction = { hash: "", step: "signing", label };
      setTransaction(tx);

      try {
        const client = createGenLayerClient();

        setTransaction({ ...tx, step: "broadcasting" });

        const hash = await client.writeContract({
          address: CONTRACT_ADDRESS,
          functionName,
          args,
          value: value ?? BigInt(0),
        } as Parameters<typeof client.writeContract>[0]);

        setTransaction({ hash: hash as string, step: "confirming", label });

        // Wait for consensus (AI-triggered writes can take 1-3 min)
        await client.waitForTransactionReceipt({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          hash: hash as any,
          status: TransactionStatus.ACCEPTED,
          retries: 80,
        } as Parameters<typeof client.waitForTransactionReceipt>[0]);

        // Check if validators reached consensus — AI calls can hit MAJORITY_DISAGREE
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const txDetails = await client.getTransaction({ hash: hash as any }).catch(() => null);
        const resultName = (txDetails as { result_name?: string } | null)?.result_name;
        if (resultName === "MAJORITY_DISAGREE") {
          const error = "Validators couldn't reach consensus. Please try again.";
          setTransaction({ ...tx, hash: hash as string, step: "failed", error });
          throw new Error(error);
        }

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

  return { wallet, connect, disconnect, executeWrite };
}
