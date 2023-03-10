import { useRouter } from "next/router";
import { useState } from "react";
import { getURLCode } from "../..";

export function useLogin(): {
  login: () => Promise<void>;
  loading: boolean;
} {
  const { push } = useRouter();
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);
      const code = getURLCode();
      if (code) {
        push("/pto");
      } else {
        window.location.replace(process.env.NEXT_PUBLIC_API_BASE_URL + "/url");
      }
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    loading,
  };
}
