"use client";
import React from 'react';
import { resolveApiBase } from '../lib/apiBase';

type AlertItem = {
  id?: string;
  level: 'error' | 'warn' | 'info' | 'success';
  title: string;
  detail?: string;
  actionLabel?: string;
  actionHref?: string;
};

export function Alerts({ scope, params }: { scope: string; params?: Record<string, string | number | undefined> }): JSX.Element | null {
  const apiBase = resolveApiBase();
  const [items, setItems] = React.useState<AlertItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      const url = new URL(`${apiBase}/api/admin/finance/alerts`);
      url.searchParams.set('scope', scope);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && String(v).length) url.searchParams.set(k, String(v));
        });
      }
      const j = await (await fetch(url.toString(), { credentials: 'include' })).json();
      setItems(Array.isArray(j.alerts) ? j.alerts : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load().catch(() => setLoading(false)); }, [apiBase, scope, JSON.stringify(params||{})]);

  if (loading && !items.length) return null;
  if (!items.length) return null;

  return (
    <div className="alerts" style={{ display: 'grid', gap: 8, marginTop: 8 }}>
      {items.map((a) => (
        <div key={a.id || a.title} className={`alert ${a.level}`} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700 }}>{a.title}</div>
              {a.detail && <div style={{ color: 'var(--sub)', fontSize: 12 }}>{a.detail}</div>}
            </div>
            {a.actionHref && (
              <a className="btn btn-xs" href={a.actionHref}>
                {a.actionLabel || 'فتح'}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

