import { create } from "zustand";

interface UserStore {
  currency: string;
  setCurrency: (currency: string) => void;
  needsOnboarding: boolean | null;
  setNeedsOnboarding: (needsOnboardig: boolean | null) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  currency: "NPR",
  setCurrency: (currency) => set({ currency }),
  needsOnboarding: null,
  setNeedsOnboarding: (needsOnboarding) => set({ needsOnboarding }),
}));
