import type { AppProps } from "next/app";

import StateManagement from "../context/StateManagement";

function App({ Component, pageProps }: AppProps) {
  return (
    <StateManagement>
      <Component {...pageProps} />
    </StateManagement>
  );
}

export default App;
