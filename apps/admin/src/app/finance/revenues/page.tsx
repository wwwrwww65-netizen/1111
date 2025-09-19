"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function RevenuesPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [rows, setRows] = React.useState<Array<{id:string;at:string;source:string;amount:number;orderId:string;status:string}>>([]);
  async function load(){
    const url = new URL(`${apiBase}/api/admin/finance/revenues`);
    url.searchParams.set('page','1'); url.searchParams.set('limit','50');
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.revenues||[]);
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase]);
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">إدارة المداخيل</h1>
      <div className="toolbar">
        <a className="btn btn-sm" href={`${apiBase}/api/admin/finance/revenues/export/csv`}>تصدير CSV</a>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>التاريخ</th><th>المصدر</th><th>المبلغ</th><th>الطلب</th><th>الحالة</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}><td>{String(r.at).slice(0,19).replace('T',' ')}</td><td>{r.source}</td><td>${r.amount.toFixed(2)}</td><td>{r.orderId}</td><td>{r.status}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

