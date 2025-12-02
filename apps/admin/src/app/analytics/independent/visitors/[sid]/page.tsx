"use client";
import React from "react";
import { resolveApiBase } from "../../../../lib/apiBase";
import { useSearchParams } from "next/navigation";
import { buildUrl, safeFetchJson } from "../../../../lib/http";
import { IndependentNav } from "../../components/IndependentNav";

export default function VisitorDetail({ params }: { params: { sid: string } }): JSX.Element {
  const sid = decodeURIComponent(params.sid);
  const sp = useSearchParams();
  const pkey = sp?.get('pkey') || '';
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [summary, setSummary] = React.useState<any>(null);
  const [events, setEvents] = React.useState<any[]>([]);
  const groups = React.useMemo(()=> {
    const by: Record<string, any[]> = {};
    for (const e of events){
      const k = String(e.sessionId||sid||'unknown');
      (by[k] ||= []).push(e);
    }
    const entries = Object.entries(by).map(([k, evs])=> ({ sid:k, evs }));
    entries.sort((a,b)=> {
      const at = a.evs[a.evs.length-1]?.createdAt || 0;
      const bt = b.evs[b.evs.length-1]?.createdAt || 0;
      return new Date(bt).getTime() - new Date(at).getTime();
    });
    return entries;
  }, [events, sid]);
  function fmtSec(s:number){ const m = Math.floor(s/60); const ss = s%60; return `${m}m ${ss}s`; }
  async function load(){
    const url = pkey? `${apiBase}/api/admin/analytics/ia/visitor/${encodeURIComponent(sid)}?pkey=${encodeURIComponent(pkey)}` : `${apiBase}/api/admin/analytics/ia/visitor/${encodeURIComponent(sid)}`;
    const r = await safeFetchJson<{ ok:boolean; summary:any; events:any[] }>(url);
    if (r.ok){ setSummary(r.data.summary||null); setEvents(r.data.events||[]); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[apiBase, sid, pkey]);
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
      {groups.map(g=> (
        <div key={g.sid} className="panel" style={{ padding:12, marginBottom:12 }}>
          <h3 style={{ marginTop:0 }}>الجلسة: <span style={{ direction:'ltr' }}>{g.sid}</span></h3>
          <div style={{ overflowX:'auto' }}>
            <table className="table">
              <thead><tr><th>الوقت</th><th>الحدث</th><th>الصفحة</th><th>المُحيل</th><th>الجهاز</th><th>المدة</th><th>المنتج</th></tr></thead>
              <tbody>
                {g.evs.map((e:any, idx:number)=> {
                  const next = g.evs[idx+1]; const sec = next? Math.max(0, Math.round((new Date(next.createdAt).getTime() - new Date(e.createdAt).getTime())/1000)) : 0;
                  return (
                    <tr key={e.id}>
                      <td>{new Date(e.createdAt).toLocaleTimeString()}</td>
                      <td>{e.name}</td>
                      <td style={{ maxWidth:320, overflow:'hidden', textOverflow:'ellipsis', direction:'ltr' }}>{e.pageUrl||'-'}</td>
                      <td style={{ maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', direction:'ltr' }}>{e.referrer||'-'}</td>
                      <td className="truncate" style={{ maxWidth:240 }}>{e.device||'-'}</td>
                      <td>{fmtSec(Number(sec||0))}</td>
                      <td>
                        {e.product? (<div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          {Array.isArray(e.product.images) && e.product.images[0]? (<img src={e.product.images[0]} alt="" className="thumb" />) : null}
                          <span>{e.product.name}</span>
                        </div>) : '-'}
                      </td>
                    </tr>
                  );
                })}
                {!g.evs.length && <tr><td colSpan={7} style={{ color:'var(--sub)' }}>لا بيانات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </main>
  );
}


