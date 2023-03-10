import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import axios from "axios";

export const useTokenStore = create<TokenStore>()(
  persist(
    () => ({
      refreshToken: "",
      accessToken: "",
      accessTokenExpiresAt: "",
    }),
    {
      name: "tokenStore",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export const axiosPTO = () => axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    Authorization: `Bearer ${useTokenStore.getState().accessToken}`,
  }
});
