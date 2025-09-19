"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function PickupPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [driverId, setDriverId] = React.useState('');
  const [barcode, setBarcode] = React.useState('');
  const [message, setMessage] = React.useState('');
  async function assign() { setMessage(''); if (!driverId) { setMessage('اختر سائقاً'); return; } setMessage('تم التعيين (نموذج أولي)'); }
  async function scanPickup() {
    setMessage('');
    if (!barcode.trim()) { setMessage('ادخل الباركود'); return; }
    // Placeholder: POST scan to API (to be implemented)
    try {
      await fetch(`${apiBase}/api/admin/logistics/scans`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ scanType:'PICKUP', barcode }) });
      setMessage('تم تسجيل الاستلام'); setBarcode('');
    } catch { setMessage('تعذر التسجيل'); }
  }
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">التوصيل من المورد إلى المستودع</h1>
      <div className="toolbar" style={{ display:'flex', gap:8 }}>
        <input className="input" placeholder="معرّف السائق" value={driverId} onChange={e=> setDriverId(e.target.value)} />
        <button className="btn btn-sm" onClick={assign}>إسناد للسائق</button>
      </div>
      <div className="mt-4" style={{ display:'grid', gap:8, maxWidth:420 }}>
        <label>مسح/إدخال باركود الطرد:</label>
        <input className="input" placeholder="Barcode" value={barcode} onChange={e=> setBarcode(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter') scanPickup(); }} />
        <button className="btn" onClick={scanPickup}>تأكيد الاستلام (PICKUP)</button>
        {message && <div className="text-sm" style={{ color:'#9ae6b4' }}>{message}</div>}
      </div>
    </div>
  );
}

