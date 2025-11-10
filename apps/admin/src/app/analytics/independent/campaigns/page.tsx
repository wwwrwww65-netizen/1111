"use client";
import React from "react";
import { resolveApiBase } from "../../../lib/apiBase";
import { buildUrl, safeFetchJson } from "../../../lib/http";
import { IndependentNav } from "../components/IndependentNav";

export default function CampaignsReport(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [from, setFrom] = React.useState<string>(new Date(Date.now()-30*24*3600*1000).toISOString().slice(0,10));
  const [to, setTo] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [rows, setRows] = React.useState<Array<{ source?:string; medium?:string; campaign?:string; count:number }>>([]);
  async function load(){
    const r = await safeFetchJson<{ ok:boolean; items:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/utm`, { from, to }));
    if (r.ok) setRows((r.data.items||[]).map((x:any)=> ({ source:x.source, medium:x.medium, campaign:x.campaign, count:Number(x.cnt||x.count||0) })));
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[apiBase, from, to]);
  return (
    <main>
      <IndependentNav />
      <h1 style={{ marginBottom:12 }}>الحملات (UTM)</h1>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
        <label>من<input type="date" value={from} onChange={e=> setFrom(e.target.value)} className="input" /></label>
        <label>إلى<input type="date" value={to} onChange={e=> setTo(e.target.value)} className="input" /></label>
        <button className="btn btn-outline" onClick={load}>تحديث</button>
      </div>
      <div className="panel" style={{ padding:12 }}>
        <div style={{ overflowX:'auto' }}>
          <table className="table"><thead><tr><th>المصدر</th><th>الوسيط</th><th>الحملة</th><th>العدد</th></tr></thead><tbody>
            {rows.map((u,idx)=> (<tr key={idx}><td>{u.source||'-'}</td><td>{u.medium||'-'}</td><td>{u.campaign||'-'}</td><td>{u.count}</td></tr>))}
            {!rows.length && <tr><td colSpan={4} style={{ color:'var(--sub)' }}>لا بيانات</td></tr>}
          </tbody></table>
        </div>
      </div>
    </main>
  );
}


