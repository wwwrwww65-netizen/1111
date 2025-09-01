"use client";
import React from "react";

function TabButton({ active, onClick, children }: { active: boolean; onClick: ()=>void; children: React.ReactNode }){
  return <button onClick={onClick} style={{ padding:'8px 14px', borderRadius:999, background: active ? '#800020' : '#111827', color: active ? '#fff' : '#e5e7eb', border:'1px solid #1c2333' }}>{children}</button>;
}

function ColorsTab(): JSX.Element {
  const apiBase = React.useMemo(()=>{
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('onrender.com')) return 'https://jeeeyai.onrender.com';
    return 'http://localhost:4000';
  }, []);
  const [rows, setRows] = React.useState<any[]>([]);
  const [name, setName] = React.useState("");
  const [hex, setHex] = React.useState("#800020");
  const [search, setSearch] = React.useState("");
  async function load(){ const j = await (await fetch(`${apiBase}/api/admin/attributes/colors`, { credentials:'include' })).json(); setRows(j.colors||[]); }
  React.useEffect(()=>{ load(); },[]);
  async function add(){ await fetch(`${apiBase}/api/admin/attributes/colors`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ name, hex }) }); setName(""); await load(); }
  async function update(id: string, partial: any){ await fetch(`${apiBase}/api/admin/attributes/colors/${id}`, { method:'PATCH', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(partial) }); await load(); }
  async function remove(id: string){ await fetch(`${apiBase}/api/admin/attributes/colors/${id}`, { method:'DELETE', credentials:'include' }); await load(); }
  return (
    <section style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, marginBottom:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 120px auto', gap:8 }}>
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="اسم اللون" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          <input type="color" value={hex} onChange={(e)=>setHex(e.target.value)} style={{ width:120, height:40, borderRadius:10, border:'1px solid #1c2333', background:'#0f1320' }} />
          <button onClick={add} style={{ padding:'10px 14px', background:'#800020', color:'#fff', borderRadius:10 }}>إضافة</button>
        </div>
        <div>
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالاسم" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0', width:240 }} />
        </div>
      </div>
      <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
        <thead><tr><th style={{textAlign:'right',padding:12,borderBottom:'1px solid #1c2333',background:'#0f1320'}}>الاسم</th><th style={{textAlign:'right',padding:12,borderBottom:'1px solid #1c2333',background:'#0f1320'}}>اللون</th></tr></thead>
        <tbody>
          {rows.filter((c:any)=> !search || c.name?.toLowerCase().includes(search.toLowerCase())).map((c:any, idx:number)=> (
            <tr key={c.id} style={{ background: idx%2? '#0a0e17':'transparent' }}>
              <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                <input defaultValue={c.name} onBlur={(e)=>update(c.id, { name: (e.target as HTMLInputElement).value })} style={{ padding:8, borderRadius:8, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
              </td>
              <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:16, height:16, borderRadius:999, background:c.hex, border:'1px solid #111827' }} />
                  <code style={{ color:'#9ca3af' }}>{c.hex}</code>
                  <input type="color" defaultValue={c.hex} onChange={(e)=>update(c.id, { hex: (e.target as HTMLInputElement).value })} style={{ width:28, height:24, border:'none', background:'transparent' }} />
                  <button onClick={()=>remove(c.id)} style={{ padding:'6px 10px', background:'#7c2d12', color:'#fff', borderRadius:8 }}>حذف</button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SizesTab(): JSX.Element {
  const apiBase = React.useMemo(()=>{
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('onrender.com')) return 'https://jeeeyai.onrender.com';
    return 'http://localhost:4000';
  }, []);
  const [rows, setRows] = React.useState<any[]>([]);
  const [name, setName] = React.useState("");
  const [search, setSearch] = React.useState("");
  async function load(){ const j = await (await fetch(`${apiBase}/api/admin/attributes/sizes`, { credentials:'include' })).json(); setRows(j.sizes||[]); }
  React.useEffect(()=>{ load(); },[]);
  async function add(){ await fetch(`${apiBase}/api/admin/attributes/size-types`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ name }) }); setName(""); await load(); }
  async function update(id: string, partial: any){ await fetch(`${apiBase}/api/admin/attributes/sizes/${id}`, { method:'PATCH', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(partial) }); await load(); }
  async function remove(id: string){ await fetch(`${apiBase}/api/admin/attributes/sizes/${id}`, { method:'DELETE', credentials:'include' }); await load(); }
  return (
    <section style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, marginBottom:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="نوع المقاس" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          <button onClick={add} style={{ padding:'10px 14px', background:'#800020', color:'#fff', borderRadius:10 }}>إضافة النوع</button>
        </div>
        <div>
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالاسم" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0', width:240 }} />
        </div>
      </div>
      <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
        <thead><tr><th style={{textAlign:'right',padding:12,borderBottom:'1px solid #1c2333',background:'#0f1320'}}>النوع</th><th style={{textAlign:'right',padding:12,borderBottom:'1px solid #1c2333',background:'#0f1320'}}></th></tr></thead>
        <tbody>
          {rows.filter((t:any)=> !search || t.name?.toLowerCase().includes(search.toLowerCase())).map((t:any, idx:number)=> (
            <tr key={t.id} style={{ background: idx%2? '#0a0e17':'transparent' }}>
              <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{t.name}</td>
              <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                <a href={`/attributes/sizes/${t.id}`} style={{ padding:'8px 12px', background:'#374151', color:'#e5e7eb', borderRadius:8, textDecoration:'none' }}>عرض المقاسات</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function BrandsTab(): JSX.Element {
  const apiBase = React.useMemo(()=>{
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('onrender.com')) return 'https://jeeeyai.onrender.com';
    return 'http://localhost:4000';
  }, []);
  const [rows, setRows] = React.useState<any[]>([]);
  const [name, setName] = React.useState("");
  const [search, setSearch] = React.useState("");
  async function load(){ const j = await (await fetch(`${apiBase}/api/admin/attributes/brands`, { credentials:'include' })).json(); setRows(j.brands||[]); }
  React.useEffect(()=>{ load(); },[]);
  async function add(){ await fetch(`${apiBase}/api/admin/attributes/brands`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ name }) }); setName(""); await load(); }
  async function update(id: string, partial: any){ await fetch(`${apiBase}/api/admin/attributes/brands/${id}`, { method:'PATCH', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(partial) }); await load(); }
  async function remove(id: string){ await fetch(`${apiBase}/api/admin/attributes/brands/${id}`, { method:'DELETE', credentials:'include' }); await load(); }
  return (
    <section style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
      <div style={{ display:'flex', gap:8, marginBottom:12, justifyContent:'space-between' }}>
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالاسم" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0', width:220 }} />
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="اسم العلامة" style={{ flex:1, padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={add} style={{ padding:'10px 14px', background:'#800020', color:'#fff', borderRadius:10 }}>إضافة</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
        <thead><tr><th style={{textAlign:'right',padding:12,borderBottom:'1px solid #1c2333',background:'#0f1320'}}>الاسم</th></tr></thead>
        <tbody>
          {rows.filter((b:any)=> !search || b.name?.toLowerCase().includes(search.toLowerCase())).map((b:any, idx:number)=> (
            <tr key={b.id} style={{ background: idx%2? '#0a0e17':'transparent' }}>
              <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input defaultValue={b.name} onBlur={(e)=>update(b.id, { name: (e.target as HTMLInputElement).value })} style={{ padding:8, borderRadius:8, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                  <button onClick={()=>remove(b.id)} style={{ padding:'6px 10px', background:'#7c2d12', color:'#fff', borderRadius:8 }}>حذف</button>
                </div>
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
      {tab==='colors' && <div style={{ marginTop: 16 }}><ColorsTab /></div>}
      {tab==='sizes' && <div style={{ marginTop: 16 }}><SizesTab /></div>}
      {tab==='brands' && <div style={{ marginTop: 16 }}><BrandsTab /></div>}
    </main>
  );
}

