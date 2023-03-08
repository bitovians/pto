import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios, { AxiosInstance } from "axios";

export const axiosStore = create<AxiosStore<AxiosInstance>>()(
  persist(
    (set) => ({
      axiosPTO: axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
      }),
      setAccessToken: (token: string) => {
        set((state) => {
          state.axiosPTO.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${token}`;
          return { axiosPTO: state.axiosPTO };
        });
      },
    }),
    {
      name: "axiosStore",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
