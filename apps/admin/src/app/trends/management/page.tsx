"use client";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";
import { downloadCsv } from "../../lib/csv";
import { exportToXlsx, exportToPdf } from "../../lib/export";

export default function TrendsManagement(): JSX.Element {
  const apiBase = resolveApiBase();
  const [q, setQ] = React.useState('');
  const [type, setType] = React.useState('');
  const [rows, setRows] = React.useState<Array<{id:string;name:string;criteria:string;status:string;lastRun?:string;awardedBadges?:number}>>([]);
  const [busy, setBusy] = React.useState(false);
  const [show, setShow] = React.useState(false);
  const [form, setForm] = React.useState<{name:string;criteria:string;type:string;active:boolean}>({ name:'', criteria:'', type:'manual', active:true });

  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/trends`);
    if (q.trim()) url.searchParams.set('q', q.trim());
    if (type) url.searchParams.set('type', type);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.trends||[]);
    setBusy(false);
  }
  React.useEffect(()=>{ load().catch(()=> setBusy(false)); }, [apiBase, q, type]);

  async function create(){
    const res = await fetch(`${apiBase}/api/admin/trends`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify(form) });
    if (!res.ok) { alert('تعذر الإنشاء'); return; }
    setShow(false); setForm({ name:'', criteria:'', type:'manual', active:true });
    await load();
  }

  async function run(id:string){
    const res = await fetch(`${apiBase}/api/admin/trends/${id}/run`, { method:'POST', credentials:'include' });
    if (!res.ok) { alert('فشل التشغيل'); return; }
    await load();
  }

  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">إدارة الاتجاهات</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <input className="input" placeholder="بحث" value={q} onChange={e=> setQ(e.target.value)} />
        <select className="select" value={type} onChange={e=> setType(e.target.value)}>
          <option value="">الكل</option>
          <option value="manual">يدوي</option>
          <option value="auto">تلقائي</option>
        </select>
        <button className="btn btn-sm" onClick={()=> setShow(true)}>+ اتجاه</button>
        <button className="btn btn-sm" onClick={()=> downloadCsv(`trends_${new Date().toISOString().slice(0,10)}.csv`, [
          ['name','criteria','status','lastRun','awardedBadges'],
          ...rows.map(r=> [r.name, r.criteria, r.status, r.lastRun? String(r.lastRun).slice(0,19).replace('T',' '):'', r.awardedBadges??0])
        ])}>CSV</button>
        <button className="btn btn-sm btn-outline" onClick={()=> exportToXlsx(`trends_${new Date().toISOString().slice(0,10)}.xlsx`, ['name','criteria','status','lastRun','awardedBadges'], rows.map(r=> [r.name, r.criteria, r.status, r.lastRun? String(r.lastRun).slice(0,19).replace('T',' '):'', r.awardedBadges??0]))}>Excel</button>
        <button className="btn btn-sm btn-outline" onClick={()=> exportToPdf(`trends_${new Date().toISOString().slice(0,10)}.pdf`, ['name','criteria','status','lastRun','awardedBadges'], rows.map(r=> [r.name, r.criteria, r.status, r.lastRun? String(r.lastRun).slice(0,19).replace('T',' '):'', r.awardedBadges??0]))}>PDF</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>الاسم</th><th>المعيار</th><th>الحالة</th><th>آخر تشغيل</th><th>شارات ممنوحة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {rows.length? rows.map(r=> (
              <tr key={r.id}><td>{r.name}</td><td>{r.criteria}</td><td>{r.status}</td><td>{r.lastRun? String(r.lastRun).slice(0,19).replace('T',' '):'—'}</td><td>{r.awardedBadges??0}</td><td><button className="btn btn-xs" onClick={()=> run(r.id)}>تشغيل</button></td></tr>
            )): (<tr><td colSpan={6}>{busy? 'جارٍ التحميل…':'لا توجد بيانات'}</td></tr>)}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 className="text-lg mb-2">اتجاه جديد</h3>
            <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:8}}>
              <input className="input" placeholder="الاسم" value={form.name} onChange={e=> setForm(f=> ({...f, name: e.target.value}))} />
              <select className="input" value={form.type} onChange={e=> setForm(f=> ({...f, type: e.target.value}))}>
                <option value="manual">يدوي</option>
                <option value="auto">تلقائي</option>
              </select>
              <input className="input" placeholder="المعيار (DSL)" value={form.criteria} onChange={e=> setForm(f=> ({...f, criteria: e.target.value}))} />
              <label style={{display:'flex',alignItems:'center', gap:6}}>
                <input type="checkbox" checked={form.active} onChange={e=> setForm(f=> ({...f, active: e.target.checked}))} />
                مفعّل
              </label>
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

