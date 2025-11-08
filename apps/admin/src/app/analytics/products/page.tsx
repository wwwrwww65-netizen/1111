"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";
import { FilterBar, type AnalyticsFilters } from "../components/FilterBar";
import { AnalyticsNav } from "../components/AnalyticsNav";
import { buildUrl, safeFetchJson, errorView } from "../../lib/http";
import { exportToXlsx } from "../../lib/export";

export default function ProductsAnalyticsPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [rows, setRows] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState(true);
  const [q, setQ] = React.useState('');
  const [filters, setFilters] = React.useState<AnalyticsFilters>({});
  const [err, setErr] = React.useState('');
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  async function load(){
    setBusy(true); setErr('');
    try{
      const url = buildUrl(`${apiBase}/api/admin/analytics/products/table`, {
        from: filters.from, to: filters.to, device: filters.device, country: filters.country, channel: filters.channel, utmSource: filters.utmSource, utmMedium: filters.utmMedium, utmCampaign: filters.utmCampaign, currency: filters.currency, page: (filters as any).page, userSegment: (filters as any).userSegment
      });
      const r = await safeFetchJson<{ rows:any[] }>(url);
      if (r.ok) setRows(r.data?.rows||[]); else { setRows([]); setErr(r.message||'failed'); }
    } finally { setBusy(false); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase]);

  const filtered = React.useMemo(()=>{
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r:any)=> (r.product?.name||'').toLowerCase().includes(s) || String(r.productId).includes(s));
  }, [rows, q]);
  const paged = React.useMemo(()=>{
    const start = (page-1)*pageSize;
    return filtered.slice(start, start+pageSize);
  }, [filtered, page]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <AnalyticsNav />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
          <h1 style={{ margin:0 }}>تحليلات المنتجات</h1>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input className="input" placeholder="بحث عن منتج" value={q} onChange={(e)=> setQ(e.target.value)} />
            <a className="btn btn-outline" href={buildUrl(`${apiBase}/api/admin/analytics/products/table`, { csv: 1, from: filters.from, to: filters.to, device: filters.device, country: filters.country, channel: filters.channel, utmSource: filters.utmSource, utmMedium: filters.utmMedium, utmCampaign: filters.utmCampaign })} target="_blank" rel="noreferrer">تصدير CSV</a>
            <button className="btn btn-outline" onClick={()=> exportToXlsx(`products_${new Date().toISOString().slice(0,10)}.xlsx`, ['product','views','add_to_cart','purchases','conversion'], filtered.map((r:any)=> [r.product?.name||'', r.views, r.addToCart, r.purchases, `${(r.conversion*100).toFixed(2)}%`]))}>Excel</button>
          </div>
        </div>
        <FilterBar value={filters} onChange={setFilters} onApply={load} />
        {err && errorView(err, load)}
        <div style={{ marginTop:12, overflowX:'auto' }}>
          <table className="table" role="table" aria-label="Products Analytics">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>المشاهدات</th>
                <th>إضافة للسلة</th>
                <th>مشتريات</th>
                <th>التحويل</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r:any)=> (
                <tr key={r.productId}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <img src={(r.product?.images?.[0]||'')+''} alt="" style={{ width:38, height:38, objectFit:'cover', borderRadius:8 }} />
                      <div>
                        <div style={{ fontWeight:600 }}>{r.product?.name||'—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{r.views}</td>
                  <td>{r.addToCart}</td>
                  <td>{r.purchases}</td>
                  <td>{(r.conversion*100).toFixed(2)}%</td>
                </tr>
              ))}
              {!busy && !filtered.length && (<tr><td colSpan={5} style={{ color:'var(--sub)' }}>لا توجد بيانات</td></tr>)}
            </tbody>
          </table>
        </div>
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginTop:12 }}>
          <button className="btn btn-outline" disabled={page<=1} onClick={()=> setPage(p=> Math.max(1, p-1))}>السابق</button>
          <span style={{ color:'var(--sub)' }}>{page} / {totalPages}</span>
          <button className="btn btn-outline" disabled={page>=totalPages} onClick={()=> setPage(p=> Math.min(totalPages, p+1))}>التالي</button>
        </div>
      </div>
    </main>
  );
}


