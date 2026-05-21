"use client";

import { create } from "zustand";
import type { WalletState, Transaction, Deal } from "@/lib/types";

interface AppStore {
  // Wallet
  wallet: WalletState;
  setWallet: (wallet: Partial<WalletState>) => void;
  disconnectWallet: () => void;

  // Transaction
  transaction: Transaction | null;
  setTransaction: (tx: Transaction | null) => void;
  clearTransaction: () => void;

  // Deals cache
  deals: Deal[];
  setDeals: (deals: Deal[]) => void;
  upsertDeal: (deal: Deal) => void;
}

const defaultWallet: WalletState = {
  address: null,
  isConnected: false,
  balance: "0",
  chainName: "GenLayer Testnet",
};

export const useStore = create<AppStore>((set) => ({
  wallet: defaultWallet,

  setWallet: (wallet) =>
    set((state) => ({ wallet: { ...state.wallet, ...wallet } })),

  disconnectWallet: () =>
    set({ wallet: defaultWallet }),

  transaction: null,

  setTransaction: (tx) => set({ transaction: tx }),

  clearTransaction: () => set({ transaction: null }),

  deals: [],

  setDeals: (deals) => set({ deals }),

  upsertDeal: (deal) =>
    set((state) => {
      const idx = state.deals.findIndex((d) => d.id === deal.id);
      if (idx >= 0) {
        const updated = [...state.deals];
        updated[idx] = deal;
        return { deals: updated };
      }
      return { deals: [...state.deals, deal] };
    }),
}));
