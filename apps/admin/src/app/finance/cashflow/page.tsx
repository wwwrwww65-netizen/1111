"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { downloadCsv } from '../../lib/csv';

export default function CashflowPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [windowDays, setWindowDays] = React.useState<string>('30');
  const [scenario, setScenario] = React.useState<'base'|'optimistic'|'pessimistic'>('base');
  const [center, setCenter] = React.useState<'all'|'marketing'|'shipping'|'operations'|'development'>('all');
  const [data, setData] = React.useState<{currentBalance:number;forecast30:number;duePayments:number}|null>(null);
  const [busy, setBusy] = React.useState(false);
  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/finance/cashflow`);
    url.searchParams.set('window', windowDays||'30');
    if (center!=='all') url.searchParams.set('costCenter', center);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setData({ currentBalance: j.currentBalance||0, forecast30: j.forecast30||0, duePayments: j.duePayments||0 });
    setBusy(false);
  }
  React.useEffect(()=>{ load().catch(()=>setBusy(false)); }, [apiBase, windowDays, center]);

  function adjustedForecast(): number {
    const f = data?.forecast30||0;
    if (scenario==='optimistic') return f * 1.1;
    if (scenario==='pessimistic') return f * 0.9;
    return f;
  }

  function exportCsv(){
    downloadCsv(`cashflow_${new Date().toISOString().slice(0,10)}.csv`, [
      ['windowDays','scenario','currentBalance','forecast30','duePayments','costCenter'],
      [windowDays, scenario, String(data?.currentBalance||0), String(adjustedForecast()), String(data?.duePayments||0), center]
    ]);
  }
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">التدفق النقدي</h1>
      <div className="grid cols-3">
        <div className="card"><div>الرصيد الحالي</div><div className="text-2xl">${(data?.currentBalance||0).toFixed(2)}</div></div>
        <div className="card"><div>توقع 30 يوم ({scenario})</div><div className="text-2xl">${adjustedForecast().toFixed(2)}</div></div>
        <div className="card"><div>دفعات مستحقة</div><div className="text-2xl">${(data?.duePayments||0).toFixed(2)}</div></div>
      </div>
      <div className="mt-3">
        <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <button className="btn btn-sm" onClick={load} disabled={busy}>تحديث</button>
          <select className="select" value={windowDays} onChange={e=> setWindowDays(e.target.value)}><option value="30">30 يوم</option><option value="60">60 يوم</option><option value="90">90 يوم</option></select>
          <select className="select" value={scenario} onChange={e=> setScenario(e.target.value as any)}>
            <option value="base">أساسي</option>
            <option value="optimistic">متفائل</option>
            <option value="pessimistic">متحفظ</option>
          </select>
          <select className="select" value={center} onChange={e=> setCenter(e.target.value as any)}>
            <option value="all">كل المراكز</option>
            <option value="marketing">التسويق</option>
            <option value="shipping">الشحن</option>
            <option value="operations">التشغيل</option>
            <option value="development">التطوير</option>
          </select>
          <button className="btn btn-sm" onClick={exportCsv}>تصدير CSV</button>
        </div>
        <div className="mt-2 text-sm text-gray-400">(مخطط زمني — سيتم ربطه ببيانات الـ API)</div>
      </div>
    </div>
  );
}

