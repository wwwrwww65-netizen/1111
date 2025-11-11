"use client";
import React from "react";
import { resolveApiBase } from "../../../lib/apiBase";
import { buildUrl, safeFetchJson, errorView } from "../../../lib/http";
import { IndependentNav } from "../components/IndependentNav";

export default function UsersPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [rng, setRng] = React.useState<'today'|'week'|'month'|'year'>('month');
  const [rows, setRows] = React.useState<Array<{ id:string; name?:string; email?:string; phone?:string; sessions:number; lastSeen:string; country?:string; city?:string; ip?:string }>>([]);
  function toRange(v:string){ const now=new Date(); const to=now.toISOString().slice(0,10); let days=30; if(v==='today') days=1; else if(v==='week') days=7; else if(v==='year') days=365; const from=new Date(now.getTime()-days*24*3600*1000).toISOString().slice(0,10); return {from,to}; }
  const { from, to } = React.useMemo(()=> toRange(rng), [rng]);
  const [err, setErr] = React.useState<string>('');
  async function load(){
    const r = await safeFetchJson<{ ok:boolean; users:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/ia/users`, { from, to, limit: 200 }));
    if (r.ok) { setRows((r.data.users||[]).map((x:any)=> ({ id:x.id, name:x.name, email:x.email, phone:x.phone, sessions:Number(x.sessions||0), lastSeen:x.lastSeen, country:x.country, city:x.city, ip:x.ip }))); setErr(''); }
    else { setErr(r.message||'failed'); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[apiBase, from, to]);
  return (
    <main>
      <IndependentNav />
      <h1 style={{ marginBottom:12 }}>المستخدمون</h1>
      {!!err && errorView(err, ()=> load())}
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
            <thead><tr><th>المستخدم</th><th>الهاتف</th><th>البريد</th><th>IP</th><th>الدولة - المدينة</th><th>الجلسات</th><th>آخر ظهور</th><th></th></tr></thead>
            <tbody>
              {rows.map(r=> (
                <tr key={r.id}>
                  <td>{r.name||r.id}</td>
                  <td>{r.phone||'-'}</td>
                  <td>{r.email||'-'}</td>
                  <td style={{ direction:'ltr' }}>{r.ip||'-'}</td>
                  <td>{(r.country||'-') + (r.city? ` - ${r.city}`:'')}</td>
                  <td>{r.sessions}</td>
                  <td>{new Date(r.lastSeen).toLocaleString()}</td>
                  <td><a className="btn btn-sm" href={`/analytics/independent/users/${encodeURIComponent(r.id)}`}>سجل المستخدم</a></td>
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


