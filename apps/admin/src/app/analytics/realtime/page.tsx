"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";
import { FilterBar, type AnalyticsFilters } from "../components/FilterBar";
import { AnalyticsNav } from "../components/AnalyticsNav";
import { buildUrl, safeFetchJson, errorView } from "../../lib/http";

export default function RealtimeAnalyticsPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [metrics, setMetrics] = React.useState<Record<string, number>>({});
  const [events, setEvents] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState(true);
  const [filters, setFilters] = React.useState<AnalyticsFilters>({});
  const [err, setErr] = React.useState('');
  const [windowMin, setWindowMin] = React.useState<5|15|60>(5);
  const [active, setActive] = React.useState<Array<{ sid:string; last:string; path:string[] }>>([]);
  const [pathView, setPathView] = React.useState<{ sid:string; steps:string[] }|null>(null);

  React.useEffect(()=>{
    let t: any;
    const load = async()=>{
      try{
        setErr('');
        const rtUrl = buildUrl(`${apiBase}/api/admin/analytics/realtime`, { device: filters.device, country: filters.country, channel: filters.channel, windowMin });
        const evUrl = buildUrl(`${apiBase}/api/admin/analytics/events/recent`, { limit: 200 });
        const [rt, rec] = await Promise.all([ safeFetchJson<{ metrics:Record<string,number> }>(rtUrl), safeFetchJson<{ events:any[] }>(evUrl) ]);
        if (!rt.ok) setErr(rt.message||'failed');
        if (!rec.ok) setErr(rec.message||'failed');
        const m = rt.ok? (rt.data?.metrics||{}) : {};
        setMetrics(m);
        const ev = rec.ok? (rec.data?.events||[]) : [];
        setEvents(ev);
        // derive active visitors in last N minutes
        const cutoff = Date.now() - windowMin*60*1000;
        const recent = ev.filter((e:any)=> new Date(e.createdAt).getTime() >= cutoff);
        const bySid = new Map<string, any[]>();
        for (const e of recent){ const sid = e.sessionId || e.anonymousId || 'guest'; if (!bySid.has(sid)) bySid.set(sid, []); bySid.get(sid)!.push(e); }
        const act: Array<{ sid:string; last:string; path:string[] }> = [];
        for (const [sid, list] of bySid.entries()){
          const sorted = list.sort((a:any,b:any)=> new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());
          act.push({ sid, last: sorted[sorted.length-1].createdAt, path: sorted.map((x:any)=> x.pageUrl).filter(Boolean) });
        }
        act.sort((a,b)=> new Date(b.last).getTime()-new Date(a.last).getTime());
        setActive(act);
      } finally { setBusy(false); }
    };
    load(); t = setInterval(load, 5000);
    return ()=> clearInterval(t);
  }, [apiBase, filters.device, filters.country, filters.channel, windowMin]);

  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <AnalyticsNav />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h1 style={{ margin:0 }}>الزمن الحقيقي</h1>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <select className="input" value={String(windowMin)} onChange={(e)=> setWindowMin(Number(e.target.value) as any)}>
              <option value="5">آخر 5 دقائق</option>
              <option value="15">آخر 15 دقيقة</option>
              <option value="60">آخر 60 دقيقة</option>
            </select>
            <span style={{ color:'var(--sub)', fontSize:12 }}>تحديث كل 5 ثوانٍ</span>
          </div>
        </div>
        {err && errorView(err)}
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
        <div style={{ marginTop:16 }}>
          <h3 style={{ marginTop:0 }}>الزوار النشطون</h3>
          <div style={{ maxHeight: 260, overflowY:'auto' }}>
            <table className="table" role="table" aria-label="Active Visitors">
              <thead><tr><th>آخر نشاط</th><th>المعرف</th><th>عدد الصفحات</th><th></th></tr></thead>
              <tbody>
                {active.map(a=> (
                  <tr key={a.sid}>
                    <td>{new Date(a.last).toLocaleTimeString()}</td>
                    <td>{a.sid || 'guest'}</td>
                    <td>{a.path.length}</td>
                    <td><button className="btn btn-sm btn-outline" onClick={()=> setPathView({ sid: a.sid, steps: a.path })}>عرض المسار</button></td>
                  </tr>
                ))}
                {!active.length && !busy && (<tr><td colSpan={4} style={{ color:'var(--sub)' }}>لا يوجد زوار نشطون</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {pathView && (
        <div className="modal" role="dialog" aria-modal onClick={()=> setPathView(null)}>
          <div className="dialog" onClick={(e)=> e.stopPropagation()}>
            <div className="title">مسار الجلسة</div>
            <div style={{ maxHeight: 360, overflowY:'auto', direction:'ltr' }}>
              <ol style={{ margin:0, paddingInlineStart: 18 }}>
                {pathView.steps.map((p,idx)=> (<li key={idx} style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p}</li>))}
              </ol>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
              <button className="btn" onClick={()=> setPathView(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
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


