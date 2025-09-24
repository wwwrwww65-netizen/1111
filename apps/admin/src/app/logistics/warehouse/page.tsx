"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function WarehousePage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [tab, setTab] = React.useState<'inbound'|'sorting'|'ready'>('inbound');
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  async function load(){
    setLoading(true);
    try {
      const url = new URL(`/api/admin/logistics/warehouse/list`, window.location.origin);
      url.searchParams.set('tab', tab);
      const j = await (await fetch(url.toString(), { credentials:'include' })).json();
      setItems(j.items||[]);
    } finally { setLoading(false); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase, tab]);

  async function confirmInbound(shipmentId: string){
    await fetch(`/api/admin/logistics/warehouse/inbound/confirm`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ shipmentId }) });
    await load();
  }
  async function addSortingResult(packageId: string, match:boolean){
    await fetch(`/api/admin/logistics/warehouse/sorting/result`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ packageId, match }) });
    await load();
  }
  async function assignReady(packageId: string){
    const driverId = prompt('معرّف السائق للتسليم:') || '';
    if (!driverId) return;
    await fetch(`/api/admin/logistics/warehouse/ready/assign`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ packageId, driverId }) });
    await load();
  }
  return (
    <div className="panel" style={{ padding:16 }}>
      <h1 className="text-xl font-bold mb-3">المستودع: المعالجة والاستلام</h1>
      <div className="toolbar" style={{ display:'flex', gap:8, position:'sticky', top:0, background:'var(--panel)', zIndex:10, padding:'6px 0' }}>
        <button className={`btn btn-sm ${tab==='inbound'?'':'btn-outline'}`} onClick={()=> setTab('inbound')}>الاستلام من السائق</button>
        <button className={`btn btn-sm ${tab==='sorting'?'':'btn-outline'}`} onClick={()=> setTab('sorting')}>الفرز والجرد</button>
        <button className={`btn btn-sm ${tab==='ready'?'':'btn-outline'}`} onClick={()=> setTab('ready')}>جاهز للتسليم</button>
        <a className="btn btn-sm" href={`/api/admin/logistics/warehouse/export/csv?tab=${tab}`}>تصدير CSV</a>
        <a className="btn btn-sm btn-outline" href={`/api/admin/logistics/warehouse/export/xls?tab=${tab}`}>تصدير Excel</a>
      </div>

      {tab==='inbound' && (
        <div className="mt-4">
          {loading && (<div className="panel"><div style={{ height:48, background:'var(--muted2)', borderRadius:8, marginBottom:8 }} /><div style={{ height:48, background:'var(--muted2)', borderRadius:8 }} /></div>)}
          {!loading && items.length===0 && (<div className="panel" style={{ display:'grid', placeItems:'center', padding:24, color:'var(--sub)' }}>لا عناصر</div>)}
          <table className="table">
            <thead><tr><th>رقم الشحنة</th><th>السائق</th><th>وقت الوصول</th><th>الحالة</th><th>إجراءات</th></tr></thead>
            <tbody>{items.map((r:any)=> (
              <tr key={r.shipmentId}><td>{r.shipmentId}</td><td>{r.driverName||'-'}</td><td>{new Date(r.arrivedAt||Date.now()).toLocaleString()}</td><td><span className="badge warn">وارد حديثاً</span></td><td style={{ display:'flex', gap:6 }}><button className="btn btn-sm" onClick={()=> confirmInbound(r.shipmentId)}>تأكيد الاستلام</button><button className="btn btn-sm btn-outline">التقاط صورة</button><button className="btn btn-sm btn-outline">ملاحظات</button><button className="btn btn-sm btn-outline">طباعة إيصال</button></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab==='sorting' && (
        <div className="mt-4">
          {loading && (<div className="panel"><div style={{ height:48, background:'var(--muted2)', borderRadius:8, marginBottom:8 }} /><div style={{ height:48, background:'var(--muted2)', borderRadius:8 }} /></div>)}
          {!loading && items.length===0 && (<div className="panel" style={{ display:'grid', placeItems:'center', padding:24, color:'var(--sub)' }}>لا عناصر</div>)}
          <table className="table">
            <thead><tr><th>المعرف</th><th>الباركود</th><th>الحالة</th><th>العمليات</th></tr></thead>
            <tbody>{items.map((p:any)=> (
              <tr key={p.packageId}><td>{p.packageId}</td><td>{p.barcode}</td><td>{p.status}</td><td style={{ display:'flex', gap:6 }}><button className="btn btn-sm" onClick={()=> addSortingResult(p.packageId, true)}>تأكيد المطابقة</button><button className="btn btn-sm btn-outline" onClick={()=> addSortingResult(p.packageId, false)}>تسجيل اختلاف</button><button className="btn btn-sm btn-outline">توثيق مشكلة</button><button className="btn btn-sm btn-outline">تقرير الجرد</button></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab==='ready' && (
        <div className="mt-4">
          {loading && (<div className="panel"><div style={{ height:48, background:'var(--muted2)', borderRadius:8, marginBottom:8 }} /><div style={{ height:48, background:'var(--muted2)', borderRadius:8 }} /></div>)}
          {!loading && items.length===0 && (<div className="panel" style={{ display:'grid', placeItems:'center', padding:24, color:'var(--sub)' }}>لا عناصر</div>)}
          <table className="table">
            <thead><tr><th>المعرف</th><th>الباركود</th><th>الحالة</th><th>إجراءات</th></tr></thead>
            <tbody>{items.map((p:any)=> (
              <tr key={p.packageId}><td>{p.packageId}</td><td>{p.barcode}</td><td><span className="badge ok">READY</span></td><td style={{ display:'flex', gap:6 }}><button className="btn btn-sm" onClick={()=> assignReady(p.packageId)}>تعيين سائق</button><button className="btn btn-sm btn-outline">طباعة الملصقات</button><button className="btn btn-sm btn-outline">تأكيد التسليم</button><button className="btn btn-sm btn-outline">إيصال الاستلام</button></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {message && <div className="text-sm" style={{ color:'#9ae6b4' }}>{message}</div>}
    </div>
  );
}

