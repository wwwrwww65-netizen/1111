"use client";
import React from "react";
import { resolveApiBase } from "../../../lib/apiBase";
import { AnalyticsNav } from "../../components/AnalyticsNav";

export default function RetentionHeatmapPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [weeks, setWeeks] = React.useState<number>(8);
  const [rows, setRows] = React.useState<Array<{ cohortDay:string; newUsers:number; series:Array<{ offset:number; sessions:number }> }>>([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string>("");
  async function load(){
    setBusy(true); setErr("");
    try{
      const r = await fetch(`${apiBase}/api/admin/analytics/retention/heatmap?weeks=${weeks}`, { credentials:"include" });
      const j = await r.json();
      if (!r.ok || !j.ok){ setErr(j.error||"failed"); setRows([]); }
      else setRows(j.heatmap||[]);
    }catch{ setErr("network_error"); setRows([]); }
    finally{ setBusy(false); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase, weeks]);
  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <AnalyticsNav />
        <h1 style={{ marginTop:0 }}>Retention Heatmap</h1>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <label>الأسابيع<input type="number" className="input" min={1} max={26} value={weeks} onChange={e=> setWeeks(Math.max(1, Math.min(26, Number(e.target.value)||8)))} style={{ width:100 }} /></label>
          <button className="btn btn-outline" onClick={load} disabled={busy}>تحديث</button>
        </div>
        {err && <div className="error" style={{ marginTop:12 }}>{err}</div>}
        <div style={{ marginTop:12, overflowX:'auto' }}>
          <table className="table">
            <thead>
              <tr><th>القُطَّيع (يوم البدء)</th><th>جدد</th>{Array.from({ length: 15 }, (_,i)=> <th key={i}>+{i}d</th>)}</tr>
            </thead>
            <tbody>
              {rows.map(r=> (
                <tr key={r.cohortDay}>
                  <td>{r.cohortDay}</td>
                  <td>{r.newUsers.toLocaleString()}</td>
                  {Array.from({ length: 15 }, (_,i)=> {
                    const it = r.series.find(s=> s.offset===i);
                    const val = it? it.sessions : 0;
                    const bg = val>0? `rgba(34,197,94,${Math.min(0.85, 0.1 + (val/Math.max(1, r.newUsers))*0.9)})` : 'transparent';
                    return <td key={i} style={{ background:bg }}>{val? val.toLocaleString() : ''}</td>;
                  })}
                </tr>
              ))}
              {!rows.length && !busy && (<tr><td colSpan={17} style={{ color:'var(--sub)' }}>لا بيانات</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


