"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";
import { FilterBar, type AnalyticsFilters } from "../components/FilterBar";
import { AnalyticsNav } from "../components/AnalyticsNav";

export default function RealtimeAnalyticsPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [metrics, setMetrics] = React.useState<Record<string, number>>({});
  const [events, setEvents] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState(true);
  const [filters, setFilters] = React.useState<AnalyticsFilters>({});

  React.useEffect(()=>{
    let t: any;
    const load = async()=>{
      try{
        const rtUrl = new URL(`${apiBase}/api/admin/analytics/realtime`);
        if (filters.device) rtUrl.searchParams.set('device', filters.device);
        if (filters.country) rtUrl.searchParams.set('country', filters.country);
        if (filters.channel) rtUrl.searchParams.set('channel', filters.channel);
        const evUrl = new URL(`${apiBase}/api/admin/analytics/events/recent`);
        evUrl.searchParams.set('limit','50');
        const [rt, rec] = await Promise.all([
          fetch(rtUrl.toString(), { credentials:'include' }).then(r=> r.json()),
          fetch(evUrl.toString(), { credentials:'include' }).then(r=> r.json())
        ]);
        setMetrics(rt?.metrics||{});
        setEvents(rec?.events||[]);
      } finally { setBusy(false); }
    };
    load(); t = setInterval(load, 5000);
    return ()=> clearInterval(t);
  }, [apiBase, filters.device, filters.country, filters.channel]);

  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <AnalyticsNav />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h1 style={{ margin:0 }}>الزمن الحقيقي</h1>
          <span style={{ color:'var(--sub)', fontSize:12 }}>تحديث كل 5 ثوانٍ</span>
        </div>
        <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
          <Card label="page_view (5m)" value={metrics.page_view ?? 0} />
          <Card label="add_to_cart (5m)" value={metrics.add_to_cart ?? 0} />
          <Card label="checkout (5m)" value={metrics.checkout ?? 0} />
          <Card label="purchase (5m)" value={metrics.purchase ?? 0} />
        </div>
        <div style={{ marginTop:12 }}>
          <FilterBar value={filters} onChange={setFilters} onApply={()=>{}} compact />
        </div>
        <div style={{ marginTop:16 }}>
          <h3 style={{ marginTop:0 }}>أحداث مباشرة</h3>
          <div style={{ maxHeight: 360, overflowY:'auto' }}>
            <table className="table" role="table" aria-label="أحداث مباشرة">
              <thead><tr><th>الوقت</th><th>الحدث</th><th>المستخدم</th><th>الجهاز</th><th>الصفحة</th></tr></thead>
              <tbody>
                {events.map((e:any)=> {
                  const dev = (e.properties?.uaBrand? (e.properties.uaBrand+' ') : '') + (e.os||'') + (e.browser? ' · '+e.browser:'');
                  return (
                    <tr key={e.id}>
                      <td>{new Date(e.createdAt).toLocaleTimeString()}</td>
                      <td>{e.name}</td>
                      <td>{e.userId || e.anonymousId || 'زائر'}</td>
                      <td>{dev||'-'}</td>
                      <td style={{ maxWidth:340, overflow:'hidden', textOverflow:'ellipsis', direction:'ltr' }}>{e.pageUrl || '-'}</td>
                    </tr>
                  );
                })}
                {!events.length && !busy && (<tr><td colSpan={4} style={{ color:'var(--sub)' }}>لا توجد بيانات</td></tr>)}
              </tbody>
            </table>
          </div>
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


