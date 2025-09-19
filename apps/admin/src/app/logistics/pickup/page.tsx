"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function PickupPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [tab, setTab] = React.useState<'waiting'|'in_progress'|'completed'>('waiting');
  const [rows, setRows] = React.useState<any[]>([]);
  const [message, setMessage] = React.useState('');
  const [assignPo, setAssignPo] = React.useState<string>('');
  const [assignDriver, setAssignDriver] = React.useState<string>('');

  async function load(){
    const url = new URL(`${apiBase}/api/admin/logistics/pickup/list`);
    url.searchParams.set('status', tab);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.pickup||[]);
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase, tab]);

  async function doAssign(){
    setMessage('');
    if (!assignPo || !assignDriver) { setMessage('ادخل المورد والسائق'); return; }
    const res = await fetch(`${apiBase}/api/admin/logistics/pickup/assign`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ poId: assignPo, driverId: assignDriver }) });
    if (!res.ok) { setMessage('تعذر الإسناد'); return; }
    setMessage('تم الإسناد'); setAssignPo(''); setAssignDriver('');
    await load();
  }
  async function changeStatus(poId: string, status: string){
    await fetch(`${apiBase}/api/admin/logistics/pickup/status`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ poId, status }) });
    await load();
  }
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">التوصيل من المورد</h1>
      <div className="toolbar" style={{ display:'flex', gap:8 }}>
        <button className={`btn btn-sm ${tab==='waiting'?'':'btn-outline'}`} onClick={()=> setTab('waiting')}>قيد الانتظار</button>
        <button className={`btn btn-sm ${tab==='in_progress'?'':'btn-outline'}`} onClick={()=> setTab('in_progress')}>قيد التنفيذ</button>
        <button className={`btn btn-sm ${tab==='completed'?'':'btn-outline'}`} onClick={()=> setTab('completed')}>مكتمل</button>
        <a className="btn btn-sm" href={`${apiBase}/api/admin/logistics/pickup/export/csv?status=${tab}`}>تصدير CSV</a>
        <a className="btn btn-sm btn-outline" href={`${apiBase}/api/admin/logistics/pickup/export/xls?status=${tab}`}>تصدير Excel</a>
      </div>

      <div className="mt-4" style={{ display:'flex', gap:12, alignItems:'center' }}>
        <input className="input" placeholder="معرّف طلب المورد (PO)" value={assignPo} onChange={e=> setAssignPo(e.target.value)} />
        <input className="input" placeholder="معرّف السائق" value={assignDriver} onChange={e=> setAssignDriver(e.target.value)} />
        <button className="btn" onClick={doAssign}>إسناد سائق</button>
        {message && <div className="text-sm" style={{ color:'#9ae6b4' }}>{message}</div>}
      </div>

      {tab==='waiting' && (
        <div className="mt-4">
          <table className="table">
            <thead><tr><th>اسم المورد</th><th>الموقع</th><th>عدد المنتجات</th><th>حالة الطلب</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {rows.map((r:any)=> (
                <tr key={r.id}>
                  <td>{r.vendorName||'-'}</td>
                  <td>{r.vendorAddress||'-'}</td>
                  <td>{Number(r.itemsCount||0)}</td>
                  <td><span className={`badge ${String(r.status).toUpperCase()==='SUBMITTED'?'warn':'ok'}`}>{r.status}</span></td>
                  <td style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-sm" onClick={()=>{ setAssignPo(r.id); }}>إسناد سائق</button>
                    <a className="btn btn-sm btn-outline" href={`${apiBase}/api/admin/logistics/pickup/export/csv?status=waiting`}>PDF</a>
                    <button className="btn btn-sm btn-outline" onClick={()=> changeStatus(r.id, 'RECEIVED')}>تغيير الحالة</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==='in_progress' && (
        <div className="mt-4">
          <table className="table">
            <thead><tr><th>اسم المورد</th><th>اسم السائق</th><th>الحالة</th><th>الوقت المنقضي</th><th>عدد المنتجات</th><th>إجراءات</th></tr></thead>
            <tbody>
              {rows.map((r:any)=> (
                <tr key={r.id}>
                  <td>{r.vendorName||'-'}</td>
                  <td>{r.driverName||'-'}</td>
                  <td><span className="badge warn">قيد التنفيذ</span></td>
                  <td>—</td>
                  <td>{Number(r.itemsCount||0)}</td>
                  <td><button className="btn btn-sm btn-outline" onClick={()=> changeStatus(r.id, 'RECEIVED')}>تغيير الحالة</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==='completed' && (
        <div className="mt-4">
          <table className="table">
            <thead><tr><th>المورد</th><th>السائق</th><th>حالة تسليم المورد</th><th>حالة استلام السائق</th><th>الوقت</th><th>عدد المنتجات</th><th>إجراءات</th></tr></thead>
            <tbody>
              {rows.map((r:any)=> (
                <tr key={r.id}>
                  <td>{r.vendorName||'-'}</td>
                  <td>{r.driverName||'-'}</td>
                  <td><span className="badge ok">تم</span></td>
                  <td><span className="badge ok">تم</span></td>
                  <td>{new Date(r.updatedAt||r.createdAt||Date.now()).toLocaleString()}</td>
                  <td>{Number(r.itemsCount||0)}</td>
                  <td><a className="btn btn-sm" href={`${apiBase}/api/admin/logistics/pickup/export/csv?status=completed`}>تصدير</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

