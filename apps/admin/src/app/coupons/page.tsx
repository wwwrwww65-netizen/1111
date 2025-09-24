"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";

export default function CouponsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [code, setCode] = React.useState("");
  const [discountType, setDiscountType] = React.useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = React.useState<string>("10");
  const [edit, setEdit] = React.useState<Record<string, number>>({});
  const [rules, setRules] = React.useState('{"enabled":true,"min":0,"max":null,"includes":[],"excludes":[],"schedule":{"from":null,"to":null}}');
  const [rulesModal, setRulesModal] = React.useState<{open:boolean, code:string, text:string, loading:boolean}>({ open:false, code:"", text:"", loading:false });

  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  async function load() {
    const res = await fetch(`${apiBase}/api/admin/coupons/list`, { credentials:'include' });
    const json = await res.json();
    setRows(json.coupons || []);
  }
  React.useEffect(()=>{ load(); }, [apiBase]);

  async function create() {
    await fetch(`${apiBase}/api/admin/coupons`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ code, discountType, discountValue: Number(discountValue), rules: JSON.parse(rules), validFrom: new Date().toISOString(), validUntil: new Date(Date.now()+7*86400000).toISOString() }) });
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
        <textarea value={rules} onChange={(e)=>setRules(e.target.value)} placeholder='{"enabled":true,"min":0,"max":null,"includes":["category:shoes"],"excludes":["brand:x"],"schedule":{"from":"2025-01-01","to":"2025-02-01"}}' style={{ minWidth:320, padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={create} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>إنشاء</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الكود</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>النوع</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>القيمة</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>تحرير</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>القواعد</th>
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
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                <button onClick={async ()=>{
                  setRulesModal({ open:true, code:c.code, text:'', loading:true });
                  try {
                    const r = await fetch(`${apiBase}/api/admin/coupons/${encodeURIComponent(c.code)}/rules`, { credentials:'include' });
                    const j = await r.json();
                    setRulesModal({ open:true, code:c.code, text: JSON.stringify(j.rules ?? {}, null, 2), loading:false });
                  } catch {
                    setRulesModal({ open:true, code:c.code, text: '{}', loading:false });
                  }
                }} style={{ padding:'6px 10px', background:'#1f2937', color:'#e5e7eb', borderRadius:6 }}>تحرير القواعد</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rulesModal.open && (
        <div role="dialog" aria-modal="true" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'grid', placeItems:'center', zIndex:1000 }}>
          <div style={{ width:'min(720px, 96vw)', background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <h2 style={{ margin:0 }}>قواعد الكوبون: {rulesModal.code}</h2>
              <button onClick={()=> setRulesModal({ open:false, code:'', text:'', loading:false })} style={{ padding:'6px 10px' }}>إغلاق</button>
            </div>
            {rulesModal.loading ? (
              <div>جاري التحميل...</div>
            ) : (
              <textarea value={rulesModal.text} onChange={(e)=> setRulesModal(s=> ({ ...s, text: e.target.value }))} style={{ width:'100%', minHeight:260, padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            )}
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:12 }}>
              <button onClick={()=> setRulesModal({ open:false, code:'', text:'', loading:false })} style={{ padding:'8px 12px' }}>إلغاء</button>
              <button onClick={async ()=>{
                try {
                  const parsed = rulesModal.text.trim() ? JSON.parse(rulesModal.text) : {};
                  await fetch(`${apiBase}/api/admin/coupons/${encodeURIComponent(rulesModal.code)}/rules`, { method:'PUT', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ rules: parsed }) });
                  setRulesModal({ open:false, code:'', text:'', loading:false });
                } catch (err) {
                  alert('JSON غير صالح');
                }
              }} style={{ padding:'8px 12px', background:'#064e3b', color:'#e5e7eb', borderRadius:8 }}>حفظ</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// legacy placeholder removed

