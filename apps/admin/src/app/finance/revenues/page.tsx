"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { downloadCsv } from '../../lib/csv';
import { exportToXlsx, exportToPdf } from '../../lib/export';

export default function RevenuesPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [rows, setRows] = React.useState<Array<{id:string;at:string;source:string;amount:number;orderId?:string;status:string;costCenter?:string;note?:string}>>([]);
  const [busy, setBusy] = React.useState(false);
  // Filters
  const [q, setQ] = React.useState('');
  const [range, setRange] = React.useState<'7d'|'30d'|'90d'|'custom'>('30d');
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');
  const [source, setSource] = React.useState<'all'|'sales'|'commissions'|'ads'|'subscriptions'|'other'>('all');
  const [status, setStatus] = React.useState<'all'|'confirmed'|'pending'|'cancelled'>('all');
  const [center, setCenter] = React.useState<'all'|'marketing'|'shipping'|'operations'|'development'>('all');
  // Add income modal
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm] = React.useState<{at:string;source:string;amount:string;status:string;costCenter?:string;orderId?:string;note?:string}>({ at:'', source:'sales', amount:'', status:'confirmed' });

  async function load(){
    setBusy(true);
    try {
      const url = new URL(`${apiBase}/api/admin/finance/revenues`);
      url.searchParams.set('page','1'); url.searchParams.set('limit','100');
      if (range==='custom' && start && end) { url.searchParams.set('start', start); url.searchParams.set('end', end); }
      else { url.searchParams.set('days', range==='7d'? '7': range==='30d'? '30':'90'); }
      if (source!=='all') url.searchParams.set('source', source);
      if (status!=='all') url.searchParams.set('status', status);
      if (center!=='all') url.searchParams.set('costCenter', center);
      if (q.trim()) url.searchParams.set('q', q.trim());
      const j = await (await fetch(url.toString(), { credentials:'include' })).json();
      setRows(j.revenues||[]);
    } finally { setBusy(false); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase, range, start, end, source, status, center]);

  async function submitAdd(e: React.FormEvent){
    e.preventDefault();
    try{
      setBusy(true);
      const res = await fetch(`${apiBase}/api/admin/finance/revenues`, {
        method:'POST', credentials:'include', headers:{ 'content-type':'application/json' },
        body: JSON.stringify({
          at: form.at || new Date().toISOString(),
          source: form.source,
          amount: Number(form.amount||0),
          status: form.status,
          costCenter: form.costCenter||undefined,
          orderId: form.orderId||undefined,
          note: form.note||undefined
        })
      });
      if (!res.ok) throw new Error('failed');
      setShowAdd(false); setForm({ at:'', source:'sales', amount:'', status:'confirmed' });
      await load();
    } catch { alert('تعذّر إضافة الدخل'); } finally { setBusy(false); }
  }

  function exportCsv(){
    downloadCsv(`revenues_${new Date().toISOString().slice(0,10)}.csv`, [
      ['at','source','amount','status','costCenter','orderId','note'],
      ...rows.map(r=> [r.at, r.source, String(r.amount), r.status, r.costCenter||'', r.orderId||'', (r.note||'').replace(/\n/g,' ')])
    ]);
  }

  async function importCsv(ev: React.ChangeEvent<HTMLInputElement>){
    const f = ev.target.files?.[0]; if (!f) return;
    try{
      const text = await f.text();
      const lines = text.split(/\r?\n/).filter(Boolean); if (!lines.length) return;
      const header = lines.shift()!;
      const idx = (h:string)=> header.split(',').findIndex(x=> x.trim().toLowerCase()===h);
      const iAt=idx('at'), iSource=idx('source'), iAmount=idx('amount'), iStatus=idx('status'), iCenter=idx('costcenter'), iOrder=idx('orderid'), iNote=idx('note');
      const payload = lines.map(l=> l.split(',')).map(c=> ({
        at: c[iAt]>=0? c[iAt]: undefined,
        source: c[iSource]>=0? c[iSource]: 'sales',
        amount: Number(c[iAmount]||0),
        status: c[iStatus]>=0? c[iStatus]: 'confirmed',
        costCenter: iCenter>=0? c[iCenter] : undefined,
        orderId: iOrder>=0? c[iOrder] : undefined,
        note: iNote>=0? c[iNote] : undefined
      }));
      setBusy(true);
      const res = await fetch(`${apiBase}/api/admin/finance/revenues/import`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({ items: payload }) });
      if (!res.ok) throw new Error('failed');
      await load();
      alert('تم استيراد الملف');
    } catch { alert('فشل استيراد CSV'); } finally { setBusy(false); (ev.target as HTMLInputElement).value=''; }
  }

  const filtered = React.useMemo(()=>{
    if (!q.trim()) return rows;
    const t = q.trim().toLowerCase();
    return rows.filter(r=> [r.source, r.status, r.costCenter, r.orderId, r.note].some(x=> String(x||'').toLowerCase().includes(t)));
  }, [rows, q]);

  return (
    <div className="panel" style={{ padding:16 }}>
      <h1 className="text-xl font-bold mb-3">إدارة المداخيل</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center', position:'sticky', top:0, background:'var(--panel)', zIndex:10, padding:'6px 0'}}>
        <input className="input" placeholder="بحث نصي" value={q} onChange={e=> setQ(e.target.value)} />
        <select className="input" value={range} onChange={e=> setRange(e.target.value as any)}>
          <option value="7d">آخر 7 أيام</option>
          <option value="30d">آخر 30 يوم</option>
          <option value="90d">آخر 90 يوم</option>
          <option value="custom">مخصص</option>
        </select>
        {range==='custom' && (
          <>
            <input className="input" type="date" value={start} onChange={e=> setStart(e.target.value)} />
            <input className="input" type="date" value={end} onChange={e=> setEnd(e.target.value)} />
          </>
        )}
        <select className="input" value={source} onChange={e=> setSource(e.target.value as any)}>
          <option value="all">جميع المصادر</option>
          <option value="sales">مبيعات</option>
          <option value="commissions">عمولات</option>
          <option value="ads">إعلانات</option>
          <option value="subscriptions">اشتراكات</option>
          <option value="other">أخرى</option>
        </select>
        <select className="input" value={status} onChange={e=> setStatus(e.target.value as any)}>
          <option value="all">كل الحالات</option>
          <option value="confirmed">مؤكد</option>
          <option value="pending">قيد الانتظار</option>
          <option value="cancelled">ملغي</option>
        </select>
        <select className="input" value={center} onChange={e=> setCenter(e.target.value as any)}>
          <option value="all">كل المراكز</option>
          <option value="marketing">التسويق</option>
          <option value="shipping">الشحن</option>
          <option value="operations">التشغيل</option>
          <option value="development">التطوير</option>
        </select>
        <button className="btn btn-outline" onClick={()=> load()} disabled={busy}>تحديث</button>
        <button className="btn" onClick={()=> setShowAdd(true)}>إضافة دخل</button>
        <label className="btn btn-outline" htmlFor="rev-import">استيراد CSV</label>
        <input id="rev-import" type="file" accept=".csv,text/csv" style={{display:'none'}} onChange={importCsv} />
        <button className="btn" onClick={exportCsv}>تصدير CSV</button>
        <button className="btn btn-outline" onClick={()=> exportToXlsx(`revenues_${new Date().toISOString().slice(0,10)}.xlsx`, ['at','source','amount','status','costCenter','orderId','note'], rows.map(r=> [r.at, r.source, r.amount, r.status, r.costCenter||'', r.orderId||'', r.note||'']))}>Excel</button>
        <button className="btn btn-outline" onClick={()=> exportToPdf(`revenues_${new Date().toISOString().slice(0,10)}.pdf`, ['at','source','amount','status','costCenter','orderId','note'], rows.map(r=> [r.at, r.source, r.amount, r.status, r.costCenter||'', r.orderId||'', r.note||'']))}>PDF</button>
      </div>
      <div className="mt-3" style={{overflowX:'auto'}}>
        <table className="table">
          <thead style={{ position:'sticky', top:48, zIndex:5, background:'var(--panel)'}}><tr><th>التاريخ</th><th>المصدر</th><th>المبلغ</th><th>الحالة</th><th>مركز التكلفة</th><th>الطلب</th><th>ملاحظات</th></tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td>{String(r.at).slice(0,19).replace('T',' ')}</td>
                <td>{r.source}</td>
                <td>{r.amount.toFixed(2)}</td>
                <td>{r.status}</td>
                <td>{r.costCenter||'—'}</td>
                <td>{r.orderId||'—'}</td>
                <td>{r.note||'—'}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={7} style={{color:'var(--sub)'}}>{busy? 'جار التحميل…' : 'لا توجد بيانات'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-head">
              <h3 style={{margin:0}}>إضافة دخل</h3>
              <button className="btn btn-xs" onClick={()=> setShowAdd(false)}>إغلاق</button>
            </div>
            <form onSubmit={submitAdd} className="grid" style={{gap:8}}>
              <label className="grid" style={{gap:4}}>
                <span>التاريخ</span>
                <input className="input" type="datetime-local" value={form.at} onChange={e=> setForm(f=> ({...f, at: e.target.value}))} />
              </label>
              <label className="grid" style={{gap:4}}>
                <span>المصدر</span>
                <select className="input" value={form.source} onChange={e=> setForm(f=> ({...f, source: e.target.value}))}>
                  <option value="sales">مبيعات</option>
                  <option value="commissions">عمولات</option>
                  <option value="ads">إعلانات</option>
                  <option value="subscriptions">اشتراكات</option>
                  <option value="other">أخرى</option>
                </select>
              </label>
              <label className="grid" style={{gap:4}}>
                <span>المبلغ</span>
                <input className="input" type="number" step="0.01" required value={form.amount} onChange={e=> setForm(f=> ({...f, amount: e.target.value}))} />
              </label>
              <label className="grid" style={{gap:4}}>
                <span>الحالة</span>
                <select className="input" value={form.status} onChange={e=> setForm(f=> ({...f, status: e.target.value}))}>
                  <option value="confirmed">مؤكد</option>
                  <option value="pending">قيد الانتظار</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </label>
              <label className="grid" style={{gap:4}}>
                <span>مركز التكلفة</span>
                <select className="input" value={form.costCenter||''} onChange={e=> setForm(f=> ({...f, costCenter: e.target.value||undefined}))}>
                  <option value="">—</option>
                  <option value="marketing">التسويق</option>
                  <option value="shipping">الشحن</option>
                  <option value="operations">التشغيل</option>
                  <option value="development">التطوير</option>
                </select>
              </label>
              <label className="grid" style={{gap:4}}>
                <span>رقم الطلب (اختياري)</span>
                <input className="input" value={form.orderId||''} onChange={e=> setForm(f=> ({...f, orderId: e.target.value||undefined}))} />
              </label>
              <label className="grid" style={{gap:4}}>
                <span>ملاحظات</span>
                <textarea className="input" rows={3} value={form.note||''} onChange={e=> setForm(f=> ({...f, note: e.target.value||undefined}))} />
              </label>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button type="button" className="btn btn-outline" onClick={()=> setShowAdd(false)}>إلغاء</button>
                <button type="submit" className="btn" disabled={busy}>حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

