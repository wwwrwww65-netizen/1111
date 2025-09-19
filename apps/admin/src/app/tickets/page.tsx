"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";

export default function TicketsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [subject, setSubject] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  },[]);
  async function load(){
    const url = new URL(`${apiBase}/api/admin/tickets`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', '20');
    if (status) url.searchParams.set('status', status);
    if (search) url.searchParams.set('search', search);
    const j = await (await fetch(url.toString(), { credentials:'include', headers:{ ...authHeaders() } })).json();
    setRows(j.tickets||[]);
  }
  React.useEffect(()=>{ load(); },[page, apiBase]);
  async function create() {
    await fetch(`${apiBase}/api/admin/tickets`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ subject }) });
    setSubject("");
    await load();
  }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>الدعم</h1>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <select value={status} onChange={(e)=>setStatus(e.target.value)} style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
          <option value="">الكل</option>
          <option value="OPEN">مفتوحة</option>
          <option value="IN_PROGRESS">جارية</option>
          <option value="CLOSED">مغلقة</option>
        </select>
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالموضوع" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={()=>{ setPage(1); load(); }} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>بحث</button>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="الموضوع" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={create} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>إنشاء</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>#</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الموضوع</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الحالة</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الأولوية</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>المستخدم</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t)=> (
            <tr key={t.id}>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{t.id.slice(0,6)}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{t.subject}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{t.status}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{t.priority}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{t.user?.email||'-'}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                <a href={`/tickets/${t.id}`} style={{ padding:'6px 10px', background:'#374151', color:'#e5e7eb', borderRadius:6 }}>تفاصيل</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

