"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function WarehousePage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [barcode, setBarcode] = React.useState('');
  const [message, setMessage] = React.useState('');
  async function scanInbound() {
    setMessage('');
    if (!barcode.trim()) { setMessage('ادخل الباركود'); return; }
    try { await fetch(`${apiBase}/api/admin/logistics/scans`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ scanType:'INBOUND', barcode }) }); setMessage('تم تسجيل الدخول للمستودع (INBOUND)'); setBarcode(''); } catch { setMessage('تعذر التسجيل'); }
  }
  async function markPacked() {
    setMessage('');
    if (!barcode.trim()) { setMessage('ادخل الباركود'); return; }
    try { await fetch(`${apiBase}/api/admin/logistics/scans`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ scanType:'PACKED', barcode }) }); setMessage('تم وضع علامة مُغلف (PACKED)'); setBarcode(''); } catch { setMessage('تعذر التسجيل'); }
  }
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">المعالجة في المستودع</h1>
      <div style={{ display:'grid', gap:8, maxWidth:420 }}>
        <label>مسح/إدخال باركود:</label>
        <input className="input" placeholder="Barcode" value={barcode} onChange={e=> setBarcode(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter') scanInbound(); }} />
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={scanInbound}>تأكيد INBOUND</button>
          <button className="btn btn-outline" onClick={markPacked}>تحديد PACKED</button>
        </div>
        {message && <div className="text-sm" style={{ color:'#9ae6b4' }}>{message}</div>}
      </div>
    </div>
  );
}

