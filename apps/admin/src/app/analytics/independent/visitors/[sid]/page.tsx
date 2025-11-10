"use client";
import React from "react";
import { resolveApiBase } from "../../../../lib/apiBase";
import { buildUrl, safeFetchJson } from "../../../../lib/http";
import { IndependentNav } from "../../components/IndependentNav";

export default function VisitorDetail({ params }: { params: { sid: string } }): JSX.Element {
  const sid = decodeURIComponent(params.sid);
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [summary, setSummary] = React.useState<any>(null);
  const [events, setEvents] = React.useState<any[]>([]);
  function fmtSec(s:number){ const m = Math.floor(s/60); const ss = s%60; return `${m}m ${ss}s`; }
  async function load(){
    const r = await safeFetchJson<{ ok:boolean; summary:any; events:any[] }>(`${apiBase}/api/admin/analytics/ia/visitor/${encodeURIComponent(sid)}`);
    if (r.ok){ setSummary(r.data.summary||null); setEvents(r.data.events||[]); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[apiBase, sid]);
  return (
    <main>
      <IndependentNav />
      <h1 style={{ marginBottom:12 }}>سجل الزائر</h1>
      <div className="panel" style={{ padding:12, marginBottom:12 }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <div><b>المعرف:</b> <span style={{ direction:'ltr' }}>{sid}</span></div>
          <div><b>بدأ:</b> <span>{summary?.startedAt? new Date(summary.startedAt).toLocaleString() : '-'}</span></div>
          <div><b>انتهى:</b> <span>{summary?.endedAt? new Date(summary.endedAt).toLocaleString() : '-'}</span></div>
          <div><b>مدة الجلسة:</b> <span>{summary? fmtSec(summary.durationSec||0) : '-'}</span></div>
        </div>
      </div>
      <div className="panel" style={{ padding:12 }}>
        <h3 style={{ marginTop:0 }}>الأحداث</h3>
        <div style={{ overflowX:'auto' }}>
          <table className="table">
            <thead><tr><th>الوقت</th><th>الحدث</th><th>الصفحة</th><th>المُحيل</th><th>الجهاز</th><th>المدة</th><th>المنتج</th></tr></thead>
            <tbody>
              {events.map((e:any)=> (
                <tr key={e.id}>
                  <td>{new Date(e.createdAt).toLocaleTimeString()}</td>
                  <td>{e.name}</td>
                  <td style={{ maxWidth:320, overflow:'hidden', textOverflow:'ellipsis', direction:'ltr' }}>{e.pageUrl||'-'}</td>
                  <td style={{ maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', direction:'ltr' }}>{e.referrer||'-'}</td>
                  <td className="truncate" style={{ maxWidth:240 }}>{e.device||'-'}</td>
                  <td>{fmtSec(Number(e.durationSec||0))}</td>
                  <td>
                    {e.product? (<div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {Array.isArray(e.product.images) && e.product.images[0]? (<img src={e.product.images[0]} alt="" className="thumb" />) : null}
                      <span>{e.product.name}</span>
                    </div>) : '-'}
                  </td>
                </tr>
              ))}
              {!events.length && <tr><td colSpan={7} style={{ color:'var(--sub)' }}>لا بيانات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


