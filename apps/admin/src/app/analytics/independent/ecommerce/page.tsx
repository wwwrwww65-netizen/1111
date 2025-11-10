"use client";
import React from "react";
import { resolveApiBase } from "../../../lib/apiBase";
import { buildUrl, safeFetchJson } from "../../../lib/http";
import { IndependentNav } from "../components/IndependentNav";

export default function EcommerceReport(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [from, setFrom] = React.useState<string>(new Date(Date.now()-30*24*3600*1000).toISOString().slice(0,10));
  const [to, setTo] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [sum, setSum] = React.useState<any>(null);
  const [top, setTop] = React.useState<any[]>([]);
  async function load(){
    const s = await safeFetchJson<{ ok:boolean; summary:any }>(buildUrl(`${apiBase}/api/admin/analytics/sales/summary`, { from, to }));
    if (s.ok) setSum(s.data.summary);
    const t = await safeFetchJson<{ ok:boolean; items:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/top-sellers`, { from, to, limit: 20 }));
    if (t.ok) setTop(t.data.items||[]);
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[apiBase, from, to]);
  return (
    <main>
      <IndependentNav />
      <h1 style={{ marginBottom:12 }}>تحليلات التجارة</h1>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
        <label>من<input type="date" value={from} onChange={e=> setFrom(e.target.value)} className="input" /></label>
        <label>إلى<input type="date" value={to} onChange={e=> setTo(e.target.value)} className="input" /></label>
        <button className="btn btn-outline" onClick={load}>تحديث</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:12, marginBottom:12 }}>
        <Card label="الإيراد" value={fmt(sum?.revenue)} />
        <Card label="الطلبات" value={fmt(sum?.orders)} />
        <Card label="الإلغاءات" value={fmt(sum?.cancellations)} />
        <Card label="المرتجعات" value={fmt(sum?.refunds)} />
        <Card label="الربح التقديري" value={fmt(sum?.profit)} />
        <Card label="متوسط قيمة الطلب" value={typeof sum?.aov==='number'? sum.aov.toFixed(2): '-'} />
      </div>
      <div className="panel" style={{ padding:12 }}>
        <h3 style={{ marginTop:0 }}>أفضل المبيعات</h3>
        <div style={{ overflowX:'auto' }}>
          <table className="table">
            <thead><tr><th>المنتج</th><th>الكمية</th><th>الإيراد</th></tr></thead>
            <tbody>
              {top.map((r:any)=> (<tr key={r.productId}><td>{r.product?.name||r.productId}</td><td>{Number(r.qty||0)}</td><td>{Number(r.revenue||0).toLocaleString()}</td></tr>))}
              {!top.length && <tr><td colSpan={3} style={{ color:'var(--sub)' }}>لا بيانات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Card({ label, value }: { label:string; value:any }){ return (<div className="card"><div style={{ color:'var(--sub)', marginBottom:6 }}>{label}</div><div style={{ fontSize:22, fontWeight:700 }}>{value}</div></div>) }
function fmt(v:any){ return typeof v==='number'? v.toLocaleString() : '-'; }


