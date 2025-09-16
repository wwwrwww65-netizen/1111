"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";

export default function CouponsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [code, setCode] = React.useState("");
  const [discountType, setDiscountType] = React.useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = React.useState<string>("10");
  const [edit, setEdit] = React.useState<Record<string, number>>({});

  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  async function load() {
    const res = await fetch(`${apiBase}/api/admin/coupons/list`, { credentials:'include' });
    const json = await res.json();
    setRows(json.coupons || []);
  }
  React.useEffect(()=>{ load(); }, [apiBase]);

  async function create() {
    await fetch(`${apiBase}/api/admin/coupons`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ code, discountType, discountValue: Number(discountValue), validFrom: new Date().toISOString(), validUntil: new Date(Date.now()+7*86400000).toISOString() }) });
    setCode("");
    await load();
  }

  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>الكوبونات</h1>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="CODE" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <select value={discountType} onChange={(e)=>setDiscountType(e.target.value)} style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
          <option value="PERCENTAGE">PERCENTAGE</option>
          <option value="FIXED">FIXED</option>
        </select>
        <input type="number" value={discountValue} onChange={(e)=>setDiscountValue(e.target.value)} placeholder="Value" style={{ width:120, padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={create} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>إنشاء</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الكود</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>النوع</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>القيمة</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>تحرير</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c)=> (
            <tr key={c.id}>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{c.code}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{c.discountType}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{edit[c.id]!==undefined ? (
                <input type="number" value={edit[c.id]} onChange={(e)=>setEdit(s=>({...s,[c.id]:Number(e.target.value)}))} style={{ width:100, padding:6, borderRadius:6, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
              ) : c.discountValue}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                {edit[c.id]!==undefined ? (
                  <button onClick={async ()=>{ await fetch(`${apiBase}/api/admin/coupons`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ code: c.code, discountType: c.discountType, discountValue: edit[c.id], validFrom: c.validFrom, validUntil: c.validUntil }) }); setEdit(s=>{ const x={...s}; delete x[c.id]; return x; }); await load(); }} style={{ padding:'6px 10px', background:'#064e3b', color:'#e5e7eb', borderRadius:6 }}>حفظ</button>
                ) : (
                  <button onClick={()=>setEdit(s=>({...s,[c.id]:c.discountValue}))} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:6 }}>تحرير</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

// legacy placeholder removed

