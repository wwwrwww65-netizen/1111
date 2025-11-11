"use client";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";
import { buildUrl, safeFetchJson } from "../../lib/http";
import { IndependentNav } from "./components/IndependentNav";

type KPIs = {
  visitors: number;              // إجمالي عبر كل الزمن (للتوافق)
  distinctVisitors?: number;     // الأشخاص الفريدون ضمن المدة
  visitorsWindow?: number;       // alias backend
  views: number;
  sessions: number;
  avgSessionDurationSec: number;
  bounceRate: number; // 0..1
  viewsPerSession: number;
};

type Point = { day: string; visitors: number; views: number; sessions: number };

export default function IndependentAnalyticsPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [preset, setPreset] = React.useState<"today"|"7d"|"30d"|"90d"|"custom">("30d");
  const [customFrom, setCustomFrom] = React.useState<string>(new Date(Date.now()-7*24*3600*1000).toISOString().slice(0,10));
  const [customTo, setCustomTo] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [pages, setPages] = React.useState<Array<{ name:string; url:string; views:number; sessions:number }>>([]);
  const [referrers, setReferrers] = React.useState<Array<{ ref:string; views:number }>>([]);
  const [countries, setCountries] = React.useState<Array<{ country:string; views:number }>>([]);
  const [devices, setDevices] = React.useState<Array<{ device:string; views:number }>>([]);
  const [rt, setRt] = React.useState<{ windowMin:number; online:number; metrics:Record<string, number> }>({ windowMin:5, online:0, metrics:{} });
  const [rtAuto, setRtAuto] = React.useState<boolean>(true);
  const [from, to] = React.useMemo(()=>{
    if (preset === "custom") {
      return [customFrom, customTo] as const;
    }
    const now = new Date();
    const days = preset==="today"? 1 : preset==="7d"? 7 : preset==="30d"? 30 : 90;
    const start = new Date(now.getTime() - days*24*3600*1000);
    return [start.toISOString().slice(0,10), now.toISOString().slice(0,10)] as const;
  },[preset, customFrom, customTo]);
  const [kpis, setKpis] = React.useState<KPIs|null>(null);
  const [prevKpis, setPrevKpis] = React.useState<KPIs|null>(null);
  const [series, setSeries] = React.useState<Point[]>([]);
  const [showStats, setShowStats] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const chartRef = React.useRef<HTMLDivElement|null>(null);
  const echartsRef = React.useRef<any>(null);
  const [utm, setUtm] = React.useState<Array<{ source?:string; medium?:string; campaign?:string; count:number }>>([]);
  const nf = React.useMemo(()=> new Intl.NumberFormat('en-US'), []);
  const num = (n:number)=> nf.format(Number(n||0));

  async function loadRealtime(opts?: { windowMin?: number }){
    const q = { windowMin: String(opts?.windowMin ?? rt.windowMin) };
    const r = await safeFetchJson<{ ok:boolean; windowMin:number; online:number; metrics:Record<string, number> }>(buildUrl(`${apiBase}/api/admin/analytics/realtime`, q));
    if (r.ok) setRt({ windowMin: r.data.windowMin, online: r.data.online, metrics: r.data.metrics||{} });
  }
  React.useEffect(()=>{
    let t: any;
    if (rtAuto){
      t = setInterval(()=> { loadRealtime().catch(()=>{}); }, 8000);
    }
    loadRealtime().catch(()=>{});
    return ()=> { if (t) clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, rt.windowMin, rtAuto]);

  async function loadAll(){
    setBusy(true);
    try{
      // previous period range (same span immediately قبل الفترة)
      const start = new Date(from);
      const end = new Date(to);
      const spanMs = Math.max(0, end.getTime() - start.getTime()) || 24*3600*1000;
      const prevFrom = new Date(start.getTime() - spanMs).toISOString().slice(0,10);
      const prevTo = new Date(start.getTime()).toISOString().slice(0,10);

      const [kr, kprev, sr, pr, rr, gr, dr] = await Promise.all([
        safeFetchJson<{ ok:boolean; kpis:KPIs }>(buildUrl(`${apiBase}/api/admin/analytics/ia/kpis`, { from, to })),
        safeFetchJson<{ ok:boolean; kpis:KPIs }>(buildUrl(`${apiBase}/api/admin/analytics/ia/kpis`, { from: prevFrom, to: prevTo })),
        safeFetchJson<{ ok:boolean; series:Point[] }>(buildUrl(`${apiBase}/api/admin/analytics/ia/series`, { from, to })),
        safeFetchJson<{ ok:boolean; pages:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/ia/pages`, { from, to })),
        safeFetchJson<{ ok:boolean; referrers:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/ia/referrers`, { from, to })),
        safeFetchJson<{ ok:boolean; countries:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/ia/geo`, { from, to })),
        safeFetchJson<{ ok:boolean; devices:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/ia/devices`, { from, to }))
      ]);
      if (kr.ok) setKpis(kr.data.kpis);
      if (kprev.ok) setPrevKpis(kprev.data.kpis); else setPrevKpis(null);
      if (sr.ok) setSeries(sr.data.series);
      if (pr.ok) setPages(pr.data.pages?.map((r:any)=> ({ name: r.product?.name || (String(r.url||'').split('/').filter(Boolean).pop()||'-'), url:String(r.url||'-'), views:Number(r.views||0), sessions:Number(r.sessions||0) }))||[]);
      if (rr.ok) setReferrers(rr.data.referrers?.map((r:any)=> ({ ref:String(r.ref||'-'), views:Number(r.views||0) }))||[]);
      if (gr.ok) setCountries(gr.data.countries?.map((r:any)=> ({ country:String(r.country||'-'), views:Number(r.views||0) }))||[]);
      if (dr.ok) setDevices(dr.data.devices?.map((r:any)=> ({ device:String(r.device||'-'), views:Number(r.views||0) }))||[]);
    }finally{ setBusy(false); }
  }
  React.useEffect(()=>{ loadAll().catch(()=>{}); },[apiBase, from, to]);

  async function loadUtm(){
    const r = await safeFetchJson<{ ok:boolean; items:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/utm`, { from, to }));
    if (r.ok) setUtm((r.data.items||[]).map((x:any)=> ({ source:x.source, medium:x.medium, campaign:x.campaign, count: Number(x.cnt||x.count||0) })));
  }
  React.useEffect(()=>{ loadUtm().catch(()=>{}); },[apiBase, from, to]);

  React.useEffect(()=>{
    let disposed=false;
    async function mount(){
      if (!chartRef.current) return;
      if (!(window as any).echarts){
        await new Promise<void>((resolve)=>{ const s=document.createElement("script"); s.src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"; s.onload=()=> resolve(); document.body.appendChild(s); });
      }
      if (disposed) return;
      const echarts = (window as any).echarts;
      const chart = echarts.init(chartRef.current);
      echartsRef.current = chart;
      const days = series.map(p=> p.day);
      chart.setOption({
        backgroundColor:"transparent",
        tooltip:{ trigger:"axis" },
        legend:{ data:["الأشخاص","عدد الجلسات","المشاهدات"], textStyle:{ color:"#cbd5e1" } },
        grid:{ left:12, right:12, top:20, bottom:26 },
        xAxis:{ type:"category", data: days, axisLabel:{ color:"#94a3b8", rotate:0 } },
        yAxis:{ type:"value", axisLabel:{ color:"#94a3b8" }, splitLine:{ lineStyle:{ color:"rgba(148,163,184,0.12)" } } },
        series:[
          { name:"الأشخاص", type:"line", smooth:true, showSymbol:false, data: series.map(p=> (p as any).visitors ?? 0), lineStyle:{ color:"#22c55e", width:2 }, areaStyle:{ color:"#22c55e", opacity:0.10 } },
          { name:"عدد الجلسات", type:"line", smooth:true, showSymbol:false, data: series.map(p=> (p as any).sessions ?? 0), lineStyle:{ color:"#8b5cf6", width:2 }, areaStyle:{ color:"#8b5cf6", opacity:0.10 } },
          { name:"المشاهدات", type:"line", smooth:true, showSymbol:false, data: series.map(p=> p.views), lineStyle:{ color:"#f59e0b", width:2 }, areaStyle:{ color:"#f59e0b", opacity:0.08 } }
        ]
      });
    }
    mount();
    return ()=> { disposed=true; try{ echartsRef.current?.dispose?.(); }catch{} };
  },[series]);

  return (
    <main>
      <IndependentNav />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <h1 style={{ margin:0 }}>تحليلات مستقلة</h1>
        <div style={{ display:"flex", gap:8, alignItems:'center' }}>
          <select className="input" value={preset} onChange={e=> setPreset(e.target.value as any)}>
            <option value="today">اليوم</option>
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يومًا</option>
            <option value="90d">آخر 90 يومًا</option>
            <option value="custom">مخصص</option>
          </select>
          {preset==='custom' && (
            <>
              <input type="date" className="input" value={customFrom} onChange={e=> setCustomFrom(e.target.value)} />
              <span style={{ color:'var(--sub)' }}>إلى</span>
              <input type="date" className="input" value={customTo} onChange={e=> setCustomTo(e.target.value)} />
              <button className="btn btn-outline" onClick={()=> loadAll()}>تحديث</button>
            </>
          )}
          <button className="btn btn-outline" onClick={()=> setShowStats(s=> !s)}>تبديل عرض الإحصاءات</button>
          <button className="btn" disabled>حفظ كعرض…</button>
        </div>
      </div>

      {showStats && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12, marginBottom:12 }}>
          <Card
            label="الأشخاص"
            value={fmt(kpis?.distinctVisitors ?? (kpis?.visitorsWindow as any), busy)}
            delta={deltaDisplay(kpis?.distinctVisitors ?? (kpis?.visitorsWindow as any), prevKpis?.distinctVisitors ?? (prevKpis?.visitorsWindow as any), true)}
          />
          <Card
            label="المشاهدات"
            value={fmt(kpis?.views, busy)}
            delta={deltaDisplay(kpis?.views, prevKpis?.views, true)}
          />
          <Card
            label="عدد الجلسات"
            value={fmt(kpis?.sessions, busy)}
            delta={deltaDisplay(kpis?.sessions, prevKpis?.sessions, true)}
          />
          <Card
            label="متوسط مدة الجلسة"
            value={kpis? formatSec(kpis.avgSessionDurationSec): (busy? "…" : "-")}
            delta={deltaDisplay(kpis?.avgSessionDurationSec, prevKpis?.avgSessionDurationSec, true)}
          />
          <Card
            label="معدل الارتداد"
            value={kpis? `${Math.round(kpis.bounceRate*100)}%`: (busy? "…" : "-")}
            delta={deltaDisplay(kpis? kpis.bounceRate*100 : undefined, prevKpis? prevKpis.bounceRate*100 : undefined, false)}
          />
          <Card
            label="مشاهدات لكل جلسة"
            value={kpis? kpis.viewsPerSession.toFixed(2): (busy? "…" : "-")}
            delta={deltaDisplay(kpis?.viewsPerSession, prevKpis?.viewsPerSession, true)}
          />
        </div>
      )}

      <div className="panel" style={{ padding:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h3 style={{ marginTop:0 }}>الاتجاهات اليومية</h3>
          <span style={{ color:"var(--sub)" }}>{busy? "جار التحميل…" : ""}</span>
        </div>
        <div ref={chartRef} style={{ width:"100%", height:320 }} />
      </div>

      <div className="panel" style={{ padding:12, marginTop:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <h3 style={{ marginTop:0, marginBottom:0 }}>الزمن الحقيقي</h3>
          <span className="badge ok">المتصلون الآن: <b style={{ marginInlineStart:6 }} suppressHydrationWarning>{num(rt.online)}</b></span>
          <div style={{ marginInlineStart:'auto', display:'flex', alignItems:'center', gap:8 }}>
            <label className="form-label" style={{ margin:0 }}>النافذة (دقائق)</label>
            <select className="input" value={rt.windowMin} onChange={e=> setRt(s=> ({ ...s, windowMin: Number(e.target.value)||5 }))} style={{ width:96 }}>
              <option value={1}>1</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={30}>30</option>
            </select>
            <button className="btn btn-outline" onClick={()=> loadRealtime()} disabled={rtAuto}>تحديث</button>
            <label style={{ display:'inline-flex', alignItems:'center', gap:8, color:'var(--sub)' }}>
              <input type="checkbox" checked={rtAuto} onChange={e=> setRtAuto(e.target.checked)} /> تحديث تلقائي
            </label>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:10, marginTop:10 }}>
          {['page_view','add_to_cart','checkout','purchase'].map((k)=> (
            <div key={k} className="card">
              <div style={{ color:'var(--sub)', marginBottom:6 }}>{labelForRt(k)}</div>
              <div style={{ fontSize:22, fontWeight:700 }} suppressHydrationWarning>{num(Number(rt.metrics?.[k]||0))}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap:12, marginTop:12 }}>
        <div className="panel" style={{ padding:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ marginTop:0 }}>UTM / الحملات</h3>
            <button className="btn btn-outline" onClick={()=> loadUtm()}>تحديث</button>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table className="table">
              <thead><tr><th>utm_source</th><th>utm_medium</th><th>utm_campaign</th><th>العدد</th></tr></thead>
              <tbody>
                {utm.map((u,idx)=> (<tr key={idx}><td>{u.source||'-'}</td><td>{u.medium||'-'}</td><td>{u.campaign||'-'}</td><td>{u.count}</td></tr>))}
                {!utm.length && <tr><td colSpan={4} style={{color:'var(--sub)'}}>لا بيانات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel" style={{ padding:12 }}>
          <h3 style={{ marginTop:0 }}>أكثر الصفحات مشاهدة</h3>
          <div style={{ overflowX:'auto' }}>
            <table className="table">
              <thead><tr><th>الاسم</th><th>الرابط</th><th>المشاهدات</th><th>الجلسات</th></tr></thead>
              <tbody>
                {pages.map((p)=> (<tr key={p.url}>
                  <td className="truncate" style={{maxWidth:220}}>{p.name||'-'}</td>
                  <td style={{maxWidth:360, direction:'ltr'}} className="truncate"><a href={p.url||'#'} target="_blank" rel="noreferrer">{p.url||'-'}</a></td>
                  <td suppressHydrationWarning>{num(p.views)}</td>
                  <td suppressHydrationWarning>{num(p.sessions)}</td>
                </tr>))}
                {!pages.length && <tr><td colSpan={4} style={{color:'var(--sub)'}}>لا بيانات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel" style={{ padding:12 }}>
          <h3 style={{ marginTop:0 }}>أعلى المُحيلين</h3>
          <div style={{ overflowX:'auto' }}>
            <table className="table">
              <thead><tr><th>المُحيل</th><th>المشاهدات</th></tr></thead>
              <tbody>
                {referrers.map((r)=> (<tr key={r.ref}><td style={{maxWidth:320, direction:'ltr'}} className="truncate">{r.ref||'-'}</td><td suppressHydrationWarning>{num(r.views)}</td></tr>))}
                {!referrers.length && <tr><td colSpan={2} style={{color:'var(--sub)'}}>لا بيانات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel" style={{ padding:12 }}>
          <h3 style={{ marginTop:0 }}>الدول</h3>
          <div style={{ overflowX:'auto' }}>
            <table className="table">
              <thead><tr><th>الدولة</th><th>المشاهدات</th></tr></thead>
              <tbody>
                {countries.map((c)=> (<tr key={c.country}><td>{c.country||'-'}</td><td suppressHydrationWarning>{num(c.views)}</td></tr>))}
                {!countries.length && <tr><td colSpan={2} style={{color:'var(--sub)'}}>لا بيانات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel" style={{ padding:12, gridColumn:'1 / -1' }}>
          <h3 style={{ marginTop:0 }}>الأجهزة والمتصفحات</h3>
          <div style={{ overflowX:'auto' }}>
            <table className="table">
              <thead><tr><th>الجهاز</th><th>المشاهدات</th></tr></thead>
              <tbody>
                {devices.map((d)=> (<tr key={d.device}><td className="truncate" style={{maxWidth:280}}>{d.device||'-'}</td><td suppressHydrationWarning>{num(d.views)}</td></tr>))}
                {!devices.length && <tr><td colSpan={2} style={{color:'var(--sub)'}}>لا بيانات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function Card({ label, value, delta }: { label:string; value:any; delta?: { text:string; up?:boolean; color:string }|null }): JSX.Element {
  return (
    <div style={{ background:'#0f1420', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
      <div style={{ color:'#94a3b8', marginBottom:6 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
        <div style={{ fontSize:22, fontWeight:700 }}>{value}</div>
        {delta && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, color: delta.color }}>
            <span aria-hidden="true">{delta.up ? '▲' : '▼'}</span>
            <span>{delta.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function fmt(v?: number, busy?: boolean): string {
  if (typeof v === 'number') return new Intl.NumberFormat('en-US').format(v);
  return busy? '…' : '-';
}

function formatSec(s: number): string {
  const m = Math.floor(s/60);
  const ss = s%60;
  return `${m}:${String(ss).padStart(2,'0')}`;
}

function labelForRt(k: string): string {
  switch(k){
    case 'page_view': return 'مشاهدات الصفحات';
    case 'add_to_cart': return 'إضافات للسلة';
    case 'checkout': return 'بدء السداد';
    case 'purchase': return 'المشتريات';
    default: return k;
  }
}

function deltaDisplay(cur?: number, prev?: number, higherIsBetter: boolean = true): { text:string; up?:boolean; color:string }|null {
  if (typeof cur !== 'number' || typeof prev !== 'number') return null;
  const diff = cur - prev;
  const pct = prev === 0 ? (cur > 0 ? 100 : 0) : (diff / prev) * 100;
  const up = diff >= 0;
  const good = higherIsBetter ? up : !up;
  const color = good ? '#22c55e' : '#ef4444';
  const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
  const sign = diff >= 0 ? '+' : '';
  return { text: `${sign}${nf.format(diff)} (${sign}${nf.format(pct)}%)`, up, color };
}


