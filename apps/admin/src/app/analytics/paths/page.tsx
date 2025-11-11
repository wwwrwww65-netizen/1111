"use client";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";
import { AnalyticsNav } from "../components/AnalyticsNav";
import { buildUrl } from "../../lib/http";

export default function PathsPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [from, setFrom] = React.useState<string>(new Date(Date.now()-7*24*3600*1000).toISOString().slice(0,10));
  const [to, setTo] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [rows, setRows] = React.useState<Array<{ transition:string; count:number }>>([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string>("");
  async function load(){
    setBusy(true); setErr("");
    try{
      const r = await fetch(buildUrl(`${apiBase}/api/admin/analytics/paths/top`, { from, to, limit: 100 }), { credentials:"include" });
      const j = await r.json();
      if (!r.ok || !j.ok){ setErr(j.error||"failed"); setRows([]); } else setRows(j.transitions||[]);
    }catch{ setErr("network_error"); setRows([]); }
    finally{ setBusy(false); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase, from, to]);
  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <AnalyticsNav />
        <h1 style={{ marginTop:0 }}>تحليل المسارات (Top flows)</h1>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <label>من<input type="date" value={from} onChange={e=> setFrom(e.target.value)} className="input" /></label>
          <label>إلى<input type="date" value={to} onChange={e=> setTo(e.target.value)} className="input" /></label>
          <button className="btn btn-outline" onClick={load} disabled={busy}>تحديث</button>
        </div>
        {err && <div className="error" style={{ marginTop:12 }}>{err}</div>}
        <div style={{ marginTop:12, overflowX:"auto" }}>
          <table className="table"><thead><tr><th>الانتقال</th><th>العدد</th></tr></thead><tbody>
            {rows.map((r,idx)=> (<tr key={idx}><td style={{ direction:'ltr', maxWidth:680 }} className="truncate">{r.transition}</td><td>{r.count.toLocaleString()}</td></tr>))}
            {!rows.length && !busy && (<tr><td colSpan={2} style={{ color:'var(--sub)' }}>لا بيانات</td></tr>)}
          </tbody></table>
        </div>
      </div>
    </main>
  );
}


