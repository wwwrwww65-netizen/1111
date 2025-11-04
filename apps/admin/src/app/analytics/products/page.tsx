"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";
import { FilterBar, type AnalyticsFilters } from "../components/FilterBar";
import { AnalyticsNav } from "../components/AnalyticsNav";

export default function ProductsAnalyticsPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [rows, setRows] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState(true);
  const [q, setQ] = React.useState('');
  const [filters, setFilters] = React.useState<AnalyticsFilters>({});

  async function load(){
    setBusy(true);
    try{
      const url = new URL(`${apiBase}/api/admin/analytics/products/table`);
      if (filters.from) url.searchParams.set('from', filters.from);
      if (filters.to) url.searchParams.set('to', filters.to);
      if (filters.device) url.searchParams.set('device', filters.device);
      if (filters.country) url.searchParams.set('country', filters.country);
      if (filters.channel) url.searchParams.set('channel', filters.channel);
      if (filters.utmSource) url.searchParams.set('utmSource', filters.utmSource);
      if (filters.utmMedium) url.searchParams.set('utmMedium', filters.utmMedium);
      if (filters.utmCampaign) url.searchParams.set('utmCampaign', filters.utmCampaign);
      const j = await (await fetch(url.toString(), { credentials:'include' })).json(); setRows(j.rows||[]);
    } finally { setBusy(false); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase]);

  const filtered = React.useMemo(()=>{
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r:any)=> (r.product?.name||'').toLowerCase().includes(s) || String(r.productId).includes(s));
  }, [rows, q]);

  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <AnalyticsNav />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
          <h1 style={{ margin:0 }}>تحليلات المنتجات</h1>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input className="input" placeholder="بحث عن منتج" value={q} onChange={(e)=> setQ(e.target.value)} />
            <a className="btn btn-outline" href={`${apiBase}/api/admin/analytics/products/table?csv=1`} target="_blank" rel="noreferrer">تصدير CSV</a>
          </div>
        </div>
        <FilterBar value={filters} onChange={setFilters} onApply={load} />
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
              {filtered.map((r:any)=> (
                <tr key={r.productId}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <img src={(r.product?.images?.[0]||'')+''} alt="" style={{ width:38, height:38, objectFit:'cover', borderRadius:8 }} />
                      <div>
                        <div style={{ fontWeight:600 }}><a className="link" href={`/products/${r.productId}`}>{r.product?.name||r.productId}</a></div>
                        <div style={{ color:'var(--sub)', fontSize:12 }}>#{r.productId}</div>
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
      </div>
    </main>
  );
}


