"use client";
import React from "react";
import { resolveApiBase } from "../../../lib/apiBase";
import { buildUrl, safeFetchJson } from "../../../lib/http";
import { IndependentNav } from "../components/IndependentNav";

export default function ReferrersReport(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [from, setFrom] = React.useState<string>(new Date(Date.now()-30*24*3600*1000).toISOString().slice(0,10));
  const [to, setTo] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [rows, setRows] = React.useState<Array<{ ref:string; views:number }>>([]);
  function exportCsv(){
    const data = [['referrer','views'], ...rows.map(r=> [r.ref, String(r.views)])];
    const csv = data.map(r=> r.map(v=> /[",\n]/.test(String(v))? '"'+String(v).replace(/"/g,'""')+'"' : String(v)).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' }); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ia_referrers.csv'; a.click(); setTimeout(()=> URL.revokeObjectURL(a.href), 1500);
  }
  async function load(){
    const r = await safeFetchJson<{ ok:boolean; referrers:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/ia/referrers`, { from, to }));
    if (r.ok) setRows((r.data.referrers||[]).map((x:any)=> ({ ref:String(x.ref||'-'), views:Number(x.views||0) })));
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[apiBase, from, to]);
  return (
    <main>
      <IndependentNav />
      <h1 style={{ marginBottom:12 }}>المُحيلون</h1>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
        <label>من<input type="date" value={from} onChange={e=> setFrom(e.target.value)} className="input" /></label>
        <label>إلى<input type="date" value={to} onChange={e=> setTo(e.target.value)} className="input" /></label>
        <button className="btn btn-outline" onClick={load}>تحديث</button>
        <button className="btn" onClick={exportCsv}>تصدير CSV</button>
      </div>
      <div className="panel" style={{ padding:12 }}>
        <div style={{ overflowX:'auto' }}>
          <table className="table"><thead><tr><th>المُحيل</th><th>المشاهدات</th></tr></thead><tbody>
            {rows.map(r=> (<tr key={r.ref}><td style={{maxWidth:520, direction:'ltr'}} className="truncate">{r.ref||'-'}</td><td>{r.views.toLocaleString()}</td></tr>))}
            {!rows.length && <tr><td colSpan={2} style={{ color:'var(--sub)' }}>لا بيانات</td></tr>}
          </tbody></table>
        </div>
      </div>
    </main>
  );
}


