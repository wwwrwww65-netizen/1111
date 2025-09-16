"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";

export default function IntegrationsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [provider, setProvider] = React.useState("");
  const [config, setConfig] = React.useState("{\"key\":\"value\"}");
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  React.useEffect(()=>{ fetch(`${apiBase}/api/admin/integrations/list`, { credentials:'include' }).then(r=>r.json()).then(j=>setRows(j.integrations||[])); },[apiBase]);
  async function add() {
    await fetch(`${apiBase}/api/admin/integrations`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ provider, config: JSON.parse(config) }) });
    setProvider(""); setConfig("{\"key\":\"value\"}");
    const j = await (await fetch(`${apiBase}/api/admin/integrations/list`, { credentials:'include' })).json(); setRows(j.integrations||[]);
  }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>التكاملات</h1>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, marginBottom:12 }}>
        <input value={provider} onChange={(e)=>setProvider(e.target.value)} placeholder="المزوّد" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <input value={config} onChange={(e)=>setConfig(e.target.value)} placeholder='{"key":"value"}' style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={add} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>إضافة</button>
      </div>
      <ul>
        {rows.map((i)=> (<li key={i.id} style={{ padding:8, border:'1px solid #1c2333', borderRadius:8, marginBottom:8 }}>{i.provider}</li>))}
      </ul>
    </main>
  );
}

