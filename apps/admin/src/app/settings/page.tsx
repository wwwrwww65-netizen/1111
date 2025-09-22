"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";
import { downloadCsv } from "../lib/csv";
import { exportToXlsx, exportToPdf } from "../lib/export";

export default function SettingsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [q, setQ] = React.useState("");
  const [keyName, setKeyName] = React.useState("");
  const [value, setValue] = React.useState("{}");
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  },[]);
  async function load(){
    const url = new URL(`${apiBase}/api/admin/settings/list`);
    if (q.trim()) url.searchParams.set('q', q.trim());
    const j = await (await fetch(url.toString(), { credentials:'include', headers:{ ...authHeaders() } })).json(); setRows(j.settings||[]);
  }
  React.useEffect(()=>{ load(); },[apiBase]);
  async function upsert(){ await fetch(`${apiBase}/api/admin/settings`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ key: keyName, value: JSON.parse(value||"{}") }) }); setKeyName(""); setValue("{}"); await load(); }
  async function remove(id:string){ await fetch(`${apiBase}/api/admin/settings/${id}`, { method:'DELETE', headers:{ ...authHeaders() }, credentials:'include' }); await load(); }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>الإعدادات</h1>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, marginBottom:12 }}>
        <input value={keyName} onChange={(e)=>setKeyName(e.target.value)} placeholder="key" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <input value={value} onChange={(e)=>setValue(e.target.value)} placeholder='{"k":"v"}' style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={upsert} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>حفظ</button>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="بحث" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={()=> load()} className="btn">تحديث</button>
        <button className="btn btn-outline" onClick={()=> downloadCsv(`settings_${new Date().toISOString().slice(0,10)}.csv`, [
          ['key','value'],
          ...rows.map((s:any)=> [s.key, JSON.stringify(s.value)])
        ])}>CSV</button>
        <button className="btn btn-outline" onClick={()=> exportToXlsx(`settings_${new Date().toISOString().slice(0,10)}.xlsx`, ['key','value'], rows.map((s:any)=> [s.key, JSON.stringify(s.value)]))}>Excel</button>
        <button className="btn btn-outline" onClick={()=> exportToPdf(`settings_${new Date().toISOString().slice(0,10)}.pdf`, ['key','value'], rows.map((s:any)=> [s.key, JSON.stringify(s.value)]))}>PDF</button>
      </div>
      <ul>
        {rows.map((s)=> (
          <li key={s.id} style={{ padding:8, border:'1px solid #1c2333', borderRadius:8, marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
            <div>
              <div style={{ fontWeight:700 }}>{s.key}</div>
              <div style={{ color:'var(--sub)', fontSize:12, direction:'ltr' }}>{JSON.stringify(s.value)}</div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn btn-xs" onClick={()=> { setKeyName(s.key); setValue(JSON.stringify(s.value||{})); }}>تعديل</button>
              <button className="btn btn-xs btn-outline" onClick={()=> remove(s.id)}>حذف</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

// legacy placeholder removed

