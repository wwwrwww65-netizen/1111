"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { downloadCsv } from '../../lib/csv';
import { exportToXlsx, exportToPdf } from '../../lib/export';

export default function ExpensesPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  },[]);
  const [busy, setBusy] = React.useState(false);
  const [rows, setRows] = React.useState<Array<{id:string;date:string;category:string;description?:string;amount:number;vendorId?:string|null;invoiceRef?:string|null; costCenter?:string|null}>>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [show, setShow] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [range, setRange] = React.useState<'7d'|'30d'|'90d'|'custom'>('30d');
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [vendor, setVendor] = React.useState('');
  const [center, setCenter] = React.useState<'all'|'marketing'|'shipping'|'operations'|'development'>('all');
  const [form, setForm] = React.useState<{date:string;category:string;description:string;amount:string;vendorId:string;invoiceRef:string; costCenter?:string}>({ date: new Date().toISOString().slice(0,10), category: '', description: '', amount: '', vendorId: '', invoiceRef: '' });

  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/finance/expenses`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', '20');
    if (range==='custom' && start && end) { url.searchParams.set('start', start); url.searchParams.set('end', end); }
    else { url.searchParams.set('days', range==='7d'? '7': range==='30d'? '30':'90'); }
    if (category.trim()) url.searchParams.set('category', category.trim());
    if (vendor.trim()) url.searchParams.set('vendorId', vendor.trim());
    if (center!=='all') url.searchParams.set('costCenter', center);
    if (q.trim()) url.searchParams.set('q', q.trim());
    const j = await (await fetch(url.toString(), { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' })).json();
    setRows(j.expenses||[]); setTotal(j.pagination?.total||0); setBusy(false);
  }
  React.useEffect(()=>{ load().catch(()=>setBusy(false)); }, [apiBase, page, range, start, end, category, vendor, center]);

  async function addExpense(){
    if (!form.category || !form.amount) return;
    const payload = { date: form.date, category: form.category, description: form.description||undefined, amount: Number(form.amount), vendorId: form.vendorId||undefined, invoiceRef: form.invoiceRef||undefined, costCenter: form.costCenter||undefined };
    const res = await fetch(`${apiBase}/api/admin/finance/expenses`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify(payload) });
    if (!res.ok) { alert('تعذر إضافة المصروف'); return; }
    setShow(false);
    setForm({ date: new Date().toISOString().slice(0,10), category: '', description: '', amount: '', vendorId: '', invoiceRef: '', costCenter: undefined });
    await load();
  }

  function exportCsv(){
    downloadCsv(`expenses_${new Date().toISOString().slice(0,10)}.csv`, [
      ['date','category','description','amount','vendorId','invoiceRef','costCenter'],
      ...rows.map(r=> [r.date, r.category, (r.description||'').replace(/\n/g,' '), String(r.amount), r.vendorId||'', r.invoiceRef||'', r.costCenter||''])
    ]);
  }

  async function importCsv(ev: React.ChangeEvent<HTMLInputElement>){
    const f = ev.target.files?.[0]; if (!f) return;
    try{
      const text = await f.text();
      const lines = text.split(/\r?\n/).filter(Boolean); if (!lines.length) return;
      const header = lines.shift()!;
      const idx = (h:string)=> header.split(',').findIndex(x=> x.trim().toLowerCase()===h);
      const iDate=idx('date'), iCat=idx('category'), iDesc=idx('description'), iAmt=idx('amount'), iVen=idx('vendorid'), iInv=idx('invoiceref'), iCenter=idx('costcenter');
      const payload = lines.map(l=> l.split(',')).map(c=> ({
        date: c[iDate]>=0? c[iDate]: new Date().toISOString().slice(0,10),
        category: c[iCat]>=0? c[iCat]: '',
        description: iDesc>=0? c[iDesc]: undefined,
        amount: Number(c[iAmt]||0),
        vendorId: iVen>=0? c[iVen]: undefined,
        invoiceRef: iInv>=0? c[iInv]: undefined,
        costCenter: iCenter>=0? c[iCenter]: undefined
      }));
      setBusy(true);
      const res = await fetch(`${apiBase}/api/admin/finance/expenses/import`, { method:'POST', credentials:'include', headers:{'content-type':'application/json', ...authHeaders()}, body: JSON.stringify({ items: payload }) });
      if (!res.ok) throw new Error('failed');
      await load();
      alert('تم استيراد الملف');
    } catch { alert('فشل استيراد CSV'); } finally { setBusy(false); (ev.target as HTMLInputElement).value=''; }
  }

  const filtered = React.useMemo(()=>{
    if (!q.trim()) return rows;
    const t = q.trim().toLowerCase();
    return rows.filter(r=> (r.category + (r.description||'') + (r.vendorId||'') + (r.invoiceRef||'')).toLowerCase().includes(t));
  }, [rows, q]);

  return (
    <div className="panel" style={{ padding:16 }}>
      <h1 className="text-xl font-bold mb-3">المصروفات</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center', position:'sticky', top:0, background:'var(--panel)', zIndex:10, padding:'6px 0'}}>
        <input className="input" placeholder="بحث نصي" value={q} onChange={e=> setQ(e.target.value)} />
        <select className="input" value={range} onChange={e=> setRange(e.target.value as any)}>
          <option value="7d">آخر 7 أيام</option>
          <option value="30d">آخر 30 يوم</option>
          <option value="90d">آخر 90 يوم</option>
          <option value="custom">مخصص</option>
        </select>
        {range==='custom' && (<>
          <input className="input" type="date" value={start} onChange={e=> setStart(e.target.value)} />
          <input className="input" type="date" value={end} onChange={e=> setEnd(e.target.value)} />
        </>)}
        <input className="input" placeholder="تصنيف" value={category} onChange={e=> setCategory(e.target.value)} />
        <input className="input" placeholder="Vendor ID" value={vendor} onChange={e=> setVendor(e.target.value)} />
        <select className="input" value={center} onChange={e=> setCenter(e.target.value as any)}>
          <option value="all">كل المراكز</option>
          <option value="marketing">التسويق</option>
          <option value="shipping">الشحن</option>
          <option value="operations">التشغيل</option>
          <option value="development">التطوير</option>
        </select>
        <button className="btn btn-outline" onClick={()=> load()} disabled={busy}>تحديث</button>
        <button className="btn" onClick={()=> setShow(true)}>+ إضافة مصروف</button>
        <label className="btn btn-outline" htmlFor="exp-import">استيراد CSV</label>
        <input id="exp-import" style={{display:'none'}} type="file" accept=".csv,text/csv" onChange={importCsv} />
        <button className="btn" onClick={exportCsv}>تصدير CSV</button>
        <button className="btn btn-outline" onClick={()=> exportToXlsx(`expenses_${new Date().toISOString().slice(0,10)}.xlsx`, ['date','category','description','amount','vendorId','invoiceRef','costCenter'], rows.map(r=> [r.date, r.category, r.description||'', r.amount, r.vendorId||'', r.invoiceRef||'', r.costCenter||'']))}>Excel</button>
        <button className="btn btn-outline" onClick={()=> exportToPdf(`expenses_${new Date().toISOString().slice(0,10)}.pdf`, ['date','category','description','amount','vendorId','invoiceRef','costCenter'], rows.map(r=> [r.date, r.category, r.description||'', r.amount, r.vendorId||'', r.invoiceRef||'', r.costCenter||'']))}>PDF</button>
      </div>
      {show && (
        <div className="modal">
          <div className="modal-content">
            <h3 className="text-lg mb-2">إضافة مصروف</h3>
            <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <label>التاريخ</label>
                <input className="input" type="date" value={form.date} onChange={e=> setForm(f=> ({...f, date: e.target.value}))} />
              </div>
              <div>
                <label>التصنيف</label>
                <input className="input" placeholder="تصنيف" value={form.category} onChange={e=> setForm(f=> ({...f, category: e.target.value}))} />
              </div>
              <div>
                <label>الوصف</label>
                <input className="input" placeholder="وصف" value={form.description} onChange={e=> setForm(f=> ({...f, description: e.target.value}))} />
              </div>
              <div>
                <label>المبلغ</label>
                <input className="input" type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e=> setForm(f=> ({...f, amount: e.target.value}))} />
              </div>
              <div>
                <label>المورد</label>
                <input className="input" placeholder="Vendor ID (اختياري)" value={form.vendorId} onChange={e=> setForm(f=> ({...f, vendorId: e.target.value}))} />
              </div>
              <div>
                <label>رقم الفاتورة</label>
                <input className="input" placeholder="INV-001" value={form.invoiceRef} onChange={e=> setForm(f=> ({...f, invoiceRef: e.target.value}))} />
              </div>
              <div>
                <label>مركز التكلفة</label>
                <select className="input" value={form.costCenter||''} onChange={e=> setForm(f=> ({...f, costCenter: e.target.value||undefined}))}>
                  <option value="">—</option>
                  <option value="marketing">التسويق</option>
                  <option value="shipping">الشحن</option>
                  <option value="operations">التشغيل</option>
                  <option value="development">التطوير</option>
                </select>
              </div>
            </div>
            <div className="mt-3" style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button className="btn btn-outline" onClick={()=> setShow(false)}>إلغاء</button>
              <button className="btn" onClick={addExpense}>حفظ</button>
            </div>
          </div>
        </div>
      )}
      <div className="mt-3">
        <table className="table">
          <thead style={{ position:'sticky', top:48, zIndex:5, background:'var(--panel)'}}><tr><th>التاريخ</th><th>التصنيف</th><th>الوصف</th><th>المبلغ</th><th>فاتورة/مورد</th><th>مركز التكلفة</th></tr></thead>
          <tbody>
            {busy ? (<tr><td colSpan={6}>جارٍ التحميل…</td></tr>) :
              filtered.length ? filtered.map(r => (
                <tr key={r.id}><td>{String(r.date).slice(0,10)}</td><td>{r.category}</td><td>{r.description||'-'}</td><td>{r.amount.toFixed(2)}</td><td>{r.invoiceRef||r.vendorId||'-'}</td><td>{r.costCenter||'—'}</td></tr>
              )) : (
                <tr><td colSpan={6}>لا توجد بيانات</td></tr>
              )
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

