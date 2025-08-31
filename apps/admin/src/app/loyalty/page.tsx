"use client";
import React from "react";

export default function LoyaltyPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  React.useEffect(()=>{ fetch('/api/admin/loyalty/list').then(r=>r.json()).then(j=>setRows(j.points||[])); },[]);
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>الولاء</h1>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><th style={{textAlign:'right',borderBottom:'1px solid #1c2333',padding:8}}>المستخدم</th><th style={{textAlign:'right',borderBottom:'1px solid #1c2333',padding:8}}>النقاط</th></tr></thead>
        <tbody>
          {rows.map((r)=> (
            <tr key={r.id}><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{r.userId}</td><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{r.points}</td></tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

