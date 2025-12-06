"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AnyRouter } from "@trpc/server";
import React from "react";

export const trpc = createTRPCReact<any>();

type Toast = { id: string; type?: 'ok' | 'err' | 'info'; message: string };
const ToastCtx = React.createContext<{ push: (t: Omit<Toast, 'id'>) => void } | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error('ToastCtx not mounted');
  return ctx;
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const push = React.useCallback((t: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts(x => [...x, { id, ...t }]);
    setTimeout(() => setToasts(x => x.filter(i => i.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="toast-stack" style={{ position: 'fixed', right: 16, bottom: 16, display: 'grid', gap: 8, zIndex: 70 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type === 'ok' ? 'ok' : t.type === 'err' ? 'err' : ''}`}>{t.message}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

const ConfirmCtx = React.createContext<{ ask: (q: { title: string; body?: string; confirmText?: string; cancelText?: string }) => Promise<boolean> } | null>(null);
export function useConfirm() {
  const ctx = React.useContext(ConfirmCtx);
  if (!ctx) throw new Error('ConfirmCtx not mounted');
  return ctx;
}

function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [q, setQ] = React.useState<{ title: string; body?: string; resolve?: (v: boolean) => void } | null>(null);
  const ask = React.useCallback((p: { title: string; body?: string }) => new Promise<boolean>(resolve => setQ({ ...p, resolve })), []);
  return (
    <ConfirmCtx.Provider value={{ ask }}>
      {children}
      {q && (
        <div className="modal" role="dialog" aria-modal>
          <div className="dialog">
            <div className="title">{q.title}</div>
            {q.body && <p style={{ marginBottom: 12 }}>{q.body}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={() => { q.resolve?.(false); setQ(null); }}>إلغاء</button>
              <button className="btn danger" onClick={() => { q.resolve?.(true); setQ(null); }}>تأكيد</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
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
    <ToastProvider>
      <ConfirmProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </trpc.Provider>
      </ConfirmProvider>
    </ToastProvider>
  );
}