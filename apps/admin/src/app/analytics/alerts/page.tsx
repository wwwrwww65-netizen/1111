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

"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";

type Rule = { name:string; type:'threshold'; metric:'orders'|'revenue'|'page_view'; op:'>'|'<'|'='; value:number; window:string; channel?:'email'|'slack'|'push' };

export default function AnalyticsAlertsPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [rules, setRules] = React.useState<Rule[]>([]);
  const [busy, setBusy] = React.useState(true);
  const [newRule, setNewRule] = React.useState<Rule>({ name:'', type:'threshold', metric:'orders', op:'>', value:100, window:'1d' });
  const [testing, setTesting] = React.useState<{ idx:number; current:number; triggered:boolean }|null>(null);

  async function load(){
    setBusy(true);
    try{ const j = await (await fetch(`${apiBase}/api/admin/analytics/alerts`, { credentials:'include' })).json(); setRules(Array.isArray(j.rules)? j.rules: []); }
    finally{ setBusy(false); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase]);

  async function save(){
    await fetch(`${apiBase}/api/admin/analytics/alerts`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ rules }) });
  }
  function add(){ if (!newRule.name.trim()) return; setRules((r)=> [...r, { ...newRule }]); setNewRule({ name:'', type:'threshold', metric:'orders', op:'>', value:100, window:'1d' }); }
  function remove(idx:number){ setRules((r)=> r.filter((_,i)=> i!==idx)); }
  async function test(idx:number){
    setTesting({ idx, current:0, triggered:false });
    const r = rules[idx];
    const res = await fetch(`${apiBase}/api/admin/analytics/alerts/test`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ rule: r }) });
    const j = await res.json();
    setTesting({ idx, current: Number(j.current||0), triggered: !!j.triggered });
  }

  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h1 style={{ margin:0 }}>التنبيهات</h1>
          <button className="btn" onClick={save} disabled={busy}>حفظ</button>
        </div>
        <div style={{ marginTop:12 }}>
          <h3 style={{ marginTop:0 }}>قاعدة جديدة</h3>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <input className="input" placeholder="اسم" value={newRule.name} onChange={(e)=> setNewRule({ ...newRule, name: e.target.value })} />
            <select className="input" value={newRule.metric} onChange={(e)=> setNewRule({ ...newRule, metric: e.target.value as any })}><option value="orders">Orders</option><option value="revenue">Revenue</option><option value="page_view">Page Views</option></select>
            <select className="input" value={newRule.op} onChange={(e)=> setNewRule({ ...newRule, op: e.target.value as any })}><option value=">">&gt;</option><option value="<">&lt;</option><option value="=">=</option></select>
            <input className="input" type="number" value={newRule.value} onChange={(e)=> setNewRule({ ...newRule, value: Number(e.target.value) })} />
            <input className="input" placeholder="نافذة مثل 1d" value={newRule.window} onChange={(e)=> setNewRule({ ...newRule, window: e.target.value })} />
            <button className="btn" onClick={add}>إضافة</button>
          </div>
        </div>
        <div style={{ marginTop:16 }}>
          <h3 style={{ marginTop:0 }}>القواعد</h3>
          <div style={{ display:'grid', gap:8 }}>
            {rules.map((r, idx)=> (
              <div key={idx} className="panel" style={{ padding:12, display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ flex:1 }}>
                  <b>{r.name}</b>
                  <div style={{ color:'var(--sub)', fontSize:12 }}>{r.metric} {r.op} {r.value} خلال {r.window}</div>
                </div>
                <button className="btn btn-outline" onClick={()=> test(idx)}>اختبار</button>
                <button className="btn btn-outline" onClick={()=> remove(idx)}>حذف</button>
              </div>
            ))}
            {!rules.length && !busy && (<div style={{ color:'var(--sub)' }}>لا توجد قواعد</div>)}
          </div>
          {testing && (
            <div className="panel" style={{ padding:12, marginTop:12 }}>
              <div>النتيجة الحالية: {testing.current} — {testing.triggered? <span style={{ color:'#22c55e' }}>TRIGGERED</span> : <span style={{ color:'#ef4444' }}>NOT TRIGGERED</span>}</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


