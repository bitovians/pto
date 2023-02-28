import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "react-query";
import "../styles/globals.scss";
import PageHeader from "../components/PageHeader";

const queryClient = new QueryClient();

function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <PageHeader />
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}

export default App;
