"use client";
import React from "react";
import { resolveApiBase } from "../../../lib/apiBase";
import { buildUrl, safeFetchJson } from "../../../lib/http";
import { IndependentNav } from "../components/IndependentNav";

export default function PagesReport(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [from, setFrom] = React.useState<string>(new Date(Date.now()-30*24*3600*1000).toISOString().slice(0,10));
  const [to, setTo] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [rows, setRows] = React.useState<Array<{ name:string; url:string; views:number; sessions:number }>>([]);
  const [q, setQ] = React.useState('');
  function exportCsv(){
    const data = [['name','url','views','sessions'], ...rows.map(r=> [r.name, r.url, String(r.views), String(r.sessions)])];
    const csv = data.map(r=> r.map(v=> /[",\n]/.test(String(v))? '"'+String(v).replace(/"/g,'""')+'"' : String(v)).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' }); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ia_pages.csv'; a.click(); setTimeout(()=> URL.revokeObjectURL(a.href), 1500);
  }
  async function load(){
    const r = await safeFetchJson<{ ok:boolean; pages:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/ia/pages`, { from, to }));
    if (r.ok){ setRows((r.data.pages||[]).map((x:any)=> ({ name: x.product?.name || (String(x.url||'').split('/').filter(Boolean).pop()||'-'), url:String(x.url||'-'), views:Number(x.views||0), sessions:Number(x.sessions||0) }))); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[apiBase, from, to]);
  const filtered = rows.filter(r=> !q || r.url.toLowerCase().includes(q.toLowerCase()));
  return (
    <main>
      <IndependentNav />
      <h1 style={{ marginBottom:12 }}>الصفحات</h1>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
        <label>من<input type="date" value={from} onChange={e=> setFrom(e.target.value)} className="input" /></label>
        <label>إلى<input type="date" value={to} onChange={e=> setTo(e.target.value)} className="input" /></label>
        <input placeholder="ابحث بالرابط" value={q} onChange={e=> setQ(e.target.value)} className="input" style={{ flex:1 }} />
        <button className="btn btn-outline" onClick={load}>تحديث</button>
        <button className="btn" onClick={exportCsv}>تصدير CSV</button>
      </div>
      <div className="panel" style={{ padding:12 }}>
        <div style={{ overflowX:'auto' }}>
          <table className="table"><thead><tr><th>الاسم</th><th>الرابط</th><th>المشاهدات</th><th>الجلسات</th></tr></thead><tbody>
            {filtered.map(r=> (<tr key={r.url}><td className="truncate" style={{maxWidth:220}}>{r.name}</td><td style={{maxWidth:520, direction:'ltr'}} className="truncate"><a href={r.url} target="_blank" rel="noreferrer">{r.url}</a></td><td>{r.views.toLocaleString()}</td><td>{r.sessions.toLocaleString()}</td></tr>))}
            {!filtered.length && <tr><td colSpan={4} style={{ color:'var(--sub)' }}>لا بيانات</td></tr>}
          </tbody></table>
        </div>
      </div>
    </main>
  );
}


