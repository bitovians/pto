import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useRefreshStore = create<RefreshStore>()(
  persist(
    (set) => ({
      refreshToken: "",
      setRefreshToken: (token: string) => set({ refreshToken: token }),
    }),
    {
      name: "refreshToken",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
