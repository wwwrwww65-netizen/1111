"use client";
import React from "react";
import { Section } from "../components/Ui";
import { resolveApiBase } from "../lib/apiBase";
export const dynamic = 'force-dynamic';

function useApiBase(){
  return React.useMemo(()=> resolveApiBase(), []);
}
function useAuthHeaders(){
  // HttpOnly cookie is sent automatically when credentials:'include';
  // No need to read token from JS (unavailable by design).
  return React.useCallback(() => ({} as Record<string,string>), []);
}

export default function CategoriesPage(): JSX.Element {
  const apiBase = useApiBase();
  const authHeaders = useAuthHeaders();
  const buildUrl = React.useCallback((path: string) => `${apiBase}${path}`, [apiBase]);
  const [search, setSearch] = React.useState("");
  const [rows, setRows] = React.useState<any[]>([]);
  const [tree, setTree] = React.useState<any[]>([]);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [image, setImage] = React.useState("");
  const [parentId, setParentId] = React.useState<string>("");
  const [slug, setSlug] = React.useState("");
  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDescription, setSeoDescription] = React.useState("");
  const [seoKeywords, setSeoKeywords] = React.useState("");
  const [trNameAr, setTrNameAr] = React.useState("");
  const [trDescAr, setTrDescAr] = React.useState("");
  const [trNameEn, setTrNameEn] = React.useState("");
  const [trDescEn, setTrDescEn] = React.useState("");
  const [toast, setToast] = React.useState<string>("");
  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(""), 1800); };

  async function loadList(){
  const url = new URL(`/api/admin/categories`, window.location.origin);
    url.searchParams.set('_', String(Date.now()));
    if (search) url.searchParams.set('search', search);
    const res = await fetch(url.toString(), { credentials:'include', cache:'no-store' });
    if (!res.ok) { setRows([]); return; }
    const j = await res.json(); setRows(j.categories||[]);
  }
  async function loadTree(){
  const res = await fetch(`/api/admin/categories/tree`, { credentials:'include', cache:'no-store' });
    if (!res.ok) { setTree([]); return; }
    const j = await res.json(); setTree(j.tree||[]);
  }
  React.useEffect(()=>{ loadList(); loadTree(); }, [apiBase]);

  const [saving, setSaving] = React.useState(false);
  async function add(){
    try {
      if (!name.trim()) { showToast('الاسم مطلوب'); return; }
      setSaving(true);
      let finalImage = image;
      if (finalImage && finalImage.startsWith('data:')) {
        try {
          const up = await fetch(`/api/admin/media/upload`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ filename: `cat-${Date.now()}.png`, contentType: 'image/png', base64: finalImage }) });
          if (up.ok) { const j = await up.json(); finalImage = j.url || j.presign?.url || finalImage; }
        } catch {}
      }
      const translations = { ar: { name: trNameAr||name, description: trDescAr||description }, en: { name: trNameEn||'', description: trDescEn||'' } };
      const keywords = seoKeywords.split(',').map(s=>s.trim()).filter(Boolean);
      const payload = { name, description, image: finalImage, parentId: parentId||null, slug, seoTitle, seoDescription, seoKeywords: keywords, translations };
      const res = await fetch(`/api/admin/categories`, { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', cache:'no-store', body: JSON.stringify(payload) });
      if (!res.ok) {
        const t = await res.text().catch(()=> '');
        showToast(`فشل الإضافة${t? ': '+t: ''}`);
        return;
      }
      setName(""); setDescription(""); setImage(""); setParentId(""); setSlug(""); setSeoTitle(""); setSeoDescription(""); setSeoKeywords(""); setTrNameAr(""); setTrDescAr(""); setTrNameEn(""); setTrDescEn("");
      await Promise.all([loadList(), loadTree()]);
      showToast('تمت الإضافة');
    } catch (e:any) {
      showToast(`تعذّرت الإضافة${e?.message? ': '+e.message: ''}`);
    } finally {
      setSaving(false);
    }
  }
  async function update(cat:any){
  const res = await fetch(`/api/admin/categories/${cat.id}`, { method:'PATCH', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ name: cat.name, description: cat.description, image: cat.image, parentId: cat.parentId||null, slug: cat.slug, seoTitle: cat.seoTitle, seoDescription: cat.seoDescription, seoKeywords: cat.seoKeywords, translations: cat.translations }) });
    if (!res.ok) { showToast('فشل الحفظ'); return; }
    await Promise.all([loadList(), loadTree()]);
    showToast('تم الحفظ');
  }
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [allChecked, setAllChecked] = React.useState(false);
  async function remove(id:string){
    if (!confirm('تأكيد الحذف؟')) return;
    // Prefer bulk endpoint for robust server-side handling
    const r = await fetch(`/api/admin/categories/bulk-delete`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ ids: [id] }) });
    if (!r.ok) { try{ const j=await r.json(); showToast(`فشل الحذف${j?.code? ' ('+j.code+')':''}`); } catch { showToast('فشل الحذف'); } return; }
    await Promise.all([loadList(), loadTree()]);
    showToast('تم الحذف');
  }
  async function removeSelected(){
    const ids = Object.keys(selected).filter(k=> selected[k]); if (!ids.length) return;
    if (!confirm(`حذف ${ids.length} تصنيف؟`)) return;
    const r = await fetch(`/api/admin/categories/bulk-delete`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ ids }) });
    if (!r.ok) { try{ const j=await r.json(); showToast(`فشل الحذف${j?.code? ' ('+j.code+')':''}`); } catch { showToast('فشل الحذف'); } return; }
    try { const j = await r.json(); showToast(j?.deleted? `تم حذف ${j.deleted}` : 'تم الحذف'); } catch { showToast('تم الحذف'); }
    await Promise.all([loadList(), loadTree()]);
    setSelected({}); setAllChecked(false);
  }

  function Tree({ nodes }:{ nodes:any[] }){
    return (
      <ul style={{ listStyle:'none', paddingInlineStart: 16 }}>
        {nodes.map((n)=> (
          <li key={n.id} style={{ marginBottom:6 }} draggable onDragStart={(e)=>{ e.dataTransfer.setData('text/plain', n.id); }} onDragOver={(e)=>{ e.preventDefault(); }} onDrop={async (e)=>{
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('text/plain'); if (!draggedId || draggedId===n.id) return;
            try {
              const siblings = (n.children||[]).map((c:any, idx:number)=> ({ id:c.id, parentId: n.id, sortOrder: idx }));
              const payload = { items: [ { id: draggedId, parentId: n.id, sortOrder: siblings.length }, ...siblings ] };
              await fetch(`/api/admin/categories/reorder`, { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify(payload) });
              await Promise.all([loadList(), loadTree()]);
              showToast('تم إعادة الترتيب');
            } catch { showToast('فشل إعادة الترتيب'); }
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ padding:'2px 8px', background:'#111827', borderRadius:999, fontSize:12, color:'#9ca3af' }}>{n.id.slice(0,6)}</span>
              <strong>{n.name}</strong>
              <button onClick={async()=>{ setParentId(n.id); setName(''); setDescription(''); setImage(''); showToast('سيتم الإضافة كإبن لـ '+n.name); }} style={{ marginInlineStart:'auto', padding:'4px 8px', background:'#111827', color:'#e5e7eb', borderRadius:6 }}>إضافة ابن</button>
              <button onClick={()=> remove(n.id)} style={{ padding:'4px 8px', background:'#7c2d12', color:'#fff', borderRadius:6 }}>حذف</button>
            </div>
            {n.children?.length ? <Tree nodes={n.children} /> : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main style={{ maxWidth: 1200, margin:'0 auto', padding:16 }}>
      <h1 style={{ marginBottom:16, fontSize:22, fontWeight:700 }}>التصنيفات</h1>
      {toast && (<div style={{ marginBottom:8, background:'#111827', color:'#e5e7eb', padding:'6px 10px', borderRadius:8 }}>{toast}</div>)}

      <section style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:16, alignItems:'start' }}>
        <div style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالاسم" style={{ flex:1, padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            <button onClick={()=>{ loadList(); }} style={{ padding:'10px 14px', background:'#111827', color:'#e5e7eb', borderRadius:10 }}>بحث</button>
          </div>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead style={{ position:'sticky', top:0, background:'#0b0e14', zIndex:1 }}>
              <tr>
                <th style={{ textAlign:'right', padding:12, borderBottom:'1px solid #1c2333', background:'#0f1320' }}><input type="checkbox" checked={allChecked} onChange={(e)=>{ const v=e.currentTarget.checked; setAllChecked(v); setSelected(Object.fromEntries(rows.map(c=> [c.id, v]))); }} /></th>
                <th style={{ textAlign:'right', padding:12, borderBottom:'1px solid #1c2333', background:'#0f1320' }}>ID</th>
                <th style={{ textAlign:'right', padding:12, borderBottom:'1px solid #1c2333', background:'#0f1320' }}>الاسم</th>
                <th style={{ textAlign:'right', padding:12, borderBottom:'1px solid #1c2333', background:'#0f1320' }}>Slug</th>
                <th style={{ textAlign:'right', padding:12, borderBottom:'1px solid #1c2333', background:'#0f1320' }}>أب</th>
                <th style={{ textAlign:'right', padding:12, borderBottom:'1px solid #1c2333', background:'#0f1320' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c:any, idx:number)=> (
                <tr key={c.id} style={{ background: idx%2? '#0a0e17':'transparent' }}>
                  <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}><input type="checkbox" checked={!!selected[c.id]} onChange={()=> setSelected(s=> ({...s, [c.id]: !s[c.id]}))} /></td>
                  <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{c.id.slice(0,6)}</td>
                  <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                    <input defaultValue={c.name} onBlur={(e)=> update({ ...c, name: (e.target as HTMLInputElement).value })} style={{ padding:8, borderRadius:8, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                  </td>
                  <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                    <input defaultValue={c.slug||''} onBlur={(e)=> update({ ...c, slug: (e.target as HTMLInputElement).value })} style={{ padding:8, borderRadius:8, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                  </td>
                  <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                    <select defaultValue={c.parentId||''} onChange={async (e)=>{ const v=(e.target as HTMLSelectElement).value||null; await update({ ...c, parentId: v }); }} style={{ padding:8, borderRadius:8, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }}>
                      <option value="">(لا يوجد)</option>
                      {rows.filter((r:any)=> r.id!==c.id).map((r:any)=> (<option key={r.id} value={r.id}>{r.name}</option>))}
                    </select>
                  </td>
                  <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                    <button onClick={()=> remove(c.id)} style={{ padding:'6px 10px', background:'#7c2d12', color:'#fff', borderRadius:8 }}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop:8, display:'flex', gap:8 }}>
            <button onClick={removeSelected} style={{ padding:'8px 12px', background:'#7c2d12', color:'#fff', borderRadius:8 }}>حذف المحدد</button>
          </div>
        </div>

        <div style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
          <h3 style={{ marginTop:0, marginBottom:12 }}>إضافة تصنيف</h3>
          <div style={{ display:'grid', gap:10 }}>
            <label>الاسم<input value={name} onChange={(e)=>setName(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
            <label>الوصف<textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <label>Slug<input value={slug} onChange={(e)=>setSlug(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
              <label>SEO Title<input value={seoTitle} onChange={(e)=>setSeoTitle(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
              <label>SEO Description<input value={seoDescription} onChange={(e)=>setSeoDescription(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
              <label>SEO Keywords (comma)<input value={seoKeywords} onChange={(e)=>setSeoKeywords(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
            </div>
            <div style={{ border:'1px solid #1c2333', borderRadius:10, padding:10 }}>
              <div style={{ color:'#94a3b8', marginBottom:8 }}>ترجمات</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <label>اسم (AR)<input value={trNameAr} onChange={(e)=>setTrNameAr(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
                <label>اسم (EN)<input value={trNameEn} onChange={(e)=>setTrNameEn(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
                <label>وصف (AR)<input value={trDescAr} onChange={(e)=>setTrDescAr(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
                <label>وصف (EN)<input value={trDescEn} onChange={(e)=>setTrDescEn(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
              </div>
            </div>
            <label>صورة (URL)<input value={image} onChange={(e)=>setImage(e.target.value)} placeholder="https://...jpg" style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
            <div onDragOver={(e)=>{ e.preventDefault(); }} onDrop={async (e)=>{
              e.preventDefault();
              const f = e.dataTransfer?.files?.[0]; if (!f) return;
              try {
                // Prefer server upload
                const reader = new FileReader();
                reader.onload = async ()=> {
                  const data = String(reader.result||'');
                  try {
                    const resp = await fetch(`/api/admin/media/upload`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ filename: f.name, contentType: f.type, base64: data }) });
                    if (resp.ok) {
                      const out = await resp.json();
                      if (out.url) { setImage(out.url); showToast('تم رفع الصورة'); }
                      else if (out.presign?.url) { setImage(out.presign.url); showToast('تم تجهيز رابط الصورة'); }
                      else { setImage(data); showToast('تم التحميل محلياً'); }
                    } else { setImage(data); showToast('تم التحميل محلياً'); }
                  } catch { setImage(data); showToast('تم التحميل محلياً'); }
                };
                reader.readAsDataURL(f);
              } catch { /* noop */ }
            }} style={{ border:'1px dashed #334155', borderRadius:10, padding:14, textAlign:'center', color:'#94a3b8' }}>
              اسحب وأسقط صورة هنا لرفعها (S3/Cloudinary)
              {image && (<div style={{ marginTop:10 }}><img src={image} alt="preview" style={{ maxWidth:'100%', borderRadius:8, border:'1px solid #1c2333' }} /></div>)}
            </div>
            <label>أو اختر ملفاً من الجهاز
              <input type="file" accept="image/*" onChange={async (e)=>{
                const f = e.target.files?.[0]; if (!f) return;
                const reader = new FileReader();
                reader.onload = async ()=> {
                  const data = String(reader.result||'');
                  try {
                    const resp = await fetch(`/api/admin/media/upload`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ filename: f.name, contentType: f.type, base64: data }) });
                    if (resp.ok) { const out = await resp.json(); setImage(out.url || out.presign?.url || data); showToast('تم رفع الصورة'); }
                    else { setImage(data); showToast('تم التحميل محلياً'); }
                  } catch { setImage(data); showToast('تم التحميل محلياً'); }
                };
                reader.readAsDataURL(f);
              }} style={{ display:'block', marginTop:6 }} />
            </label>
            <label>التصنيف الأب
              <select value={parentId} onChange={(e)=>setParentId(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }}>
                <option value="">(لا يوجد)</option>
                {rows.map((c:any)=> (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </label>
            <button onClick={add} disabled={saving || !name.trim()} style={{ padding:'10px 14px', background: saving? '#6b7280':'#800020', color:'#fff', borderRadius:10, opacity: (saving||!name.trim())? 0.7: 1 }}>{saving? 'جارٍ الحفظ...':'إضافة'}</button>
          </div>

          <div style={{ marginTop:16 }}>
            <h3 style={{ marginTop:0, marginBottom:8 }}>عرض هرمي</h3>
            <div style={{ border:'1px solid #1c2333', borderRadius:10, padding:10, maxHeight: 360, overflow:'auto' }}>
              <Tree nodes={tree} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}