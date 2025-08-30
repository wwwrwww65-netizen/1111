"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpLink, splitLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AnyRouter } from "@trpc/server";
import React from "react";

export const trpc = createTRPCReact<AnyRouter>();

export function AppProviders({ children }: { children: React.ReactNode }): JSX.Element {
  const [queryClient] = React.useState(() => new QueryClient());
  const [trpcClient] = React.useState(() =>
    trpc.createClient({
      links: [
        splitLink({
          condition: (op) => op.type === 'query',
          true: httpLink({
            url: process.env.NEXT_PUBLIC_TRPC_URL || "http://localhost:4000/trpc",
            method: 'GET',
            fetch(input, init) {
              return fetch(input, { ...(init ?? {}), credentials: "include" });
            },
          }),
          false: httpBatchLink({
            url: process.env.NEXT_PUBLIC_TRPC_URL || "http://localhost:4000/trpc",
            fetch(input, init) {
              return fetch(input, { ...(init ?? {}), credentials: "include" });
            },
          }),
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}