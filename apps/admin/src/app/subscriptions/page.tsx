"use client";
import React from 'react';
import { resolveApiBase } from '../lib/apiBase';
import { downloadCsv } from '../lib/csv';
import { exportToXlsx, exportToPdf } from '../lib/export';

export default function SubscriptionsPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [q, setQ] = React.useState('');
  const [plan, setPlan] = React.useState('');
  const [rows, setRows] = React.useState<Array<{id:string;user:string;plan:string;status:string;startedAt:string;expiresAt?:string}>>([]);
  const [busy, setBusy] = React.useState(false);
  const [show, setShow] = React.useState(false);
  const [form, setForm] = React.useState<{userId:string;plan:string;months:string}>({ userId:'', plan:'basic', months:'1' });

  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/subscriptions`);
    if (q.trim()) url.searchParams.set('q', q.trim());
    if (plan) url.searchParams.set('plan', plan);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.subscriptions||[]);
    setBusy(false);
  }
  React.useEffect(()=>{ load().catch(()=> setBusy(false)); }, [apiBase, q, plan]);

  async function create(){
    const res = await fetch(`${apiBase}/api/admin/subscriptions`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({ userId: form.userId, plan: form.plan, months: Number(form.months||1) }) });
    if (!res.ok) { alert('تعذر الإنشاء'); return; }
    setShow(false); setForm({ userId:'', plan:'basic', months:'1' });
    await load();
  }

  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">Jeeey Club — الاشتراكات</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <input className="input" placeholder="بحث مستخدم" value={q} onChange={e=> setQ(e.target.value)} />
        <select className="select" value={plan} onChange={e=> setPlan(e.target.value)}>
          <option value="">كل الباقات</option>
          <option value="basic">Basic</option>
          <option value="plus">Plus</option>
          <option value="pro">Pro</option>
        </select>
        <button className="btn btn-sm" onClick={load} disabled={busy}>تحديث</button>
        <button className="btn btn-sm" onClick={()=> downloadCsv(`subscriptions_${new Date().toISOString().slice(0,10)}.csv`, [
          ['user','plan','status','startedAt','expiresAt'],
          ...rows.map(r=> [r.user, r.plan, r.status, String(r.startedAt).slice(0,10), r.expiresAt? String(r.expiresAt).slice(0,10):''])
        ])}>CSV</button>
        <button className="btn btn-sm btn-outline" onClick={()=> exportToXlsx(`subscriptions_${new Date().toISOString().slice(0,10)}.xlsx`, ['user','plan','status','startedAt','expiresAt'], rows.map(r=> [r.user, r.plan, r.status, String(r.startedAt).slice(0,10), r.expiresAt? String(r.expiresAt).slice(0,10):'']))}>Excel</button>
        <button className="btn btn-sm btn-outline" onClick={()=> exportToPdf(`subscriptions_${new Date().toISOString().slice(0,10)}.pdf`, ['user','plan','status','startedAt','expiresAt'], rows.map(r=> [r.user, r.plan, r.status, String(r.startedAt).slice(0,10), r.expiresAt? String(r.expiresAt).slice(0,10):'']))}>PDF</button>
        <button className="btn btn-sm" onClick={()=> setShow(true)}>+ إنشاء اشتراك</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>المستخدم</th><th>الباقة</th><th>الحالة</th><th>البدء</th><th>الانتهاء</th></tr></thead>
          <tbody>
            {rows.length? rows.map(r=> (
              <tr key={r.id}><td>{r.user}</td><td>{r.plan}</td><td>{r.status}</td><td>{String(r.startedAt).slice(0,10)}</td><td>{r.expiresAt? String(r.expiresAt).slice(0,10): '—'}</td></tr>
            )): (<tr><td colSpan={5}>{busy? 'جارٍ التحميل…':'لا توجد بيانات'}</td></tr>)}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 className="text-lg mb-2">اشتراك جديد</h3>
            <div className="grid" style={{gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
              <input className="input" placeholder="User ID" value={form.userId} onChange={e=> setForm(f=> ({...f, userId: e.target.value}))} />
              <select className="input" value={form.plan} onChange={e=> setForm(f=> ({...f, plan: e.target.value}))}>
                <option value="basic">Basic</option>
                <option value="plus">Plus</option>
                <option value="pro">Pro</option>
              </select>
              <input className="input" type="number" step="1" placeholder="الأشهر" value={form.months} onChange={e=> setForm(f=> ({...f, months: e.target.value}))} />
            </div>
            <div className="mt-3" style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
              <button className="btn btn-outline btn-sm" onClick={()=> setShow(false)}>إلغاء</button>
              <button className="btn btn-sm" onClick={create}>حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

