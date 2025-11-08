"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";
import { FilterBar, type AnalyticsFilters } from "../components/FilterBar";
import { AnalyticsNav } from "../components/AnalyticsNav";
import { buildUrl, safeFetchJson, errorView } from "../../lib/http";

export default function SalesReportsPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [filters, setFilters] = React.useState<AnalyticsFilters>({ granularity:'day' });
  const [kpis, setKpis] = React.useState<{ revenue:number; orders:number; cancellations:number; refunds:number; cogs:number; profit:number; aov:number }|null>(null);
  const [series, setSeries] = React.useState<Array<{ day:string; orders:number; revenue:number }>>([]);
  const [busy, setBusy] = React.useState(true);
  const [err, setErr] = React.useState('');

  async function load(){
    setBusy(true); setErr('');
    try{
      const sUrl = buildUrl(`${apiBase}/api/admin/analytics/sales/summary`, { from: filters.from, to: filters.to });
      const oUrl = buildUrl(`${apiBase}/api/admin/analytics/orders-series`, { from: filters.from, to: filters.to, g: filters.granularity });
      const [sj, oj] = await Promise.all([ safeFetchJson<{ summary:any }>(sUrl), safeFetchJson<{ series:any[] }>(oUrl) ]);
      if (!sj.ok) setErr(sj.message||'failed');
      if (!oj.ok) setErr(oj.message||'failed');
      setKpis(sj.ok? (sj.data?.summary||null) : null);
      setSeries(oj.ok? (oj.data?.series||[]) : []);
    } finally { setBusy(false); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase]);

  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <AnalyticsNav />
        <h1 style={{ marginTop:0 }}>تقارير المبيعات</h1>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
          <FilterBar value={filters} onChange={setFilters} onApply={load} />
          <a className="btn btn-outline" href={buildUrl(`${apiBase}/api/admin/analytics/orders-series`, { csv:1, from: filters.from, to: filters.to, g: filters.granularity })} target="_blank" rel="noreferrer">تصدير CSV</a>
        </div>
        {err && errorView(err, load)}
        {kpis && (
          <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:12 }}>
            <Card label="الإيرادات" value={fmt(kpis.revenue)} />
            <Card label="الطلبات" value={kpis.orders} />
            <Card label="المُلغاة" value={kpis.cancellations} />
            <Card label="المُستردة" value={fmt(kpis.refunds)} />
            <Card label="الربح" value={fmt(kpis.profit)} />
            <Card label="AOV" value={fmt(kpis.aov)} />
          </div>
        )}
        <div style={{ marginTop:16, minHeight:280 }}>
          {!busy ? <ChartOrdersRevenue series={series} /> : <div className="skeleton" style={{ height:280 }} />}
        </div>
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: any }): JSX.Element {
  return (
    <div className="panel" style={{ padding:12 }}>
      <div style={{ color:'var(--sub)' }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700 }}>{value}</div>
    </div>
  );
}

function fmt(n: number): string { return typeof n==='number'? n.toLocaleString(): String(n); }

function ChartOrdersRevenue({ series }: { series: Array<{ day:string; orders:number; revenue:number }> }): JSX.Element {
  const ref = React.useRef<HTMLDivElement|null>(null);
  const chartRef = React.useRef<any>(null);
  React.useEffect(()=>{
    let disposed = false;
    async function ensure(){
      if (!ref.current) return;
      if (!(window as any).echarts) {
        await new Promise<void>((resolve)=>{ const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js'; s.onload=()=> resolve(); document.body.appendChild(s); });
      }
      if (disposed) return;
      const echarts = (window as any).echarts;
      chartRef.current = echarts.init(ref.current);
      const option = {
        backgroundColor: 'transparent', textStyle:{ color:'#e2e8f0' }, tooltip:{ trigger:'axis' }, legend:{ data:['الطلبات','الإيرادات'], textStyle:{ color:'#cbd5e1' } }, grid:{ left: 36, right: 18, top: 30, bottom: 28 },
        xAxis:{ type:'category', data: series.map(s=> s.day), axisLine:{ lineStyle:{ color:'#334155' } } },
        yAxis:[ { type:'value', name:'طلبات', axisLine:{ lineStyle:{ color:'#334155' } }, splitLine:{ lineStyle:{ color:'#172036' } } }, { type:'value', name:'ريال', axisLine:{ lineStyle:{ color:'#334155' } }, splitLine:{ show:false } } ],
        series:[ { name:'الطلبات', type:'bar', data: series.map(s=> s.orders), itemStyle:{ color:'#22c55e' } }, { name:'الإيرادات', type:'line', yAxisIndex:1, data: series.map(s=> s.revenue), itemStyle:{ color:'#0ea5e9' }, smooth:true } ]
      };
      chartRef.current.setOption(option);
      window.addEventListener('resize', resize);
    }
    function resize(){ try { chartRef.current && chartRef.current.resize(); } catch {}
    }
    ensure();
    return ()=> { disposed = true; window.removeEventListener('resize', resize); try { chartRef.current && chartRef.current.dispose(); } catch {} };
  }, [series]);
  return <div ref={ref} style={{ width:'100%', height: 280 }} />;
}


