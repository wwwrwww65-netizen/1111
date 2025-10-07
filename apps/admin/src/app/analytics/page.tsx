"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";

export default function AnalyticsPage(): JSX.Element {
  const [kpis, setKpis] = React.useState<any>({});
  const [from, setFrom] = React.useState<string>(new Date(Date.now()-7*24*3600*1000).toISOString().slice(0,10));
  const [to, setTo] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [utm, setUtm] = React.useState<Array<{source?:string;medium?:string;campaign?:string;count:number}>>([]);
  const [reports, setReports] = React.useState<Array<{name:string;updatedAt:string;config:any}>>([]);
  const [reportName, setReportName] = React.useState<string>("");
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  React.useEffect(()=>{ fetch(`${apiBase}/api/admin/analytics`, { credentials:'include' }).then(r=>r.json()).then(j=>setKpis(j.kpis||{})); },[apiBase]);
  async function loadUtm(){
    const url = new URL(`${apiBase}/api/admin/analytics/utm/summary`);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setUtm(j.utm||[]);
  }
  async function loadReports(){ const j = await (await fetch(`${apiBase}/api/admin/analytics/reports`, { credentials:'include' })).json(); setReports(j.reports||[]); }
  React.useEffect(()=>{ loadUtm().catch(()=>{}); loadReports().catch(()=>{}); },[apiBase]);
  async function saveReport(){ const cfg = { from, to }; const r = await fetch(`${apiBase}/api/admin/analytics/reports`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ name: reportName||`r_${Date.now()}`, config: cfg }) }); if (r.ok) { setReportName(""); await loadReports(); } }
  async function applyReport(r:any){ const cfg = r?.config||{}; if (cfg.from) setFrom(String(cfg.from).slice(0,10)); if (cfg.to) setTo(String(cfg.to).slice(0,10)); await loadUtm(); }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>الإحصاءات</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
        <Card label="المستخدمون" value={kpis.users ?? '-'} />
        <Card label="الطلبات" value={kpis.orders ?? '-'} />
        <Card label="الإيرادات" value={kpis.revenue ?? '-'} />
      </div>
      <div style={{ marginTop:16, display:'grid', gap:10 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <label>من<input type="date" value={from} onChange={e=> setFrom(e.target.value)} className="input" /></label>
          <label>إلى<input type="date" value={to} onChange={e=> setTo(e.target.value)} className="input" /></label>
          <button className="btn btn-outline" onClick={loadUtm}>تحديث UTM</button>
          <input placeholder="اسم التقرير" value={reportName} onChange={e=> setReportName(e.target.value)} className="input" />
          <button className="btn" onClick={saveReport}>حفظ كتقرير</button>
        </div>
        <div className="panel" style={{ padding:12 }}>
          <h3 style={{ marginTop:0 }}>UTM Summary</h3>
          <div style={{ overflowX:'auto' }}>
            <table className="table"><thead><tr><th>source</th><th>medium</th><th>campaign</th><th>count</th></tr></thead><tbody>
              {utm.map((u,idx)=> (<tr key={idx}><td>{u.source||'-'}</td><td>{u.medium||'-'}</td><td>{u.campaign||'-'}</td><td>{u.count}</td></tr>))}
              {!utm.length && (<tr><td colSpan={4}>لا بيانات</td></tr>)}
            </tbody></table>
          </div>
        </div>
        <div className="panel" style={{ padding:12 }}>
          <h3 style={{ marginTop:0 }}>تقارير محفوظة</h3>
          <div style={{ display:'grid', gap:8 }}>
            {reports.length? reports.map((r:any)=> (
              <div key={r.name} style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div style={{ flex:1 }}><b>{r.name}</b> <span style={{ color:'#94a3b8' }}>{String(r.updatedAt).slice(0,19).replace('T',' ')}</span></div>
                <button className="btn btn-sm" onClick={()=> applyReport(r)}>تطبيق</button>
                <button className="btn btn-sm btn-outline" onClick={async()=>{ await fetch(`${apiBase}/api/admin/analytics/reports/${encodeURIComponent(r.name)}`, { method:'DELETE', credentials:'include' }); await loadReports(); }}>حذف</button>
              </div>
            )): (<div style={{ color:'#94a3b8' }}>لا توجد تقارير محفوظة</div>)}
          </div>
        </div>
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: any }): JSX.Element {
  return (
    <div style={{ background:'#0f1420', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
      <div style={{ color:'#94a3b8', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:700 }}>{value}</div>
    </div>
  );
}

// legacy placeholder removed

