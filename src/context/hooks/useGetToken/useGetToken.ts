import axios from "axios";
import { useContext, useState } from "react";

import { Context } from "../../StateManagement";

export function useGetToken() {
  const { token, setToken, apiBaseURL } = useContext(Context);

  async function getToken() {
    if (token) return token;

    const url = new URLSearchParams(window.location.search);
    const code = url.get("code");
    if (code) {
      const res = await axios.post(
        apiBaseURL + "/token",
        {
          code,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log({ res });
      const access_token = res.data.data.access_token;
      setToken(access_token);
      return access_token;
    }
  }

  return { getToken };
}
