"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";

export default function SettingsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [keyName, setKeyName] = React.useState("");
  const [value, setValue] = React.useState("{}");
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
  },[]);
  async function load(){ const j = await (await fetch(`${apiBase}/api/admin/settings/list`, { credentials:'include', headers:{ ...authHeaders() } })).json(); setRows(j.settings||[]); }
  React.useEffect(()=>{ load(); },[apiBase]);
  async function upsert(){ await fetch(`${apiBase}/api/admin/settings`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ key: keyName, value: JSON.parse(value||"{}") }) }); setKeyName(""); setValue("{}"); await load(); }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>الإعدادات</h1>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, marginBottom:12 }}>
        <input value={keyName} onChange={(e)=>setKeyName(e.target.value)} placeholder="key" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <input value={value} onChange={(e)=>setValue(e.target.value)} placeholder='{"k":"v"}' style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={upsert} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>حفظ</button>
      </div>
      <ul>
        {rows.map((s)=> (<li key={s.id} style={{ padding:8, border:'1px solid #1c2333', borderRadius:8, marginBottom:8 }}>{s.key}</li>))}
      </ul>
    </main>
  );
}

// legacy placeholder removed

