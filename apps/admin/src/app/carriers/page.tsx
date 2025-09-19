"use client";
import React from 'react';
import { resolveApiBase } from "../lib/apiBase";

export default function CarriersPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [name, setName] = React.useState('');
  const [mode, setMode] = React.useState<'TEST'|'LIVE'>('TEST');
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);
  async function load(){ const j = await (await fetch(`${apiBase}/api/admin/carriers`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' })).json(); setRows(j.carriers||[]); }
  React.useEffect(()=>{ load(); },[apiBase]);
  async function add(){ if (!name.trim()) return; await fetch(`${apiBase}/api/admin/carriers`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ name, mode }) }); setName(''); setMode('TEST'); await load(); }
  return (
    <main className="panel">
      <h1>المزوّدون</h1>
      <div className="grid" style={{ gridTemplateColumns:'2fr 1fr auto', gap:8, marginBottom:12 }}>
        <input className="input" placeholder="اسم المزود" value={name} onChange={(e)=>setName(e.target.value)} />
        <select className="select" value={mode} onChange={(e)=>setMode(e.target.value as any)}>
          <option value="TEST">TEST</option>
          <option value="LIVE">LIVE</option>
        </select>
        <button className="btn" onClick={add}>إضافة</button>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
          <thead><tr>
            <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>الاسم</th>
            <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>الوضع</th>
            <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>الحالة</th>
          </tr></thead>
          <tbody>
            {rows.map((c:any, idx:number)=> (
              <tr key={c.id} style={{ background: idx%2? '#0a0e17':'transparent' }}>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{c.name}</td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{c.mode}</td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{c.isActive? 'مفعل':'موقّف'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

