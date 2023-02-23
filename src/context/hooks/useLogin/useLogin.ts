import axios from "axios";
import { useRouter } from "next/router";
import { useContext, useState } from "react";

import { STORAGE_PROP } from "../../const";
import { Context } from "../../StateManagement";
import { useGetToken } from "../useGetToken";

export function useLogin(): {
  login: () => Promise<void>;
  loading: boolean;
} {
  const { push } = useRouter();
  const [loading, setLoading] = useState(false);
  const { setToken, apiBaseURL, code } = useContext(Context);
  const { getToken } = useGetToken();

  const login = async () => {
    try {
      setLoading(true);

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

        // console.log({ res });

        const access_token = res.data.data.access_token;

        if (access_token) {
          await localStorage.setItem(STORAGE_PROP, "Bearer " + access_token);
          setToken(access_token);

          await push("/pto");
        }
      } else {
        console.log("redirect");
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
