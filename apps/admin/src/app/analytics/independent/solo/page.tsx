"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { resolveApiBase } from "../../../lib/apiBase";
import { buildUrl, safeFetchJson } from "../../../lib/http";
import { IndependentNav } from "../components/IndependentNav";

export default function SoloReport(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const sp = useSearchParams();
  const [from, setFrom] = React.useState<string>(new Date(Date.now()-30*24*3600*1000).toISOString().slice(0,10));
  const [to, setTo] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [url, setUrl] = React.useState<string>(sp.get('url') || '');
  const [views, setViews] = React.useState(0);
  const [visitors, setVisitors] = React.useState(0);
  const [sessions, setSessions] = React.useState(0);
  async function load(){
    if (!url) { setViews(0); setVisitors(0); setSessions(0); return; }
    const r = await safeFetchJson<{ ok:boolean; pages:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/ia/pages`, { from, to }));
    if (r.ok){
      const m = (r.data.pages||[]).find((x:any)=> String(x.url||'')===url);
      setViews(Number(m?.views||0)); setVisitors(Number(m?.visitors||0)); setSessions(Number(m?.sessions||0));
    }
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[apiBase, from, to, url]);
  return (
    <main>
      <IndependentNav />
      <h1 style={{ marginBottom:12 }}>تقرير منفرد (Solo)</h1>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
        <input placeholder="ألصق رابط صفحة" value={url} onChange={e=> setUrl(e.target.value)} className="input" style={{ flex:1, direction:'ltr' }} />
        <label>من<input type="date" value={from} onChange={e=> setFrom(e.target.value)} className="input" /></label>
        <label>إلى<input type="date" value={to} onChange={e=> setTo(e.target.value)} className="input" /></label>
        <button className="btn btn-outline" onClick={load}>تحديث</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        <Card label="المشاهدات" value={views.toLocaleString()} />
        <Card label="الزوار" value={visitors.toLocaleString()} />
        <Card label="الجلسات" value={sessions.toLocaleString()} />
      </div>
    </main>
  );
}

function Card({ label, value }: { label:string; value:any }){ return (<div className="card"><div style={{ color:'var(--sub)', marginBottom:6 }}>{label}</div><div style={{ fontSize:22, fontWeight:700 }}>{value}</div></div>) }


