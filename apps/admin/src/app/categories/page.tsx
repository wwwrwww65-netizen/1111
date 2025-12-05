"use client";
import React from "react";
import { Section } from "../components/Ui";
import { resolveApiBase } from "../lib/apiBase";
import ProductSeoEditor from "../products/components/ProductSeoEditor";
export const dynamic = 'force-dynamic';

function useApiBase() {
  return React.useMemo(() => resolveApiBase(), []);
}
function useAuthHeaders() {
  return React.useCallback(() => {
    if (typeof document === 'undefined') return {} as Record<string, string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch { }
    return token ? { Authorization: `Bearer ${token}` } : {} as Record<string, string>;
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
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [parentId, setParentId] = React.useState<string>("");
  const [slug, setSlug] = React.useState("");
  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDescription, setSeoDescription] = React.useState("");
  const [seoKeywords, setSeoKeywords] = React.useState("");
  const [canonicalUrl, setCanonicalUrl] = React.useState("");
  const [metaRobots, setMetaRobots] = React.useState("");
  const [hiddenContent, setHiddenContent] = React.useState("");
  const [trNameAr, setTrNameAr] = React.useState("");
  const [trDescAr, setTrDescAr] = React.useState("");
  const [trNameEn, setTrNameEn] = React.useState("");
  const [trDescEn, setTrDescEn] = React.useState("");
  const [jsonEditorOpen, setJsonEditorOpen] = React.useState<boolean>(false);
  const [jsonText, setJsonText] = React.useState<string>(`{
  "ar": { "name": "", "description": "" },
  "en": { "name": "", "description": "" }
}`);
  const [ogTagsStr, setOgTagsStr] = React.useState("");
  const [twitterCardStr, setTwitterCardStr] = React.useState(""); // Added for compatibility
  const [schemaStr, setSchemaStr] = React.useState("");
  const [toast, setToast] = React.useState<string>("");
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1800); };

  const [siteName, setSiteName] = React.useState("");
  const [siteUrl, setSiteUrl] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/settings/list`, { credentials: 'include', headers: { ...authHeaders() } });
        const data = await res.json();
        const settings = data.settings || [];
        const n = settings.find((s: any) => s.key === 'site_name');
        const u = settings.find((s: any) => s.key === 'site_url');
        if (n?.value?.value) setSiteName(n.value.value);
        if (u?.value?.value) setSiteUrl(u.value.value);
      } catch { }
    })();
  }, [apiBase]);

  async function fileToBase64(file: File): Promise<string> {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  async function loadList() {
    const url = new URL(`/api/admin/categories`, window.location.origin);
    url.searchParams.set('_', String(Date.now()));
    if (search) url.searchParams.set('search', search);
    const res = await fetch(url.toString(), { credentials: 'include', cache: 'no-store', headers: { ...authHeaders() } });
    if (!res.ok) { setRows([]); return; }
    const j = await res.json(); setRows(j.categories || []);
  }
  async function loadTree() {
    const res = await fetch(`/api/admin/categories/tree`, { credentials: 'include', cache: 'no-store', headers: { ...authHeaders() } });
    if (!res.ok) { setTree([]); return; }
    const j = await res.json(); setTree(j.tree || []);
  }
  React.useEffect(() => { loadList(); loadTree(); }, [apiBase]);

  const [saving, setSaving] = React.useState(false);
  async function add() {
    try {
      if (!name.trim()) { showToast('الاسم مطلوب'); return; }
      setSaving(true);
      let finalImage = image;
      // Prefer uploading a selected file (blob preview) at save time
      if (imageFile) {
        try {
          const base64 = await fileToBase64(imageFile);
          const up = await fetch(`/api/admin/media`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json', ...authHeaders() }, body: JSON.stringify({ base64 }) });
          if (up.ok) {
            const j = await up.json();
            finalImage = j.asset?.url || j.url || j.secure_url || j.presign?.url || '';
          } else {
            finalImage = '';
          }
        } catch { finalImage = ''; }
      } else if (typeof finalImage === 'string' && (finalImage.startsWith('data:') || finalImage.startsWith('blob:'))) {
        // Avoid sending base64/blob in payload if not uploaded
        finalImage = '';
      }
      let translations: any = { ar: { name: trNameAr || name, description: trDescAr || description }, en: { name: trNameEn || '', description: trDescEn || '' } };
      if (jsonEditorOpen) {
        try { const parsed = JSON.parse(jsonText || '{}'); if (parsed && typeof parsed === 'object') translations = parsed; } catch { }
      }
      const keywords = seoKeywords.split(',').map(s => s.trim()).filter(Boolean);
      // Persist the media asset when we have a URL or base64 to ensure it appears in Media Library too
      try {
        if (finalImage) {
          const body: any = finalImage.startsWith('data:') ? { base64: finalImage } : { url: finalImage };
          await fetch(`/api/admin/media`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }).catch(() => null);
        }
      } catch { }
      const payload = {
        name, description, image: finalImage, parentId: parentId || null, slug, seoTitle, seoDescription, seoKeywords: keywords, canonicalUrl, metaRobots, hiddenContent, translations,
        ogTags: (() => { try { return ogTagsStr ? JSON.parse(ogTagsStr) : undefined } catch { return undefined } })(),
        twitterCard: (() => { try { return twitterCardStr ? JSON.parse(twitterCardStr) : undefined } catch { return undefined } })(),
        schema: (() => { try { return schemaStr ? JSON.parse(schemaStr) : undefined } catch { return undefined } })()
      };
      const res = await fetch(`/api/admin/categories`, { method: 'POST', headers: { 'content-type': 'application/json', ...authHeaders() }, credentials: 'include', cache: 'no-store', body: JSON.stringify(payload) });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        showToast(`فشل الإضافة${t ? ': ' + t : ''}`);
        return;
      }
      setName(""); setDescription(""); setImage(""); setImageFile(null); setParentId(""); setSlug(""); setSeoTitle(""); setSeoDescription(""); setSeoKeywords(""); setCanonicalUrl(""); setMetaRobots(""); setHiddenContent(""); setTrNameAr(""); setTrDescAr(""); setTrNameEn(""); setTrDescEn(""); setOgTagsStr(""); setSchemaStr("");
      await Promise.all([loadList(), loadTree()]);
      showToast('تمت الإضافة');
    } catch (e: any) {
      showToast(`تعذّرت الإضافة${e?.message ? ': ' + e.message : ''}`);
    } finally {
      setSaving(false);
    }
  }
  async function update(cat: any) {
    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json', ...authHeaders() }, credentials: 'include', body: JSON.stringify({ name: cat.name, description: cat.description, image: cat.image, parentId: cat.parentId || null, slug: cat.slug, seoTitle: cat.seoTitle, seoDescription: cat.seoDescription, seoKeywords: cat.seoKeywords, canonicalUrl: cat.canonicalUrl, metaRobots: cat.metaRobots, hiddenContent: cat.hiddenContent, translations: cat.translations }) });
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
  const [editFile, setEditFile] = React.useState<File | null>(null);
  const [mediaOpen, setMediaOpen] = React.useState(false);
  const [mediaFor, setMediaFor] = React.useState<'add' | 'edit' | null>(null);
  async function existsOnServer(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/admin/categories?search=${encodeURIComponent(id)}`, { credentials: 'include', cache: 'no-store' });
      if (!res.ok) return true;
      const j = await res.json();
      return Array.isArray(j?.categories) && j.categories.some((c: any) => c.id === id);
    } catch { return true; }
  }
  async function remove(id: string) {
    if (confirmingDeleteId !== id) {
      setConfirmingDeleteId(id);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirmingDeleteId(null), 4000);
      showToast('اضغط حذف مرة أخرى لتأكيد العملية');
      return;
    }
    setConfirmingDeleteId(null);
    const r = await fetch(`/api/admin/categories/bulk-delete`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json', ...authHeaders() }, body: JSON.stringify({ ids: [id] }) });
    if (!r.ok) { try { const j = await r.json(); showToast(`فشل الحذف${j?.code ? ' (' + j.code + ')' : ''}`); } catch { showToast('فشل الحذف'); } return; }
    let deletedCount = 0; try { const j = await r.json(); deletedCount = Number(j?.deleted || 0); } catch { }
    const stillExists = await existsOnServer(id);
    await Promise.all([loadList(), loadTree()]);
    if (deletedCount < 1 || stillExists) { showToast('فشل الحذف'); return; }
    showToast('تم الحذف');
  }
  async function openEdit(cat: any) {
    try {
      setEditOpen(true);
      setEditFile(null);
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
        canonicalUrl: cat.canonicalUrl || '',
        metaRobots: cat.metaRobots || '',
        hiddenContent: cat.hiddenContent || '',
        translations: cat.translations ? JSON.stringify(cat.translations, null, 2) : '{\n  "ar": { "name": "", "description": "" },\n  "en": { "name": "", "description": "" }\n}',
        ogTagsStr: cat.ogTags ? JSON.stringify(cat.ogTags, null, 2) : '',
        twitterCardStr: cat.twitterCard ? JSON.stringify(cat.twitterCard, null, 2) : '',
        schemaStr: cat.schema ? JSON.stringify(cat.schema, null, 2) : ''
      });
      setEditLoading(true);
      const r = await fetch(`/api/admin/categories/${cat.id}`, { credentials: 'include', cache: 'no-store', headers: { ...authHeaders() } });
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
        canonicalUrl: c.canonicalUrl || '',
        metaRobots: c.metaRobots || '',
        hiddenContent: c.hiddenContent || '',
        translations: c.translations ? JSON.stringify(c.translations, null, 2) : '{\n  "ar": { "name": "", "description": "" },\n  "en": { "name": "", "description": "" }\n}',
        ogTagsStr: c.ogTags ? JSON.stringify(c.ogTags, null, 2) : '',
        twitterCardStr: c.twitterCard ? JSON.stringify(c.twitterCard, null, 2) : '',
        schemaStr: c.schema ? JSON.stringify(c.schema, null, 2) : ''
      });
    } catch { showToast('تعذر جلب البيانات'); }
    finally { setEditLoading(false); }
  }
  async function saveEdit() {
    if (!edit || !edit.id) return;
    setEditSaving(true);
    try {
      let finalImage = edit.image || '';
      if (editFile) {
        try {
          const base64 = await fileToBase64(editFile);
          const up = await fetch(`/api/admin/media`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json', ...authHeaders() }, body: JSON.stringify({ base64 }) });
          if (up.ok) {
            const j = await up.json();
            finalImage = j.asset?.url || j.url || j.secure_url || j.presign?.url || '';
          } else { finalImage = ''; }
        } catch { finalImage = ''; }
      } else if (typeof finalImage === 'string' && (finalImage.startsWith('data:') || finalImage.startsWith('blob:'))) {
        finalImage = '';
      }
      let translations: any = undefined;
      try { const parsed = JSON.parse(String(edit.translations || '{}')); if (parsed && typeof parsed === 'object') translations = parsed; } catch { }
      // Persist the media asset for edit as well
      try {
        if (finalImage) {
          const body: any = finalImage.startsWith('data:') ? { base64: finalImage } : { url: finalImage };
          await fetch(`/api/admin/media`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }).catch(() => null);
        }
      } catch { }
      const payload: any = {
        name: edit.name,
        description: edit.description,
        image: finalImage,
        parentId: edit.parentId || null,
        slug: edit.slug,
        seoKeywords: (typeof edit.seoKeywords === 'string' ? edit.seoKeywords.split(',') : (edit.seoKeywords || [])).map((k: any) => String(k).trim()).filter(Boolean),
        seoDescription: edit.seoDescription,
        seoTitle: edit.seoTitle,
        canonicalUrl: edit.canonicalUrl,
        metaRobots: edit.metaRobots,
        hiddenContent: edit.hiddenContent,
        ogTags: (() => { try { return edit.ogTagsStr ? JSON.parse(edit.ogTagsStr) : undefined } catch { return undefined } })(),
        twitterCard: (() => { try { return edit.twitterCardStr ? JSON.parse(edit.twitterCardStr) : undefined } catch { return undefined } })(),
        schema: (() => { try { return edit.schemaStr ? JSON.parse(edit.schemaStr) : undefined } catch { return undefined } })(),
        translations
      };

      const r = await fetch(edit.id ? `/api/admin/categories/${edit.id}` : `/api/admin/categories`, {
        method: edit.id ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });

      if (!r.ok) {
        if (r.status === 409) { showToast('Slug مستخدم بالفعل'); return; }
        try { const j = await r.json(); showToast(j?.error || 'فشل الحفظ'); } catch { showToast('فشل الحفظ'); }
        return;
      }
      await Promise.all([loadList(), loadTree()]);
      showToast('تم الحفظ'); setEditOpen(false); setEdit(null); setEditFile(null);
    } finally { setEditSaving(false); }
  }
  const [confirmingBulk, setConfirmingBulk] = React.useState(false);
  async function removeSelected() {
    const ids = Object.keys(selected).filter(k => selected[k]); if (!ids.length) return;
    if (!confirmingBulk) {
      setConfirmingBulk(true);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirmingBulk(false), 4000);
      showToast(`اضغط حذف مرة أخرى لتأكيد حذف ${ids.length}`);
      return;
    }
    setConfirmingBulk(false);
    const r = await fetch(`/api/admin/categories/bulk-delete`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json', ...authHeaders() }, body: JSON.stringify({ ids }) });
    if (!r.ok) { try { const j = await r.json(); showToast(`فشل الحذف${j?.code ? ' (' + j.code + ')' : ''}`); } catch { showToast('فشل الحذف'); } return; }
    let deletedCount = 0; try { const j = await r.json(); deletedCount = Number(j?.deleted || 0); } catch { }
    // Verify each id no longer exists on server
    let remaining = 0; for (const id of ids) { const ex = await existsOnServer(id); if (ex) remaining++; }
    await Promise.all([loadList(), loadTree()]);
    setSelected({}); setAllChecked(false);
    if (deletedCount < 1 || remaining > 0) { showToast('فشل الحذف'); return; }
    showToast(`تم حذف ${deletedCount}`);
  }

  function Tree({ nodes }: { nodes: any[] }) {
    return (
      <ul style={{ listStyle: 'none', paddingInlineStart: 16 }}>
        {nodes.map((n) => (
          <li key={n.id} style={{ marginBottom: 6 }} draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', n.id); }} onDragOver={(e) => { e.preventDefault(); }} onDrop={async (e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('text/plain'); if (!draggedId || draggedId === n.id) return;
            try {
              const siblings = (n.children || []).map((c: any, idx: number) => ({ id: c.id, parentId: n.id, sortOrder: idx }));
              const payload = { items: [{ id: draggedId, parentId: n.id, sortOrder: siblings.length }, ...siblings] };
              await fetch(`/api/admin/categories/reorder`, { method: 'POST', headers: { 'content-type': 'application/json', ...authHeaders() }, credentials: 'include', body: JSON.stringify(payload) });
              await Promise.all([loadList(), loadTree()]);
              showToast('تم إعادة الترتيب');
            } catch { showToast('فشل إعادة الترتيب'); }
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ padding: '2px 8px', background: '#111827', borderRadius: 999, fontSize: 12, color: '#9ca3af' }}>{n.id.slice(0, 6)}</span>
              <strong>{n.name}</strong>
              <button onClick={async () => { setParentId(n.id); setName(''); setDescription(''); setImage(''); showToast('سيتم الإضافة كإبن لـ ' + n.name); }} style={{ marginInlineStart: 'auto', padding: '4px 8px', background: '#111827', color: '#e5e7eb', borderRadius: 6 }}>إضافة ابن</button>
              <button onClick={() => remove(n.id)} style={{ padding: '4px 8px', background: '#7c2d12', color: '#fff', borderRadius: 6 }}>حذف</button>
            </div>
            {n.children?.length ? <Tree nodes={n.children} /> : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main style={{ padding: 16, width: '100%' }}>
      <h1 style={{ marginBottom: 16, fontSize: 22, fontWeight: 700 }}>التصنيفات</h1>
      {toast && (<div style={{ marginBottom: 8, background: '#111827', color: '#e5e7eb', padding: '6px 10px', borderRadius: 8 }}>{toast}</div>)}

      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ background: '#0b0e14', border: '1px solid #1c2333', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم" style={{ flex: 1, padding: 10, borderRadius: 10, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }} />
            <button onClick={() => { loadList(); }} style={{ padding: '10px 14px', background: '#111827', color: '#e5e7eb', borderRadius: 10 }}>بحث</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#0b0e14', zIndex: 1 }}>
              <tr>
                <th style={{ textAlign: 'right', padding: 12, borderBottom: '1px solid #1c2333', background: '#0f1320' }}><input type="checkbox" checked={allChecked} onChange={(e) => { const v = e.currentTarget.checked; setAllChecked(v); setSelected(Object.fromEntries(rows.map(c => [c.id, v]))); }} /></th>
                <th style={{ textAlign: 'right', padding: 12, borderBottom: '1px solid #1c2333', background: '#0f1320' }}>ID</th>
                <th style={{ textAlign: 'right', padding: 12, borderBottom: '1px solid #1c2333', background: '#0f1320' }}>الصورة</th>
                <th style={{ textAlign: 'right', padding: 12, borderBottom: '1px solid #1c2333', background: '#0f1320' }}>الاسم</th>
                <th style={{ textAlign: 'right', padding: 12, borderBottom: '1px solid #1c2333', background: '#0f1320' }}>Slug</th>
                <th style={{ textAlign: 'right', padding: 12, borderBottom: '1px solid #1c2333', background: '#0f1320' }}>أب</th>
                <th style={{ textAlign: 'right', padding: 12, borderBottom: '1px solid #1c2333', background: '#0f1320' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c: any, idx: number) => (
                <tr key={c.id} style={{ background: idx % 2 ? '#0a0e17' : 'transparent' }}>
                  <td style={{ padding: 12, borderBottom: '1px solid #1c2333' }}><input type="checkbox" checked={!!selected[c.id]} onChange={() => setSelected(s => ({ ...s, [c.id]: !s[c.id] }))} /></td>
                  <td style={{ padding: 12, borderBottom: '1px solid #1c2333' }}>{c.id.slice(0, 6)}</td>
                  <td style={{ padding: 12, borderBottom: '1px solid #1c2333' }}>
                    {c.image ? (<img src={c.image} alt="cat" style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 8, border: '1px solid #1c2333' }} />) : (<span style={{ color: '#94a3b8' }}>—</span>)}
                  </td>
                  <td style={{ padding: 12, borderBottom: '1px solid #1c2333' }}>
                    <input defaultValue={c.name} onBlur={(e) => update({ ...c, name: (e.target as HTMLInputElement).value })} style={{ padding: 8, borderRadius: 8, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }} />
                  </td>
                  <td style={{ padding: 12, borderBottom: '1px solid #1c2333' }}>
                    <input defaultValue={c.slug || ''} onBlur={(e) => update({ ...c, slug: (e.target as HTMLInputElement).value })} style={{ padding: 8, borderRadius: 8, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }} />
                  </td>
                  <td style={{ padding: 12, borderBottom: '1px solid #1c2333' }}>
                    <select defaultValue={c.parentId || ''} onChange={async (e) => { const v = (e.target as HTMLSelectElement).value || null; await update({ ...c, parentId: v }); }} style={{ padding: 8, borderRadius: 8, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }}>
                      <option value="">(لا يوجد)</option>
                      {rows.filter((r: any) => r.id !== c.id).map((r: any) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                    </select>
                  </td>
                  <td style={{ padding: 12, borderBottom: '1px solid #1c2333' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(c)} style={{ padding: '6px 10px', background: '#374151', color: '#e5e7eb', borderRadius: 8 }}>تعديل</button>
                      <button onClick={() => remove(c.id)} style={{ padding: '6px 10px', background: '#7c2d12', color: '#fff', borderRadius: 8 }}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button onClick={removeSelected} style={{ padding: '8px 12px', background: '#7c2d12', color: '#fff', borderRadius: 8 }}>حذف المحدد</button>
          </div>
        </div>

        <div style={{ background: '#0b0e14', border: '1px solid #1c2333', borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>إضافة تصنيف</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            <label>الاسم<input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }} /></label>
            <label>الوصف<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: 10, borderRadius: 10, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }} /></label>
            <div style={{ marginTop: 10, background: '#0b0e14', border: '1px solid #1c2333', borderRadius: 10, padding: 16 }}>
              <ProductSeoEditor
                siteName={siteName}
                siteUrl={siteUrl}
                pathPrefix="/c/"
                data={{
                  slug,
                  titleSeo: seoTitle,
                  metaDescription: seoDescription,
                  focusKeyword: seoKeywords,
                  canonicalUrl,
                  metaRobots,
                  schema: schemaStr,
                  hiddenContent,
                  ogTags: (() => { try { return ogTagsStr ? JSON.parse(ogTagsStr) : {} } catch { return {} } })(),
                  twitterCard: (() => { try { return twitterCardStr ? JSON.parse(twitterCardStr) : {} } catch { return {} } })()
                }}
                onChange={(changes) => {
                  if (changes.slug !== undefined) setSlug(changes.slug);
                  if (changes.titleSeo !== undefined) setSeoTitle(changes.titleSeo);
                  if (changes.metaDescription !== undefined) setSeoDescription(changes.metaDescription);
                  if (changes.focusKeyword !== undefined) setSeoKeywords(changes.focusKeyword);
                  if (changes.canonicalUrl !== undefined) setCanonicalUrl(changes.canonicalUrl);
                  if (changes.metaRobots !== undefined) setMetaRobots(changes.metaRobots);
                  if (changes.schema !== undefined) setSchemaStr(changes.schema);
                  if (changes.hiddenContent !== undefined) setHiddenContent(changes.hiddenContent);
                  if (changes.ogTags !== undefined) setOgTagsStr(JSON.stringify(changes.ogTags, null, 2));
                  if (changes.twitterCard !== undefined) setTwitterCardStr(JSON.stringify(changes.twitterCard, null, 2));
                }}
              />
            </div>

            <div style={{ border: '1px solid #1c2333', borderRadius: 10, padding: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ color: '#94a3b8' }}>ترجمات</div>
                <button onClick={() => setJsonEditorOpen(v => !v)} className="btn btn-outline">{jsonEditorOpen ? 'نموذج مبسط' : 'محرر JSON'}</button>
              </div>
              {!jsonEditorOpen ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label>اسم (AR)<input value={trNameAr} onChange={(e) => setTrNameAr(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }} /></label>
                  <label>اسم (EN)<input value={trNameEn} onChange={(e) => setTrNameEn(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }} /></label>
                  <label>وصف (AR)<input value={trDescAr} onChange={(e) => setTrDescAr(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }} /></label>
                  <label>وصف (EN)<input value={trDescEn} onChange={(e) => setTrDescEn(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }} /></label>
                </div>
              ) : (
                <div>
                  <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={8} className="input" style={{ width: '100%', borderRadius: 10 }} />
                  <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>صيغة مثال: {`{"ar":{"name":"...","description":"..."},"en":{"name":"...","description":"..."}}`}</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => { setMediaFor('add'); setMediaOpen(true); }} style={{ padding: '8px 12px', background: '#374151', color: '#e5e7eb', borderRadius: 8 }}>اختر من الوسائط</button>
              {image && (<span style={{ color: '#94a3b8', fontSize: 12 }}>تم اختيار صورة</span>)}
            </div>
            <div onDragOver={(e) => { e.preventDefault(); }} onDrop={async (e) => {
              e.preventDefault();
              const f = e.dataTransfer?.files?.[0]; if (!f) return;
              try {
                const reader = new FileReader();
                reader.onload = () => {
                  try { URL.revokeObjectURL(image); } catch { }
                  const blobUrl = URL.createObjectURL(f);
                  setImage(blobUrl);
                  setImageFile(f);
                  showToast('تم التحميل محلياً');
                };
                reader.readAsDataURL(f);
              } catch { /* noop */ }
            }} style={{ border: '1px dashed #334155', borderRadius: 10, padding: 14, textAlign: 'center', color: '#94a3b8' }}>
              اسحب وأفلت الصور هنا أو
              {image && (<div style={{ marginTop: 10 }}><img src={image} alt="preview" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #1c2333' }} /></div>)}
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-block', padding: '8px 12px', background: '#374151', color: '#e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
                اختر من جهازك
                <input type="file" accept="image/*" onChange={async (e) => {
                  const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
                  try { URL.revokeObjectURL(image); } catch { }
                  const blobUrl = URL.createObjectURL(f);
                  setImage(blobUrl);
                  setImageFile(f);
                  showToast('تم التحميل محلياً');
                }} style={{ display: 'none' }} />
              </label>
              {image && (<span style={{ marginInlineStart: 8, color: '#94a3b8', fontSize: 12 }}>تم اختيار صورة</span>)}
            </div>
            <label>التصنيف الأب
              <select value={parentId} onChange={(e) => setParentId(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }}>
                <option value="">(لا يوجد)</option>
                {rows.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </label>
            <button onClick={add} disabled={saving || !name.trim()} style={{ padding: '10px 14px', background: saving ? '#6b7280' : '#800020', color: '#fff', borderRadius: 10, opacity: (saving || !name.trim()) ? 0.7 : 1 }}>{saving ? 'جارٍ الحفظ...' : 'إضافة'}</button>
          </div>

          <div style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>عرض هرمي</h3>
            <div style={{ border: '1px solid #1c2333', borderRadius: 10, padding: 10, maxHeight: 360, overflow: 'auto' }}>
              <Tree nodes={tree} />
            </div>
          </div>
        </div>
      </section>
      <EditModal open={editOpen} loading={editLoading} saving={editSaving} edit={edit} setEdit={setEdit} onClose={() => { setEditOpen(false); }} onSave={saveEdit} rows={rows} setMediaOpen={setMediaOpen} setMediaFor={setMediaFor} setEditFile={setEditFile} showToast={showToast} />
      <MediaPicker open={mediaOpen} onClose={() => { setMediaOpen(false); setMediaFor(null); }} onSelect={(url) => {
        if (mediaFor === 'edit') { setEditFile(null); setEdit((c: any) => ({ ...c, image: url })); }
        if (mediaFor === 'add') { setImageFile(null); setImage(url); }
      }} />
    </main >
  );
}

function EditModal({ open, loading, saving, edit, setEdit, onClose, onSave, rows, setMediaOpen, setMediaFor, setEditFile, showToast }: { open: boolean; loading: boolean; saving: boolean; edit: any; setEdit: (u: any) => void; onClose: () => void; onSave: () => void; rows: any[]; setMediaOpen: (v: boolean) => void; setMediaFor: (v: 'add' | 'edit' | null) => void; setEditFile: (f: File | null) => void; showToast: (m: string) => void }): JSX.Element | null {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ width: 'min(900px, 92vw)', maxHeight: '85vh', overflow: 'auto', background: '#0b0e14', border: '1px solid #1c2333', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>تعديل التصنيف</h2>
          <button onClick={onClose} style={{ padding: '6px 10px', background: '#111827', color: '#e5e7eb', borderRadius: 8 }}>إغلاق</button>
        </div>
        {loading ? (
          <div className="panel">جارٍ التحميل…</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            <label>الاسم
              <input value={edit?.name || ''} onChange={(e) => setEdit((c: any) => ({ ...c, name: (e.target as HTMLInputElement).value }))} style={{ width: '100%', padding: 10, borderRadius: 10, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }} />
            </label>
            <label>الوصف
              <textarea value={edit?.description || ''} onChange={(e) => setEdit((c: any) => ({ ...c, description: (e.target as HTMLTextAreaElement).value }))} rows={3} style={{ width: '100%', padding: 10, borderRadius: 10, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }} />
            </label>
            <label>التصنيف الأب
              <select value={edit?.parentId || ''} onChange={(e) => setEdit((c: any) => ({ ...c, parentId: (e.target as HTMLSelectElement).value }))} style={{ width: '100%', padding: 10, borderRadius: 10, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }}>
                <option value="">(لا يوجد)</option>
                {rows.filter((r: any) => r.id !== edit?.id).map((r: any) => (<option key={r.id} value={r.id}>{r.name}</option>))}
              </select>
            </label>
            <div className="panel" style={{ marginTop: 10, padding: 12 }}>
              <ProductSeoEditor
                // Pass current edit state
                data={{
                  slug: edit?.slug || '',
                  titleSeo: edit?.seoTitle || '',
                  metaDescription: edit?.seoDescription || '',
                  focusKeyword: edit?.seoKeywords || '', // handle array/string conversion? edit object has it as array usually. Wait, in openEdit it sets seoKeywords as string (join).
                  // In edit object it might be string if coming from openEdit.
                  canonicalUrl: edit?.canonicalUrl || '',
                  metaRobots: edit?.metaRobots || '',
                  schema: edit?.schemaStr || '',
                  hiddenContent: edit?.hiddenContent || '',
                  ogTags: (() => { try { return edit?.ogTagsStr ? JSON.parse(edit.ogTagsStr) : {} } catch { return {} } })(),
                  twitterCard: (() => { try { return edit?.twitterCardStr ? JSON.parse(edit.twitterCardStr) : {} } catch { return {} } })()
                }}
                pathPrefix="/c/"
                onChange={(changes) => {
                  setEdit((prev: any) => {
                    const next = { ...prev };
                    if (changes.slug !== undefined) next.slug = changes.slug;
                    if (changes.titleSeo !== undefined) next.seoTitle = changes.titleSeo;
                    if (changes.metaDescription !== undefined) next.seoDescription = changes.metaDescription;
                    if (changes.focusKeyword !== undefined) next.seoKeywords = changes.focusKeyword; // String
                    if (changes.canonicalUrl !== undefined) next.canonicalUrl = changes.canonicalUrl;
                    if (changes.metaRobots !== undefined) next.metaRobots = changes.metaRobots;
                    if (changes.schema !== undefined) next.schemaStr = changes.schema;
                    if (changes.hiddenContent !== undefined) next.hiddenContent = changes.hiddenContent;
                    if (changes.ogTags !== undefined) next.ogTagsStr = JSON.stringify(changes.ogTags, null, 2);
                    if (changes.twitterCard !== undefined) next.twitterCardStr = JSON.stringify(changes.twitterCard, null, 2);
                    return next;
                  });
                }}
              />
            </div>
            <label>صورة (URL)
              <input value={edit?.image || ''} onChange={(e) => setEdit((c: any) => ({ ...c, image: (e.target as HTMLInputElement).value }))} placeholder="https://...jpg" style={{ width: '100%', padding: 10, borderRadius: 10, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }} />
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => { setMediaFor('edit'); setMediaOpen(true); }} style={{ padding: '8px 12px', background: '#374151', color: '#e5e7eb', borderRadius: 8 }}>اختر من الوسائط</button>
              {edit?.image && (<span style={{ color: '#94a3b8', fontSize: 12 }}>تم اختيار صورة</span>)}
            </div>
            <div onDragOver={(e) => { e.preventDefault(); }} onDrop={async (e) => {
              e.preventDefault();
              const f = e.dataTransfer?.files?.[0]; if (!f) return;
              try {
                const reader = new FileReader();
                reader.onload = () => {
                  try { URL.revokeObjectURL(edit?.image || ''); } catch { }
                  const blobUrl = URL.createObjectURL(f);
                  setEdit((c: any) => ({ ...c, image: blobUrl }));
                  setEditFile(f);
                  showToast('تم التحميل محلياً');
                };
                reader.readAsDataURL(f);
              } catch { }
            }} style={{ border: '1px dashed #334155', borderRadius: 10, padding: 14, textAlign: 'center', color: '#94a3b8' }}>
              اسحب وأفلت الصور هنا أو
              {edit?.image && (<div style={{ marginTop: 10 }}><img src={edit.image} alt="preview" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #1c2333' }} /></div>)}
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-block', padding: '8px 12px', background: '#374151', color: '#e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
                اختر من جهازك
                <input type="file" accept="image/*" onChange={async (e) => {
                  const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
                  try { URL.revokeObjectURL(edit?.image || ''); } catch { }
                  const blobUrl = URL.createObjectURL(f);
                  setEdit((c: any) => ({ ...c, image: blobUrl }));
                  setEditFile(f);
                  showToast('تم التحميل محلياً');
                }} style={{ display: 'none' }} />
              </label>
              {edit?.image && (<span style={{ marginInlineStart: 8, color: '#94a3b8', fontSize: 12 }}>تم اختيار صورة</span>)}
            </div>
            {/* translations UI removed as requested */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={onClose} style={{ padding: '10px 14px', background: '#111827', color: '#e5e7eb', borderRadius: 10 }}>إلغاء</button>
              <button onClick={onSave} disabled={saving} style={{ padding: '10px 14px', background: saving ? '#6b7280' : '#800020', color: '#fff', borderRadius: 10 }}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MediaPicker({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (url: string) => void }): JSX.Element | null {
  const [rows, setRows] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const limit = 24;
  React.useEffect(() => {
    if (!open) return; (async () => {
      try {
        const r = await fetch(`/api/admin/media/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { credentials: 'include' });
        const j = await r.json(); setRows(j.assets || []); setTotal(j.total || 0);
      } catch { }
    })();
  }, [open, page, search]);
  if (!open) return null;
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ width: 'min(1000px, 94vw)', maxHeight: '85vh', overflow: 'auto', background: '#0b0e14', border: '1px solid #1c2333', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>الوسائط</h3>
          <button onClick={onClose} style={{ padding: '6px 10px', background: '#111827', color: '#e5e7eb', borderRadius: 8 }}>إغلاق</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input value={search} onChange={(e) => setSearch((e.target as HTMLInputElement).value)} placeholder="بحث" style={{ flex: 1, padding: 10, borderRadius: 10, background: '#0f1320', border: '1px solid #1c2333', color: '#e2e8f0' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(120px, 1fr))', gap: 10 }}>
          {rows.map((a: any) => (
            <button key={a.id} onClick={() => { onSelect(a.url); onClose(); }} style={{ background: '#0f1320', border: '1px solid #1c2333', borderRadius: 8, padding: 6 }}>
              <img src={a.url} alt={a.alt || ''} style={{ width: '100%', borderRadius: 6 }} />
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>{total} عنصر</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ padding: '6px 10px', background: '#111827', color: '#e5e7eb', borderRadius: 8 }}>السابق</button>
            <span style={{ color: '#94a3b8' }}>{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))} style={{ padding: '6px 10px', background: '#111827', color: '#e5e7eb', borderRadius: 8 }}>التالي</button>
          </div>
        </div>
      </div>
    </div>
  );
}