"use client";
import React from "react";

function TabButton({ active, onClick, children }: { active: boolean; onClick: ()=>void; children: React.ReactNode }){
  return <button onClick={onClick} style={{ padding:'8px 14px', borderRadius:999, background: active ? '#800020' : '#111827', color: active ? '#fff' : '#e5e7eb', border:'1px solid #1c2333' }}>{children}</button>;
}

function ColorsTab(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [name, setName] = React.useState("");
  const [hex, setHex] = React.useState("#800020");
  async function load(){ const j = await (await fetch('/api/admin/attributes/colors')).json(); setRows(j.colors||[]); }
  React.useEffect(()=>{ load(); },[]);
  async function add(){ await fetch('/api/admin/attributes/colors', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name, hex }) }); setName(""); await load(); }
  return (
    <section style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="اسم اللون" style={{ flex:1, padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <input type="color" value={hex} onChange={(e)=>setHex(e.target.value)} style={{ width:48, height:40, border:'none', background:'transparent' }} />
        <button onClick={add} style={{ padding:'10px 14px', background:'#800020', color:'#fff', borderRadius:10 }}>إضافة</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
        <thead><tr><th style={{textAlign:'right',padding:12,borderBottom:'1px solid #1c2333',background:'#0f1320'}}>الاسم</th><th style={{textAlign:'right',padding:12,borderBottom:'1px solid #1c2333',background:'#0f1320'}}>اللون</th></tr></thead>
        <tbody>
          {rows.map((c:any, idx:number)=> (
            <tr key={c.id} style={{ background: idx%2? '#0a0e17':'transparent' }}>
              <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{c.name}</td>
              <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:16, height:16, borderRadius:999, background:c.hex, border:'1px solid #111827' }} />
                  <code style={{ color:'#9ca3af' }}>{c.hex}</code>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function AttributesPage(): JSX.Element {
  const [tab, setTab] = React.useState<'colors'|'sizes'|'brands'>('colors');
  return (
    <main style={{ maxWidth: 1100, margin:'0 auto', padding:16 }}>
      <h1 style={{ marginBottom:16, fontSize:22, fontWeight:700 }}>السمات</h1>
      <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:16 }}>
        <TabButton active={tab==='colors'} onClick={()=>setTab('colors')}>الألوان</TabButton>
        <TabButton active={tab==='sizes'} onClick={()=>setTab('sizes')}>المقاسات</TabButton>
        <TabButton active={tab==='brands'} onClick={()=>setTab('brands')}>العلامات التجارية</TabButton>
      </div>
      {tab==='colors' && <ColorsTab />}
      {tab==='sizes' && (
        <section style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16, textAlign:'center', color:'#9ca3af' }}>
          قريبًا: إدارة المقاسات (إضافة/قائمة)
        </section>
      )}
      {tab==='brands' && (
        <section style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16, textAlign:'center', color:'#9ca3af' }}>
          قريبًا: إدارة العلامات التجارية (إضافة/قائمة)
        </section>
      )}
    </main>
  );
}

