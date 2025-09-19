"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function CashflowPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [windowDays, setWindowDays] = React.useState<string>('30');
  const [data, setData] = React.useState<{currentBalance:number;forecast30:number;duePayments:number}|null>(null);
  async function load(){
    const url = new URL(`${apiBase}/api/admin/finance/cashflow`);
    url.searchParams.set('window', windowDays||'30');
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setData({ currentBalance: j.currentBalance||0, forecast30: j.forecast30||0, duePayments: j.duePayments||0 });
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase]);
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">التدفق النقدي</h1>
      <div className="grid cols-3">
        <div className="card"><div>الرصيد الحالي</div><div className="text-2xl">${(data?.currentBalance||0).toFixed(2)}</div></div>
        <div className="card"><div>توقع 30 يوم</div><div className="text-2xl">${(data?.forecast30||0).toFixed(2)}</div></div>
        <div className="card"><div>دفعات مستحقة</div><div className="text-2xl">${(data?.duePayments||0).toFixed(2)}</div></div>
      </div>
      <div className="mt-3">
        <div className="toolbar">
          <button className="btn btn-sm" onClick={load}>تحديث</button>
          <select className="select" value={windowDays} onChange={e=> setWindowDays(e.target.value)}><option value="30">30 يوم</option><option value="60">60 يوم</option><option value="90">90 يوم</option></select>
        </div>
        <div className="mt-2 text-sm text-gray-400">(مخطط زمني هنا)</div>
      </div>
    </div>
  );
}

