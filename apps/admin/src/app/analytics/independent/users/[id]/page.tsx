"use client";
import React from "react";
import { resolveApiBase } from "../../../../lib/apiBase";
import { IndependentNav } from "../../components/IndependentNav";

export default function UserDetail({ params }: { params: { id: string } }): JSX.Element {
  const id = decodeURIComponent(params.id);
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [user, setUser] = React.useState<any>(null);
  const [events, setEvents] = React.useState<any[]>([]);
  const groups = React.useMemo(()=> {
    const by: Record<string, any[]> = {};
    for (const e of events){
      const k = String(e.sessionId||'unknown');
      (by[k] ||= []).push(e);
    }
    const entries = Object.entries(by).map(([sid, evs])=> ({ sid, evs }));
    entries.sort((a,b)=> {
      const at = a.evs[a.evs.length-1]?.createdAt || 0;
      const bt = b.evs[b.evs.length-1]?.createdAt || 0;
      return new Date(bt).getTime() - new Date(at).getTime();
    });
    return entries;
  }, [events]);
  function fmtSec(s:number){ const m=Math.floor(s/60); const ss=s%60; return `${m}m ${ss}s`; }
  async function load(){
    try{
      const r = await fetch(`${apiBase}/api/admin/analytics/ia/user/${encodeURIComponent(id)}`, { credentials:'include' });
      if (r.ok){ const j = await r.json(); setUser(j.user||null); setEvents(j.events||[]); }
    }catch{}
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[apiBase, id]);
  return (
    <main>
      <IndependentNav />
      <h1 style={{ marginBottom:12 }}>سجل المستخدم</h1>
      <div className="panel" style={{ padding:12, marginBottom:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:12 }}>
          <div><b>المعرف:</b> <span style={{ direction:'ltr' }}>{user?.id||id}</span></div>
          <div><b>الاسم:</b> <span>{user?.name||'-'}</span></div>
          <div><b>الهاتف:</b> <span>{user?.phone||'-'}</span></div>
          <div><b>البريد:</b> <span>{user?.email||'-'}</span></div>
        </div>
      </div>
      {groups.map(g=> (
        <div key={g.sid} className="panel" style={{ padding:12, marginBottom:12 }}>
          <h3 style={{ marginTop:0 }}>الجلسة: <span style={{ direction:'ltr' }}>{g.sid}</span></h3>
          <div style={{ overflowX:'auto' }}>
            <table className="table">
              <thead><tr><th>الوقت</th><th>الحدث</th><th>الصفحة</th><th>المُحيل</th><th>المدة</th><th>المنتج</th></tr></thead>
              <tbody>
                {g.evs.map((e:any, idx:number)=> {
                  const next = g.evs[idx+1]; const sec = next? Math.max(0, Math.round((new Date(next.createdAt).getTime()-new Date(e.createdAt).getTime())/1000)) : 0;
                  return (
                    <tr key={e.id}>
                      <td>{new Date(e.createdAt).toLocaleString()}</td>
                      <td>{e.name}</td>
                      <td style={{ maxWidth:320, overflow:'hidden', textOverflow:'ellipsis', direction:'ltr' }}>{e.pageUrl||'-'}</td>
                      <td style={{ maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', direction:'ltr' }}>{e.referrer||'-'}</td>
                      <td>{fmtSec(sec)}</td>
                      <td>{e.product? e.product.name : '-'}</td>
                    </tr>
                  );
                })}
                {!g.evs.length && <tr><td colSpan={6} style={{ color:'var(--sub)' }}>لا بيانات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </main>
  );
}


