"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";

export default function MediaPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [url, setUrl] = React.useState("");
  const [file, setFile] = React.useState<File|null>(null);
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  React.useEffect(()=>{ fetch(`${apiBase}/api/admin/media/list`, { credentials:'include' }).then(r=>r.json()).then(j=>setRows(j.assets||[])); },[apiBase]);
  async function add() {
    let body: any = { url, type:'image' };
    if (file) {
      const b64 = await toBase64(file);
      body = { base64: b64, type:'image' };
    }
    await fetch(`${apiBase}/api/admin/media`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(body) });
    setUrl("");
    setFile(null);
    const j = await (await fetch(`${apiBase}/api/admin/media/list`, { credentials:'include' })).json(); setRows(j.assets||[]);
  }
  function toBase64(f: File): Promise<string> { return new Promise((resolve,reject)=>{ const r = new FileReader(); r.onload=()=>resolve(String(r.result)); r.onerror=reject; r.readAsDataURL(f); }); }
  return (
    <main className="panel" style={{ padding:16 }}>
      <h1 className="text-xl font-bold mb-3">الوسائط</h1>
      <div className="toolbar" style={{ display:'flex', gap:8, position:'sticky', top:0, background:'var(--panel)', zIndex:10, padding:'6px 0' }}>
        <input className="input" value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://..." />
        <input className="input" type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
        <button className="btn" onClick={add}>إضافة</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:8 }}>
        {rows.map((a)=> (
          <div key={a.id} style={{ border:'1px solid #1c2333', borderRadius:8, overflow:'hidden' }}>
            <img src={a.url} alt={a.alt||''} style={{ width:'100%', height:140, objectFit:'cover' }} />
          </div>
        ))}
      </div>
    </main>
  );
}

