"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { downloadCsv } from '../../lib/csv';

export default function PnLPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [from, setFrom] = React.useState<string>('');
  const [to, setTo] = React.useState<string>('');
  const [group, setGroup] = React.useState<'none'|'category'|'vendor'>('none');
  const [center, setCenter] = React.useState<'all'|'marketing'|'shipping'|'operations'|'development'>('all');
  const [data, setData] = React.useState<{revenues:number;expenses:number;profit:number}|null>(null);
  async function load(){
    const url = new URL(`${apiBase}/api/admin/finance/pnl`);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    if (group!=='none') url.searchParams.set('groupBy', group);
    if (center!=='all') url.searchParams.set('costCenter', center);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setData({ revenues: j.revenues||0, expenses: j.expenses||0, profit: j.profit||0 });
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase]);

  function exportCsv(){
    downloadCsv(`pnl_${new Date().toISOString().slice(0,10)}.csv`, [
      ['from','to','groupBy','costCenter','revenues','expenses','profit'],
      [from||'', to||'', group, center, String(data?.revenues||0), String(data?.expenses||0), String(data?.profit||0)]
    ]);
  }
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">قوائم الدخل / P&L</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <input className="input" placeholder="من" type="date" value={from} onChange={e=> setFrom(e.target.value)} />
        <input className="input" placeholder="إلى" type="date" value={to} onChange={e=> setTo(e.target.value)} />
        <select className="select" value={group} onChange={e=> setGroup(e.target.value as any)}>
          <option value="none">بدون تجميع</option>
          <option value="category">حسب التصنيف</option>
          <option value="vendor">حسب المورد</option>
        </select>
        <select className="select" value={center} onChange={e=> setCenter(e.target.value as any)}>
          <option value="all">كل المراكز</option>
          <option value="marketing">التسويق</option>
          <option value="shipping">الشحن</option>
          <option value="operations">التشغيل</option>
          <option value="development">التطوير</option>
        </select>
        <button className="btn btn-sm" onClick={load}>تحديث</button>
        <a className="btn btn-sm" href={`${apiBase}/api/admin/finance/pnl/export/csv?from=${from||''}&to=${to||''}&groupBy=${group!=='none'?group:''}&costCenter=${center!=='all'?center:''}`}>تصدير CSV (API)</a>
        <button className="btn btn-sm" onClick={exportCsv}>تصدير CSV (محلي)</button>
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

