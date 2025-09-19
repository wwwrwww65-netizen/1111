"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function DeliveryPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [tab, setTab] = React.useState<'ready'|'in_delivery'|'completed'|'returns'>('ready');
  const [items, setItems] = React.useState<any[]>([]);
  const [message, setMessage] = React.useState('');
  const [assignOrder, setAssignOrder] = React.useState('');
  const [assignDriver, setAssignDriver] = React.useState('');

  async function load(){
    const url = new URL(`${apiBase}/api/admin/logistics/delivery/list`);
    url.searchParams.set('tab', tab);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setItems(j.items||[]);
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase, tab]);

  async function assign(){
    setMessage('');
    if (!assignOrder || !assignDriver) { setMessage('ادخل الطلب والسائق'); return; }
    const r = await fetch(`${apiBase}/api/admin/logistics/delivery/assign`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderId: assignOrder, driverId: assignDriver }) });
    if (!r.ok) { setMessage('تعذر التوزيع'); return; }
    setMessage('تم التوزيع'); setAssignOrder(''); setAssignDriver(''); await load();
  }

  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">التوصيل إلى العميل</h1>
      <div className="toolbar" style={{ display:'flex', gap:8 }}>
        <button className={`btn btn-sm ${tab==='ready'?'':'btn-outline'}`} onClick={()=> setTab('ready')}>الطلبات الجاهزة</button>
        <button className={`btn btn-sm ${tab==='in_delivery'?'':'btn-outline'}`} onClick={()=> setTab('in_delivery')}>قيد التوصيل</button>
        <button className={`btn btn-sm ${tab==='completed'?'':'btn-outline'}`} onClick={()=> setTab('completed')}>مكتمل</button>
        <button className={`btn btn-sm ${tab==='returns'?'':'btn-outline'}`} onClick={()=> setTab('returns')}>مرتجعات</button>
        <a className="btn btn-sm" href={`${apiBase}/api/admin/logistics/delivery/export/csv?tab=${tab}`}>تصدير CSV</a>
      </div>

      {tab==='ready' && (
        <div className="mt-4">
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
            <input className="input" placeholder="رقم الطلب" value={assignOrder} onChange={e=> setAssignOrder(e.target.value)} />
            <input className="input" placeholder="معرّف السائق" value={assignDriver} onChange={e=> setAssignDriver(e.target.value)} />
            <button className="btn" onClick={assign}>تعيين سائق</button>
            {message && <div className="text-sm" style={{ color:'#9ae6b4' }}>{message}</div>}
          </div>
          <table className="table">
            <thead><tr><th>رقم الطلب</th><th>العميل</th><th>العنوان</th><th>القيمة الإجمالية</th><th>إجراءات</th></tr></thead>
            <tbody>{items.map((o:any)=> (
              <tr key={o.orderId}><td>{o.orderId}</td><td>{o.customer||'-'}</td><td>{o.address||'-'}</td><td>${Number(o.total||0).toFixed(2)}</td><td style={{ display:'flex', gap:6 }}><button className="btn btn-sm">تخطيط المسار</button><button className="btn btn-sm btn-outline">تجميع الطلبات</button><button className="btn btn-sm btn-outline">طباعة الفواتير</button></td></tr>
            ))}</tbody>
          </table>
          <div className="panel" style={{ marginTop:12 }}>خريطة (placeholder)</div>
        </div>
      )}

      {tab==='in_delivery' && (
        <div className="mt-4">
          <table className="table">
            <thead><tr><th>رقم الطلب</th><th>السائق</th><th>الحالة</th><th>آخر تحديث</th><th>مؤشر</th></tr></thead>
            <tbody>{items.map((o:any)=> (
              <tr key={o.orderId}><td>{o.orderId}</td><td>{o.driver||'-'}</td><td>{o.status}</td><td>{new Date(o.updatedAt||Date.now()).toLocaleString()}</td><td><span className="badge warn">في الطريق</span></td></tr>
            ))}</tbody>
          </table>
          <div className="panel" style={{ marginTop:12 }}>خريطة حية (placeholder)</div>
        </div>
      )}

      {tab==='completed' && (
        <div className="mt-4">
          <table className="table">
            <thead><tr><th>رقم الطلب</th><th>وقت التسليم</th><th>الدفع</th><th>إجراءات</th></tr></thead>
            <tbody>{items.map((o:any)=> (
              <tr key={o.orderId}><td>{o.orderId}</td><td>{new Date(o.deliveredAt||Date.now()).toLocaleString()}</td><td>{o.paymentStatus||'-'}</td><td style={{ display:'flex', gap:6 }}><button className="btn btn-sm btn-outline">عرض التقييم</button><button className="btn btn-sm btn-outline">تفاصيل التسليم</button><button className="btn btn-sm btn-outline">إشعار شكر</button></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab==='returns' && (
        <div className="mt-4">
          <table className="table">
            <thead><tr><th>رقم الإرجاع</th><th>التاريخ</th><th>السبب</th><th>إجراءات</th></tr></thead>
            <tbody>{items.map((r:any)=> (
              <tr key={r.returnId}><td>{r.returnId}</td><td>{new Date(r.createdAt||Date.now()).toLocaleString()}</td><td>{r.reason||'-'}</td><td style={{ display:'flex', gap:6 }}><button className="btn btn-sm">إعادة المحاولة</button><button className="btn btn-sm btn-outline">الاتصال</button><button className="btn btn-sm btn-outline">تحديث العنوان</button><button className="btn btn-sm btn-outline">إرجاع للمستودع</button></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

