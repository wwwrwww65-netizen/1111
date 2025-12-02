"use client";
import React from "react";
import { resolveApiBase } from "../../../lib/apiBase";
import { buildUrl, safeFetchJson } from "../../../lib/http";
import { IndependentNav } from "../components/IndependentNav";

export default function ProductsReport(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [from, setFrom] = React.useState<string>(new Date(Date.now()-30*24*3600*1000).toISOString().slice(0,10));
  const [to, setTo] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [rows, setRows] = React.useState<Array<{ productId:string; name:string; sku?:string; views:number; addToCart:number; sessions:number; image?:string }>>([]);
  const [q, setQ] = React.useState('');
  const [err, setErr] = React.useState('');

  function exportCsv(){
    const data = [['productId','name','sku','views','addToCart','sessions'], ...rows.map(r=> [r.productId, r.name, r.sku||'', String(r.views), String(r.addToCart), String(r.sessions)])];
    const csv = data.map(r=> r.map(v=> /[",\n]/.test(String(v))? '"'+String(v).replace(/"/g,'""')+'"' : String(v)).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' }); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ia_products.csv'; a.click(); setTimeout(()=> URL.revokeObjectURL(a.href), 1500);
  }
  async function load(){
    const r = await safeFetchJson<{ ok:boolean; products:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/ia/products`, { from, to }));
    if (r.ok){
      setRows((r.data.products||[]).map((x:any)=> ({
        productId: String(x.productId||x.product?.id||''),
        name: x.product?.name || x.productId,
        sku: x.product?.sku,
        views: Number(x.views||0),
        addToCart: Number(x.addToCart||0),
        sessions: Number(x.sessions||0),
        image: Array.isArray(x.product?.images) ? x.product.images[0] : undefined
      })));
      setErr('');
    } else {
      setErr(r.message||'failed');
    }
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[apiBase, from, to]);

  const filtered = rows.filter(r=> !q || r.name.toLowerCase().includes(q.toLowerCase()) || r.productId.toLowerCase().includes(q.toLowerCase()));

  return (
    <main>
      <IndependentNav />
      <h1 style={{ marginBottom:12 }}>المنتجات</h1>
      {!!err && <div className="error" aria-live="assertive">فشل: {err}</div>}
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
        <label>من<input type="date" value={from} onChange={e=> setFrom(e.target.value)} className="input" /></label>
        <label>إلى<input type="date" value={to} onChange={e=> setTo(e.target.value)} className="input" /></label>
        <input placeholder="ابحث بالمنتج أو المعرّف" value={q} onChange={e=> setQ(e.target.value)} className="input" style={{ flex:1 }} />
        <button className="btn btn-outline" onClick={load}>تحديث</button>
        <a className="btn" href={buildUrl(`${apiBase}/api/admin/analytics/ia/products`, { from, to, csv: '1' })}>تصدير CSV</a>
      </div>
      <div className="panel" style={{ padding:12 }}>
        <div style={{ overflowX:'auto' }}>
          <table className="table">
            <thead><tr><th></th><th>المنتج</th><th>المعرّف</th><th>SKU</th><th>المشاهدات</th><th>الإضافة للسلة</th><th>الجلسات</th></tr></thead>
            <tbody>
              {filtered.map(r=> (
                <tr key={r.productId}>
                  <td>{r.image? (<img src={r.image} alt="" className="thumb" />) : null}</td>
                  <td className="truncate" style={{maxWidth:320}}>{r.name}</td>
                  <td style={{ direction:'ltr' }}>{r.productId}</td>
                  <td style={{ direction:'ltr' }}>{r.sku||'-'}</td>
                  <td>{r.views.toLocaleString()}</td>
                  <td>{r.addToCart.toLocaleString()}</td>
                  <td>{r.sessions.toLocaleString()}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={7} style={{ color:'var(--sub)' }}>لا بيانات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


