"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function SuppliersLedgerPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [vendorId, setVendorId] = React.useState('');
  const [rows, setRows] = React.useState<Array<{date:string;description:string;debit:number;credit:number;balance:number}>>([]);
  async function load(){
    const url = new URL(`${apiBase}/api/admin/finance/suppliers-ledger`);
    if (vendorId) url.searchParams.set('vendorId', vendorId);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.ledger||[]);
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase, vendorId]);
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">حسابات الموردين — كشف حساب</h1>
      <div className="toolbar">
        <input className="input" placeholder="Vendor ID" value={vendorId} onChange={e=> setVendorId(e.target.value)} />
        <button className="btn btn-sm" onClick={load}>تحديث</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>التاريخ</th><th>الوصف</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead>
          <tbody>
            {rows.map((r,idx)=> (
              <tr key={idx}><td>{String(r.date).slice(0,10)}</td><td>{r.description}</td><td>${(r.debit||0).toFixed(2)}</td><td>${(r.credit||0).toFixed(2)}</td><td>${(r.balance||0).toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

