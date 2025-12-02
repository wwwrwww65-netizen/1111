"use client";
import React from "react";

export function MediaPicker({ open, onClose, onSelect }:{ open:boolean; onClose:()=>void; onSelect:(url:string)=>void }): JSX.Element|null {
  const [rows, setRows] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const limit = 24;
  React.useEffect(()=>{ if(!open) return; (async()=>{
    try{
      const r = await fetch(`/api/admin/media/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { credentials:'include' });
      const j = await r.json(); setRows(j.assets||[]); setTotal(j.total||0);
    }catch{}
  })(); },[open, page, search]);
  if (!open) return null;
  const pages = Math.max(1, Math.ceil(total/limit));
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000 }}>
      <div style={{ width:'min(1000px, 94vw)', maxHeight:'85vh', overflow:'auto', background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h3 style={{ margin:0 }}>الوسائط</h3>
          <button onClick={onClose} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>إغلاق</button>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <input value={search} onChange={(e)=> setSearch((e.target as HTMLInputElement).value)} placeholder="بحث" style={{ flex:1, padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(120px, 1fr))', gap:10 }}>
          {rows.map((a:any)=> (
            <button key={a.id} onClick={()=>{ onSelect(a.url); onClose(); }} style={{ background:'#0f1320', border:'1px solid #1c2333', borderRadius:8, padding:6 }}>
              <img src={a.url} alt={a.alt||''} style={{ width:'100%', borderRadius:6 }} />
            </button>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
          <div style={{ color:'#94a3b8', fontSize:12 }}>{total} عنصر</div>
          <div style={{ display:'flex', gap:6 }}>
            <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1, p-1))} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>السابق</button>
            <span style={{ color:'#94a3b8' }}>{page} / {pages}</span>
            <button disabled={page>=pages} onClick={()=> setPage(p=> Math.min(pages, p+1))} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>التالي</button>
          </div>
        </div>
      </div>
    </div>
  );
}


