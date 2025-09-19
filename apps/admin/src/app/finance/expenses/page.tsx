"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

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
  const [rows, setRows] = React.useState<Array<{id:string;date:string;category:string;description?:string;amount:number;vendorId?:string|null;invoiceRef?:string|null}>>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [show, setShow] = React.useState(false);
  const [form, setForm] = React.useState<{date:string;category:string;description:string;amount:string;vendorId:string;invoiceRef:string}>({ date: new Date().toISOString().slice(0,10), category: '', description: '', amount: '', vendorId: '', invoiceRef: '' });

  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/finance/expenses`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', '20');
    const j = await (await fetch(url.toString(), { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' })).json();
    setRows(j.expenses||[]); setTotal(j.pagination?.total||0); setBusy(false);
  }
  React.useEffect(()=>{ load().catch(()=>setBusy(false)); }, [apiBase, page]);

  async function addExpense(){
    if (!form.category || !form.amount) return;
    const payload = { date: form.date, category: form.category, description: form.description||undefined, amount: Number(form.amount), vendorId: form.vendorId||undefined, invoiceRef: form.invoiceRef||undefined };
    const res = await fetch(`${apiBase}/api/admin/finance/expenses`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify(payload) });
    if (!res.ok) {
      alert('تعذر إضافة المصروف');
      return;
    }
    setShow(false);
    setForm({ date: new Date().toISOString().slice(0,10), category: '', description: '', amount: '', vendorId: '', invoiceRef: '' });
    await load();
  }

  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">المصروفات</h1>
      <div className="toolbar">
        <button className="btn btn-sm" onClick={()=> setShow(true)}>+ إضافة مصروف</button>
        <a className="btn btn-sm" href={`${apiBase}/api/admin/finance/expenses/export/csv`}>تصدير CSV</a>
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
          <thead><tr><th>التاريخ</th><th>التصنيف</th><th>الوصف</th><th>المبلغ</th><th>فاتورة/مورد</th></tr></thead>
          <tbody>
            {busy ? (<tr><td colSpan={5}>جارٍ التحميل…</td></tr>) :
              rows.length ? rows.map(r => (
                <tr key={r.id}><td>{String(r.date).slice(0,10)}</td><td>{r.category}</td><td>{r.description||'-'}</td><td>${r.amount.toFixed(2)}</td><td>{r.invoiceRef||r.vendorId||'-'}</td></tr>
              )) : (
                <tr><td colSpan={5}>لا توجد بيانات</td></tr>
              )
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

