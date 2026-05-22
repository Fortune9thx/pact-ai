"use client";

import { useCallback, useEffect } from "react";
import { createGenLayerClient, CONTRACT_ADDRESS, demoAccount } from "@/lib/genlayer";
import { demoStore, DEMO_BUYER } from "@/lib/demo-store";
import { TransactionStatus } from "genlayer-js/types";
import { useStore } from "@/store/useStore";
import type { Transaction } from "@/lib/types";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

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
    // Demo mode — auto-connect with seeded buyer persona
    if (IS_DEMO) {
      demoStore.seed();
      setWallet({
        address: DEMO_BUYER as `0x${string}`,
        isConnected: true,
        balance: "1000.0000",
        chainName: "Demo Mode",
      });
      return;
    }

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

  // Auto-connect on mount
  useEffect(() => {
    if (wallet.isConnected) return;

    if (IS_DEMO) {
      demoStore.seed();
      setWallet({
        address: DEMO_BUYER as `0x${string}`,
        isConnected: true,
        balance: "1000.0000",
        chainName: "Demo Mode",
      });
      return;
    }

    if (demoAccount) {
      setWallet({
        address: demoAccount.address as `0x${string}`,
        isConnected: true,
        balance: "1000.0000",
        chainName: "GenLayer Studionet (Demo)",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for MetaMask account changes
  useEffect(() => {
    if (IS_DEMO || typeof window === "undefined" || !window.ethereum) return;

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

  // ── Demo write handler ─────────────────────────────────────────────

  const executeDemoWrite = useCallback(
    async ({
      functionName,
      args,
      label,
    }: {
      functionName: string;
      args: unknown[];
      label: string;
    }): Promise<string> => {
      if (!wallet.address) throw new Error("Wallet not connected");

      const tx: Transaction = { hash: "", step: "signing", label };
      setTransaction(tx);

      try {
        setTransaction({ ...tx, step: "broadcasting" });

        const addr = wallet.address;
        switch (functionName) {
          case "create_deal": {
            const [prompt, deadline, amount] = args as [string, number, number];
            const dealId = await demoStore.createDeal(addr, prompt, deadline, amount);
            setTransaction({ hash: `0xdemo_${dealId}`, step: "confirmed", label });
            setTimeout(clearTransaction, 3000);
            return dealId;
          }
          case "claim_deal": {
            const [dealId] = args as [string];
            await demoStore.claimDeal(dealId, addr);
            break;
          }
          case "submit_work": {
            const [dealId, url, desc] = args as [string, string, string];
            await demoStore.submitWork(dealId, addr, url, desc);
            break;
          }
          case "approve_work": {
            const [dealId] = args as [string];
            await demoStore.approveWork(dealId, addr);
            break;
          }
          case "request_ai_review": {
            const [dealId] = args as [string];
            setTransaction({ ...tx, step: "confirming", label: "AI evaluation in progress…" });
            await demoStore.requestAIReview(dealId, addr);
            break;
          }
          case "release_after_ai": {
            const [dealId] = args as [string];
            await demoStore.releaseAfterAI(dealId, addr);
            break;
          }
          case "override_ai": {
            const [dealId, release] = args as [string, boolean];
            await demoStore.overrideAI(dealId, addr, release);
            break;
          }
          case "cancel_deal": {
            const [dealId] = args as [string];
            await demoStore.cancelDeal(dealId, addr);
            break;
          }
          default:
            throw new Error(`Unknown demo function: ${functionName}`);
        }

        const fakeTxHash = `0xdemo_${Date.now().toString(16)}`;
        setTransaction({ hash: fakeTxHash, step: "confirmed", label });
        setTimeout(clearTransaction, 3000);
        return fakeTxHash;
      } catch (err) {
        const error = err instanceof Error ? err.message : "Transaction failed";
        setTransaction({ ...tx, step: "failed", error });
        throw err;
      }
    },
    [wallet.address, setTransaction, clearTransaction]
  );

  // ── Real (GenLayer) write handler ──────────────────────────────────

  const executeRealWrite = useCallback(
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
    }): Promise<string> => {
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

        // Check consensus result
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

  const executeWrite = IS_DEMO ? executeDemoWrite : executeRealWrite;

  return { wallet, connect, disconnect, executeWrite };
}
