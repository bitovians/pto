import axios from "axios";
import { useRouter } from "next/router";
import { useContext, useState } from "react";

import { STORAGE_PROP } from "../../const";
import { Context } from "../../StateManagement";

export function useLogin(): {
  login: () => Promise<void>;
  loading: boolean;
} {
  const { push } = useRouter();
  const [loading, setLoading] = useState(false);
  const { token, setToken, apiBaseURL } = useContext(Context);

  const login = async () => {
    try {
      setLoading(true);
      const url = new URLSearchParams(window.location.search);
      const code = url.get("code");

      if (code) {
        console.log("login");
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

        const access_token = res.data.data.access_token;

        if (access_token) {
          console.log({ access_token });

          await localStorage.setItem(STORAGE_PROP, "Bearer " + access_token);
          await setToken(access_token);

          await push("/pto");
        }
      } else {
        window.location.replace(apiBaseURL + "/url");
      }
    } catch (error) {
      console.log({ error });

      // localStorage.removeItem(STORAGE_PROP);
    } finally {
      setLoading(false);
    }
  };

  return {
    login: login,
    loading,
  };
}
