"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";
import { FilterBar, type AnalyticsFilters } from "../components/FilterBar";
import { AnalyticsNav } from "../components/AnalyticsNav";
import { buildUrl, safeFetchJson, errorView } from "../../lib/http";

export default function VendorsAnalyticsPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [filters, setFilters] = React.useState<AnalyticsFilters>({});
  const [rows, setRows] = React.useState<Array<{ vendor:{id:string;name:string}; visits:number; qty:number; revenue:number }>>([]);
  const [busy, setBusy] = React.useState(true);
  const [err, setErr] = React.useState('');

  async function load(){
    setBusy(true); setErr('');
    try{
      const url = buildUrl(`${apiBase}/api/admin/analytics/vendors/top`, { from: filters.from, to: filters.to });
      const r = await safeFetchJson<{ vendors:any[] }>(url);
      if (r.ok) setRows(r.data?.vendors||[]); else { setRows([]); setErr(r.message||'failed'); }
    } finally { setBusy(false); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase]);

  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <AnalyticsNav />
        <h1 style={{ marginTop:0 }}>تحليلات الموردين</h1>
        <FilterBar value={filters} onChange={setFilters} onApply={load} />
        {err && errorView(err, load)}
        <div style={{ marginTop:12, overflowX:'auto' }}>
          <table className="table" role="table" aria-label="Vendors">
            <thead><tr><th>المورد</th><th>الزيارات</th><th>الكمية</th><th>الإيراد</th></tr></thead>
            <tbody>
              {rows.map(r=> (
                <tr key={r.vendor.id}>
                  <td>{r.vendor.name}</td>
                  <td>{r.visits}</td>
                  <td>{r.qty||0}</td>
                  <td>{typeof r.revenue==='number'? r.revenue.toLocaleString(): r.revenue}</td>
                </tr>
              ))}
              {!busy && !rows.length && (<tr><td colSpan={4} style={{ color:'var(--sub)' }}>لا توجد بيانات</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


