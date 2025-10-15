"use client";
import React from "react";

export default function ProductBundlesPage({ params }:{ params:{ id:string } }): JSX.Element {
  const productId = params.id;
  const [items, setItems] = React.useState<string[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(""), 1500); };

  async function load(){
    try{ const j = await (await fetch(`/api/admin/bundles/${encodeURIComponent(productId)}`, { credentials:'include' })).json(); setItems(Array.isArray(j.items)? j.items: []); }catch{}
  }
  React.useEffect(()=>{ load(); }, [productId]);

  function add(){ const v = input.trim(); if (!v) return; setItems(s=> Array.from(new Set([...s, v]))); setInput(""); }
  function remove(id:string){ setItems(s=> s.filter(x=> x!==id)); }

  async function save(){ try{ setBusy(true); await fetch(`/api/admin/bundles/${encodeURIComponent(productId)}`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ items }) }); showToast('تم الحفظ'); }catch{ showToast('فشل الحفظ'); } finally{ setBusy(false); } }

  return (
    <main className="panel">
      <h1>حزم المنتج</h1>
      <div style={{ display:'flex', gap:8 }}>
        <input value={input} onChange={(e)=> setInput(e.target.value)} placeholder="ID منتج لإضافته" />
        <button onClick={add} className="btn btn-outline">إضافة</button>
      </div>
      <ul style={{ marginTop:12, display:'grid', gap:6 }}>
        {items.map((id)=> (
          <li key={id} style={{ display:'flex', justifyContent:'space-between', border:'1px solid #1c2333', padding:8, borderRadius:8 }}>
            <span>{id}</span>
            <button onClick={()=> remove(id)} className="btn btn-outline">إزالة</button>
          </li>
        ))}
        {!items.length && <li style={{ opacity:0.7 }}>لا توجد عناصر</li>}
      </ul>
      <div style={{ display:'flex', gap:8, marginTop:12 }}>
        <button onClick={save} disabled={busy} className="btn">حفظ</button>
        {toast && <span>{toast}</span>}
      </div>
    </main>
  );
}


