"use client";
import React from "react";

export default function TicketsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [subject, setSubject] = React.useState("");
  React.useEffect(()=>{ fetch('/api/admin/tickets').then(r=>r.json()).then(j=>setRows(j.tickets||[])); },[]);
  async function create() {
    await fetch('/api/admin/tickets', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ subject }) });
    setSubject("");
    const j = await (await fetch('/api/admin/tickets')).json();
    setRows(j.tickets||[]);
  }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>الدعم</h1>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="الموضوع" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={create} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>إنشاء</button>
      </div>
      <ul>
        {rows.map((t)=> (
          <li key={t.id} style={{ padding:8, border:'1px solid #1c2333', borderRadius:8, marginBottom:8 }}>{t.subject} • {t.status}</li>
        ))}
      </ul>
    </main>
  );
}

