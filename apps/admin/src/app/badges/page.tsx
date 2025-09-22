"use client";
import React from 'react';
import { resolveApiBase } from '../lib/apiBase';
import { downloadCsv } from '../lib/csv';
import { exportToXlsx, exportToPdf } from '../lib/export';

export default function BadgesPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [q, setQ] = React.useState('');
  const [rows, setRows] = React.useState<Array<{id:string;name:string;rule:string;color:string;awarded:number}>>([]);
  const [busy, setBusy] = React.useState(false);
  const [show, setShow] = React.useState(false);
  const [form, setForm] = React.useState<{name:string;rule:string;color:string}>({ name:'', rule:'', color:'#22c55e' });

  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/badges`);
    if (q.trim()) url.searchParams.set('q', q.trim());
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.badges||[]);
    setBusy(false);
  }
  React.useEffect(()=>{ load().catch(()=> setBusy(false)); }, [apiBase, q]);

  async function save(){
    const res = await fetch(`${apiBase}/api/admin/badges`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify(form) });
    if (!res.ok) { alert('تعذر الحفظ'); return; }
    setShow(false); setForm({ name:'', rule:'', color:'#22c55e' });
    await load();
  }

  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">الشارات</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <input className="input" placeholder="بحث" value={q} onChange={e=> setQ(e.target.value)} />
        <button className="btn btn-sm" onClick={()=> setShow(true)}>+ إضافة شارة</button>
        <button className="btn btn-sm" onClick={()=> downloadCsv(`badges_${new Date().toISOString().slice(0,10)}.csv`, [
          ['name','rule','color','awarded'],
          ...rows.map(r=> [r.name, r.rule, r.color, r.awarded])
        ])}>CSV</button>
        <button className="btn btn-sm btn-outline" onClick={()=> exportToXlsx(`badges_${new Date().toISOString().slice(0,10)}.xlsx`, ['name','rule','color','awarded'], rows.map(r=> [r.name, r.rule, r.color, r.awarded]))}>Excel</button>
        <button className="btn btn-sm btn-outline" onClick={()=> exportToPdf(`badges_${new Date().toISOString().slice(0,10)}.pdf`, ['name','rule','color','awarded'], rows.map(r=> [r.name, r.rule, r.color, r.awarded]))}>PDF</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>الاسم</th><th>القاعدة</th><th>اللون</th><th>الممنوحة</th></tr></thead>
          <tbody>
            {rows.length? rows.map(r=> (
              <tr key={r.id}><td>{r.name}</td><td>{r.rule}</td><td><span style={{background:r.color, padding:'2px 8px', borderRadius:6}}>{r.color}</span></td><td>{r.awarded}</td></tr>
            )): (<tr><td colSpan={4}>{busy? 'جارٍ التحميل…':'لا توجد بيانات'}</td></tr>)}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 className="text-lg mb-2">شارة جديدة</h3>
            <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:8}}>
              <input className="input" placeholder="الاسم" value={form.name} onChange={e=> setForm(f=> ({...f, name: e.target.value}))} />
              <input className="input" placeholder="لون HEX" value={form.color} onChange={e=> setForm(f=> ({...f, color: e.target.value}))} />
              <input className="input" placeholder="القاعدة (DSL)" value={form.rule} onChange={e=> setForm(f=> ({...f, rule: e.target.value}))} />
            </div>
            <div className="mt-3" style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
              <button className="btn btn-outline btn-sm" onClick={()=> setShow(false)}>إلغاء</button>
              <button className="btn btn-sm" onClick={save}>حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

