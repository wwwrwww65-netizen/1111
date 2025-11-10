"use client";
import React from "react";
import { resolveApiBase } from "../../../lib/apiBase";
import { buildUrl, safeFetchJson } from "../../../lib/http";
import { IndependentNav } from "../components/IndependentNav";

function rangeToFromTo(v: string): { from: string; to: string } {
  const now = new Date(); const to = now.toISOString().slice(0,10);
  let days = 7; if (v==='today') days = 1; else if (v==='week') days = 7; else if (v==='month') days = 30; else if (v==='year') days = 365;
  const from = new Date(now.getTime() - (days*24*3600*1000)).toISOString().slice(0,10);
  return { from, to };
}

export default function VisitorsPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [rng, setRng] = React.useState<'today'|'week'|'month'|'year'>('week');
  const { from, to } = React.useMemo(()=> rangeToFromTo(rng), [rng]);
  const [rows, setRows] = React.useState<Array<{ sid:string; ip:string; referrer:string; country:string; city?:string; device:string; durationSec:number; firstSeenAt:string; lastSeenAt:string }>>([]);
  const nf = React.useMemo(()=> new Intl.NumberFormat('en-US'), []);
  function fmtSec(s:number){ const m = Math.floor(s/60); const ss = s%60; return `${m}m ${ss}s`; }
  async function load(){
    const r = await safeFetchJson<{ ok:boolean; visitors:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/ia/visitors`, { from, to, limit: 200 }));
    if (r.ok) setRows((r.data.visitors||[]).map((x:any)=> ({ sid:x.sid, ip:x.ip, referrer:x.referrer, country:x.country, city:x.city, device:x.device, durationSec:Number(x.durationSec||0), firstSeenAt:x.firstSeenAt, lastSeenAt:x.lastSeenAt })));
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[apiBase, from, to]);
  return (
    <main>
      <IndependentNav />
      <h1 style={{ marginBottom:12 }}>الزائرون</h1>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <select className="input" value={rng} onChange={e=> setRng(e.target.value as any)} style={{ width:180 }}>
          <option value="today">اليوم</option>
          <option value="week">الأسبوع</option>
          <option value="month">الشهر</option>
          <option value="year">السنة</option>
        </select>
        <button className="btn btn-outline" onClick={load}>تحديث</button>
      </div>
      <div className="panel" style={{ padding:12 }}>
        <div style={{ overflowX:'auto' }}>
          <table className="table">
            <thead><tr><th>IP</th><th>المعرف</th><th>المُحيل</th><th>الدولة - المدينة</th><th>الجهاز</th><th>مدة الجلسة</th><th>آخر نشاط</th><th></th></tr></thead>
            <tbody>
              {rows.map(r=> (
                <tr key={r.sid}>
                  <td style={{ direction:'ltr' }}>{r.ip||'-'}</td>
                  <td style={{ direction:'ltr' }}>{r.sid}</td>
                  <td style={{ maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', direction:'ltr' }}>{r.referrer||'-'}</td>
                  <td>{(r.country||'-') + (r.city? ` - ${r.city}`:'')}</td>
                  <td className="truncate" style={{ maxWidth:260 }}>{r.device||'-'}</td>
                  <td suppressHydrationWarning>{fmtSec(r.durationSec)}</td>
                  <td>{new Date(r.lastSeenAt).toLocaleString()}</td>
                  <td><a className="btn btn-sm" href={`/analytics/independent/visitors/${encodeURIComponent(r.sid)}`}>سجل الزائر</a></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={8} style={{ color:'var(--sub)' }}>لا بيانات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


