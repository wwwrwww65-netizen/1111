"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";

export default function MediaPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(24);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [url, setUrl] = React.useState("");
  const [file, setFile] = React.useState<File|null>(null);
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  async function load(p = page, q = search) {
    const r = await fetch(`${apiBase}/api/admin/media/list?page=${p}&limit=${limit}&search=${encodeURIComponent(q)}`, { credentials:'include' });
    const j = await r.json();
    setRows(j.assets||[]); setTotal(j.total||0); setPage(j.page||p);
  }
  React.useEffect(()=>{ load(1, ''); },[apiBase]);
  async function add() {
    let body: any = { url, type:'image' };
    if (file) {
      const b64 = await toBase64(file);
      body = { base64: b64, type:'image' };
    }
    await fetch(`${apiBase}/api/admin/media`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(body) });
    setUrl("");
    setFile(null);
    await load(page, search);
  }
  function toBase64(f: File): Promise<string> { return new Promise((resolve,reject)=>{ const r = new FileReader(); r.onload=()=>resolve(String(r.result)); r.onerror=reject; r.readAsDataURL(f); }); }
  return (
    <main className="panel" style={{ padding:16 }}>
      <h1 className="text-xl font-bold mb-3">الوسائط</h1>
      <div className="toolbar" style={{ display:'flex', gap:8, position:'sticky', top:0, background:'var(--panel)', zIndex:10, padding:'6px 0' }}>
        <input className="input" value={search} onChange={(e)=> setSearch(e.target.value)} placeholder="بحث بالعنوان أو الرابط" />
        <button className="btn" onClick={()=> load(1, search)}>بحث</button>
        <input className="input" value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://..." />
        <input className="input" type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
        <button className="btn" onClick={add}>إضافة</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:8 }}>
        {rows.map((a)=> (
          <div key={a.id} style={{ border:'1px solid #1c2333', borderRadius:8, overflow:'hidden' }}>
            <img src={a.url} alt={a.alt||''} style={{ width:'100%', height:140, objectFit:'cover' }} />
            <div style={{ display:'flex', gap:6, padding:8, alignItems:'center' }}>
              <input className="input" defaultValue={a.alt||''} placeholder="alt" onBlur={async (e)=>{ const v=e.currentTarget.value; await fetch(`${apiBase}/api/admin/media/${a.id}`, { method:'PATCH', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ alt:v }) }); }}/>
              <button className="btn" onClick={()=> { navigator.clipboard.writeText(a.url); }}>نسخ</button>
              <button className="btn" onClick={async ()=>{ await fetch(`${apiBase}/api/admin/media/${a.id}`, { method:'DELETE', credentials:'include' }); await load(page, search); }}>حذف</button>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'0 8px 8px', fontSize:12, color:'#94a3b8' }}>
              <span>{a.meta?.width}×{a.meta?.height}px</span>
              {Array.isArray(a.dominantColors) && a.dominantColors.length>0 && (
                <span style={{ display:'inline-flex', gap:4 }}>
                  {a.dominantColors.slice(0,3).map((c:string, i:number)=> (
                    <span key={i} title={c} style={{ width:14, height:14, borderRadius:3, background:c, border:'1px solid rgba(255,255,255,0.2)' }} />
                  ))}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
        <span>الكل: {total}</span>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" disabled={page<=1} onClick={()=> load(page-1, search)}>السابق</button>
          <button className="btn" disabled={(page*limit)>=total} onClick={()=> load(page+1, search)}>التالي</button>
        </div>
      </div>
    </main>
  );
}

