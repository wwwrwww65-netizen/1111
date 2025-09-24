"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { useToast, useConfirm } from '../../providers';

export default function PickupPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const { push } = useToast();
  const { ask } = useConfirm();
  const [tab, setTab] = React.useState<'waiting'|'in_progress'|'completed'>('waiting');
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [assignPo, setAssignPo] = React.useState<string>('');
  const [assignDriver, setAssignDriver] = React.useState<string>('');
  // local filters
  const [vendorText, setVendorText] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');

  async function load(){
    setLoading(true);
    try{
      const url = new URL(`/api/admin/logistics/pickup/list`, window.location.origin);
      url.searchParams.set('status', tab);
      const j = await (await fetch(url.toString(), { credentials:'include' })).json();
      // API returns { pickups: [...] }
      setRows(j.pickups || j.pickup || []);
    } finally { setLoading(false); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase, tab]);

  async function doAssign(){
    setMessage('');
    if (!assignPo || !assignDriver) { setMessage('ادخل المورد والسائق'); return; }
    const res = await fetch(`/api/admin/status/change`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ entity:'pickup', id: assignPo, action:'assign', extra:{ driverId: assignDriver } }) });
    if (!res.ok) { push({ type:'err', message:'تعذر الإسناد' }); setMessage('تعذر الإسناد'); return; }
    push({ type:'ok', message:'تم إسناد السائق' });
    setMessage('تم الإسناد'); setAssignPo(''); setAssignDriver('');
    await load();
  }
  async function changeStatus(poId: string, status: string){
    const ok = await ask({ title:'تأكيد تغيير الحالة؟' });
    if(!ok) return;
    await fetch(`/api/admin/status/change`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ entity:'pickup', id: poId, action: status }) });
    push({ type:'ok', message:'تم تحديث الحالة' });
    await load();
  }
  const Empty = !loading && rows.length===0 ? (
    <div className="panel" style={{ display:'grid', placeItems:'center', padding:24, color:'var(--sub)' }}>
      لا توجد عناصر لهذا التبويب.
    </div>
  ) : null;
  const Skeleton = loading ? (
    <div className="panel">
      <div className="skeleton-row" style={{ height:48, background:'var(--muted2)', borderRadius:8, marginBottom:8 }} />
      <div className="skeleton-row" style={{ height:48, background:'var(--muted2)', borderRadius:8, marginBottom:8 }} />
      <div className="skeleton-row" style={{ height:48, background:'var(--muted2)', borderRadius:8 }} />
    </div>
  ) : null;
  const filtered = rows.filter((r:any)=>{
    const passVendor = !vendorText || String(r.vendorName||'').toLowerCase().includes(vendorText.toLowerCase());
    const ts = new Date(r.createdAt||r.updatedAt||Date.now()).getTime();
    const passFrom = !dateFrom || ts >= new Date(dateFrom+'T00:00:00').getTime();
    const passTo = !dateTo || ts <= new Date(dateTo+'T23:59:59').getTime();
    return passVendor && passFrom && passTo;
  });
  return (
    <div className="panel" style={{ padding:16 }}>
      <h1 className="text-xl font-bold mb-3">التوصيل من المورد</h1>
      <div className="toolbar" style={{ display:'flex', gap:8, position:'sticky', top:0, background:'var(--panel)', zIndex:10, padding:'6px 0' }}>
        <button className={`btn btn-sm ${tab==='waiting'?'':'btn-outline'}`} onClick={()=> setTab('waiting')}>قيد الانتظار</button>
        <button className={`btn btn-sm ${tab==='in_progress'?'':'btn-outline'}`} onClick={()=> setTab('in_progress')}>قيد التنفيذ</button>
        <button className={`btn btn-sm ${tab==='completed'?'':'btn-outline'}`} onClick={()=> setTab('completed')}>مكتمل</button>
        <a className="btn btn-sm" href={`/api/admin/logistics/pickup/export/csv?status=${tab}`}>تصدير CSV</a>
        <a className="btn btn-sm btn-outline" href={`/api/admin/logistics/pickup/export/xls?status=${tab}`}>تصدير Excel</a>
      </div>

      <div className="toolbar" style={{ display:'flex', gap:8, marginTop:8 }}>
        <input className="input" placeholder="بحث المورد" value={vendorText} onChange={e=> setVendorText(e.target.value)} />
        <input className="input" type="date" value={dateFrom} onChange={e=> setDateFrom(e.target.value)} />
        <input className="input" type="date" value={dateTo} onChange={e=> setDateTo(e.target.value)} />
      </div>

      <div className="mt-4" style={{ display:'flex', gap:12, alignItems:'center' }}>
        <input className="input" placeholder="معرّف طلب المورد (PO)" value={assignPo} onChange={e=> setAssignPo(e.target.value)} />
        <input className="input" placeholder="معرّف السائق" value={assignDriver} onChange={e=> setAssignDriver(e.target.value)} />
        <button className="btn" onClick={doAssign}>إسناد سائق</button>
        {message && <div className="text-sm" style={{ color:'#9ae6b4' }}>{message}</div>}
      </div>

      {tab==='waiting' && (
        <div className="mt-4">
          {Skeleton}
          {Empty}
          {filtered.length>0 && (
            <table className="table">
              <thead style={{ position:'sticky', top:48, zIndex:5, background:'var(--panel)'}}><tr><th>اسم المورد</th><th>الموقع</th><th>عدد المنتجات</th><th>حالة الطلب</th><th>الإجراءات</th></tr></thead>
              <tbody>
                {filtered.map((r:any)=> (
                  <tr key={r.id}>
                    <td>{r.vendorName||'-'}</td>
                    <td>{r.vendorAddress||'-'}</td>
                    <td>{Number(r.itemsCount||0)}</td>
                    <td><span className={`badge ${String(r.status).toUpperCase()==='SUBMITTED'?'warn':'ok'}`}>{r.status}</span></td>
                    <td style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-sm" onClick={()=>{ setAssignPo(r.poId||r.id); }}>إسناد سائق</button>
                      <a className="btn btn-sm btn-outline" href={`/api/admin/logistics/pickup/export/csv?status=waiting`}>PDF</a>
                      <button className="btn btn-sm btn-outline" onClick={()=> changeStatus(r.poId||r.id, 'receive')}>استلام</button>
                      <button className="btn btn-sm btn-outline" onClick={()=> changeStatus(r.poId||r.id, 'start')}>بدء</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab==='in_progress' && (
        <div className="mt-4">
          {Skeleton}
          {Empty}
          {filtered.length>0 && (
            <table className="table">
              <thead style={{ position:'sticky', top:48, zIndex:5, background:'var(--panel)'}}><tr><th>اسم المورد</th><th>اسم السائق</th><th>الحالة</th><th>الوقت المنقضي</th><th>عدد المنتجات</th><th>إجراءات</th></tr></thead>
              <tbody>
                {filtered.map((r:any)=> (
                  <tr key={r.id}>
                    <td>{r.vendorName||'-'}</td>
                    <td>{r.driverName||'-'}</td>
                    <td><span className="badge warn">قيد التنفيذ</span></td>
                    <td>—</td>
                    <td>{Number(r.itemsCount||0)}</td>
                    <td><button className="btn btn-sm btn-outline" onClick={()=> changeStatus(r.id, 'receive')}>تغيير الحالة</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab==='completed' && (
        <div className="mt-4">
          {Skeleton}
          {Empty}
          {filtered.length>0 && (
            <table className="table">
              <thead style={{ position:'sticky', top:48, zIndex:5, background:'var(--panel)'}}><tr><th>المورد</th><th>السائق</th><th>حالة تسليم المورد</th><th>حالة استلام السائق</th><th>الوقت</th><th>عدد المنتجات</th><th>إجراءات</th></tr></thead>
              <tbody>
                {filtered.map((r:any)=> (
                  <tr key={r.id}>
                    <td>{r.vendorName||'-'}</td>
                    <td>{r.driverName||'-'}</td>
                    <td><span className="badge ok">تم</span></td>
                    <td><span className="badge ok">تم</span></td>
                    <td>{new Date(r.updatedAt||r.createdAt||Date.now()).toLocaleString()}</td>
                    <td>{Number(r.itemsCount||0)}</td>
                    <td><a className="btn btn-sm" href={`/api/admin/logistics/pickup/export/csv?status=completed`}>تصدير</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

