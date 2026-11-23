"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import type { AppRouter } from "./router";

// useTRPC() gives typed query/mutation options for each procedure.
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

export function Providers({ children }: { children: React.ReactNode }) {
  // useState keeps a single instance of each client for the lifetime of the page.
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      // A relative URL is enough: requests are only sent from the browser.
      // Server-side data loading calls the router directly instead (step 3).
      links: [httpBatchLink({ url: "/api/trpc" })],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
