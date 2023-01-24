import axios from "axios";
import { useContext, useState } from "react";

import { STORAGE_PROP } from "../../const";
import { Context } from "../../StateManagement";

export function useLogin(): {
  login: () => Promise<"success" | "failure">;
  loading: boolean;
} {
  const [loading, setLoading] = useState(false);
  const { token, setToken, apiBaseURL } = useContext(Context);

  const login = async () => {
    try {
      setLoading(true);
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

        if (res.data.data.access_token) {
          localStorage.setItem(STORAGE_PROP, "Bearer " + token);
          setToken(res.data.data.access_token);
          return "success";
        }
      } else if (!token) {
        window.location.replace(apiBaseURL + "/url");
      }
    } catch (error) {
      localStorage.removeItem(STORAGE_PROP);
      return "failure";
    } finally {
      setLoading(false);
    }
    return "failure";
  };

  return {
    login: login,
    loading,
  };
}
