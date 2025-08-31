"use client";
import React from "react";

export default function CouponsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [code, setCode] = React.useState("");
  const [discountType, setDiscountType] = React.useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = React.useState<string>("10");

  async function load() {
    const res = await fetch("/api/admin/coupons/list");
    const json = await res.json();
    setRows(json.coupons || []);
  }
  React.useEffect(()=>{ load(); }, []);

  async function create() {
    await fetch('/api/admin/coupons', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ code, discountType, discountValue: Number(discountValue), validFrom: new Date().toISOString(), validUntil: new Date(Date.now()+7*86400000).toISOString() }) });
    setCode("");
    await load();
  }

  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>الكوبونات</h1>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="CODE" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <select value={discountType} onChange={(e)=>setDiscountType(e.target.value)} style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
          <option value="PERCENTAGE">PERCENTAGE</option>
          <option value="FIXED">FIXED</option>
        </select>
        <input type="number" value={discountValue} onChange={(e)=>setDiscountValue(e.target.value)} placeholder="Value" style={{ width:120, padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={create} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>إنشاء</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الكود</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>النوع</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>القيمة</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c)=> (
            <tr key={c.id}>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{c.code}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{c.discountType}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{c.discountValue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

export default function CouponsPage(): JSX.Element {
  return (
    <main style={{padding:'16px'}}>
      <h1>الكوبونات</h1>
      <p>قريباً: إنشاء/تعديل/تعطيل الكوبونات وتتبع الاستخدام.</p>
    </main>
  );
}

