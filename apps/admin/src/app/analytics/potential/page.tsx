"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";
import { FilterBar, type AnalyticsFilters } from "../components/FilterBar";
import { AnalyticsNav } from "../components/AnalyticsNav";
import { buildUrl, safeFetchJson, errorView } from "../../lib/http";

export default function PotentialToBuyPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [filters, setFilters] = React.useState<AnalyticsFilters>({});
  const [rows, setRows] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState(true);
  const [err, setErr] = React.useState('');

  async function load(){
    setBusy(true); setErr('');
    try{
      const url = buildUrl(`${apiBase}/api/admin/analytics/recommendations/potential`, { from: filters.from, to: filters.to });
      const r = await safeFetchJson<{ items:any[] }>(url);
      if (r.ok) setRows(r.data?.items||[]); else { setRows([]); setErr(r.message||'failed'); }
    } finally { setBusy(false); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase]);

  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <AnalyticsNav />
        <h1 style={{ marginTop:0 }}>منتجات محتمل شراؤها</h1>
        <FilterBar value={filters} onChange={setFilters} onApply={load} />
        {err && errorView(err, load)}
        <div style={{ marginTop:12, overflowX:'auto' }}>
          <table className="table" role="table" aria-label="Potential">
            <thead><tr><th>المنتج</th><th>المشاهدات</th><th>إضافة للسلة</th><th>مشتريات</th><th>النتيجة</th></tr></thead>
            <tbody>
              {rows.map((r:any)=> (
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
                  <td>{r.score.toFixed(2)}</td>
                </tr>
              ))}
              {!busy && !rows.length && (<tr><td colSpan={5} style={{ color:'var(--sub)' }}>لا توجد بيانات</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


