"use client";
import React from "react";

export default function CategoriesTabsIndex(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [slug, setSlug] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [toast, setToast] = React.useState("");
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=> setToast("") , 1600); };

  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {} as Record<string,string>;
  },[]);

  async function load(){
    try{
      setLoading(true);
      const r = await fetch(`/api/admin/tabs/pages?device=MOBILE&limit=100&includeCategories=1`, { credentials:'include', cache:'no-store', headers: { ...authHeaders() } });
      const j = await r.json();
      const list = Array.isArray(j?.pages)? j.pages: [];
      // أعرض فقط تبويبات الفئات (التي تحمل content.type === 'categories-v1')
      setRows(list);
    }catch{ setRows([]) }
    finally{ setLoading(false) }
  }
  React.useEffect(()=>{ load(); },[]);

  async function create(){
    if (!slug.trim() || !label.trim()) { showToast('Slug والاسم مطلوبان'); return; }
    try{
      const body = { slug, label, device:'MOBILE' };
      const r = await fetch(`/api/admin/tabs/pages`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify(body) });
      if (!r.ok){
        if (r.status === 409){
          // موجود مسبقاً: ابحث عنه واذهب إليه
          try{
            const rl = await fetch(`/api/admin/tabs/pages?device=MOBILE&limit=200`, { credentials:'include', cache:'no-store', headers: { ...authHeaders() } });
            const jl = await rl.json();
            const list: any[] = Array.isArray(jl?.pages)? jl.pages: [];
            const existing = list.find((p:any)=> String(p.slug||'')===slug) || list.find((p:any)=> String(p.label||'')===label);
            if (existing){ location.href = `/categories-tabs/${encodeURIComponent(existing.slug)}`; return; }
          }catch{}
          showToast('الاسم مستخدم. اختر Slug مختلف');
          return;
        }
        const t = await r.text().catch(()=>""); showToast(`فشل الإنشاء${t? ': '+t: ''}`); return;
      }
      const j = await r.json();
      showToast('تم الإنشاء');
      location.href = `/categories-tabs/${encodeURIComponent(j.page.slug)}`;
    }catch(e:any){ showToast('تعذر الإنشاء'); }
  }

  return (
    <main style={{ padding:16 }}>
      <h1 style={{ margin:'0 0 12px', fontSize:22, fontWeight:700 }}>تبويبات الفئات (صفحات مستقلة)</h1>
      {toast && (<div style={{ marginBottom:8, background:'#111827', color:'#e5e7eb', padding:'6px 10px', borderRadius:8 }}>{toast}</div>)}

      <section style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:16, alignItems:'start' }}>
        <div style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
          <div style={{ marginBottom:10, display:'flex', gap:8 }}>
            <input value={slug} onChange={(e)=> setSlug((e.target as HTMLInputElement).value)} placeholder="slug (مثال: women)" style={{ flex:1, padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            <input value={label} onChange={(e)=> setLabel((e.target as HTMLInputElement).value)} placeholder="الاسم الظاهر" style={{ flex:1, padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            <button onClick={create} style={{ padding:'10px 14px', background:'#800020', color:'#fff', borderRadius:10 }}>إنشاء تبويب</button>
          </div>
          <div style={{ color:'#94a3b8', fontSize:12, marginBottom:8 }}>سيتم فتح محرر التبويب بعد الإنشاء مباشرة</div>
        </div>

        <div style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <h3 style={{ margin:0 }}>القائمة ({rows.length})</h3>
            <button onClick={load} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>{loading? 'جارٍ التحديث…' : 'تحديث'}</button>
          </div>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead>
              <tr>
                <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid #1c2333' }}>Slug</th>
                <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid #1c2333' }}>الاسم</th>
                <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid #1c2333' }}>الحالة</th>
                <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid #1c2333' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p:any, idx:number)=> (
                <tr key={p.id} style={{ background: idx%2? '#0a0e17':'transparent' }}>
                  <td style={{ padding:10, borderBottom:'1px solid #1c2333' }}>{p.slug}</td>
                  <td style={{ padding:10, borderBottom:'1px solid #1c2333' }}>{p.label}</td>
                  <td style={{ padding:10, borderBottom:'1px solid #1c2333' }}>{p.status}</td>
                  <td style={{ padding:10, borderBottom:'1px solid #1c2333' }}>
                    <div style={{ display:'flex', gap:8 }}>
                      <a href={`/categories-tabs/${encodeURIComponent(p.slug)}`} style={{ padding:'6px 10px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>تعديل</a>
                      {p.status==='PUBLISHED' ? (<a href={`/categories/${encodeURIComponent(p.slug)}`} target="_blank" style={{ padding:'6px 10px', background:'#065f46', color:'#e5e7eb', borderRadius:8 }}>عرض</a>) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}


