"use client";
import React from "react";
import { resolveApiBase } from "../../../lib/apiBase";
import { buildUrl, safeFetchJson } from "../../../lib/http";
import { IndependentNav } from "../components/IndependentNav";

export default function DevicesReport(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [from, setFrom] = React.useState<string>(new Date(Date.now()-30*24*3600*1000).toISOString().slice(0,10));
  const [to, setTo] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [rows, setRows] = React.useState<Array<{ device:string; views:number }>>([]);
  async function load(){
    const r = await safeFetchJson<{ ok:boolean; devices:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/ia/devices`, { from, to }));
    if (r.ok) setRows((r.data.devices||[]).map((x:any)=> ({ device:String(x.device||'-'), views:Number(x.views||0) })));
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[apiBase, from, to]);
  return (
    <main>
      <IndependentNav />
      <h1 style={{ marginBottom:12 }}>الأجهزة</h1>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
        <label>من<input type="date" value={from} onChange={e=> setFrom(e.target.value)} className="input" /></label>
        <label>إلى<input type="date" value={to} onChange={e=> setTo(e.target.value)} className="input" /></label>
        <button className="btn btn-outline" onClick={load}>تحديث</button>
      </div>
      <div className="panel" style={{ padding:12 }}>
        <div style={{ overflowX:'auto' }}>
          <table className="table"><thead><tr><th>الجهاز</th><th>المشاهدات</th></tr></thead><tbody>
            {rows.map(r=> (<tr key={r.device}><td className="truncate" style={{maxWidth:520}}>{r.device||'-'}</td><td>{r.views.toLocaleString()}</td></tr>))}
            {!rows.length && <tr><td colSpan={2} style={{ color:'var(--sub)' }}>لا بيانات</td></tr>}
          </tbody></table>
        </div>
      </div>
    </main>
  );
}


