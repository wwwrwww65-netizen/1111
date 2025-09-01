"use client";
import React from "react";

export default function VendorsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [storeName, setStoreName] = React.useState("");
  const [storeNumber, setStoreNumber] = React.useState("");
  const [vendorCode, setVendorCode] = React.useState("");
  React.useEffect(()=>{ fetch('/api/admin/vendors/list').then(r=>r.json()).then(j=>setRows(j.vendors||[])); },[]);
  async function save() {
    await fetch('/api/admin/vendors', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name, contactEmail: email, phone, address, storeName, storeNumber, vendorCode }) });
    setName(""); setEmail(""); setPhone(""); setAddress(""); setStoreName(""); setStoreNumber(""); setVendorCode("");
    const j = await (await fetch('/api/admin/vendors/list')).json(); setRows(j.vendors||[]);
  }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>المورّدون</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr) auto', gap:8, marginBottom:12 }}>
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="الاسم" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="البريد" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="الهاتف" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <input value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="العنوان" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <input value={storeName} onChange={(e)=>setStoreName(e.target.value)} placeholder="اسم المتجر" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <input value={storeNumber} onChange={(e)=>setStoreNumber(e.target.value)} placeholder="رقم المتجر" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <input value={vendorCode} onChange={(e)=>setVendorCode(e.target.value)} placeholder="رمز المورد (SKU prefix)" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={save} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>حفظ</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الاسم</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>البريد</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الهاتف</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الكود</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v)=> (
            <tr key={v.id}>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{v.name}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{v.contactEmail||'-'}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{v.phone||'-'}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{v.vendorCode||'-'}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                <a href={`/vendors/${v.id}`} style={{ padding:'6px 10px', background:'#374151', color:'#e5e7eb', borderRadius:6 }}>عرض</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

