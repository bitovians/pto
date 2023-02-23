import { createContext } from "react";
import React, { FC, useEffect, useState } from "react";

import { STORAGE_PROP, SERVER_URL } from "./const";

interface Context {
  token: string | undefined;
  setToken: React.Dispatch<React.SetStateAction<string | undefined>>;
  code: string | undefined;
  apiBaseURL: string;
}

export const Context = createContext<Context>({
  token: undefined,
  setToken: () => {},
  code: undefined,
  apiBaseURL: "",
});

const StateManagement: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [token, setToken] = useState<string>();
  const [code, setCode] = useState<string>();
  const [apiBaseURL, setApiBaseURL] = useState<string>("http://localhost:4000");

  useEffect(() => {
    if (!code) {
      const url = new URLSearchParams(window.location.search);
      setCode(url.get("code") ?? undefined);
    }

    if (!initialized) {
      setToken(window.localStorage.getItem(STORAGE_PROP) ?? undefined);

      setApiBaseURL(
        window.location.origin.includes("localhost")
          ? "http://localhost:4000"
          : SERVER_URL
      );

      setInitialized(true);
    }
  }, []);

  const value = {
    token,
    setToken,
    code,
    apiBaseURL,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export default StateManagement;
