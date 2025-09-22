"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function ReturnsImpactPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [q, setQ] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [vendor, setVendor] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [rows, setRows] = React.useState<Array<{rma:string;orderId:string;customer?:string;vendorId?:string;amount:number;reason?:string;at:string;accountImpact:number}>>([]);
  const [busy, setBusy] = React.useState(false);

  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/finance/returns`);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    if (vendor.trim()) url.searchParams.set('vendorId', vendor.trim());
    if (reason.trim()) url.searchParams.set('reason', reason.trim());
    if (q.trim()) url.searchParams.set('q', q.trim());
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.items||[]);
    setBusy(false);
  }
  React.useEffect(()=>{ load().catch(()=> setBusy(false)); }, [apiBase, from, to, vendor, reason]);

  function exportCsv(){
    const lines = [
      ['rma','orderId','customer','vendorId','amount','reason','date','accountImpact'],
      ...rows.map(r=> [r.rma, r.orderId, r.customer||'', r.vendorId||'', String(r.amount), r.reason||'', String(r.at).slice(0,10), String(r.accountImpact)])
    ];
    const csv = lines.map(r=> r.map(v=> /[",\n]/.test(String(v))? '"'+String(v).replace(/"/g,'""')+'"' : String(v)).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `returns_impact_${new Date().toISOString().slice(0,10)}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
  }

  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">المرتجعات — الأثر المالي</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <input className="input" placeholder="بحث" value={q} onChange={e=> setQ(e.target.value)} />
        <input className="input" type="date" value={from} onChange={e=> setFrom(e.target.value)} />
        <input className="input" type="date" value={to} onChange={e=> setTo(e.target.value)} />
        <input className="input" placeholder="Vendor ID" value={vendor} onChange={e=> setVendor(e.target.value)} />
        <input className="input" placeholder="سبب المرتجع" value={reason} onChange={e=> setReason(e.target.value)} />
        <button className="btn btn-sm" onClick={load} disabled={busy}>تحديث</button>
        <button className="btn btn-sm" onClick={exportCsv}>تصدير CSV</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>رقم المرتجع</th><th>الطلب</th><th>العميل</th><th>المورد</th><th>المبلغ</th><th>السبب</th><th>التاريخ</th><th>أثر محاسبي</th></tr></thead>
          <tbody>
            {(rows.filter(r=> !q.trim() || (r.rma + r.orderId + (r.customer||'') + (r.vendorId||'') + (r.reason||'')).toLowerCase().includes(q.trim().toLowerCase()))).length ?
              rows.filter(r=> !q.trim() || (r.rma + r.orderId + (r.customer||'') + (r.vendorId||'') + (r.reason||'')).toLowerCase().includes(q.trim().toLowerCase())).map(r=> (
                <tr key={r.rma}><td>{r.rma}</td><td>{r.orderId}</td><td>{r.customer||'—'}</td><td>{r.vendorId||'—'}</td><td>{r.amount.toFixed(2)}</td><td>{r.reason||'—'}</td><td>{String(r.at).slice(0,10)}</td><td>{r.accountImpact.toFixed(2)}</td></tr>
              )) : (
                <tr><td colSpan={8}>{busy? 'جارٍ التحميل…' : 'لا توجد بيانات'}</td></tr>
              )
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

