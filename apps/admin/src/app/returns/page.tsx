"use client";
import React from "react";

export default function ReturnsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  React.useEffect(()=>{ fetch('/api/admin/returns/list').then(r=>r.json()).then(j=>setRows(j.returns||[])); },[]);
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>المرتجعات</h1>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><th style={{textAlign:'right',borderBottom:'1px solid #1c2333',padding:8}}>الطلب</th><th style={{textAlign:'right',borderBottom:'1px solid #1c2333',padding:8}}>الحالة</th></tr></thead>
        <tbody>
          {rows.map((r)=> (
            <tr key={r.id}><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{r.orderId}</td><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{r.status}</td></tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

