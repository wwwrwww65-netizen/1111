"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";
import { FilterBar, type AnalyticsFilters } from "./components/FilterBar";
import { AnalyticsNav } from "./components/AnalyticsNav";
import { safeFetchJson, errorView, buildUrl } from "../lib/http";

export default function AnalyticsPage(): JSX.Element {
  const [kpis, setKpis] = React.useState<any>({});
  const [prevKpis, setPrevKpis] = React.useState<any>({});
  const [from, setFrom] = React.useState<string>(new Date(Date.now()-7*24*3600*1000).toISOString().slice(0,10));
  const [to, setTo] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [utm, setUtm] = React.useState<Array<{source?:string;medium?:string;campaign?:string;count:number}>>([]);
  const [reports, setReports] = React.useState<Array<{name:string;updatedAt:string;config:any}>>([]);
  const [reportName, setReportName] = React.useState<string>("");
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [filters, setFilters] = React.useState<AnalyticsFilters>({ granularity:'day' });
  const [err, setErr] = React.useState<string>('');
  const [busy, setBusy] = React.useState(false);
  const [sessions, setSessions] = React.useState<Array<{ startedAt:string; visitor:string; device:string; pageUrl:string; referrer?:string; utm_source?:string; country?:string; durationSec:number; sid?:string }>>([]);
  async function loadKpis(cur?: { from?: string; to?: string }){
    setBusy(true); setErr('');
    const url = buildUrl(`${apiBase}/api/admin/analytics`, { from: cur?.from, to: cur?.to });
    const r = await safeFetchJson<{ kpis:any }>(url);
    if (r.ok) {
      setKpis(r.data?.kpis||{});
      try{
        if (cur?.from && cur?.to){
          const start = new Date(cur.from); const end = new Date(cur.to);
          const span = end.getTime() - start.getTime();
          const prevFrom = new Date(start.getTime() - span).toISOString();
          const prevTo = start.toISOString();
          const pr = await safeFetchJson<{ kpis:any }>(buildUrl(`${apiBase}/api/admin/analytics`, { from: prevFrom, to: prevTo }));
          if (pr.ok) setPrevKpis(pr.data?.kpis||{}); else setPrevKpis({});
        }
      } catch {}
    } else setErr(r.message||'failed');
    setBusy(false);
  }
  React.useEffect(()=>{ loadKpis({ from: filters.from, to: filters.to }).catch(()=>{}); },[apiBase]);
  async function loadUtm(){
    const url = buildUrl(`${apiBase}/api/admin/analytics/utm`, { from, to });
    const r = await safeFetchJson<{ items:any[] }>(url);
    if (r.ok) setUtm((r.data?.items||[]).map((x:any)=> ({ source:x.source, medium:x.medium, campaign:x.campaign, count:x.cnt })));
  }
  async function loadReports(){
    const r = await safeFetchJson<{ reports:any[] }>(`${apiBase}/api/admin/analytics/reports`);
    if (r.ok) setReports(r.data?.reports||[]);
  }
  React.useEffect(()=>{ loadUtm().catch(()=>{}); loadReports().catch(()=>{}); },[apiBase]);
  async function saveReport(){
    const cfg = { from, to, filters };
    const r = await fetch(`${apiBase}/api/admin/analytics/reports`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ name: reportName||`r_${Date.now()}`, config: cfg }) });
    if (r.ok) { setReportName(""); await loadReports(); }
  }
  async function applyReport(r:any){ const cfg = r?.config||{}; if (cfg.from) setFrom(String(cfg.from).slice(0,10)); if (cfg.to) setTo(String(cfg.to).slice(0,10)); if (cfg.filters) setFilters(cfg.filters); await Promise.all([loadKpis({ from: cfg.from, to: cfg.to }), loadUtm()]); }
  async function loadSessionsToday(){
    try{
      const rec = await safeFetchJson<{ events:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/events/recent`, { limit: 500 }));
      if (!rec.ok) { setSessions([]); return; }
      const today = new Date().toISOString().slice(0,10);
      const ev = (rec.data?.events||[]).filter((e:any)=> String(e.createdAt||'').slice(0,10)===today);
      const bySid = new Map<string, any[]>();
      for (const e of ev){ const sid = e.sessionId || e.anonymousId || 'guest'; if (!bySid.has(sid)) bySid.set(sid, []); bySid.get(sid)!.push(e); }
      const rows: Array<{ startedAt:string; visitor:string; device:string; pageUrl:string; referrer?:string; utm_source?:string; country?:string; durationSec:number; sid?:string }> = [];
      for (const [sid, list] of bySid.entries()){
        const sorted = list.sort((a:any,b:any)=> new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());
        const first = sorted[0]; const last = sorted[sorted.length-1];
        const durationSec = Math.max(0, Math.round((new Date(last.createdAt).getTime()-new Date(first.createdAt).getTime())/1000));
        rows.push({
          startedAt: first.createdAt,
          visitor: first.userId? 'User' : 'Guest',
          device: ((first.properties?.uaBrand? first.properties.uaBrand+' ' : '') + (first.os||'') + (first.browser? ' · '+first.browser:'')) || '-',
          pageUrl: first.pageUrl || '-',
          referrer: first.referrer || '',
          utm_source: first.properties?.utm_source || '',
          country: first.country || '',
          durationSec, sid
        });
      }
      rows.sort((a,b)=> new Date(b.startedAt).getTime()-new Date(a.startedAt).getTime());
      setSessions(rows.slice(0,200));
    }catch{ setSessions([]); }
  }
  function exportSessionsCsv(){
    const lines = [
      ['timestamp','visitor','device','page','referrer','utm_source','country','session_duration_sec'],
      ...sessions.map(s=> [String(s.startedAt).slice(0,19).replace('T',' '), s.visitor, s.device, s.pageUrl, s.referrer||'', s.utm_source||'', s.country||'', String(s.durationSec)])
    ];
    const csv = lines.map(r=> r.map(v=> /[",\n]/.test(String(v))? '"'+String(v).replace(/"/g,'""')+'"' : String(v)).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `sessions_${new Date().toISOString().slice(0,10)}.csv`; a.click(); setTimeout(()=> URL.revokeObjectURL(a.href), 1500);
  }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>التحليلات</h1>
      <AnalyticsNav />
      <FilterBar value={filters} onChange={setFilters} onApply={()=>{ loadKpis({ from: filters.from, to: filters.to }); loadUtm(); }} />
      {err && errorView(err, ()=> loadKpis({ from: filters.from, to: filters.to }))}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12 }}>
        <Card label="الزوار اليوم" value={kpis.usersActive ?? (busy?'…':'-')} delta={deltaPct(kpis.usersActive, prevKpis.usersActive)} />
        <Card label="الجلسات" value={kpis.sessions ?? (busy?'…':'-')} delta={deltaPct(kpis.sessions, prevKpis.sessions)} />
        <Card label="مشاهدات الصفحات" value={kpis.pageViews ?? (busy?'…':'-')} delta={deltaPct(kpis.pageViews, prevKpis.pageViews)} />
        <Card label="طلبات اليوم" value={kpis.orders ?? (busy?'…':'-')} delta={deltaPct(kpis.orders, prevKpis.orders)} />
        <Card label="إيراد اليوم" value={kpis.revenue ?? (busy?'…':'-')} delta={deltaPct(kpis.revenue, prevKpis.revenue)} />
        <Card label="معدل التحويل" value={kpis.conversionRate ?? (busy?'…':'-')} />
      </div>
      <div style={{ marginTop:16, display:'grid', gap:10 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <label>من<input type="date" value={from} onChange={e=> setFrom(e.target.value)} className="input" /></label>
          <label>إلى<input type="date" value={to} onChange={e=> setTo(e.target.value)} className="input" /></label>
          <button className="btn btn-outline" onClick={loadUtm}>تحديث UTM</button>
          <input placeholder="اسم التقرير" value={reportName} onChange={e=> setReportName(e.target.value)} className="input" />
          <button className="btn" onClick={saveReport}>حفظ كتقرير</button>
        </div>
        <div className="panel" style={{ padding:12 }}>
          <h3 style={{ marginTop:0 }}>ملخص UTM</h3>
          <div style={{ overflowX:'auto' }}>
            <table className="table"><thead><tr><th>المصدر</th><th>الوسيط</th><th>الحملة</th><th>العدد</th></tr></thead><tbody>
              {utm.map((u,idx)=> (<tr key={idx}><td>{u.source||'-'}</td><td>{u.medium||'-'}</td><td>{u.campaign||'-'}</td><td>{u.count}</td></tr>))}
              {!utm.length && (<tr><td colSpan={4}>لا بيانات</td></tr>)}
            </tbody></table>
          </div>
        </div>
        <div className="panel" style={{ padding:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ marginTop:0 }}>جلسات اليوم</h3>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-outline" onClick={loadSessionsToday}>تحديث</button>
              <button className="btn" onClick={exportSessionsCsv}>تصدير CSV</button>
            </div>
          </div>
          <div style={{ maxHeight: 360, overflowY:'auto' }}>
            <table className="table" role="table" aria-label="جلسات اليوم">
              <thead><tr><th>الوقت</th><th>الزائر</th><th>الجهاز</th><th>الصفحة</th><th>المُحيل</th><th>utm_source</th><th>الدولة</th><th>المدة</th><th></th></tr></thead>
              <tbody>
                {sessions.map((s)=> (
                  <tr key={`${s.sid}:${s.startedAt}`}>
                    <td>{new Date(s.startedAt).toLocaleTimeString()}</td>
                    <td>{s.visitor}</td>
                    <td>{s.device}</td>
                    <td style={{ maxWidth:320, overflow:'hidden', textOverflow:'ellipsis', direction:'ltr' }}>{s.pageUrl}</td>
                    <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', direction:'ltr' }}>{s.referrer||'-'}</td>
                    <td>{s.utm_source||'-'}</td>
                    <td>{s.country||'-'}</td>
                    <td>{formatSec(s.durationSec)}</td>
                    <td><a className="btn btn-sm btn-outline" href={`/analytics/users?sid=${encodeURIComponent(s.sid||'')}`}>View Session</a></td>
                  </tr>
                ))}
                {!sessions.length && (<tr><td colSpan={9} style={{ color:'var(--sub)' }}>لا توجد بيانات</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
        <HealthPanel apiBase={apiBase} />
        <div className="panel" style={{ padding:12 }}>
          <h3 style={{ marginTop:0 }}>إشارات سريعة</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
            <Spark label="اتجاه الطلبات" color="#22c55e" />
            <Spark label="اتجاه الإيراد" color="#0ea5e9" />
            <Spark label="مشاهدات الصفحات" color="#f59e0b" />
          </div>
        </div>
        <div className="panel" style={{ padding:12 }}>
          <h3 style={{ marginTop:0 }}>تقارير محفوظة</h3>
          <div style={{ display:'grid', gap:8 }}>
            {reports.length? reports.map((r:any)=> (
              <div key={r.name} style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div style={{ flex:1 }}><b>{r.name}</b> <span style={{ color:'#94a3b8' }}>{String(r.updatedAt).slice(0,19).replace('T',' ')}</span></div>
                <button className="btn btn-sm" onClick={()=> applyReport(r)}>تطبيق</button>
                <button className="btn btn-sm btn-outline" onClick={async()=>{ await fetch(`${apiBase}/api/admin/analytics/reports/${encodeURIComponent(r.name)}`, { method:'DELETE', credentials:'include' }); await loadReports(); }}>حذف</button>
              </div>
            )): (<div style={{ color:'#94a3b8' }}>لا توجد تقارير محفوظة</div>)}
          </div>
        </div>
      </div>
    </main>
  );
}

function Card({ label, value, delta }: { label: string; value: any; delta?: string }): JSX.Element {
  return (
    <div style={{ background:'#0f1420', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
      <div style={{ color:'#94a3b8', marginBottom:8 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
        <div style={{ fontSize:24, fontWeight:700 }}>{value}</div>
        {delta!=null && <span style={{ fontSize:12, color: String(delta).startsWith('+')? '#22c55e':'#ef4444' }}>{delta}</span>}
      </div>
    </div>
  );
}

function Spark({ label, color }: { label:string; color:string }): JSX.Element {
  const ref = React.useRef<HTMLDivElement|null>(null);
  const [data, setData] = React.useState<number[]>([]);
  const chartRef = React.useRef<any>(null);
  React.useEffect(()=>{
    // simple synthetic sparkline for now (can be replaced with real endpoint)
    const arr = Array.from({ length: 20 }, ()=> Math.round(Math.random()*100));
    setData(arr);
  },[]);
  React.useEffect(()=>{
    let disposed = false; async function ensure(){
      if (!ref.current) return;
      const { ensureEcharts } = await import("../lib/echarts");
      if (disposed) return;
      const echarts = await ensureEcharts(); const chart = echarts.init(ref.current);
      chartRef.current = chart;
      chart.setOption({ backgroundColor:'transparent', grid:{ left:0, right:0, top:10, bottom:0 }, xAxis:{ type:'category', show:false, data: data.map((_,i)=> i) }, yAxis:{ type:'value', show:false }, series:[ { type:'line', data, smooth:true, symbol:'none', lineStyle:{ color }, areaStyle:{ color, opacity:0.12 } } ] });
    }
    ensure();
    return ()=> { disposed = true; try { chartRef.current && chartRef.current.dispose(); } catch {} };
  },[data, color]);
  return (
    <div>
      <div style={{ color:'var(--sub)', marginBottom:6 }}>{label}</div>
      <div ref={ref} style={{ width:'100%', height: 60 }} />
    </div>
  );
}

function HealthPanel({ apiBase }: { apiBase: string }): JSX.Element {
  const [rows, setRows] = React.useState<Array<{ name:string; latencyMs:number; ok:boolean; at:string }>>([]);
  const [busy, setBusy] = React.useState(false);
  async function run(){
    setBusy(true);
    const targets = [
      { name:'analytics', url: `${apiBase}/api/admin/analytics` },
      { name:'orders-series', url: `${apiBase}/api/admin/analytics/orders-series` },
      { name:'products-table', url: `${apiBase}/api/admin/analytics/products/table` },
      { name:'realtime', url: `${apiBase}/api/admin/analytics/realtime` }
    ];
    const out: Array<{ name:string; latencyMs:number; ok:boolean; at:string }> = [];
    for (const t of targets){
      const start = Date.now();
      try{
        const r = await fetch(t.url, { credentials:'include' });
        out.push({ name: t.name, latencyMs: Date.now()-start, ok: r.ok, at: new Date().toISOString() });
      } catch {
        out.push({ name: t.name, latencyMs: Date.now()-start, ok: false, at: new Date().toISOString() });
      }
    }
    setRows(out);
    setBusy(false);
  }
  return (
    <div className="panel" style={{ padding:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h3 style={{ marginTop:0 }}>Health & API Monitoring</h3>
        <button className="btn" onClick={run} disabled={busy}>Run smoke test</button>
      </div>
      <div style={{ display:'grid', gap:6 }}>
        {rows.map(r=> (
          <div key={r.name} style={{ display:'flex', gap:12, alignItems:'center' }}>
            <span className={`badge ${r.ok?'ok':'warn'}`}>{r.ok? 'OK':'Fail'}</span>
            <span style={{ minWidth:120 }}>{r.name}</span>
            <span style={{ color:'var(--sub)' }}>{r.latencyMs} ms</span>
            <span style={{ marginInlineStart:'auto', color:'var(--sub)', fontSize:12 }}>{r.at.slice(11,19)}</span>
          </div>
        ))}
        {!rows.length && <div style={{ color:'var(--sub)' }}>—</div>}
      </div>
    </div>
  );
}

function deltaPct(cur?: number, prev?: number): string|undefined {
  if (typeof cur!=='number' || typeof prev!=='number' || prev===0) return undefined;
  const pct = ((cur - prev)/prev)*100;
  return `${pct>=0? '+':''}${pct.toFixed(1)}%`;
}

function formatSec(s: number): string {
  const m = Math.floor(s/60); const ss = s%60;
  return `${m}m ${ss}s`;
}

