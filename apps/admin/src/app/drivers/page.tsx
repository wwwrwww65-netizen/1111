"use client";
import React from 'react';

export default function DriversPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const apiBase = React.useMemo(()=>{
    return (process.env.NEXT_PUBLIC_API_BASE_URL as string) || (typeof window !== 'undefined' ? (window.location.origin.replace('jeeey-manger','jeeeyai')) : 'http://localhost:4000');
  }, []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
  }, []);

  async function load(){ const j = await (await fetch(`${apiBase}/api/admin/drivers`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' })).json(); setRows(j.drivers||[]); }
  React.useEffect(()=>{ load(); },[apiBase]);

  async function add(){ if (!name.trim()) return; await fetch(`${apiBase}/api/admin/drivers`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ name, phone }) }); setName(''); setPhone(''); await load(); }

  return (
    <main className="panel">
      <h1>السائقون</h1>
      <div className="grid" style={{ gridTemplateColumns:'2fr 2fr auto', gap:8, marginBottom:12 }}>
        <input className="input" placeholder="اسم السائق" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="input" placeholder="رقم الهاتف" value={phone} onChange={(e)=>setPhone(e.target.value)} />
        <button className="btn" onClick={add}>إضافة</button>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
          <thead><tr>
            <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>الاسم</th>
            <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>الهاتف</th>
            <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>الحالة</th>
          </tr></thead>
          <tbody>
            {rows.map((d:any, idx:number)=> (
              <tr key={d.id} style={{ background: idx%2? '#0a0e17':'transparent' }}>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{d.name}</td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{d.phone||'-'}</td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

