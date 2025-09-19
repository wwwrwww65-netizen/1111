"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function DeliveryPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [orderId, setOrderId] = React.useState('');
  const [driverId, setDriverId] = React.useState('');
  const [barcode, setBarcode] = React.useState('');
  const [message, setMessage] = React.useState('');
  async function dispatch() {
    setMessage('');
    if (!orderId || !driverId) { setMessage('ادخل الطلب والسائق'); return; }
    try { await fetch(`${apiBase}/api/admin/logistics/legs/delivery/dispatch`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderId, driverId }) }); setMessage('تم توزيع الطلب على السائق'); } catch { setMessage('تعذر التوزيع'); }
  }
  async function confirmDelivered() {
    setMessage('');
    if (!barcode.trim()) { setMessage('ادخل باركود'); return; }
    try { await fetch(`${apiBase}/api/admin/logistics/scans`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ scanType:'DELIVERED', barcode }) }); setMessage('تم تسليم الشحنة'); setBarcode(''); } catch { setMessage('تعذر التحديث'); }
  }
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">التوصيل إلى العميل</h1>
      <div className="toolbar" style={{ display:'flex', gap:8 }}>
        <input className="input" placeholder="رقم الطلب" value={orderId} onChange={e=> setOrderId(e.target.value)} />
        <input className="input" placeholder="معرّف السائق" value={driverId} onChange={e=> setDriverId(e.target.value)} />
        <button className="btn btn-sm" onClick={dispatch}>توزيع</button>
      </div>
      <div className="mt-4" style={{ display:'grid', gap:8, maxWidth:420 }}>
        <label>تأكيد التسليم (باركود):</label>
        <input className="input" placeholder="Barcode" value={barcode} onChange={e=> setBarcode(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter') confirmDelivered(); }} />
        <button className="btn" onClick={confirmDelivered}>تأكيد التسليم</button>
        {message && <div className="text-sm" style={{ color:'#9ae6b4' }}>{message}</div>}
      </div>
    </div>
  );
}

