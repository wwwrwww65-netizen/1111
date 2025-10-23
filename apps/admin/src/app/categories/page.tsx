"use client";
import React from "react";
import { Section } from "../components/Ui";
import { resolveApiBase } from "../lib/apiBase";
export const dynamic = 'force-dynamic';

function useApiBase(){
  return React.useMemo(()=> resolveApiBase(), []);
}
function useAuthHeaders(){
  return React.useCallback(() => {
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {} as Record<string,string>;
  }, []);
}

export default function CategoriesPage(): JSX.Element {
  const apiBase = useApiBase();
  const authHeaders = useAuthHeaders();
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
  const [jsonEditorOpen, setJsonEditorOpen] = React.useState<boolean>(false);
  const [jsonText, setJsonText] = React.useState<string>(`{
  "ar": { "name": "", "description": "" },
  "en": { "name": "", "description": "" }
}`);
  const [toast, setToast] = React.useState<string>("");
  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(""), 1800); };

  async function loadList(){
  const url = new URL(`/api/admin/categories`, window.location.origin);
    url.searchParams.set('_', String(Date.now()));
    if (search) url.searchParams.set('search', search);
    const res = await fetch(url.toString(), { credentials:'include', cache:'no-store', headers: { ...authHeaders() } });
    if (!res.ok) { setRows([]); return; }
    const j = await res.json(); setRows(j.categories||[]);
  }
  async function loadTree(){
  const res = await fetch(`/api/admin/categories/tree`, { credentials:'include', cache:'no-store', headers: { ...authHeaders() } });
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
          const up = await fetch(`${apiBase}/api/admin/media`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify({ base64: finalImage }) });
          if (up.ok) {
            const j = await up.json();
            // Prefer absolute URL from asset
            finalImage = j.asset?.url || j.url || j.secure_url || j.presign?.url || finalImage;
          }
        } catch {}
      }
      // If still base64, drop it to avoid huge POST bodies and 502
      if (typeof finalImage === 'string' && finalImage.startsWith('data:')) {
        finalImage = '';
      }
      let translations: any = { ar: { name: trNameAr||name, description: trDescAr||description }, en: { name: trNameEn||'', description: trDescEn||'' } };
      if (jsonEditorOpen) {
        try { const parsed = JSON.parse(jsonText||'{}'); if (parsed && typeof parsed==='object') translations = parsed; } catch {}
      }
      const keywords = seoKeywords.split(',').map(s=>s.trim()).filter(Boolean);
      // Persist the media asset when we have a URL or base64 to ensure it appears in Media Library too
      try {
        if (finalImage) {
          const body:any = finalImage.startsWith('data:') ? { base64: finalImage } : { url: finalImage };
          await fetch(`${apiBase}/api/admin/media`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify(body) }).catch(()=>null);
        }
      } catch {}
      const payload = { name, description, image: finalImage, parentId: parentId||null, slug, seoTitle, seoDescription, seoKeywords: keywords, translations };
      const res = await fetch(`${apiBase}/api/admin/categories`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', cache:'no-store', body: JSON.stringify(payload) });
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
  const res = await fetch(`/api/admin/categories/${cat.id}`, { method:'PATCH', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ name: cat.name, description: cat.description, image: cat.image, parentId: cat.parentId||null, slug: cat.slug, seoTitle: cat.seoTitle, seoDescription: cat.seoDescription, seoKeywords: cat.seoKeywords, translations: cat.translations }) });
    if (!res.ok) { showToast('فشل الحفظ'); return; }
    await Promise.all([loadList(), loadTree()]);
    showToast('تم الحفظ');
  }
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [allChecked, setAllChecked] = React.useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = React.useState<string | null>(null);
  const confirmTimerRef = React.useRef<any>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editLoading, setEditLoading] = React.useState(false);
  const [editSaving, setEditSaving] = React.useState(false);
  const [edit, setEdit] = React.useState<any | null>(null);
  const [mediaOpen, setMediaOpen] = React.useState(false);
  const [mediaFor, setMediaFor] = React.useState<'add'|'edit'|null>(null);
  async function existsOnServer(id:string): Promise<boolean> {
    try {
      const res = await fetch(`/api/admin/categories?search=${encodeURIComponent(id)}`, { credentials:'include', cache:'no-store' });
      if (!res.ok) return true;
      const j = await res.json();
      return Array.isArray(j?.categories) && j.categories.some((c:any)=> c.id === id);
    } catch { return true; }
  }
  async function remove(id:string){
    if (confirmingDeleteId !== id) {
      setConfirmingDeleteId(id);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(()=> setConfirmingDeleteId(null), 4000);
      showToast('اضغط حذف مرة أخرى لتأكيد العملية');
      return;
    }
    setConfirmingDeleteId(null);
    const r = await fetch(`/api/admin/categories/bulk-delete`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify({ ids: [id] }) });
    if (!r.ok) { try{ const j=await r.json(); showToast(`فشل الحذف${j?.code? ' ('+j.code+')':''}`); } catch { showToast('فشل الحذف'); } return; }
    let deletedCount = 0; try { const j = await r.json(); deletedCount = Number(j?.deleted||0); } catch {}
    const stillExists = await existsOnServer(id);
    await Promise.all([loadList(), loadTree()]);
    if (deletedCount < 1 || stillExists) { showToast('فشل الحذف'); return; }
    showToast('تم الحذف');
  }
  async function openEdit(cat: any){
    try{
      setEditOpen(true);
      // Prefill from current row immediately (fallback if fetch fails)
      setEdit({
        id: cat.id,
        name: cat.name || '',
        description: cat.description || '',
        image: cat.image || '',
        parentId: cat.parentId || '',
        slug: cat.slug || '',
        seoTitle: cat.seoTitle || '',
        seoDescription: cat.seoDescription || '',
        seoKeywords: Array.isArray(cat.seoKeywords) ? cat.seoKeywords.join(',') : '',
        translations: cat.translations ? JSON.stringify(cat.translations, null, 2) : '{\n  "ar": { "name": "", "description": "" },\n  "en": { "name": "", "description": "" }\n}'
      });
      setEditLoading(true);
      const r = await fetch(`${apiBase}/api/admin/categories/${cat.id}`, { credentials:'include', cache:'no-store', headers: { ...authHeaders() } });
      if (!r.ok) { showToast('تعذر جلب البيانات'); return; }
      const j = await r.json();
      const c = j?.category || {};
      setEdit({
        id: c.id,
        name: c.name || '',
        description: c.description || '',
        image: c.image || '',
        parentId: c.parentId || '',
        slug: c.slug || '',
        seoTitle: c.seoTitle || '',
        seoDescription: c.seoDescription || '',
        seoKeywords: Array.isArray(c.seoKeywords) ? c.seoKeywords.join(',') : '',
        translations: c.translations ? JSON.stringify(c.translations, null, 2) : '{\n  "ar": { "name": "", "description": "" },\n  "en": { "name": "", "description": "" }\n}'
      });
    } catch { showToast('تعذر جلب البيانات'); }
    finally { setEditLoading(false); }
  }
  async function saveEdit(){
    if (!edit || !edit.id) return;
    setEditSaving(true);
    try {
      let finalImage = edit.image || '';
      if (finalImage && finalImage.startsWith('data:')) {
        try {
          const up = await fetch(`/api/admin/media`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify({ base64: finalImage }) });
          if (up.ok) {
            const j = await up.json();
            edit.image = j.asset?.url || j.url || j.secure_url || j.presign?.url || finalImage;
            finalImage = edit.image;
          }
        } catch {}
      }
      if (typeof finalImage === 'string' && finalImage.startsWith('data:')) {
        finalImage = '';
      }
      let translations: any = undefined;
      try { const parsed = JSON.parse(String(edit.translations||'{}')); if (parsed && typeof parsed==='object') translations = parsed; } catch {}
      // Persist the media asset for edit as well
      try {
        if (finalImage) {
          const body:any = finalImage.startsWith('data:') ? { base64: finalImage } : { url: finalImage };
          await fetch(`/api/admin/media`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify(body) }).catch(()=>null);
        }
      } catch {}
      const payload: any = {
        name: edit.name,
        description: edit.description,
        image: finalImage,
        parentId: edit.parentId || null,
        slug: edit.slug,
        seoTitle: edit.seoTitle,
        seoDescription: edit.seoDescription,
        seoKeywords: String(edit.seoKeywords||'').split(',').map((s:string)=>s.trim()).filter(Boolean),
        translations
      };
      const r = await fetch(`${apiBase}/api/admin/categories/${edit.id}`, { method:'PATCH', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify(payload) });
      if (!r.ok) {
        if (r.status === 409) { showToast('Slug مستخدم بالفعل'); return; }
        try { const j = await r.json(); showToast(j?.error||'فشل الحفظ'); } catch { showToast('فشل الحفظ'); }
        return;
      }
      await Promise.all([loadList(), loadTree()]);
      showToast('تم الحفظ'); setEditOpen(false); setEdit(null);
    } finally { setEditSaving(false); }
  }
  const [confirmingBulk, setConfirmingBulk] = React.useState(false);
  async function removeSelected(){
    const ids = Object.keys(selected).filter(k=> selected[k]); if (!ids.length) return;
    if (!confirmingBulk) {
      setConfirmingBulk(true);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(()=> setConfirmingBulk(false), 4000);
      showToast(`اضغط حذف مرة أخرى لتأكيد حذف ${ids.length}`);
      return;
    }
    setConfirmingBulk(false);
      const r = await fetch(`${apiBase}/api/admin/categories/bulk-delete`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify({ ids }) });
    if (!r.ok) { try{ const j=await r.json(); showToast(`فشل الحذف${j?.code? ' ('+j.code+')':''}`); } catch { showToast('فشل الحذف'); } return; }
    let deletedCount = 0; try { const j = await r.json(); deletedCount = Number(j?.deleted||0); } catch {}
    // Verify each id no longer exists on server
    let remaining = 0; for (const id of ids) { const ex = await existsOnServer(id); if (ex) remaining++; }
    await Promise.all([loadList(), loadTree()]);
    setSelected({}); setAllChecked(false);
    if (deletedCount < 1 || remaining > 0) { showToast('فشل الحذف'); return; }
    showToast(`تم حذف ${deletedCount}`);
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
              await fetch(`${apiBase}/api/admin/categories/reorder`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify(payload) });
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
    <main style={{ padding:16, width:'100%' }}>
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
                <th style={{ textAlign:'right', padding:12, borderBottom:'1px solid #1c2333', background:'#0f1320' }}>الصورة</th>
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
                    {c.image ? (<img src={c.image} alt="cat" style={{ width:42, height:42, objectFit:'cover', borderRadius:8, border:'1px solid #1c2333' }} />) : (<span style={{ color:'#94a3b8' }}>—</span>)}
                  </td>
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
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=> openEdit(c)} style={{ padding:'6px 10px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>تعديل</button>
                      <button onClick={()=> remove(c.id)} style={{ padding:'6px 10px', background:'#7c2d12', color:'#fff', borderRadius:8 }}>حذف</button>
                    </div>
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
            <label>Slug
              <input value={slug} onChange={(e)=>setSlug(e.target.value)} onBlur={async()=>{
                if (!slug.trim()) return;
                try{
                  const r = await fetch(`/api/admin/categories?search=${encodeURIComponent(slug)}`, { credentials:'include', cache:'no-store', headers:{ ...authHeaders() } });
                  const j = await r.json();
                  const exists = Array.isArray(j?.categories) && j.categories.some((c:any)=> String(c.slug||'').toLowerCase() === slug.trim().toLowerCase());
                  if (exists) showToast('Slug مستخدم بالفعل');
                } catch {}
              }} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            </label>
              <label>SEO Title<input value={seoTitle} onChange={(e)=>setSeoTitle(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
              <label>SEO Description<input value={seoDescription} onChange={(e)=>setSeoDescription(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
              <label>SEO Keywords (comma)<input value={seoKeywords} onChange={(e)=>setSeoKeywords(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
            </div>
          <div style={{ marginTop:10 }}>
            <div style={{ color:'#94a3b8', marginBottom:6 }}>معاينة محرك البحث</div>
            <div className="panel" style={{ padding:12 }}>
              <div style={{ color:'#1d4ed8', fontSize:16, fontWeight:700 }}>{(seoTitle||name||'عنوان التصنيف')} | الموقع</div>
              <div style={{ color:'#059669', fontSize:12 }}>{slug? `https://www.example.com/c/${slug}` : 'https://www.example.com/c/your-slug'}</div>
              <div style={{ color:'#9ca3af', marginTop:4 }}>{seoDescription || (description? description.slice(0,160) : 'وصف موجز للتصنيف سيظهر في نتائج البحث.')}</div>
            </div>
          </div>
            <div style={{ border:'1px solid #1c2333', borderRadius:10, padding:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ color:'#94a3b8' }}>ترجمات</div>
                <button onClick={()=> setJsonEditorOpen(v=> !v)} className="btn btn-outline">{jsonEditorOpen? 'نموذج مبسط' : 'محرر JSON'}</button>
              </div>
              {!jsonEditorOpen ? (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <label>اسم (AR)<input value={trNameAr} onChange={(e)=>setTrNameAr(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
                  <label>اسم (EN)<input value={trNameEn} onChange={(e)=>setTrNameEn(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
                  <label>وصف (AR)<input value={trDescAr} onChange={(e)=>setTrDescAr(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
                  <label>وصف (EN)<input value={trDescEn} onChange={(e)=>setTrDescEn(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
                </div>
              ) : (
                <div>
                  <textarea value={jsonText} onChange={(e)=> setJsonText(e.target.value)} rows={8} className="input" style={{ width:'100%', borderRadius:10 }} />
                  <div style={{ color:'#94a3b8', fontSize:12, marginTop:6 }}>صيغة مثال: {`{"ar":{"name":"...","description":"..."},"en":{"name":"...","description":"..."}}`}</div>
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button onClick={()=>{ setMediaFor('add'); setMediaOpen(true); }} style={{ padding:'8px 12px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>اختر من الوسائط</button>
              {image && (<span style={{ color:'#94a3b8', fontSize:12 }}>تم اختيار صورة</span>)}
            </div>
            <div onDragOver={(e)=>{ e.preventDefault(); }} onDrop={async (e)=>{
              e.preventDefault();
              const f = e.dataTransfer?.files?.[0]; if (!f) return;
              try {
                const reader = new FileReader();
                reader.onload = ()=> {
                  const data = String(reader.result||'');
                  setImage(data);
                  showToast('تم التحميل محلياً');
                };
                reader.readAsDataURL(f);
              } catch { /* noop */ }
            }} style={{ border:'1px dashed #334155', borderRadius:10, padding:14, textAlign:'center', color:'#94a3b8' }}>
              اسحب وأفلت الصور هنا أو
              {image && (<div style={{ marginTop:10 }}><img src={image} alt="preview" style={{ maxWidth:'100%', borderRadius:8, border:'1px solid #1c2333' }} /></div>)}
            </div>
            <div style={{ marginTop:8 }}>
              <label style={{ display:'inline-block', padding:'8px 12px', background:'#374151', color:'#e5e7eb', borderRadius:8, cursor:'pointer' }}>
                اختر من جهازك
                <input type="file" accept="image/*" onChange={async (e)=>{
                  const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
                  const reader = new FileReader();
                  reader.onload = ()=> { const data = String(reader.result||''); setImage(data); showToast('تم التحميل محلياً'); };
                  reader.readAsDataURL(f);
                }} style={{ display:'none' }} />
              </label>
              {image && (<span style={{ marginInlineStart:8, color:'#94a3b8', fontSize:12 }}>تم اختيار صورة</span>)}
            </div>
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
      <EditModal open={editOpen} loading={editLoading} saving={editSaving} edit={edit} setEdit={setEdit} onClose={()=>{ setEditOpen(false); }} onSave={saveEdit} rows={rows} />
      <MediaPicker open={mediaOpen} onClose={()=>{ setMediaOpen(false); setMediaFor(null); }} onSelect={(url)=>{
        if (mediaFor==='edit') setEdit((c:any)=> ({...c, image: url }));
        if (mediaFor==='add') setImage(url);
      }} />
    </main>
  );
}

// Modal styles are inline to match existing style usage on this page
function EditModal({ open, loading, saving, edit, setEdit, onClose, onSave, rows }:{ open:boolean; loading:boolean; saving:boolean; edit:any; setEdit:(u:any)=>void; onClose:()=>void; onSave:()=>void; rows:any[] }): JSX.Element|null {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
      <div style={{ width:'min(900px, 92vw)', maxHeight:'85vh', overflow:'auto', background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h2 style={{ margin:0, fontSize:18 }}>تعديل التصنيف</h2>
          <button onClick={onClose} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>إغلاق</button>
        </div>
        {loading ? (
          <div className="panel">جارٍ التحميل…</div>
        ) : (
          <div style={{ display:'grid', gap:10 }}>
            <label>الاسم
              <input value={edit?.name||''} onChange={(e)=> setEdit((c:any)=> ({...c, name: (e.target as HTMLInputElement).value}))} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            </label>
            <label>الوصف
              <textarea value={edit?.description||''} onChange={(e)=> setEdit((c:any)=> ({...c, description: (e.target as HTMLTextAreaElement).value}))} rows={3} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <label>Slug
                <input value={edit?.slug||''} onChange={(e)=> setEdit((c:any)=> ({...c, slug: (e.target as HTMLInputElement).value}))} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
              </label>
              <label>التصنيف الأب
                <select value={edit?.parentId||''} onChange={(e)=> setEdit((c:any)=> ({...c, parentId: (e.target as HTMLSelectElement).value}))} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }}>
                  <option value="">(لا يوجد)</option>
                  {rows.filter((r:any)=> r.id !== edit?.id).map((r:any)=> (<option key={r.id} value={r.id}>{r.name}</option>))}
                </select>
              </label>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <label>SEO Title
                <input value={edit?.seoTitle||''} onChange={(e)=> setEdit((c:any)=> ({...c, seoTitle: (e.target as HTMLInputElement).value}))} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
              </label>
              <label>SEO Description
                <input value={edit?.seoDescription||''} onChange={(e)=> setEdit((c:any)=> ({...c, seoDescription: (e.target as HTMLInputElement).value}))} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
              </label>
            </div>
            <label>SEO Keywords (comma)
              <input value={edit?.seoKeywords||''} onChange={(e)=> setEdit((c:any)=> ({...c, seoKeywords: (e.target as HTMLInputElement).value}))} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            </label>
            <label>صورة (URL)
              <input value={edit?.image||''} onChange={(e)=> setEdit((c:any)=> ({...c, image: (e.target as HTMLInputElement).value}))} placeholder="https://...jpg" style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            </label>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button onClick={()=>{ setMediaFor('edit'); setMediaOpen(true); }} style={{ padding:'8px 12px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>اختر من الوسائط</button>
              {edit?.image && (<span style={{ color:'#94a3b8', fontSize:12 }}>تم اختيار صورة</span>)}
            </div>
            <div onDragOver={(e)=>{ e.preventDefault(); }} onDrop={async (e)=>{
              e.preventDefault();
              const f = e.dataTransfer?.files?.[0]; if (!f) return;
              try {
                const reader = new FileReader();
                reader.onload = ()=> {
                  const data = String(reader.result||'');
                  setEdit((c:any)=> ({...c, image: data }));
                  showToast('تم التحميل محلياً');
                };
                reader.readAsDataURL(f);
              } catch {}
            }} style={{ border:'1px dashed #334155', borderRadius:10, padding:14, textAlign:'center', color:'#94a3b8' }}>
              اسحب وأفلت الصور هنا أو
              {edit?.image && (<div style={{ marginTop:10 }}><img src={edit.image} alt="preview" style={{ maxWidth:'100%', borderRadius:8, border:'1px solid #1c2333' }} /></div>)}
            </div>
            <div style={{ marginTop:8 }}>
              <label style={{ display:'inline-block', padding:'8px 12px', background:'#374151', color:'#e5e7eb', borderRadius:8, cursor:'pointer' }}>
                اختر من جهازك
                <input type="file" accept="image/*" onChange={async (e)=>{
                  const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
                  const reader = new FileReader();
                  reader.onload = ()=> { const data = String(reader.result||''); setEdit((c:any)=> ({...c, image: data })); showToast('تم التحميل محلياً'); };
                  reader.readAsDataURL(f);
                }} style={{ display:'none' }} />
              </label>
              {edit?.image && (<span style={{ marginInlineStart:8, color:'#94a3b8', fontSize:12 }}>تم اختيار صورة</span>)}
            </div>
            {/* translations UI removed as requested */}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={onClose} style={{ padding:'10px 14px', background:'#111827', color:'#e5e7eb', borderRadius:10 }}>إلغاء</button>
              <button onClick={onSave} disabled={saving} style={{ padding:'10px 14px', background: saving? '#6b7280':'#800020', color:'#fff', borderRadius:10 }}>{saving? 'جارٍ الحفظ…' : 'حفظ'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MediaPicker({ open, onClose, onSelect }:{ open:boolean; onClose:()=>void; onSelect:(url:string)=>void }): JSX.Element|null {
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
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>
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