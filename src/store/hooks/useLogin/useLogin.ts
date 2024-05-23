import { useRouter } from "next/router";
import { useEffect } from "react";
import { getToken, getURLCode, getConfigParams } from "../..";

export function useLogin(): {
  login: () => Promise<void>;
} {
  const { push } = useRouter();

  useEffect(() => {
    const code = getURLCode();
    if (code) {
      getToken().then(() => {
        push("/pto");
      });
    } else {
      getConfigParams();
    }
  }, []);

  const login = async () => {
    window.location.replace(process.env.NEXT_PUBLIC_API_BASE_URL + "/url");
  };

  return {
    login,
  };
}
