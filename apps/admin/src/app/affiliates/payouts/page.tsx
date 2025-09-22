"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { downloadCsv } from '../../lib/csv';
import { exportToXlsx, exportToPdf } from '../../lib/export';

export default function AffiliatePayoutsPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [status, setStatus] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [rows, setRows] = React.useState<Array<{id:string;email:string;period:string;amount:number;status:string}>>([]);
  const [busy, setBusy] = React.useState(false);

  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/affiliates/payouts`);
    if (status) url.searchParams.set('status', status);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.payouts||[]);
    setBusy(false);
  }
  React.useEffect(()=>{ load().catch(()=> setBusy(false)); }, [apiBase, status, from, to]);

  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">تقارير المدفوعات للمسوّقين</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <select className="select" value={status} onChange={e=> setStatus(e.target.value)}><option value="">الكل</option><option value="PAID">مدفوع</option><option value="PENDING">معلّق</option></select>
        <input className="input" type="date" value={from} onChange={e=> setFrom(e.target.value)} />
        <input className="input" type="date" value={to} onChange={e=> setTo(e.target.value)} />
        <button className="btn btn-sm" onClick={load} disabled={busy}>تحديث</button>
        <button className="btn btn-sm" onClick={()=> downloadCsv(`affiliate_payouts_${new Date().toISOString().slice(0,10)}.csv`, [
          ['email','period','amount','status'],
          ...rows.map(r=> [r.email, r.period, r.amount, r.status])
        ])}>CSV</button>
        <button className="btn btn-sm btn-outline" onClick={()=> exportToXlsx(`affiliate_payouts_${new Date().toISOString().slice(0,10)}.xlsx`, ['email','period','amount','status'], rows.map(r=> [r.email, r.period, r.amount, r.status]))}>Excel</button>
        <button className="btn btn-sm btn-outline" onClick={()=> exportToPdf(`affiliate_payouts_${new Date().toISOString().slice(0,10)}.pdf`, ['email','period','amount','status'], rows.map(r=> [r.email, r.period, r.amount, r.status]))}>PDF</button>
      </div>
      <table className="table mt-3">
        <thead><tr><th>المسوّق</th><th>الفترة</th><th>المبلغ</th><th>الحالة</th></tr></thead>
        <tbody>
          {rows.length? rows.map(r=> (
            <tr key={r.id}><td>{r.email}</td><td>{r.period}</td><td>{r.amount.toFixed(2)}</td><td>{r.status}</td></tr>
          )): (<tr><td colSpan={4}>{busy? 'جارٍ التحميل…':'لا توجد بيانات'}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

