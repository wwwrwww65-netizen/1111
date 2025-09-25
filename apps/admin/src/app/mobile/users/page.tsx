"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

type UserItem = { id:string; name:string; phone?:string; email?:string; status?:string };

export default function MobileUsers(): JSX.Element {
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<UserItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const ctrlRef = React.useRef<AbortController | null>(null);

  const fetchList = React.useCallback(async (query: string) => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setLoading(true); setError(null);
    try {
      const base = resolveApiBase();
      const url = new URL(base + '/api/admin/users');
      if (query) url.searchParams.set('q', query);
      url.searchParams.set('limit', '20');
      const res = await fetch(url.toString(), { signal: ctrl.signal, headers: { 'accept': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : data);
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError('تعذر جلب البيانات');
    } finally { setLoading(false); }
  }, []);

  React.useEffect(()=>{ const t = setTimeout(()=> fetchList(q), 300); return ()=> clearTimeout(t); }, [q, fetchList]);
  React.useEffect(()=>{ try { const s = localStorage.getItem('m_users_q'); if (s) setQ(s); } catch {} }, []);
  React.useEffect(()=>{ try { localStorage.setItem('m_users_q', q); } catch {} }, [q]);

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:700, marginBottom:8 }}>المستخدمون</div>
        <input className="input" placeholder="بحث بالاسم أو الهاتف" value={q} onChange={e=> setQ(e.target.value)} />
      </div>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {error && <div className="panel" style={{ color:'var(--err)' }}>{error}</div>}
      {!loading && !error && items.length===0 && <div className="panel" style={{ color:'var(--sub)' }}>لا يوجد مستخدمون</div>}
      {!loading && !error && items.map((u)=> (
        <a key={u.id} className="panel" href={`/mobile/users/${u.id}`} style={{ textDecoration:'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:700 }}>{u.name}</div>
              <div style={{ color:'var(--sub)', fontSize:12 }}>{u.phone || u.email || '—'}</div>
            </div>
            {u.status && <span className="badge" style={{ background:'#101828', border:'1px solid #233046', padding:'4px 8px', borderRadius:8 }}>{u.status}</span>}
          </div>
        </a>
      ))}
    </div>
  );
}

