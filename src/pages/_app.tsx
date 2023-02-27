import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "react-query";
import "../styles/globals.scss";

const queryClient = new QueryClient();

function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="logos">
        <span
          className="bitovi-logo"
          role="presentation"
          aria-label="bitovi-logo"
        />
        <img
          src="https://www.freshbooks.com/wp-content/themes/freshpress/dist/images/logos/freshbooks-logo.svg"
          alt="freshbooks logo"
          width="155"
          height="38"
        />
      </div>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}

export default App;
