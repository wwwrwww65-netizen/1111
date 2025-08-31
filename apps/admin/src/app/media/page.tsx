"use client";
import React from "react";

export default function MediaPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [url, setUrl] = React.useState("");
  React.useEffect(()=>{ fetch('/api/admin/media/list').then(r=>r.json()).then(j=>setRows(j.assets||[])); },[]);
  async function add() {
    await fetch('/api/admin/media', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ url, type:'image' }) });
    setUrl("");
    const j = await (await fetch('/api/admin/media/list')).json(); setRows(j.assets||[]);
  }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>الوسائط</h1>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://..." style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={add} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>إضافة</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
        {rows.map((a)=> (
          <div key={a.id} style={{ border:'1px solid #1c2333', borderRadius:8, overflow:'hidden' }}>
            <img src={a.url} alt={a.alt||''} style={{ width:'100%', height:140, objectFit:'cover' }} />
          </div>
        ))}
      </div>
    </main>
  );
}

