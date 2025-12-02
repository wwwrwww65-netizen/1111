"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";

export default function AnalyticsPrivacyPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [retentionDays, setRetentionDays] = React.useState(365);
  const [ipAnonymize, setIpAnonymize] = React.useState(true);
  const [busy, setBusy] = React.useState(true);

  React.useEffect(()=>{ (async()=>{
    try{ const j = await (await fetch(`${apiBase}/api/admin/analytics/privacy`, { credentials:'include' })).json(); setRetentionDays(Number(j.retentionDays||365)); setIpAnonymize(!!j.ipAnonymize); }
    finally{ setBusy(false); }
  })(); }, [apiBase]);

  async function save(){
    await fetch(`${apiBase}/api/admin/analytics/privacy`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ retentionDays, ipAnonymize }) });
  }

  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h1 style={{ margin:0 }}>الخصوصية والاحتفاظ</h1>
          <button className="btn" disabled={busy} onClick={save}>حفظ</button>
        </div>
        <div style={{ marginTop:12, display:'grid', gap:12 }}>
          <label style={{ display:'flex', gap:8, alignItems:'center' }}>الاحتفاظ (أيام)
            <input className="input" type="number" min={7} max={1825} value={retentionDays} onChange={(e)=> setRetentionDays(Number(e.target.value))} />
          </label>
          <label style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input type="checkbox" checked={ipAnonymize} onChange={(e)=> setIpAnonymize(e.target.checked)} /> إخفاء هوية IP
          </label>
        </div>
      </div>
    </main>
  );
}


