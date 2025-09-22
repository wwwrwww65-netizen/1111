"use client";
import React from 'react';
import { resolveApiBase } from '../lib/apiBase';

export default function FinanceDashboard(): JSX.Element {
  const apiBase = resolveApiBase();
  const [q, setQ] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [center, setCenter] = React.useState<'all'|'marketing'|'shipping'|'operations'|'development'>('all');
  const [kpi, setKpi] = React.useState<{revenue:number;expenses:number;profit:number;cash:number} | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/finance/summary`);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    if (center!=='all') url.searchParams.set('costCenter', center);
    if (q.trim()) url.searchParams.set('q', q.trim());
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setKpi({ revenue: j.revenue||0, expenses: j.expenses||0, profit: j.profit||0, cash: j.cash||0 });
    setBusy(false);
  }
  React.useEffect(()=>{ load().catch(()=> setBusy(false)); }, [apiBase, from, to, center]);

  function exportCsv(){
    const rows = [
      ['from','to','costCenter','revenue','expenses','profit','cash'],
      [from||'', to||'', center, String(kpi?.revenue||0), String(kpi?.expenses||0), String(kpi?.profit||0), String(kpi?.cash||0)]
    ];
    const csv = rows.map(r=> r.map(v=> /[",\n]/.test(String(v))? '"'+String(v).replace(/"/g,'""')+'"' : String(v)).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `finance_summary_${new Date().toISOString().slice(0,10)}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
  }

  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">المالية — لوحة تحكم</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <input className="input" placeholder="بحث" value={q} onChange={e=> setQ(e.target.value)} />
        <input className="input" type="date" value={from} onChange={e=> setFrom(e.target.value)} />
        <input className="input" type="date" value={to} onChange={e=> setTo(e.target.value)} />
        <select className="select" value={center} onChange={e=> setCenter(e.target.value as any)}>
          <option value="all">كل المراكز</option>
          <option value="marketing">التسويق</option>
          <option value="shipping">الشحن</option>
          <option value="operations">التشغيل</option>
          <option value="development">التطوير</option>
        </select>
        <button className="btn btn-sm" onClick={load} disabled={busy}>تحديث</button>
        <button className="btn btn-sm" onClick={exportCsv}>تصدير CSV</button>
      </div>
      <div className="grid cols-4 mt-3">
        <Kpi label="الإيرادات" value={kpi?.revenue||0} />
        <Kpi label="المصروفات" value={kpi?.expenses||0} />
        <Kpi label="الربح" value={kpi?.profit||0} />
        <Kpi label="النقدية" value={kpi?.cash||0} />
      </div>
      <div className="mt-4 text-sm" style={{color:'var(--sub)'}}>
        مخططات مبسطة ستظهر هنا (حسب بيانات الـ API).
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label:string; value:number }): JSX.Element {
  return (
    <div className="card">
      <div>{label}</div>
      <div className="text-2xl">{value.toFixed(2)}</div>
    </div>
  );
}

