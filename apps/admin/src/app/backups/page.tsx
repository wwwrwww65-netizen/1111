"use client";
import React from "react";

export default function BackupsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  async function load(){ const j = await (await fetch('/api/admin/backups/list')).json(); setRows(j.backups||[]); }
  React.useEffect(()=>{ load(); },[]);
  async function run(){ await fetch('/api/admin/backups/run', { method:'POST' }); await load(); }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>النسخ الاحتياطي</h1>
      <button onClick={run} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8, marginBottom:12 }}>تشغيل نسخة</button>
      <ul>
        {rows.map((b)=> (<li key={b.id} style={{ padding:8, border:'1px solid #1c2333', borderRadius:8, marginBottom:8 }}>{b.status} • {new Date(b.createdAt).toLocaleString()}</li>))}
      </ul>
    </main>
  );
}

