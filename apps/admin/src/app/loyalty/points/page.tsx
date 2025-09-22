"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { downloadCsv } from '../../lib/csv';
import { exportToXlsx, exportToPdf } from '../../lib/export';

export default function LoyaltyPointsPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [value, setValue] = React.useState('');
  const [expiryDays, setExpiryDays] = React.useState('');
  const [q, setQ] = React.useState('');
  const [rows, setRows] = React.useState<Array<{user:string;balance:number;updatedAt:string}>>([]);
  const [showAdjust, setShowAdjust] = React.useState(false);
  const [form, setForm] = React.useState<{userId:string;delta:string;reason?:string}>({ userId:'', delta:'', reason: '' });
  const [busy, setBusy] = React.useState(false);

  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/points/accounts`);
    if (q.trim()) url.searchParams.set('q', q.trim());
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.accounts||[]);
    setBusy(false);
  }
  React.useEffect(()=>{ load().catch(()=> setBusy(false)); }, [apiBase, q]);

  async function saveSettings(){
    const res = await fetch(`${apiBase}/api/admin/points/settings`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({
      pointValue: Number(value||0),
      expiryDays: Number(expiryDays||0)
    }) });
    if (!res.ok) { alert('تعذر الحفظ'); return; }
    alert('تم حفظ الإعدادات');
  }

  async function submitAdjust(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch(`${apiBase}/api/admin/points/adjust`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({
      userId: form.userId,
      delta: Number(form.delta||0),
      reason: form.reason||undefined
    }) });
    if (!res.ok) { alert('تعذر التعديل'); return; }
    setShowAdjust(false); setForm({ userId:'', delta:'', reason:'' });
    await load();
  }

  function exportCsv(){
    downloadCsv(`points_accounts_${new Date().toISOString().slice(0,10)}.csv`, [
      ['user','balance','updatedAt'],
      ...rows.map(r=> [r.user, String(r.balance), String(r.updatedAt).slice(0,19).replace('T',' ')])
    ]);
  }

  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">إدارة النقاط</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <input className="input" placeholder="قيمة النقطة" value={value} onChange={e=> setValue(e.target.value)} />
        <input className="input" placeholder="الصلاحية (أيام)" value={expiryDays} onChange={e=> setExpiryDays(e.target.value)} />
        <button className="btn btn-sm" onClick={saveSettings}>حفظ</button>
        <input className="input" placeholder="بحث: مستخدم" value={q} onChange={e=> setQ(e.target.value)} />
        <button className="btn btn-sm" onClick={load} disabled={busy}>تحديث</button>
        <button className="btn btn-sm" onClick={()=> setShowAdjust(true)}>تعديل يدوي</button>
        <button className="btn btn-sm" onClick={exportCsv}>تصدير CSV</button>
        <button className="btn btn-sm btn-outline" onClick={()=> exportToXlsx(`points_${new Date().toISOString().slice(0,10)}.xlsx`, ['user','balance','updatedAt'], rows.map(r=> [r.user, r.balance, String(r.updatedAt).slice(0,19).replace('T',' ')]))}>Excel</button>
        <button className="btn btn-sm btn-outline" onClick={()=> exportToPdf(`points_${new Date().toISOString().slice(0,10)}.pdf`, ['user','balance','updatedAt'], rows.map(r=> [r.user, r.balance, String(r.updatedAt).slice(0,19).replace('T',' ')]))}>PDF</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>المستخدم</th><th>الرصيد</th><th>آخر تحديث</th></tr></thead>
          <tbody>
            {rows.length? rows.map(r=> (
              <tr key={r.user}><td>{r.user}</td><td>{r.balance}</td><td>{String(r.updatedAt).slice(0,19).replace('T',' ')}</td></tr>
            )) : (<tr><td colSpan={3}>{busy? 'جارٍ التحميل…':'لا توجد بيانات'}</td></tr>)}
          </tbody>
        </table>
      </div>

      {showAdjust && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 className="text-lg mb-2">تعديل رصيد النقاط</h3>
            <form onSubmit={submitAdjust} className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label className="grid" style={{gap:4}}>
                <span>معرّف المستخدم</span>
                <input className="input" value={form.userId} onChange={e=> setForm(f=> ({...f, userId: e.target.value}))} />
              </label>
              <label className="grid" style={{gap:4}}>
                <span>التغير (±)</span>
                <input className="input" type="number" step="1" value={form.delta} onChange={e=> setForm(f=> ({...f, delta: e.target.value}))} />
              </label>
              <label className="grid" style={{gap:4}}>
                <span>السبب</span>
                <input className="input" value={form.reason||''} onChange={e=> setForm(f=> ({...f, reason: e.target.value||undefined}))} />
              </label>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end',gridColumn:'1 / -1'}}>
                <button type="button" className="btn btn-outline" onClick={()=> setShowAdjust(false)}>إلغاء</button>
                <button type="submit" className="btn">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

