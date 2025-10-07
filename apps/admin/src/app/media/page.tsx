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
  const [files, setFiles] = React.useState<File[]>([]);
  const [busy, setBusy] = React.useState(false);
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  async function load(p = page, q = search) {
    const r = await fetch(`${apiBase}/api/admin/media/list?page=${p}&limit=${limit}&search=${encodeURIComponent(q)}`, { credentials:'include' });
    const j = await r.json();
    setRows(j.assets||[]); setTotal(j.total||0); setPage(j.page||p);
  }
  React.useEffect(()=>{ load(1, ''); },[apiBase]);
  async function add() {
    setBusy(true);
    try{
      let body: any = { url, type:'image' };
      const uploadOne = async (payload:any)=> fetch(`${apiBase}/api/admin/media`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
      if (files.length>0) {
        for (const f of files) {
          const b64 = await toBase64(f);
          await uploadOne({ base64: b64, type: f.type||'image' });
        }
      } else if (file) {
        const b64 = await toBase64(file);
        await uploadOne({ base64: b64, type:'image' });
      } else if (url) {
        await uploadOne(body);
      }
      setUrl("");
      setFile(null);
      setFiles([]);
      await load(page, search);
    } finally { setBusy(false); }
  }
  async function toBase64(f: File): Promise<string> {
    try {
      const d = await cropAndConvert(f);
      return d;
    } catch {
      return await new Promise((resolve,reject)=>{ const r = new FileReader(); r.onload=()=>resolve(String(r.result)); r.onerror=reject; r.readAsDataURL(f); });
    }
  }
  async function cropAndConvert(file: File): Promise<string> {
    // Simple client-side crop to square center and export to WebP; fallback to original
    return new Promise<string>((resolve, reject) => {
      try{
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          try{
            const minSide = Math.min(img.width, img.height);
            const sx = Math.floor((img.width - minSide)/2);
            const sy = Math.floor((img.height - minSide)/2);
            const canvas = document.createElement('canvas');
            const target = Math.min(1024, minSide);
            canvas.width = target; canvas.height = target;
            const ctx = canvas.getContext('2d'); if (!ctx) { URL.revokeObjectURL(url); return reject(new Error('no_ctx')); }
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, target, target);
            const out = canvas.toDataURL('image/webp', 0.9);
            URL.revokeObjectURL(url);
            resolve(out);
          }catch(e){ URL.revokeObjectURL(url); reject(e as any); }
        };
        img.onerror = ()=> { URL.revokeObjectURL(url); reject(new Error('img_error')); };
        img.src = url;
      } catch(e){ reject(e as any); }
    });
  }
  return (
    <main className="panel" style={{ padding:16 }}>
      <h1 className="text-xl font-bold mb-3">الوسائط</h1>
      <div className="toolbar" style={{ display:'flex', gap:8, position:'sticky', top:0, background:'var(--panel)', zIndex:10, padding:'6px 0' }}>
        <input className="input" value={search} onChange={(e)=> setSearch(e.target.value)} placeholder="بحث بالعنوان أو الرابط" />
        <button className="btn" onClick={()=> load(1, search)}>بحث</button>
        <input className="input" value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://..." />
        <input className="input" type="file" accept="image/*" multiple onChange={(e)=>{ const list = Array.from(e.target.files||[]); if (list.length) setFiles(list); }} />
        <button className="btn" onClick={add} disabled={busy}>{busy? 'جارٍ الرفع…':'إضافة'}</button>
        <button className="btn btn-outline" onClick={async()=>{ try{ const r = await fetch(`${apiBase}/api/admin/media/dedupe`, { method:'POST', credentials:'include' }); const j = await r.json(); alert(`تم حذف ${j.deleted||0} مكرر`); await load(page, search); } catch{ alert('فشل إزالة التكرار'); } }}>إزالة التكرار</button>
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

