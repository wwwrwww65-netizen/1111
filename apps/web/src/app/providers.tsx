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
        const hostname = host.split(':')[0];
        const parts = hostname.split('.');
        const apex = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
        resolvedUrl = `${window.location.protocol}//api.${apex}/trpc`;
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
            url: '/api/trpc',
            method: 'GET',
            fetch(input, init) {
              return fetch(input, { ...(init ?? {}), credentials: "include" });
            },
          }),
          false: httpBatchLink({
            url: '/api/trpc',
            fetch(input, init) {
              return fetch(input, { ...(init ?? {}), credentials: "include" });
            },
          }),
        }),
      ],
    });
  });

  // Apply theme CSS variables from server (live config)
  React.useEffect(() => {
    async function loadTheme() {
      try {
        const res = await fetch('/api/admin/public/theme/config?site=web', { credentials: 'include' });
        const j = await res.json();
        const theme = j?.theme || {};
        const root = document.documentElement as HTMLElement;
        const c = theme.colors || {};
        if (c.primary) root.style.setProperty('--color-primary', String(c.primary));
        if (c.secondary) root.style.setProperty('--color-secondary', String(c.secondary));
        if (c.bg) root.style.setProperty('--color-bg', String(c.bg));
        if (c.text) root.style.setProperty('--color-text', String(c.text));
        const r = theme.radius || {};
        if (r.md != null) root.style.setProperty('--radius-md', String(r.md) + 'px');
        if (r.lg != null) root.style.setProperty('--radius-lg', String(r.lg) + 'px');
      } catch {}
    }
    if (typeof window !== 'undefined') loadTheme();
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try { navigator.serviceWorker.register('/sw.js'); } catch {}
    }
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>{children}</I18nProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}