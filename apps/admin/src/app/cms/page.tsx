"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";

export default function CMSPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [slug, setSlug] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  React.useEffect(()=>{ fetch(`${apiBase}/api/admin/cms/pages`, { credentials:'include' }).then(r=>r.json()).then(j=>setRows(j.pages||[])); },[apiBase]);
  async function save() {
    await fetch(`${apiBase}/api/admin/cms/pages`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ slug, title, content, published: false }) });
    setSlug(""); setTitle(""); setContent("");
    const j = await (await fetch(`${apiBase}/api/admin/cms/pages`, { credentials:'include' })).json(); setRows(j.pages||[]);
  }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>CMS</h1>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
        <input value={slug} onChange={(e)=>setSlug(e.target.value)} placeholder="slug" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="title" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <textarea value={content} onChange={(e)=>setContent(e.target.value)} placeholder="content" rows={3} style={{ gridColumn:'1 / -1', padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <div style={{ gridColumn:'1 / -1', display:'flex', justifyContent:'flex-end' }}>
          <button onClick={save} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>حفظ</button>
        </div>
      </div>
      <ul>
        {rows.map((p)=> (<li key={p.id} style={{ padding:8, border:'1px solid #1c2333', borderRadius:8, marginBottom:8 }}>{p.slug} • {p.title}</li>))}
      </ul>
    </main>
  );
}

