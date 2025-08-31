"use client";
import React from "react";

export default function AuditLogsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(1);
  async function load(){
    const url = new URL(window.location.origin + '/api/admin/audit-logs');
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', '20');
    const j = await (await fetch(url.toString())).json(); setRows(j.logs||[]);
  }
  React.useEffect(()=>{ load(); }, [page]);
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>سجلّ التدقيق</h1>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr>
          <th style={{textAlign:'right',borderBottom:'1px solid #1c2333',padding:8}}>الموديل</th>
          <th style={{textAlign:'right',borderBottom:'1px solid #1c2333',padding:8}}>الفعل</th>
          <th style={{textAlign:'right',borderBottom:'1px solid #1c2333',padding:8}}>التفاصيل</th>
          <th style={{textAlign:'right',borderBottom:'1px solid #1c2333',padding:8}}>الوقت</th>
        </tr></thead>
        <tbody>
          {rows.map((l)=> (
            <tr key={l.id}>
              <td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{l.module}</td>
              <td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{l.action}</td>
              <td style={{padding:8,borderBottom:'1px solid #1c2333'}}><code style={{fontSize:12}}>{JSON.stringify(l.details)}</code></td>
              <td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{new Date(l.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

