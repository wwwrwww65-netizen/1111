"use client";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";
import { AnalyticsNav } from "../components/AnalyticsNav";

export default function SegmentationBuilderPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [from, setFrom] = React.useState<string>(new Date(Date.now()-30*24*3600*1000).toISOString().slice(0,10));
  const [to, setTo] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [country, setCountry] = React.useState<string>("");
  const [device, setDevice] = React.useState<string>("");
  const [source, setSource] = React.useState<string>("");
  const [refHost, setRefHost] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string>("");
  const [res, setRes] = React.useState<{ visitors:number; sessions:number; views:number; purchases:number }|null>(null);
  async function run(){
    setBusy(true); setErr(""); setRes(null);
    try{
      const r = await fetch(`${apiBase}/api/admin/analytics/segments/query`, {
        method:"POST", credentials:"include", headers:{ "content-type":"application/json" },
        body: JSON.stringify({ from, to, filters: { country: country||undefined, device: device||undefined, source: source||undefined, refHost: refHost||undefined } })
      });
      const j = await r.json().catch(()=> ({}));
      if (!r.ok || !j.ok){ setErr(j.error||"failed"); } else setRes(j.result||null);
    }catch{ setErr("network_error"); }
    finally{ setBusy(false); }
  }
  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <AnalyticsNav />
        <h1 style={{ marginTop:0 }}>منشئ الشرائح Segmentation</h1>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px,1fr))", gap:8, alignItems:"center" }}>
          <label>من<input type="date" value={from} onChange={e=> setFrom(e.target.value)} className="input" /></label>
          <label>إلى<input type="date" value={to} onChange={e=> setTo(e.target.value)} className="input" /></label>
          <input className="input" placeholder="الدولة" value={country} onChange={e=> setCountry(e.target.value)} />
          <input className="input" placeholder="الجهاز/النظام/المتصفح" value={device} onChange={e=> setDevice(e.target.value)} />
          <input className="input" placeholder="utm_source" value={source} onChange={e=> setSource(e.target.value)} />
          <input className="input" placeholder="المُحيل (host فقط)" value={refHost} onChange={e=> setRefHost(e.target.value)} />
          <div><button className="btn" onClick={run} disabled={busy}>تطبيق</button></div>
        </div>
        {err && <div className="error" style={{ marginTop:12 }}>{err}</div>}
        <div style={{ marginTop:12, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))", gap:12 }}>
          <Card label="الأشخاص" value={res? res.visitors.toLocaleString() : (busy? "…":"-")} />
          <Card label="الجلسات" value={res? res.sessions.toLocaleString() : (busy? "…":"-")} />
          <Card label="المشاهدات" value={res? res.views.toLocaleString() : (busy? "…":"-")} />
          <Card label="المشتريات" value={res? res.purchases.toLocaleString() : (busy? "…":"-")} />
        </div>
      </div>
    </main>
  );
}

function Card({ label, value }: { label:string; value:any }){ return (<div className="panel" style={{ padding:12 }}><div style={{ color:'var(--sub)' }}>{label}</div><div style={{ fontSize:22, fontWeight:700 }}>{value}</div></div>); }


