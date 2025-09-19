"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function PnLPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [from, setFrom] = React.useState<string>('');
  const [to, setTo] = React.useState<string>('');
  const [data, setData] = React.useState<{revenues:number;expenses:number;profit:number}|null>(null);
  async function load(){
    const url = new URL(`${apiBase}/api/admin/finance/pnl`);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setData({ revenues: j.revenues||0, expenses: j.expenses||0, profit: j.profit||0 });
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase]);
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">قوائم الدخل / P&L</h1>
      <div className="toolbar">
        <input className="input" placeholder="من" type="date" value={from} onChange={e=> setFrom(e.target.value)} />
        <input className="input" placeholder="إلى" type="date" value={to} onChange={e=> setTo(e.target.value)} />
        <button className="btn btn-sm" onClick={load}>تحديث</button>
        <a className="btn btn-sm" href={`${apiBase}/api/admin/finance/pnl/export/csv`}>تصدير CSV</a>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>البند</th><th>القيمة</th></tr></thead>
          <tbody>
            <tr><td>المداخيل</td><td>${(data?.revenues||0).toFixed(2)}</td></tr>
            <tr><td>المصروفات</td><td>${(data?.expenses||0).toFixed(2)}</td></tr>
            <tr><td><b>الربح</b></td><td><b>${(data?.profit||0).toFixed(2)}</b></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

