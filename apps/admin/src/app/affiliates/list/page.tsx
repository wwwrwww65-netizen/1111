"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { downloadCsv } from '../../lib/csv';
import { exportToXlsx, exportToPdf } from '../../lib/export';

export default function AffiliatesListPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [rows, setRows] = React.useState<Array<{id:string;email:string;visits:number;sales:number;commission:number;payouts:number;status:string}>>([]);
  const [busy, setBusy] = React.useState(false);

  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/affiliates/list`);
    if (q.trim()) url.searchParams.set('q', q.trim());
    if (status) url.searchParams.set('status', status);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.affiliates||[]);
    setBusy(false);
  }
  React.useEffect(()=>{ load().catch(()=> setBusy(false)); }, [apiBase, q, status, from, to]);

  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">إدارة المسوّقين</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <input className="input" placeholder="بحث" value={q} onChange={e=> setQ(e.target.value)} />
        <select className="select" value={status} onChange={e=> setStatus(e.target.value)}>
          <option value="">الكل</option>
          <option value="ACTIVE">نشط</option>
          <option value="SUSPENDED">موقوف</option>
        </select>
        <input className="input" type="date" value={from} onChange={e=> setFrom(e.target.value)} />
        <input className="input" type="date" value={to} onChange={e=> setTo(e.target.value)} />
        <button className="btn btn-sm" onClick={load} disabled={busy}>تحديث</button>
        <button className="btn btn-sm" onClick={()=> downloadCsv(`affiliates_${new Date().toISOString().slice(0,10)}.csv`, [
          ['email','visits','sales','commission','payouts','status'],
          ...rows.map(r=> [r.email, r.visits, r.sales, r.commission, r.payouts, r.status])
        ])}>CSV</button>
        <button className="btn btn-sm btn-outline" onClick={()=> exportToXlsx(`affiliates_${new Date().toISOString().slice(0,10)}.xlsx`, ['email','visits','sales','commission','payouts','status'], rows.map(r=> [r.email, r.visits, r.sales, r.commission, r.payouts, r.status]))}>Excel</button>
        <button className="btn btn-sm btn-outline" onClick={()=> exportToPdf(`affiliates_${new Date().toISOString().slice(0,10)}.pdf`, ['email','visits','sales','commission','payouts','status'], rows.map(r=> [r.email, r.visits, r.sales, r.commission, r.payouts, r.status]))}>PDF</button>
      </div>
      <table className="table mt-3">
        <thead><tr><th>المسوّق</th><th>زيارات</th><th>مبيعات</th><th>عمولات</th><th>دفعات</th><th>الحالة</th></tr></thead>
        <tbody>
          {rows.length? rows.map(r=> (
            <tr key={r.id}><td>{r.email}</td><td>{r.visits}</td><td>{r.sales}</td><td>{r.commission}</td><td>{r.payouts}</td><td>{r.status}</td></tr>
          )): (<tr><td colSpan={6}>{busy? 'جارٍ التحميل…':'لا توجد بيانات'}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

