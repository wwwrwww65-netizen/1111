"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AnyRouter } from "@trpc/server";
import React from "react";

export const trpc = createTRPCReact<AnyRouter>();

export function AppProviders({ children }: { children: React.ReactNode }): JSX.Element {
  const [queryClient] = React.useState(() => new QueryClient());
  const [trpcClient] = React.useState(() => {
    const envUrl = process.env.NEXT_PUBLIC_TRPC_URL;
    const isProd = process.env.NODE_ENV === 'production';
    let resolvedUrl = envUrl || '';
    if (!resolvedUrl) {
      if (typeof window !== 'undefined') {
        const host = window.location.host; // admin.jeeey.com
        const root = host.startsWith('admin.') ? host.slice('admin.'.length) : host;
        resolvedUrl = `${window.location.protocol}//api.${root}/trpc`;
      } else if (!isProd) {
        resolvedUrl = 'http://localhost:4000/trpc';
      } else {
        // Safe production fallback
        resolvedUrl = 'https://api.jeeey.com/trpc';
      }
    }

    return trpc.createClient({
      links: [
        httpBatchLink({
          url: resolvedUrl,
          fetch(input, init) {
            return fetch(input, { ...(init ?? {}), credentials: "include" });
          },
        }),
      ],
    });
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}