"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";
import { AnalyticsNav } from "../components/AnalyticsNav";
import { buildUrl, safeFetchJson, errorView } from "../../lib/http";

export default function UserExplorerPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [userId, setUserId] = React.useState('');
  const [events, setEvents] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  async function load(){
    setBusy(true); setErr('');
    try{
      const url = buildUrl(`${apiBase}/api/admin/analytics/events/recent`, { limit: 200, userId: userId.trim()||undefined });
      const r = await safeFetchJson<{ events:any[] }>(url);
      if (r.ok) setEvents(r.data?.events||[]); else { setEvents([]); setErr(r.message||'failed'); }
    } finally { setBusy(false); }
  }

  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <AnalyticsNav />
        <h1 style={{ marginTop:0 }}>مستكشف المستخدم</h1>
        {err && errorView(err)}
        <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
          <input className="input" placeholder="User ID" value={userId} onChange={(e)=> setUserId(e.target.value)} />
          <button className="btn" onClick={load} disabled={busy}>بحث</button>
        </div>
        <div style={{ marginTop:12, maxHeight: 420, overflowY:'auto' }}>
          <table className="table" role="table" aria-label="User Timeline">
            <thead><tr><th>الوقت</th><th>الحدث</th><th>الجلسة</th><th>الجهاز</th><th>الصفحة</th></tr></thead>
            <tbody>
              {events.map((e:any)=> {
                const dev = (e.properties?.uaBrand? (e.properties.uaBrand+' ') : '') + (e.os||'') + (e.browser? ' · '+e.browser:'');
                return (
                  <tr key={e.id}>
                    <td>{new Date(e.createdAt).toLocaleString()}</td>
                    <td>{e.name}</td>
                    <td>{e.sessionId||'-'}</td>
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
    </main>
  );
}


