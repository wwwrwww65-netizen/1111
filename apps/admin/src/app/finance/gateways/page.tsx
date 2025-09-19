"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function PaymentGatewaysPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [gateway, setGateway] = React.useState<string>('');
  const [rows, setRows] = React.useState<Array<{at:string;gateway:string;amount:number;fee:string;status:string}>>([]);
  async function load(){
    const url = new URL(`${apiBase}/api/admin/finance/gateways/logs`);
    if (gateway) url.searchParams.set('gateway', gateway);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.logs||[]);
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase, gateway]);
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">بوابات الدفع وسجلاتها</h1>
      <div className="toolbar">
        <select className="select" value={gateway} onChange={e=> setGateway(e.target.value)}><option value="">بوابة: الكل</option><option value="STRIPE">Stripe</option><option value="PAYPAL">PayPal</option><option value="CASH_ON_DELIVERY">COD</option></select>
        <button className="btn btn-sm" onClick={load}>تحديث</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>الوقت</th><th>البوابة</th><th>المبلغ</th><th>الرسوم</th><th>الحالة</th></tr></thead>
          <tbody>
            {rows.map((r,idx)=> (
              <tr key={idx}><td>{String(r.at).slice(0,19).replace('T',' ')}</td><td>{r.gateway}</td><td>${(r.amount||0).toFixed(2)}</td><td>${r.fee}</td><td>{r.status}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

