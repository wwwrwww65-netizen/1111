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
  const [search, setSearch] = React.useState("");
  React.useEffect(()=>{ fetch('/api/admin/vendors/list').then(r=>r.json()).then(j=>setRows(j.vendors||[])); },[]);
  async function save() {
    await fetch('/api/admin/vendors', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name, contactEmail: email, phone, address, storeName, storeNumber, vendorCode }) });
    setName(""); setEmail(""); setPhone(""); setAddress(""); setStoreName(""); setStoreNumber(""); setVendorCode("");
    const j = await (await fetch('/api/admin/vendors/list')).json(); setRows(j.vendors||[]);
  }
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <h1 style={{ marginBottom: 16, fontSize: 22, fontWeight: 700 }}>المورّدون</h1>
      <section style={{ background: '#0b0e14', border: '1px solid #1c2333', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>إضافة مورد جديد</h2>
          <div style={{ display:'flex', gap:8 }}>
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالاسم/الكود" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0', width:220 }} />
            <button onClick={()=>{ /* optional client-side filter */ }} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>بحث</button>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(0,1fr)) auto', gap:8 }}>
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="الاسم" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="البريد" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="الهاتف" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          <input value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="العنوان" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          <input value={storeName} onChange={(e)=>setStoreName(e.target.value)} placeholder="اسم المتجر" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          <input value={storeNumber} onChange={(e)=>setStoreNumber(e.target.value)} placeholder="رقم المتجر" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          <input value={vendorCode} onChange={(e)=>setVendorCode(e.target.value)} placeholder="رمز المورد (SKU prefix)" style={{ padding:10, borderRadius:10, background:'#0f1320', border:"1px solid #1c2333", color:'#e2e8f0' }} />
          <button onClick={save} style={{ padding:'10px 14px', background:'#800020', color:'#fff', borderRadius:10 }}>حفظ</button>
        </div>
      </section>
      <section style={{ background: '#0b0e14', border: '1px solid #1c2333', borderRadius: 12, padding: 12 }}>
        <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
          <thead>
            <tr>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}>الاسم</th>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}>البريد</th>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}>الهاتف</th>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}>الكود</th>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((v)=> !search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.vendorCode?.toLowerCase().includes(search.toLowerCase()))
              .map((v, idx)=> (
              <tr key={v.id} style={{ background: idx % 2 ? '#0a0e17' : 'transparent' }}>
                <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ padding:'2px 8px', background:'#111827', borderRadius:999, fontSize:12, color:'#9ca3af' }}>{v.vendorCode||'NO-CODE'}</span>
                    <span>{v.name}</span>
                  </div>
                </td>
                <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{v.contactEmail||'-'}</td>
                <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{v.phone||'-'}</td>
                <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{v.vendorCode||'-'}</td>
                <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                  <a href={`/vendors/${v.id}`} style={{ padding:'8px 12px', background:'#374151', color:'#e5e7eb', borderRadius:8, textDecoration:'none' }}>عرض</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

