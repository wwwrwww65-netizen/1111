 "use client";
 import React from "react";
 import { resolveApiBase } from "../../lib/apiBase";
 import { AnalyticsNav } from "../components/AnalyticsNav";
 import { buildUrl } from "../../lib/http";
 
 export default function AlertsAnomaliesPage(): JSX.Element {
   const apiBase = React.useMemo(()=> resolveApiBase(), []);
   const [metric, setMetric] = React.useState<string>("page_views");
   const [rows, setRows] = React.useState<Array<{ day:string; value:number; z:number; anomaly:boolean }>>([]);
   const [mean, setMean] = React.useState<number>(0);
   const [std, setStd] = React.useState<number>(0);
   const [err, setErr] = React.useState<string>("");
   const [busy, setBusy] = React.useState(false);
   async function load(){
     setBusy(true); setErr("");
     try{
       const r = await fetch(buildUrl(`${apiBase}/api/admin/analytics/anomalies/daily`, { metric }), { credentials:"include" });
       const j = await r.json();
       if (!r.ok || !j.ok){ setErr(j.error||"failed"); setRows([]); }
       else { setRows(j.anomalies||[]); setMean(j.mean||0); setStd(j.std||0); }
     }catch{ setErr("network_error"); setRows([]); }
     finally{ setBusy(false); }
   }
   React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase, metric]);
   return (
     <main className="container">
       <div className="panel" style={{ padding:16 }}>
         <AnalyticsNav />
         <h1 style={{ marginTop:0 }}>التنبيهات والشذوذ</h1>
         <div style={{ display:"flex", alignItems:"center", gap:8 }}>
           <label>المؤشر</label>
           <select className="input" value={metric} onChange={e=> setMetric(e.target.value)} style={{ width:180 }}>
             <option value="page_views">Page Views</option>
             <option value="orders">Orders</option>
           </select>
           <button className="btn btn-outline" onClick={load} disabled={busy}>تحديث</button>
           <span style={{ color:'var(--sub)', marginInlineStart:'auto' }}>μ={mean} σ={std}</span>
         </div>
         {err && <div className="error" style={{ marginTop:12 }}>{err}</div>}
         <div style={{ marginTop:12, overflowX:"auto" }}>
           <table className="table"><thead><tr><th>اليوم</th><th>القيمة</th><th>z</th><th>شاذ؟</th></tr></thead><tbody>
             {rows.map((r)=> (<tr key={r.day}>
               <td>{r.day}</td>
               <td>{Number(r.value||0).toLocaleString()}</td>
               <td>{r.z}</td>
               <td>{r.anomaly? <span className="badge warn">نعم</span> : '-'}</td>
             </tr>))}
             {!rows.length && !busy && (<tr><td colSpan={4} style={{ color:'var(--sub)' }}>لا بيانات</td></tr>)}
           </tbody></table>
         </div>
       </div>
     </main>
   );
 }
