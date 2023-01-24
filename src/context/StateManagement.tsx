import { createContext } from "react";
import React, { FC, useEffect, useState } from "react";

import { STORAGE_PROP, SERVER_URL } from "./const";

interface Context {
  token: string | undefined;
  setToken: React.Dispatch<React.SetStateAction<string | undefined>>;
  apiBaseURL: string;
}

export const Context = createContext<Context>({} as Context);

const StateManagement: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string>();
  const [apiBaseURL, setApiBaseURL] = useState<string>("http://localhost:4000");

  useEffect(() => {
    // setApiBaseURL(
    //   window.location.origin.includes("localhost")
    //     ? "http://localhost:4000"
    //     : SERVER_URL
    // );
    // setToken(window.localStorage.getItem(STORAGE_PROP) ?? undefined);
  }, []);

  const value = {
    token,
    setToken,
    apiBaseURL,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export default StateManagement;
