"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";

export default function ReturnsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>("");
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  async function load(){
    const url = new URL(`${apiBase}/api/admin/returns/list`);
    if (search) url.searchParams.set('q', search);
    if (status) url.searchParams.set('status', status);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json(); setRows(j.returns||[]);
  }
  React.useEffect(()=>{ load(); },[apiBase]);
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>المرتجعات</h1>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالطلب/السبب" className="input" />
        <select value={status} onChange={(e)=>setStatus(e.target.value)} className="select">
          <option value="">كل الحالات</option>
          <option value="REQUESTED">REQUESTED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>
        <button className="btn" onClick={()=> load()}>تطبيق</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><th style={{textAlign:'right',borderBottom:'1px solid #1c2333',padding:8}}>الطلب</th><th style={{textAlign:'right',borderBottom:'1px solid #1c2333',padding:8}}>الحالة</th><th style={{textAlign:'right',borderBottom:'1px solid #1c2333',padding:8}}>SLA</th></tr></thead>
        <tbody>
          {rows.map((r,idx)=> { const ageDays = Math.floor((Date.now() - new Date(r.createdAt||Date.now()).getTime())/(24*3600*1000)); const slaWarn = r.status!=='REFUNDED' && ageDays>=7; return (
            <tr key={r.id} className={slaWarn? 'warn': ''}><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{r.orderId}</td><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{r.status}</td><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{slaWarn? (<span style={{ color:'#ef4444' }}>(+{ageDays}ي)</span>) : '-'}</td></tr>
          );})}
        </tbody>
      </table>
    </main>
  );
}

