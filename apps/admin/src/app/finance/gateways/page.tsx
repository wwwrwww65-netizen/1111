"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function PaymentGatewaysPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [gateway, setGateway] = React.useState<string>('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [rows, setRows] = React.useState<Array<{at:string;gateway:string;amount:number;fee:number;status:string;settledAt?:string}> >([]);
  const [metrics, setMetrics] = React.useState<{gross:number;fees:number;net:number;settlementDelayDays?:number}|null>(null);
  const [busy, setBusy] = React.useState(false);
  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/finance/gateways/logs`);
    if (gateway) url.searchParams.set('gateway', gateway);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.logs||[]);
    const gross = (j.logs||[]).reduce((s:any,r:any)=> s + Number(r.amount||0), 0);
    const fees = (j.logs||[]).reduce((s:any,r:any)=> s + Number(r.fee||0), 0);
    const net = gross - fees;
    const delays: number[] = (j.logs||[]).filter((r:any)=> r.settledAt).map((r:any)=> Math.max(0, (new Date(r.settledAt).getTime()-new Date(r.at).getTime())/(24*3600*1000)));
    setMetrics({ gross, fees, net, settlementDelayDays: delays.length? Number((delays.reduce((a,b)=>a+b,0)/delays.length).toFixed(1)) : undefined });
    setBusy(false);
  }
  React.useEffect(()=>{ load().catch(()=> setBusy(false)); }, [apiBase, gateway, from, to]);
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">بوابات الدفع وسجلاتها</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <select className="select" value={gateway} onChange={e=> setGateway(e.target.value)}><option value="">بوابة: الكل</option><option value="STRIPE">Stripe</option><option value="PAYPAL">PayPal</option><option value="CASH_ON_DELIVERY">COD</option></select>
        <input className="input" type="date" value={from} onChange={e=> setFrom(e.target.value)} />
        <input className="input" type="date" value={to} onChange={e=> setTo(e.target.value)} />
        <button className="btn btn-sm" onClick={load} disabled={busy}>تحديث</button>
        <button className="btn btn-sm" onClick={()=>{
          const lines = [
            ['at','gateway','amount','fee','status','settledAt'],
            ...rows.map(r=> [r.at, r.gateway, String(r.amount), String(r.fee), r.status, r.settledAt||''])
          ];
          const csv = lines.map(r=> r.map(v=> /[",\n]/.test(String(v))? '"'+String(v).replace(/"/g,'""')+'"' : String(v)).join(',')).join('\n');
          const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `gateway_${gateway||'all'}_${new Date().toISOString().slice(0,10)}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
        }}>تصدير CSV</button>
      </div>
      {metrics && (
        <div className="grid cols-3 mt-3">
          <div className="card"><div>إجمالي الإيراد</div><div className="text-2xl">${metrics.gross.toFixed(2)}</div></div>
          <div className="card"><div>إجمالي الرسوم</div><div className="text-2xl">${metrics.fees.toFixed(2)}</div></div>
          <div className="card"><div>الصافي</div><div className="text-2xl">${metrics.net.toFixed(2)}</div></div>
        </div>
      )}
      {metrics?.settlementDelayDays!==undefined && metrics.settlementDelayDays>3 && (
        <div className="alert warn mt-2">تنبيه: متوسط تأخير التسوية {metrics.settlementDelayDays} يوم — يرجى المتابعة مع مزود الخدمة.</div>
      )}
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>الوقت</th><th>البوابة</th><th>المبلغ</th><th>الرسوم</th><th>الصافي</th><th>الحالة</th><th>تاريخ التسوية</th></tr></thead>
          <tbody>
            {rows.map((r,idx)=> (
              <tr key={idx}><td>{String(r.at).slice(0,19).replace('T',' ')}</td><td>{r.gateway}</td><td>{(r.amount||0).toFixed(2)}</td><td>{(r.fee||0).toFixed(2)}</td><td>{((r.amount||0)-(r.fee||0)).toFixed(2)}</td><td>{r.status}</td><td>{r.settledAt? String(r.settledAt).slice(0,10): '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

