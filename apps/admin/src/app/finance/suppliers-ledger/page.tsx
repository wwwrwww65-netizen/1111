"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { downloadCsv } from '../../lib/csv';

export default function SuppliersLedgerPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [vendorId, setVendorId] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [q, setQ] = React.useState('');
  const [rows, setRows] = React.useState<Array<{date:string;description:string;debit:number;credit:number;balance:number; ref?:string}>>([]);
  const [summary, setSummary] = React.useState<{opening:number;debits:number;credits:number;closing:number}|null>(null);
  const [busy, setBusy] = React.useState(false);
  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/finance/suppliers-ledger`);
    if (vendorId) url.searchParams.set('vendorId', vendorId);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    if (q.trim()) url.searchParams.set('q', q.trim());
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.ledger||[]);
    setSummary(j.summary||null);
    setBusy(false);
  }
  React.useEffect(()=>{ load().catch(()=> setBusy(false)); }, [apiBase, vendorId, from, to]);
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">حسابات الموردين — كشف حساب</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <input className="input" placeholder="Vendor ID" value={vendorId} onChange={e=> setVendorId(e.target.value)} />
        <input className="input" type="date" value={from} onChange={e=> setFrom(e.target.value)} />
        <input className="input" type="date" value={to} onChange={e=> setTo(e.target.value)} />
        <input className="input" placeholder="بحث" value={q} onChange={e=> setQ(e.target.value)} />
        <button className="btn btn-sm" onClick={load} disabled={busy}>تحديث</button>
        <button className="btn btn-sm" onClick={()=> downloadCsv(`vendor_ledger_${vendorId||'all'}_${new Date().toISOString().slice(0,10)}.csv`, [
            ['date','description','ref','debit','credit','balance'],
            ...rows.map(r=> [r.date, r.description, r.ref||'', String(r.debit), String(r.credit), String(r.balance)])
          ])
        }>تصدير CSV</button>
      </div>
      {summary && (
        <div className="grid cols-4 mt-3">
          <div className="card"><div>رصيد أول المدة</div><div className="text-2xl">{summary.opening.toFixed(2)}</div></div>
          <div className="card"><div>إجمالي مدين</div><div className="text-2xl">{summary.debits.toFixed(2)}</div></div>
          <div className="card"><div>إجمالي دائن</div><div className="text-2xl">{summary.credits.toFixed(2)}</div></div>
          <div className="card"><div>رصيد آخر المدة</div><div className="text-2xl">{summary.closing.toFixed(2)}</div></div>
        </div>
      )}
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>التاريخ</th><th>الوصف</th><th>مرجع</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead>
          <tbody>
            {rows.filter(r=> !q.trim() || (r.description + (r.ref||'')).toLowerCase().includes(q.trim().toLowerCase())).map((r,idx)=> (
              <tr key={idx}><td>{String(r.date).slice(0,10)}</td><td>{r.description}</td><td>{r.ref||'—'}</td><td>{(r.debit||0).toFixed(2)}</td><td>{(r.credit||0).toFixed(2)}</td><td>{(r.balance||0).toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

