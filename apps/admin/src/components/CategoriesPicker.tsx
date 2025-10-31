"use client";
import React from "react";

export type Mini = { id: string; name: string; image?: string };

export function CategoriesPicker({ open, onClose, onSelectMany, initial }:{ open:boolean; onClose:()=>void; onSelectMany:(items:Mini[])=>void; initial?:Mini[] }): JSX.Element|null {
  const [rows, setRows] = React.useState<Mini[]>(initial||[]);
  const [all, setAll] = React.useState<Mini[]>([]);
  const [search, setSearch] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  React.useEffect(()=>{ if(!open) return; (async()=>{
    try{
      setBusy(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const r = await fetch(`${API_BASE}/api/categories?limit=200`, { credentials:'omit' });
      const j = await r.json();
      const list: Array<any> = Array.isArray(j?.categories)? j.categories: [];
      const mapped: Mini[] = list.map((c:any)=> ({ id: c.slug||c.id, name: c.name, image: c.image }));
      setAll(mapped);
      if (!rows.length && initial?.length) setRows(initial);
    }catch{}
    finally{ setBusy(false) }
  })() },[open]);
  if (!open) return null;
  const filtered = search.trim()? all.filter(c=> (c.name||'').toLowerCase().includes(search.toLowerCase()) || (c.id||'').toLowerCase().includes(search.toLowerCase())) : all;
  const toggle = (it:Mini)=>{
    setRows((cur)=>{
      const exists = cur.find(x=> x.id===it.id);
      if (exists) return cur.filter(x=> x.id!==it.id);
      return [...cur, it];
    });
  };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000 }}>
      <div style={{ width:'min(1000px, 95vw)', maxHeight:'86vh', overflow:'auto', background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h3 style={{ margin:0 }}>اختيار فئات {busy? '…' : ''}</h3>
          <button onClick={onClose} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>إغلاق</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:16 }}>
          <div>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              <input value={search} onChange={(e)=> setSearch((e.target as HTMLInputElement).value)} placeholder="بحث بالاسم أو المعرف" style={{ flex:1, padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(120px, 1fr))', gap:10 }}>
              {filtered.map((c)=>{
                const on = !!rows.find(r=> r.id===c.id);
                return (
                  <button key={c.id} onClick={()=> toggle(c)} style={{ textAlign:'start', background:on? '#111827':'#0f1320', border:'1px solid #1c2333', borderRadius:10, padding:8 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <div style={{ width:40, height:40, borderRadius:8, overflow:'hidden', background:'#111827' }}>{c.image? (<img src={c.image} style={{ width:'100%', height:'100%', objectFit:'cover' }} />) : null}</div>
                      <div>
                        <div style={{ color:'#e2e8f0', fontWeight:600, fontSize:13 }}>{c.name}</div>
                        <div style={{ color:'#94a3b8', fontSize:11 }}>{c.id}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <h4 style={{ margin:'6px 0' }}>المحددة ({rows.length})</h4>
            <div style={{ display:'grid', gap:6 }}>
              {rows.map((c)=> (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8, background:'#0f1320', border:'1px solid #1c2333', borderRadius:10, padding:8 }}>
                  <div style={{ width:36, height:36, borderRadius:8, overflow:'hidden', background:'#111827' }}>{c.image? (<img src={c.image} style={{ width:'100%', height:'100%', objectFit:'cover' }} />) : null}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:'#e2e8f0', fontSize:13 }}>{c.name}</div>
                    <div style={{ color:'#94a3b8', fontSize:11 }}>{c.id}</div>
                  </div>
                  <button onClick={()=> setRows(rs=> rs.filter(x=> x.id!==c.id))} style={{ padding:'6px 10px', background:'#7c2d12', color:'#fff', borderRadius:8 }}>إزالة</button>
                </div>
              ))}
            </div>
            <div style={{ marginTop:12, display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={()=> onSelectMany(rows)} style={{ padding:'8px 12px', background:'#065f46', color:'#e5e7eb', borderRadius:8 }}>تأكيد الاختيار</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
