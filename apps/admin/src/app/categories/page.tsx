"use client";
import React from "react";
export const dynamic = 'force-dynamic';

function useApiBase(){
  return React.useMemo(()=> (process.env.NEXT_PUBLIC_API_BASE_URL as string) || (typeof window!=="undefined" ? window.location.origin.replace('jeeey-manger','jeeeyai') : 'http://localhost:4000'), []);
}
function useAuthHeaders(){
  return React.useCallback(() => {
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
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
  const [toast, setToast] = React.useState<string>("");
  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(""), 1800); };

  async function loadList(){
    const url = new URL(`${apiBase}/api/admin/categories`);
    if (search) url.searchParams.set('search', search);
    const res = await fetch(url.toString(), { credentials:'include', cache:'no-store', headers: { ...authHeaders() } });
    if (!res.ok) { setRows([]); return; }
    const j = await res.json(); setRows(j.categories||[]);
  }
  async function loadTree(){
    const res = await fetch(`${apiBase}/api/admin/categories/tree`, { credentials:'include', cache:'no-store', headers: { ...authHeaders() } });
    if (!res.ok) { setTree([]); return; }
    const j = await res.json(); setTree(j.tree||[]);
  }
  React.useEffect(()=>{ loadList(); loadTree(); }, [apiBase]);

  async function add(){
    const res = await fetch(`${apiBase}/api/admin/categories`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ name, description, image, parentId: parentId||null }) });
    if (!res.ok) { showToast('فشل الإضافة'); return; }
    setName(""); setDescription(""); setImage(""); setParentId("");
    await Promise.all([loadList(), loadTree()]);
    showToast('تمت الإضافة');
  }
  async function update(cat:any){
    const res = await fetch(`${apiBase}/api/admin/categories/${cat.id}`, { method:'PATCH', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ name: cat.name, description: cat.description, image: cat.image, parentId: cat.parentId||null }) });
    if (!res.ok) { showToast('فشل الحفظ'); return; }
    await Promise.all([loadList(), loadTree()]);
    showToast('تم الحفظ');
  }
  async function remove(id:string){
    if (!confirm('تأكيد الحذف؟')) return;
    const res = await fetch(`${apiBase}/api/admin/categories/${id}`, { method:'DELETE', credentials:'include', headers: { ...authHeaders() } });
    if (!res.ok) { showToast('فشل الحذف'); return; }
    await Promise.all([loadList(), loadTree()]);
    showToast('تم الحذف');
  }

  function Tree({ nodes }:{ nodes:any[] }){
    return (
      <ul style={{ listStyle:'none', paddingInlineStart: 16 }}>
        {nodes.map((n)=> (
          <li key={n.id} style={{ marginBottom:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ padding:'2px 8px', background:'#111827', borderRadius:999, fontSize:12, color:'#9ca3af' }}>{n.id.slice(0,6)}</span>
              <strong>{n.name}</strong>
              <button onClick={()=> remove(n.id)} style={{ marginInlineStart:'auto', padding:'4px 8px', background:'#7c2d12', color:'#fff', borderRadius:6 }}>حذف</button>
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
            <thead>
              <tr>
                <th style={{ textAlign:'right', padding:12, borderBottom:'1px solid #1c2333', background:'#0f1320' }}>ID</th>
                <th style={{ textAlign:'right', padding:12, borderBottom:'1px solid #1c2333', background:'#0f1320' }}>الاسم</th>
                <th style={{ textAlign:'right', padding:12, borderBottom:'1px solid #1c2333', background:'#0f1320' }}>أب</th>
                <th style={{ textAlign:'right', padding:12, borderBottom:'1px solid #1c2333', background:'#0f1320' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c:any, idx:number)=> (
                <tr key={c.id} style={{ background: idx%2? '#0a0e17':'transparent' }}>
                  <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{c.id.slice(0,6)}</td>
                  <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                    <input defaultValue={c.name} onBlur={(e)=> update({ ...c, name: (e.target as HTMLInputElement).value })} style={{ padding:8, borderRadius:8, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                  </td>
                  <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{c.parentId ? rows.find((r:any)=>r.id===c.parentId)?.name || '-' : '-'}</td>
                  <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                    <button onClick={()=> remove(c.id)} style={{ padding:'6px 10px', background:'#7c2d12', color:'#fff', borderRadius:8 }}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
          <h3 style={{ marginTop:0, marginBottom:12 }}>إضافة تصنيف</h3>
          <div style={{ display:'grid', gap:10 }}>
            <label>الاسم<input value={name} onChange={(e)=>setName(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
            <label>الوصف<textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
            <label>صورة (URL)<input value={image} onChange={(e)=>setImage(e.target.value)} placeholder="https://...jpg" style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
            <label>التصنيف الأب
              <select value={parentId} onChange={(e)=>setParentId(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }}>
                <option value="">(لا يوجد)</option>
                {rows.map((c:any)=> (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </label>
            <button onClick={add} style={{ padding:'10px 14px', background:'#800020', color:'#fff', borderRadius:10 }}>إضافة</button>
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