"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { downloadCsv } from '../../lib/csv';

export default function LoyaltyPointsLogPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [rows, setRows] = React.useState<Array<{id:string;userId:string;points:number;reason:string;createdAt:string}>>([]);
  const [q, setQ] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  async function load(){
    const url = new URL(`${apiBase}/api/admin/points/log`);
    if (q.trim()) url.searchParams.set('q', q.trim());
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.entries||[]);
  }
  React.useEffect(()=>{ load().catch(()=> setRows([])); }, [apiBase, q, from, to]);
  function exportCsv(){
    downloadCsv(`points_log_${new Date().toISOString().slice(0,10)}.csv`, [
      ['id','userId','points','reason','createdAt'],
      ...rows.map(r=> [r.id, r.userId, String(r.points), r.reason||'', String(r.createdAt).slice(0,19).replace('T',' ')])
    ]);
  }
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">سجل معاملات النقاط</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <input className="input" placeholder="بحث: المستخدم/العملية" value={q} onChange={e=> setQ(e.target.value)} />
        <input className="input" type="date" value={from} onChange={e=> setFrom(e.target.value)} />
        <input className="input" type="date" value={to} onChange={e=> setTo(e.target.value)} />
        <button className="btn btn-sm" onClick={load}>تحديث</button>
        <button className="btn btn-sm" onClick={exportCsv}>تصدير CSV</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>التاريخ</th><th>المستخدم</th><th>التغير</th><th>السبب</th></tr></thead>
          <tbody>
            {rows.map(r=> (
              <tr key={r.id}><td>{new Date(r.createdAt).toLocaleString()}</td><td>{r.userId}</td><td>{r.points>0?`+${r.points}`:r.points}</td><td>{r.reason||'-'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

