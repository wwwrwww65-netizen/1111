"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";
import { AnalyticsNav } from "../components/AnalyticsNav";
import { safeFetchJson, errorView } from "../../lib/http";

export default function AcquisitionPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [utm, setUtm] = React.useState<any[]>([]);
  const [fb, setFb] = React.useState<{ roas:number; conv:number; purchases:number; cpa:number }|null>(null);
  const [busy, setBusy] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(()=>{ (async()=>{
    try{
      const [u, f] = await Promise.all([
        safeFetchJson<{ items:any[] }>(`${apiBase}/api/admin/analytics/utm`),
        safeFetchJson<{ analytics:any }>(`${apiBase}/api/admin/marketing/facebook/analytics`)
      ]);
      if (!u.ok) setErr(u.message||'failed');
      setUtm(u.ok? (u.data?.items||[]) : []);
      setFb(f.ok? (f.data?.analytics||null) : null);
    } finally { setBusy(false); }
  })(); }, [apiBase]);

  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <AnalyticsNav />
        <h1 style={{ marginTop:0 }}>الاكتساب والقنوات</h1>
        {err && errorView(err)}
        {fb && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginTop:8 }}>
            <Card label="ROAS" value={fb.roas.toFixed(2)} />
            <Card label="CPA" value={fb.cpa} />
            <Card label="التحويل" value={fb.conv} />
            <Card label="مشتريات" value={fb.purchases} />
          </div>
        )}
        <div style={{ marginTop:16 }}>
          <h3 style={{ marginTop:0 }}>UTM</h3>
          <div style={{ overflowX:'auto' }}>
            <table className="table" role="table" aria-label="UTM">
              <thead><tr><th>source</th><th>medium</th><th>campaign</th><th>count</th></tr></thead>
              <tbody>
                {utm.map((r:any, idx:number)=> (
                  <tr key={idx}><td>{r.source}</td><td>{r.medium}</td><td>{r.campaign}</td><td>{r.cnt}</td></tr>
                ))}
                {!utm.length && !busy && (<tr><td colSpan={4} style={{ color:'var(--sub)' }}>لا توجد بيانات</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: any }): JSX.Element {
  return (
    <div className="panel" style={{ padding:12 }}>
      <div style={{ color:'var(--sub)' }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700 }}>{value}</div>
    </div>
  );
}


