"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function InvoicesPaymentsPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [status, setStatus] = React.useState<string>('');
  const [rows, setRows] = React.useState<Array<{number:string;orderId:string;customer:string;amount:number;status:string}>>([]);
  async function load(){
    const url = new URL(`${apiBase}/api/admin/finance/invoices`);
    if (status) url.searchParams.set('status', status);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.invoices||[]);
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase, status]);
  async function settle(orderId: string){
    await fetch(`${apiBase}/api/admin/finance/invoices/settle`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderId }) });
    await load();
  }
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">الفواتير والمدفوعات</h1>
      <div className="toolbar">
        <select className="select" value={status} onChange={e=> setStatus(e.target.value)}><option value="">الكل</option><option value="PAID">مدفوعة</option><option value="DUE">مستحقة</option></select>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>#</th><th>العميل</th><th>المبلغ</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {rows.map((r)=> (
              <tr key={r.orderId}><td>{r.number}</td><td>{r.customer}</td><td>${r.amount.toFixed(2)}</td><td>{r.status}</td><td><button className="btn btn-sm" onClick={()=> settle(r.orderId)}>تسوية</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

