import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { PTOStore } from "./types";
import { getToken } from "./functions";

const usePTOStore = create<PTOStore>()(
  persist(
    devtools((set) => ({
      token: undefined,
      setToken: (token: string) => set({ token }),
    })),
    {
      name: "pto-store",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default usePTOStore;
