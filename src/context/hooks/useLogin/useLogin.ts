import axios from "axios";
import { useContext, useState } from "react";

import { STORAGE_PROP } from "../../const";
import { Context } from "../../StateManagement";

export function useLogin(): {
  login: () => Promise<void>;
  loading: boolean;
} {
  const [loading, setLoading] = useState(false);
  const { token, setToken, apiBaseURL } = useContext(Context);

  console.log({ token });
  console.log({ setToken });
  console.log({ apiBaseURL });

  const login = async () => {
    try {
      setLoading(true);
      const url = new URLSearchParams(window.location.search);
      const code = url.get("code");

      console.log({ code });

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
          window.location.replace(window.location.origin);
          setToken(res.data.data.access_token);
        }
      } else if (!token) {
        window.location.replace(apiBaseURL + "/url");
      }
    } catch (error) {
      localStorage.removeItem(STORAGE_PROP);
    } finally {
      setLoading(false);
    }
  };

  return {
    login: login,
    loading,
  };
}
