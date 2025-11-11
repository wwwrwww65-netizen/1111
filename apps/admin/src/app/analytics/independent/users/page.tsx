"use client";
import React from "react";
import { resolveApiBase } from "../../../lib/apiBase";
import { buildUrl, safeFetchJson, errorView } from "../../../lib/http";
import { IndependentNav } from "../components/IndependentNav";

export default function UsersPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [rng, setRng] = React.useState<'today'|'week'|'month'|'year'|'custom'>('month');
  const [customFrom, setCustomFrom] = React.useState<string>(new Date(Date.now()-30*24*3600*1000).toISOString().slice(0,10));
  const [customTo, setCustomTo] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [rows, setRows] = React.useState<Array<{ id:string; name?:string; email?:string; phone?:string; sessions:number; lastSeen:string; country?:string; city?:string; ip?:string }>>([]);
  function toRange(v:string){ const now=new Date(); const to=now.toISOString().slice(0,10); let days=30; if(v==='today') days=1; else if(v==='week') days=7; else if(v==='year') days=365; const from=new Date(now.getTime()-days*24*3600*1000).toISOString().slice(0,10); return {from,to}; }
  const { from, to } = React.useMemo(()=> rng==='custom'? { from: customFrom, to: customTo } : toRange(rng), [rng, customFrom, customTo]);
  const [err, setErr] = React.useState<string>('');
  const [summary, setSummary] = React.useState<{ count:number; prevCount:number; sessions:number }|null>(null);
  async function load(){
    const [r, s] = await Promise.all([
      safeFetchJson<{ ok:boolean; users:any[] }>(buildUrl(`${apiBase}/api/admin/analytics/ia/users`, { from, to, limit: 200 })),
      safeFetchJson<{ ok:boolean; count:number; prevCount:number; sessions:number }>(buildUrl(`${apiBase}/api/admin/analytics/ia/users/summary`, { from, to })),
    ]);
    if (r.ok) { setRows((r.data.users||[]).map((x:any)=> ({ id:x.id, name:x.name, email:x.email, phone:x.phone, sessions:Number(x.sessions||0), lastSeen:x.lastSeen, country:x.country, city:x.city, ip:x.ip }))); setErr(''); }
    else { setErr(r.message||'failed'); }
    if (s.ok) setSummary({ count:s.data.count, prevCount:s.data.prevCount, sessions:s.data.sessions });
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
          <option value="custom">مخصص</option>
        </select>
        {rng==='custom' && (<>
          <input type="date" className="input" value={customFrom} onChange={e=> setCustomFrom(e.target.value)} />
          <span style={{ color:'var(--sub)' }}>إلى</span>
          <input type="date" className="input" value={customTo} onChange={e=> setCustomTo(e.target.value)} />
        </>)}
        <button className="btn btn-outline" onClick={load}>تحديث</button>
      </div>
      {summary && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:12, marginBottom:12 }}>
          <KpiCard label="عدد المستخدمين" value={new Intl.NumberFormat('en-US').format(summary.count)} prev={summary.prevCount} />
          <KpiCard label="عدد الجلسات" value={new Intl.NumberFormat('en-US').format(summary.sessions)} />
        </div>
      )}
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

function KpiCard({ label, value, prev }: { label:string; value:string; prev?: number }): JSX.Element {
  let deltaEl: React.ReactNode = null;
  if (typeof prev === 'number'){
    const curNum = Number(String(value).replace(/,/g,''))||0;
    const diff = curNum - prev;
    const pct = prev===0? (curNum>0? 100:0) : (diff/prev)*100;
    const up = diff>=0;
    deltaEl = (<div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, color: up? '#22c55e' : '#ef4444' }}>
      <span aria-hidden="true">{up? '▲':'▼'}</span>
      <span>{`${diff>=0? '+':''}${new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(diff)} (${diff>=0? '+':''}${new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(pct)}%)`}</span>
    </div>);
  }
  return (
    <div className="card" style={{ padding:16 }}>
      <div style={{ color:'var(--sub)', marginBottom:6 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
        <div style={{ fontSize:22, fontWeight:700 }}>{value}</div>
        {deltaEl}
      </div>
    </div>
  );
}


