"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpLink, splitLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AnyRouter } from "@trpc/server";
import React from "react";
import { I18nProvider } from "../lib/i18n";

export const trpc = createTRPCReact<AnyRouter>();

export function AppProviders({ children }: { children: React.ReactNode }): JSX.Element {
  const [queryClient] = React.useState(() => new QueryClient());
  const [trpcClient] = React.useState(() => {
    const envUrl = process.env.NEXT_PUBLIC_TRPC_URL;
    const isBrowser = typeof window !== 'undefined';
    const isProd = process.env.NODE_ENV === 'production';
    let resolvedUrl = envUrl || '';
    if (!resolvedUrl) {
      if (isBrowser) {
        const host = window.location.host;
        const root = host.replace(/^www\./, '').replace(/^admin\./, '');
        resolvedUrl = `${window.location.protocol}//api.${root}/trpc`;
      } else {
        // Safe production fallback for SSR
        resolvedUrl = isProd ? 'https://api.jeeey.com/trpc' : 'http://localhost:4000/trpc';
      }
    }

    return trpc.createClient({
      links: [
        splitLink({
          condition: (op) => op.type === 'query',
          true: httpLink({
            url: resolvedUrl,
            method: 'GET',
            fetch(input, init) {
              return fetch(input, { ...(init ?? {}), credentials: "include" });
            },
          }),
          false: httpBatchLink({
            url: resolvedUrl,
            fetch(input, init) {
              return fetch(input, { ...(init ?? {}), credentials: "include" });
            },
          }),
        }),
      ],
    });
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>{children}</I18nProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}