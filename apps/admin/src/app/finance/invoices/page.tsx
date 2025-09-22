"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function InvoicesPaymentsPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [tab, setTab] = React.useState<'invoices'|'payments'|'schedule'|'reconcile'>('invoices');
  const [status, setStatus] = React.useState<string>('');
  const [q, setQ] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [method, setMethod] = React.useState('');
  const [center, setCenter] = React.useState<'all'|'marketing'|'shipping'|'operations'|'development'>('all');

  const [invoices, setInvoices] = React.useState<Array<{number:string;orderId:string;customer:string;amount:number;status:string; dueDate?:string}>[]>([] as any);
  const [payments, setPayments] = React.useState<Array<{id:string;orderId?:string;ref?:string;method:string;amount:number;at:string;note?:string}>>([]);
  const [schedule, setSchedule] = React.useState<Array<{id:string;orderId:string;dueDate:string;amount:number;status:string}>>([]);
  const [busy, setBusy] = React.useState(false);

  async function load(){
    setBusy(true);
    try {
      if (tab==='invoices'){
        const url = new URL(`${apiBase}/api/admin/finance/invoices`);
        if (status) url.searchParams.set('status', status);
        if (from) url.searchParams.set('from', from);
        if (to) url.searchParams.set('to', to);
        if (center!=='all') url.searchParams.set('costCenter', center);
        if (q.trim()) url.searchParams.set('q', q.trim());
        const j = await (await fetch(url.toString(), { credentials:'include' })).json();
        setInvoices(j.invoices||[]);
      } else if (tab==='payments'){
        const url = new URL(`${apiBase}/api/admin/finance/payments`);
        if (from) url.searchParams.set('from', from);
        if (to) url.searchParams.set('to', to);
        if (method) url.searchParams.set('method', method);
        if (q.trim()) url.searchParams.set('q', q.trim());
        const j = await (await fetch(url.toString(), { credentials:'include' })).json();
        setPayments(j.payments||[]);
      } else if (tab==='schedule'){
        const url = new URL(`${apiBase}/api/admin/finance/invoices/schedule`);
        if (from) url.searchParams.set('from', from);
        if (to) url.searchParams.set('to', to);
        const j = await (await fetch(url.toString(), { credentials:'include' })).json();
        setSchedule(j.schedule||[]);
      }
    } finally { setBusy(false); }
  }
  React.useEffect(()=>{ load().catch(()=>setBusy(false)); }, [apiBase, tab, status, from, to, method, center]);

  async function settle(orderId: string){
    await fetch(`${apiBase}/api/admin/finance/invoices/settle`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderId }) });
    await load();
  }

  const [showPay, setShowPay] = React.useState(false);
  const [payForm, setPayForm] = React.useState<{orderId:string;amount:string;method:string;ref?:string;at?:string;note?:string}>({ orderId:'', amount:'', method:'CASH' });
  async function submitPayment(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch(`${apiBase}/api/admin/finance/payments`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({
      orderId: payForm.orderId||undefined,
      amount: Number(payForm.amount||0),
      method: payForm.method,
      ref: payForm.ref||undefined,
      at: payForm.at||undefined,
      note: payForm.note||undefined
    }) });
    if (!res.ok) { alert('تعذر تسجيل الدفعة'); return; }
    setShowPay(false); setPayForm({ orderId:'', amount:'', method:'CASH' });
    await load();
  }

  const [showSched, setShowSched] = React.useState(false);
  const [schedForm, setSchedForm] = React.useState<{orderId:string;dueDate:string;amount:string;method:string}>({ orderId:'', dueDate:'', amount:'', method:'BANK' });
  async function submitSchedule(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch(`${apiBase}/api/admin/finance/invoices/schedule`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({
      orderId: schedForm.orderId,
      dueDate: schedForm.dueDate,
      amount: Number(schedForm.amount||0),
      method: schedForm.method
    }) });
    if (!res.ok) { alert('تعذر إضافة الجدولة'); return; }
    setShowSched(false); setSchedForm({ orderId:'', dueDate:'', amount:'', method:'BANK' });
    await load();
  }

  function exportCsv(){
    if (tab==='invoices'){
      const rows = [
        ['number','orderId','customer','amount','status','dueDate'],
        ...invoices.map((r:any)=> [r.number, r.orderId, r.customer, String(r.amount), r.status, r.dueDate||''])
      ];
      const csv = rows.map(r=> r.map(v=> /[",\n]/.test(String(v))? '"'+String(v).replace(/"/g,'""')+'"' : String(v)).join(',')).join('\n');
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `invoices_${new Date().toISOString().slice(0,10)}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
    } else if (tab==='payments'){
      const rows = [
        ['id','orderId','ref','method','amount','at','note'],
        ...payments.map(r=> [r.id, r.orderId||'', r.ref||'', r.method, String(r.amount), r.at, (r.note||'').replace(/\n/g,' ')])
      ];
      const csv = rows.map(r=> r.map(v=> /[",\n]/.test(String(v))? '"'+String(v).replace(/"/g,'""')+'"' : String(v)).join(',')).join('\n');
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `payments_${new Date().toISOString().slice(0,10)}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
    } else if (tab==='schedule'){
      const rows = [
        ['id','orderId','dueDate','amount','status'],
        ...schedule.map(r=> [r.id, r.orderId, r.dueDate, String(r.amount), r.status])
      ];
      const csv = rows.map(r=> r.map(v=> /[",\n]/.test(String(v))? '"'+String(v).replace(/"/g,'""')+'"' : String(v)).join(',')).join('\n');
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `schedule_${new Date().toISOString().slice(0,10)}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
    }
  }

  async function importBank(ev: React.ChangeEvent<HTMLInputElement>){
    const f = ev.target.files?.[0]; if (!f) return;
    try{
      const text = await f.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (!lines.length) return;
      const header = lines.shift()!;
      const idx = (h:string)=> header.split(',').findIndex(x=> x.trim().toLowerCase()===h);
      const iDate=idx('date'), iAmt=idx('amount'), iRef=idx('ref'), iDesc=idx('description');
      const items = lines.map(l=> l.split(',')).map(c=> ({
        date: c[iDate]>=0? c[iDate]: '',
        amount: Number(c[iAmt]||0),
        ref: iRef>=0? c[iRef]: undefined,
        description: iDesc>=0? c[iDesc]: undefined
      }));
      const res = await fetch(`${apiBase}/api/admin/finance/reconcile/bank`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({ items }) });
      if (!res.ok) throw new Error('failed');
      alert('تم رفع كشف الحساب للمطابقة');
    } catch { alert('فشل استيراد كشف الحساب'); } finally { (ev.target as HTMLInputElement).value=''; }
  }
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">الفواتير والمدفوعات</h1>
      <div className="tabs" style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <button className={`btn btn-sm ${tab==='invoices'?'btn-active':''}`} onClick={()=> setTab('invoices')}>الفواتير</button>
        <button className={`btn btn-sm ${tab==='payments'?'btn-active':''}`} onClick={()=> setTab('payments')}>المدفوعات</button>
        <button className={`btn btn-sm ${tab==='schedule'?'btn-active':''}`} onClick={()=> setTab('schedule')}>الجدولة</button>
        <button className={`btn btn-sm ${tab==='reconcile'?'btn-active':''}`} onClick={()=> setTab('reconcile')}>مطابقة البنك</button>
      </div>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginTop:8}}>
        <input className="input" placeholder="بحث" value={q} onChange={e=> setQ(e.target.value)} />
        <input className="input" type="date" value={from} onChange={e=> setFrom(e.target.value)} />
        <input className="input" type="date" value={to} onChange={e=> setTo(e.target.value)} />
        {tab==='invoices' && (
          <>
            <select className="select" value={status} onChange={e=> setStatus(e.target.value)}><option value="">الكل</option><option value="PAID">مدفوعة</option><option value="DUE">مستحقة</option><option value="PARTIAL">جزئي</option></select>
            <select className="select" value={center} onChange={e=> setCenter(e.target.value as any)}>
              <option value="all">كل المراكز</option>
              <option value="marketing">التسويق</option>
              <option value="shipping">الشحن</option>
              <option value="operations">التشغيل</option>
              <option value="development">التطوير</option>
            </select>
            <button className="btn btn-sm" onClick={()=> setShowSched(true)}>+ إضافة جدولة</button>
          </>
        )}
        {tab==='payments' && (
          <>
            <select className="select" value={method} onChange={e=> setMethod(e.target.value)}>
              <option value="">كل الوسائل</option>
              <option value="CASH">نقدي</option>
              <option value="CARD">بطاقة</option>
              <option value="BANK">حوالة</option>
              <option value="WALLET">محفظة</option>
            </select>
            <button className="btn btn-sm" onClick={()=> setShowPay(true)}>+ تسجيل دفعة</button>
          </>
        )}
        {tab==='reconcile' && (
          <>
            <label className="btn btn-sm btn-outline" htmlFor="bank-import">استيراد كشف بنكي CSV</label>
            <input id="bank-import" type="file" accept=".csv,text/csv" style={{display:'none'}} onChange={importBank} />
          </>
        )}
        <button className="btn btn-sm" onClick={load} disabled={busy}>تحديث</button>
        <button className="btn btn-sm" onClick={exportCsv}>تصدير CSV</button>
      </div>

      {tab==='invoices' && (
        <div className="mt-3">
          <table className="table">
            <thead><tr><th>#</th><th>العميل</th><th>المبلغ</th><th>الحالة</th><th>استحقاق</th><th>إجراءات</th></tr></thead>
            <tbody>
              {(invoices as any[]).filter(r=> !q.trim() || (r.number + r.customer + r.orderId).toLowerCase().includes(q.trim().toLowerCase())).map((r)=> (
                <tr key={r.orderId}><td>{(r as any).number}</td><td>{(r as any).customer}</td><td>{Number((r as any).amount||0).toFixed(2)}</td><td>{(r as any).status}</td><td>{(r as any).dueDate? String((r as any).dueDate).slice(0,10): '—'}</td><td><button className="btn btn-sm" onClick={()=> settle((r as any).orderId)}>تسوية</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==='payments' && (
        <div className="mt-3">
          <table className="table">
            <thead><tr><th>#</th><th>الطلب</th><th>المرجع</th><th>الطريقة</th><th>المبلغ</th><th>التاريخ</th><th>ملاحظات</th></tr></thead>
            <tbody>
              {payments.filter(r=> !q.trim() || ((r.ref||'')+(r.orderId||'')+r.method).toLowerCase().includes(q.trim().toLowerCase())).map(r=> (
                <tr key={r.id}><td>{r.id}</td><td>{r.orderId||'—'}</td><td>{r.ref||'—'}</td><td>{r.method}</td><td>{r.amount.toFixed(2)}</td><td>{String(r.at).slice(0,10)}</td><td>{r.note||'—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==='schedule' && (
        <div className="mt-3">
          <table className="table">
            <thead><tr><th>#</th><th>الطلب</th><th>الاستحقاق</th><th>المبلغ</th><th>الحالة</th></tr></thead>
            <tbody>
              {schedule.map(r=> (
                <tr key={r.id}><td>{r.id}</td><td>{r.orderId}</td><td>{String(r.dueDate).slice(0,10)}</td><td>{r.amount.toFixed(2)}</td><td>{r.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==='reconcile' && (
        <div className="mt-3 text-sm" style={{color:'var(--sub)'}}>قم باستيراد كشف الحساب البنكي بصيغة CSV مع أعمدة: date, amount, ref, description. ستتم مطابقة المبالغ والمراجع مع المدفوعات والفواتير.</div>
      )}

      {showPay && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 className="text-lg mb-2">تسجيل دفعة</h3>
            <form onSubmit={submitPayment} className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label className="grid" style={{gap:4}}>
                <span>رقم الطلب</span>
                <input className="input" value={payForm.orderId} onChange={e=> setPayForm(f=> ({...f, orderId: e.target.value}))} />
              </label>
              <label className="grid" style={{gap:4}}>
                <span>المبلغ</span>
                <input className="input" type="number" step="0.01" required value={payForm.amount} onChange={e=> setPayForm(f=> ({...f, amount: e.target.value}))} />
              </label>
              <label className="grid" style={{gap:4}}>
                <span>الطريقة</span>
                <select className="input" value={payForm.method} onChange={e=> setPayForm(f=> ({...f, method: e.target.value}))}>
                  <option value="CASH">نقدي</option>
                  <option value="CARD">بطاقة</option>
                  <option value="BANK">حوالة</option>
                  <option value="WALLET">محفظة</option>
                </select>
              </label>
              <label className="grid" style={{gap:4}}>
                <span>مرجع</span>
                <input className="input" value={payForm.ref||''} onChange={e=> setPayForm(f=> ({...f, ref: e.target.value||undefined}))} />
              </label>
              <label className="grid" style={{gap:4}}>
                <span>تاريخ الدفعة</span>
                <input className="input" type="datetime-local" value={payForm.at||''} onChange={e=> setPayForm(f=> ({...f, at: e.target.value||undefined}))} />
              </label>
              <label className="grid" style={{gap:4}}>
                <span>ملاحظات</span>
                <input className="input" value={payForm.note||''} onChange={e=> setPayForm(f=> ({...f, note: e.target.value||undefined}))} />
              </label>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end',gridColumn:'1 / -1'}}>
                <button type="button" className="btn btn-outline" onClick={()=> setShowPay(false)}>إلغاء</button>
                <button type="submit" className="btn">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSched && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 className="text-lg mb-2">إضافة جدولة سداد</h3>
            <form onSubmit={submitSchedule} className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label className="grid" style={{gap:4}}>
                <span>رقم الطلب</span>
                <input className="input" value={schedForm.orderId} onChange={e=> setSchedForm(f=> ({...f, orderId: e.target.value}))} />
              </label>
              <label className="grid" style={{gap:4}}>
                <span>تاريخ الاستحقاق</span>
                <input className="input" type="date" value={schedForm.dueDate} onChange={e=> setSchedForm(f=> ({...f, dueDate: e.target.value}))} />
              </label>
              <label className="grid" style={{gap:4}}>
                <span>المبلغ</span>
                <input className="input" type="number" step="0.01" required value={schedForm.amount} onChange={e=> setSchedForm(f=> ({...f, amount: e.target.value}))} />
              </label>
              <label className="grid" style={{gap:4}}>
                <span>الطريقة</span>
                <select className="input" value={schedForm.method} onChange={e=> setSchedForm(f=> ({...f, method: e.target.value}))}>
                  <option value="BANK">حوالة</option>
                  <option value="CASH">نقدي</option>
                  <option value="CARD">بطاقة</option>
                  <option value="WALLET">محفظة</option>
                </select>
              </label>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end',gridColumn:'1 / -1'}}>
                <button type="button" className="btn btn-outline" onClick={()=> setShowSched(false)}>إلغاء</button>
                <button type="submit" className="btn">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

