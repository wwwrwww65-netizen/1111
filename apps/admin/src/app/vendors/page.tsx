"use client";
import React from "react";

export default function VendorsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  React.useEffect(()=>{ fetch('/api/admin/vendors/list').then(r=>r.json()).then(j=>setRows(j.vendors||[])); },[]);
  async function save() {
    await fetch('/api/admin/vendors', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name, contactEmail: email, phone }) });
    setName(""); setEmail(""); setPhone("");
    const j = await (await fetch('/api/admin/vendors/list')).json(); setRows(j.vendors||[]);
  }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>المورّدون</h1>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:8, marginBottom:12 }}>
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="الاسم" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="البريد" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="الهاتف" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={save} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>حفظ</button>
      </div>
      <ul>
        {rows.map((v)=> (<li key={v.id} style={{ padding:8, border:'1px solid #1c2333', borderRadius:8, marginBottom:8 }}>{v.name} • {v.contactEmail}</li>))}
      </ul>
    </main>
  );
}

