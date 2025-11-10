"use client";
import React from "react";
import { resolveApiBase } from "../../../lib/apiBase";
import { buildUrl, safeFetchJson } from "../../../lib/http";
import { IndependentNav } from "../components/IndependentNav";

export default function RealtimePage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [win, setWin] = React.useState(5);
  const [auto, setAuto] = React.useState(true);
  const [rt, setRt] = React.useState<{ windowMin:number; online:number; metrics:Record<string, number> }>({ windowMin:5, online:0, metrics:{} });
  const nf = React.useMemo(()=> new Intl.NumberFormat('en-US'), []);
  const fmt = (n:number)=> nf.format(Number(n||0));
  const [sessions, setSessions] = React.useState<Array<{ startedAt:string; visitor:string; device:string; pageUrl:string; referrer?:string; utm_source?:string; country?:string; city?:string; durationSec:number; sid?:string }>>([]);
  async function load(){
    const r = await safeFetchJson<{ ok:boolean; windowMin:number; online:number; metrics:Record<string, number> }>(buildUrl(`${apiBase}/api/admin/analytics/realtime`, { windowMin: String(win) }));
    if (r.ok) setRt({ windowMin:r.data.windowMin, online:r.data.online, metrics: r.data.metrics||{} });
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[apiBase, win]);
  React.useEffect(()=>{ let t:any; if (auto){ t=setInterval(()=> { load().catch(()=>{}); loadSessions().catch(()=>{}); }, 8000); } return ()=> t && clearInterval(t); },[auto]);
  async function loadSessions(){
    try{
      const rec = await safeFetchJson<{ events:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/events/recent`, { limit: 500 }));
      if (!rec.ok) { setSessions([]); return; }
      const ev = (rec.data?.events||[]);
      const bySid = new Map<string, any[]>();
      for (const e of ev){ const sid = e.sessionId || e.properties?.sessionId || e.anonymousId || 'guest'; if (!bySid.has(sid)) bySid.set(sid, []); bySid.get(sid)!.push(e); }
      const rows: Array<{ startedAt:string; visitor:string; device:string; pageUrl:string; referrer?:string; utm_source?:string; country?:string; city?:string; durationSec:number; sid?:string }> = [];
      for (const [sid, list] of bySid.entries()){
        const sorted = list.sort((a:any,b:any)=> new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());
        const first = sorted[0]; const last = sorted[sorted.length-1];
        const durationSec = Math.max(0, Math.round((new Date(last.createdAt).getTime()-new Date(first.createdAt).getTime())/1000));
        rows.push({
          startedAt: first.createdAt,
          visitor: first.userId? 'User' : 'Guest',
          device: ((first.properties?.uaBrand? first.properties.uaBrand+' ' : '') + (first.os||'') + (first.browser? ' · '+first.browser:'')) || '-',
          pageUrl: first.pageUrl || first.properties?.pageUrl || '-',
          referrer: first.referrer || first.properties?.referrer || '',
          utm_source: first.utmSource || first.properties?.utm_source || '',
          country: first.country || '',
          city: first.city || '',
          durationSec, sid
        });
      }
      rows.sort((a,b)=> new Date(b.startedAt).getTime()-new Date(a.startedAt).getTime());
      setSessions(rows.slice(0,200));
    }catch{ setSessions([]); }
  }
  React.useEffect(()=>{ loadSessions().catch(()=>{}); },[apiBase]);
  return (
    <main>
      <IndependentNav />
      <h1 style={{ marginBottom:12 }}>الزمن الحقيقي</h1>
      <div className="panel" style={{ padding:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span className="badge ok">المتصلون الآن: <b style={{ marginInlineStart:6 }} suppressHydrationWarning>{fmt(rt.online)}</b></span>
          <div style={{ marginInlineStart:'auto', display:'flex', alignItems:'center', gap:8 }}>
            <label className="form-label" style={{ margin:0 }}>النافذة</label>
            <select className="input" value={win} onChange={e=> setWin(Number(e.target.value)||5)} style={{ width:96 }}>
              <option value={1}>1 دقيقة</option>
              <option value={5}>5 دقائق</option>
              <option value={10}>10 دقائق</option>
              <option value={30}>30 دقيقة</option>
            </select>
            <button className="btn btn-outline" onClick={load} disabled={auto}>تحديث</button>
            <label style={{ display:'inline-flex', alignItems:'center', gap:8, color:'var(--sub)' }}>
              <input type="checkbox" checked={auto} onChange={e=> setAuto(e.target.checked)} /> تحديث تلقائي
            </label>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:10, marginTop:10 }}>
          {['page_view','add_to_cart','checkout','purchase'].map((k)=> (
            <div key={k} className="card">
              <div style={{ color:'var(--sub)', marginBottom:6 }}>{label(k)}</div>
              <div style={{ fontSize:22, fontWeight:700 }} suppressHydrationWarning>{fmt(Number(rt.metrics?.[k]||0))}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel" style={{ padding:12, marginTop:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ marginTop:0 }}>جلسات حية (آخر ما تم تسجيله)</h3>
          <button className="btn btn-outline" onClick={()=> loadSessions()}>تحديث</button>
        </div>
        <div style={{ maxHeight: 420, overflowY:'auto' }}>
          <table className="table" role="table" aria-label="الجلسات الحية">
            <thead><tr><th>الوقت</th><th>الزائر</th><th>الجهاز</th><th>الصفحة</th><th>المُحيل</th><th>utm_source</th><th>الدولة - المدينة</th><th>المدة</th></tr></thead>
            <tbody>
              {sessions.map((s)=> (
                <tr key={`${s.sid}:${s.startedAt}`}>
                  <td>{new Date(s.startedAt).toLocaleTimeString()}</td>
                  <td>{s.visitor}</td>
                  <td>{s.device}</td>
                  <td style={{ maxWidth:320, overflow:'hidden', textOverflow:'ellipsis', direction:'ltr' }}>{s.pageUrl}</td>
                  <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', direction:'ltr' }}>{s.referrer||'-'}</td>
                  <td>{s.utm_source||'-'}</td>
                  <td>{(s.country||'-') + (s.city? ` - ${s.city}`:'')}</td>
                  <td>{formatSec(s.durationSec)}</td>
                </tr>
              ))}
              {!sessions.length && (<tr><td colSpan={8} style={{ color:'var(--sub)' }}>لا توجد بيانات</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function label(k:string){ switch(k){ case 'page_view': return 'مشاهدات'; case 'add_to_cart': return 'إضافات للسلة'; case 'checkout': return 'بدء السداد'; case 'purchase': return 'مشتريات'; default: return k; } }
function formatSec(s: number): string { const m = Math.floor(s/60); const ss = s%60; return `${m}m ${ss}s`; }


