"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";
import { FilterBar, type AnalyticsFilters } from "../components/FilterBar";
import { AnalyticsNav } from "../components/AnalyticsNav";
import { buildUrl, safeFetchJson, errorView } from "../../lib/http";

export default function OrdersRevenuePage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [series, setSeries] = React.useState<Array<{ day:string; orders:number; revenue:number }>>([]);
  const [busy, setBusy] = React.useState(true);
  const [filters, setFilters] = React.useState<AnalyticsFilters>({ granularity: 'day' });
  const [err, setErr] = React.useState('');

  async function load(){
    setBusy(true); setErr('');
    try{
      const url = buildUrl(`${apiBase}/api/admin/analytics/orders-series`, { from: filters.from, to: filters.to, g: filters.granularity, compare: filters.compare? 1: undefined });
      const r = await safeFetchJson<{ series:any[] }>(url);
      if (r.ok) setSeries(r.data?.series||[]); else { setSeries([]); setErr(r.message||'failed'); }
    } finally { setBusy(false); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase]);

  return (
    <main className="container">
      <div className="panel" style={{ padding:16, minHeight: 360 }}>
        <AnalyticsNav />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h1 style={{ marginTop:0 }}>الإيرادات والطلبات</h1>
          <a className="btn btn-outline" href={buildUrl(`${apiBase}/api/admin/analytics/orders-series`, { csv:1, from: filters.from, to: filters.to, g: filters.granularity })} target="_blank" rel="noreferrer">تصدير CSV</a>
        </div>
        <FilterBar value={filters} onChange={setFilters} onApply={load} />
        {err && errorView(err, load)}
        {!busy ? <ChartOrdersRevenue series={series} onPointClick={(day)=>{
          // Drill-down to selected day
          setFilters((f)=> ({ ...f, from: `${day}T00:00`, to: `${day}T23:59` }));
          setTimeout(()=> load(), 0);
        }} /> : <div className="skeleton" style={{ height: 280 }} />}
      </div>
    </main>
  );
}

function ChartOrdersRevenue({ series, onPointClick }: { series: Array<{ day:string; orders:number; revenue:number }>; onPointClick?: (day:string)=> void }): JSX.Element {
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
      if (onPointClick) {
        chartRef.current.off('click');
        chartRef.current.on('click', (params:any)=>{
          try{
            const idx = params.dataIndex;
            const day = series[idx]?.day;
            if (day) onPointClick(day);
          } catch {}
        });
      }
      window.addEventListener('resize', resize);
    }
    function resize(){ try { chartRef.current && chartRef.current.resize(); } catch {}
    }
    ensure();
    return ()=> { disposed = true; window.removeEventListener('resize', resize); try { chartRef.current && chartRef.current.dispose(); } catch {} };
  }, [series]);
  return <div ref={ref} style={{ width:'100%', height: 280 }} />;
}


