"use client";
import React from "react";
import { MediaPicker } from "../../components/MediaPicker";
import { CategoriesPicker, Mini as CatMini } from "../../components/CategoriesPicker";
import { useParams } from "next/navigation";

type Grid = { mode: 'explicit'; categories: CatMini[] } | { mode: 'filter'; categoryIds?: string[]; limit?: number; sortBy?: 'name_asc'|'name_desc'|'created_desc' };
type Suggestions = { enabled?: boolean; title?: string; items?: CatMini[] } | CatMini[];
type SidebarItem = { label: string; href?: string; icon?: string; promoBanner?: any; featured?: CatMini[]; grid?: Grid; suggestions?: Suggestions };
type PageData = { layout?: { showHeader?: boolean; showSidebar?: boolean }; promoBanner?: any; title?: string; featured?: Mini[]; grid?: Grid; sidebarItems?: SidebarItem[]; suggestions?: Suggestions; seo?: { title?: string; description?: string } };

export default function CategoriesTabBuilder(): JSX.Element {
  const params = useParams();
  const slug = String(params?.slug||"");
  const [effectiveSlug, setEffectiveSlug] = React.useState<string>(slug);
  const [toast, setToast] = React.useState("");
  const [pageId, setPageId] = React.useState<string>("");
  const [latestVersion, setLatestVersion] = React.useState<number>(0);
  const [json, setJson] = React.useState<string>(JSON.stringify({
    type: 'categories-v1',
    data: {
      title: '',
      layout: { showHeader: true, showSidebar: true },
      promoBanner: { enabled: false, title: '', image: '', href: '' },
      sidebarItems: [],
      featured: [],
      grid: { mode: 'filter', limit: 36, sortBy: 'name_asc' },
      suggestions: { enabled: true, title: 'ربما يعجبك هذا أيضاً', items: [] },
      seo: { title: '', description: '' }
    }
  }, null, 2));
  const [busy, setBusy] = React.useState<boolean>(false);
  const [parsed, setParsed] = React.useState<any>(null);
  const [mediaOpen, setMediaOpen] = React.useState(false);
  const [mediaPath, setMediaPath] = React.useState<string[]>([]);
  const [catsOpen, setCatsOpen] = React.useState(false);
  const [catsPath, setCatsPath] = React.useState<string[]>([]);
  const iframeRef = React.useRef<HTMLIFrameElement|null>(null);

  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {} as Record<string,string>;
  },[]);

  const showToast = (m:string)=>{ setToast(m); setTimeout(()=> setToast("") , 1600); };

  async function init(){
    try{
      // ابحث فقط ضمن تبويبات الفئات لتجنّب الخلط مع تبويبات الرئيسية
      const r = await fetch(`/api/admin/tabs/pages?device=MOBILE&limit=200&includeCategories=1`, { credentials:'include', cache:'no-store', headers: { ...authHeaders() } });
      const j = await r.json();
      let list: Array<any> = Array.isArray(j?.pages)? j.pages: [];
      let p = list.find((x:any)=> String(x.slug||'')===slug || String(x.label||'')===slug || String(x.slug||'')===`cat-${slug}`);

      // If not found, create it on the fly
      if (!p){
        try{
          const cr = await fetch(`/api/admin/tabs/pages`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify({ slug, label: slug, device:'MOBILE' }) });
          if (cr.ok){
            const cj = await cr.json();
            p = cj?.page || null;
          } else if (cr.status === 409) {
            // Slug محجوز ربما لغير الفئات: أنشئ نسخة بإضافة cat- لتجنّب خلط المحتوى
            const altSlug = `cat-${slug}`;
            const cr2 = await fetch(`/api/admin/tabs/pages`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify({ slug: altSlug, label: slug, device:'MOBILE' }) });
            if (cr2.ok){ const cj2 = await cr2.json(); p = cj2?.page || null; setEffectiveSlug(altSlug); }
          }
        }catch{}
      }

      if (!p) { showToast('لم يتم العثور على الصفحة'); return; }
      setPageId(p.id);
      if (p.slug && String(p.slug)!==effectiveSlug) setEffectiveSlug(String(p.slug));
      // load latest version content
      try{
        const r2 = await fetch(`/api/admin/tabs/pages/${p.id}/versions`, { credentials:'include', cache:'no-store', headers: { ...authHeaders() } });
        const j2 = await r2.json();
        const vlist: Array<any> = Array.isArray(j2?.versions)? j2.versions: [];
        const v = vlist[0];
        if (v?.content) {
          setJson(JSON.stringify(v.content, null, 2));
          setLatestVersion(Number(v.version||0));
        }
      }catch{}
    }catch{ showToast('تعذر التحميل'); }
  }
  React.useEffect(()=>{ init(); },[slug]);

  // keep parsed in sync with JSON
  React.useEffect(()=>{
    try { const obj = JSON.parse(json); setParsed(obj); } catch { /* ignore */ }
  }, [json]);

  // Live postMessage to preview iframe
  React.useEffect(()=>{
    try{
      const win = iframeRef.current?.contentWindow; if (!win) return;
      const obj = JSON.parse(json);
      win.postMessage({ __categories_preview: true, content: obj }, '*');
    }catch{}
  }, [json]);

  function setAtPath(path: string[], value: any){
    try{
      const obj = JSON.parse(json);
      let cur:any = obj;
      for (let i=0;i<path.length-1;i++){ const k = path[i]; if (!(k in cur) || typeof cur[k] !== 'object') cur[k] = {}; cur = cur[k]; }
      cur[path[path.length-1]] = value;
      setJson(JSON.stringify(obj, null, 2));
    }catch{}
  }
  function getAtPath<T=any>(path: string[], fallback: T): T{
    try{
      const obj = parsed || JSON.parse(json);
      let cur:any = obj;
      for (const k of path){ if (cur == null) return fallback; cur = cur[k]; }
      return (cur==null? fallback: cur) as T;
    }catch{ return fallback }
  }
  function ensureArray(path: string[]): any[]{
    const arr = getAtPath<any[]>(path, []);
    if (Array.isArray(arr)) return arr;
    setAtPath(path, []);
    return [];
  }

  async function saveDraft(){
    if (!pageId) { showToast('لا توجد صفحة'); return; }
    let content:any = null;
    try{ content = JSON.parse(json); }catch{ showToast('JSON غير صالح'); return; }
    // Enforce correct content type for categories tabs to be discoverable at /categories
    try{
      if (!content || typeof content !== 'object') content = {};
      if (content.type !== 'categories-v1') content.type = 'categories-v1';
      if (!content.data || typeof content.data !== 'object') content.data = {};
    }catch{}
    setBusy(true);
    try{
      const r = await fetch(`/api/admin/tabs/pages/${pageId}/versions`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify({ title: content?.data?.title||'', content, notes: '' }) });
      if (!r.ok){ const t=await r.text().catch(()=>""); showToast(`فشل الحفظ${t? ': '+t: ''}`); return; }
      const j = await r.json(); setLatestVersion(Number(j?.version?.version||j?.version||0));
      showToast('تم الحفظ');
    } finally { setBusy(false); }
  }

  async function publish(){
    if (!pageId) { showToast('لا توجد صفحة'); return; }
    if (!latestVersion) { await saveDraft(); }
    const version = latestVersion || 1;
    setBusy(true);
    try{
      const r = await fetch(`/api/admin/tabs/pages/${pageId}/publish`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify({ version }) });
      if (!r.ok){ const t=await r.text().catch(()=>""); showToast(`فشل النشر${t? ': '+t: ''}`); return; }
      showToast('تم النشر');
    } finally { setBusy(false); }
  }

  async function preview(){
    let content:any = null;
    try{ content = JSON.parse(json); }catch{ showToast('JSON غير صالح'); return; }
    try{
      const r = await fetch(`/api/admin/tabs/preview/sign`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify({ content, device:'MOBILE' }) });
      const j = await r.json();
      if (!j?.token){ showToast('فشل إنشاء المعاينة'); return; }
      const origin = process.env.NEXT_PUBLIC_MWEB_ORIGIN || 'https://m.jeeey.com';
      const url = `${origin}/c/${encodeURIComponent(slug)}?previewToken=${encodeURIComponent(j.token)}`;
      window.open(url, '_blank');
    }catch{ showToast('فشل المعاينة'); }
  }

  return (
    <main style={{ padding:16 }}>
      <h1 style={{ margin:'0 0 10px', fontSize:22, fontWeight:700 }}>محرر تبويب الفئات: {slug}</h1>
      {toast && (<div style={{ marginBottom:8, background:'#111827', color:'#e5e7eb', padding:'6px 10px', borderRadius:8 }}>{toast}</div>)}

      <section style={{ display:'grid', gridTemplateColumns:'1.3fr 0.7fr', gap:12, alignItems:'start' }}>
        {/* Visual Editor */}
        <div style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:12 }}>
          <h3 style={{ marginTop:0 }}>إعدادات الصفحة</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
            <label>عنوان القسم
              <input value={getAtPath(['data','title'],'')} onChange={(e)=> setAtPath(['data','title'], (e.target as HTMLInputElement).value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            </label>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input type="checkbox" checked={!!getAtPath(['data','layout','showHeader'], true)} onChange={(e)=> setAtPath(['data','layout','showHeader'], (e.target as HTMLInputElement).checked)} />
                إظهار الهيدر
              </label>
              <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input type="checkbox" checked={!!getAtPath(['data','layout','showSidebar'], true)} onChange={(e)=> setAtPath(['data','layout','showSidebar'], (e.target as HTMLInputElement).checked)} />
                إظهار الشريط الجانبي
              </label>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <label>SEO Title
              <input value={getAtPath(['data','seo','title'],'')} onChange={(e)=> setAtPath(['data','seo','title'], (e.target as HTMLInputElement).value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            </label>
            <label>SEO Description
              <input value={getAtPath(['data','seo','description'],'')} onChange={(e)=> setAtPath(['data','seo','description'], (e.target as HTMLInputElement).value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            </label>
          </div>

          <div style={{ borderTop:'1px solid #1c2333', margin:'8px 0 12px' }} />

          <h3 style={{ margin:'0 0 8px' }}>عناصر الشريط الجانبي</h3>
          <div style={{ display:'grid', gap:10 }}>
            {ensureArray(['data','sidebarItems']).map((it:any, idx:number)=> (
              <div key={idx} style={{ padding:10, border:'1px solid #1c2333', borderRadius:10, background:'#0f1320' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <strong style={{ color:'#e2e8f0' }}>عنصر #{idx+1}</strong>
                  <div style={{ display:'flex', gap:6 }}>
                    <button disabled={idx===0} onClick={()=>{
                      const list = [...ensureArray(['data','sidebarItems'])]; if (idx>0){ const t=list[idx-1]; list[idx-1]=list[idx]; list[idx]=t; setAtPath(['data','sidebarItems'], list); }
                    }} style={{ padding:'6px 10px', background: idx===0? '#374151':'#111827', color:'#e5e7eb', borderRadius:8 }}>↑</button>
                    <button disabled={idx===ensureArray(['data','sidebarItems']).length-1} onClick={()=>{
                      const list = [...ensureArray(['data','sidebarItems'])]; if (idx<list.length-1){ const t=list[idx+1]; list[idx+1]=list[idx]; list[idx]=t; setAtPath(['data','sidebarItems'], list); }
                    }} style={{ padding:'6px 10px', background: idx===ensureArray(['data','sidebarItems']).length-1? '#374151':'#111827', color:'#e5e7eb', borderRadius:8 }}>↓</button>
                  </div>
                  <button onClick={()=>{
                    const list = [...ensureArray(['data','sidebarItems'])]; list.splice(idx,1); setAtPath(['data','sidebarItems'], list);
                  }} style={{ marginInlineStart:'auto', padding:'6px 10px', background:'#7c2d12', color:'#fff', borderRadius:8 }}>حذف</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:8 }}>
                  <label>الاسم
                    <input defaultValue={String(it?.label||'')} onBlur={(e)=>{
                      const list = [...ensureArray(['data','sidebarItems'])]; list[idx] = { ...(list[idx]||{}), label: (e.target as HTMLInputElement).value }; setAtPath(['data','sidebarItems'], list);
                    }} style={{ width:'100%', padding:10, borderRadius:10, background:'#0b1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                  </label>
                  <label>رابط اختياري
                    <input defaultValue={String(it?.href||'')} onBlur={(e)=>{
                      const list = [...ensureArray(['data','sidebarItems'])]; list[idx] = { ...(list[idx]||{}), href: (e.target as HTMLInputElement).value }; setAtPath(['data','sidebarItems'], list);
                    }} style={{ width:'100%', padding:10, borderRadius:10, background:'#0b1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                  </label>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:8 }}>
                  <div>
                    <div style={{ color:'#94a3b8', marginBottom:6 }}>بنر</div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <button onClick={()=>{ setMediaPath(['data','sidebarItems', String(idx), 'promoBanner','image']); setMediaOpen(true); }} style={{ padding:'6px 10px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>اختيار صورة</button>
                      <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <input type="checkbox" checked={!!it?.promoBanner?.enabled} onChange={(e)=>{
                          const list = [...ensureArray(['data','sidebarItems'])]; const en = (e.target as HTMLInputElement).checked; list[idx] = { ...(list[idx]||{}), promoBanner: { ...(list[idx]?.promoBanner||{}), enabled: en } }; setAtPath(['data','sidebarItems'], list);
                        }} /> تفعيل
                      </label>
                    </div>
                  </div>
                  <div>
                    <div style={{ color:'#94a3b8', marginBottom:6 }}>Featured</div>
                    <button onClick={()=>{ setCatsPath(['data','sidebarItems', String(idx), 'featured']); setCatsOpen(true); }} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>اختيار فئات</button>
                  </div>
                </div>
                <div style={{ marginTop:8 }}>
                  <div style={{ color:'#94a3b8', marginBottom:6 }}>Grid</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <input type="radio" name={`grid-${idx}`} defaultChecked={(it?.grid?.mode||'filter')==='explicit'} onChange={(e)=>{ if(!(e.target as HTMLInputElement).checked) return; const list=[...ensureArray(['data','sidebarItems'])]; list[idx] = { ...(list[idx]||{}), grid: { mode:'explicit', categories: Array.isArray(it?.grid?.categories)? it.grid.categories: [] } }; setAtPath(['data','sidebarItems'], list); }} /> explicit
                    </label>
                    <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <input type="radio" name={`grid-${idx}`} defaultChecked={(it?.grid?.mode||'filter')==='filter'} onChange={(e)=>{ if(!(e.target as HTMLInputElement).checked) return; const list=[...ensureArray(['data','sidebarItems'])]; list[idx] = { ...(list[idx]||{}), grid: { mode:'filter', categoryIds: [], limit: 36, sortBy:'name_asc' } }; setAtPath(['data','sidebarItems'], list); }} /> filter
                    </label>
                    {(it?.grid?.mode||'filter')==='explicit' ? (
                      <button onClick={()=>{ setCatsPath(['data','sidebarItems', String(idx), 'grid','categories']); setCatsOpen(true); }} style={{ padding:'6px 10px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>اختيار فئات للشبكة</button>
                    ) : (
                      <>
                        <input placeholder="IDs مفصولة بفاصلة" defaultValue={Array.isArray(it?.grid?.categoryIds)? it.grid.categoryIds.join(','): ''} onBlur={(e)=>{
                          const list=[...ensureArray(['data','sidebarItems'])]; const ids=String((e.target as HTMLInputElement).value||'').split(',').map(s=>s.trim()).filter(Boolean); list[idx] = { ...(list[idx]||{}), grid: { ...(list[idx]?.grid||{ mode:'filter' }), mode:'filter', categoryIds: ids } }; setAtPath(['data','sidebarItems'], list);
                        }} style={{ padding:8, borderRadius:8, background:'#0b1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                        <input type="number" placeholder="limit" defaultValue={Number(it?.grid?.limit||36)} onBlur={(e)=>{
                          const list=[...ensureArray(['data','sidebarItems'])]; const v=Number((e.target as HTMLInputElement).value||36); list[idx] = { ...(list[idx]||{}), grid: { ...(list[idx]?.grid||{ mode:'filter' }), mode:'filter', limit: v } }; setAtPath(['data','sidebarItems'], list);
                        }} style={{ width:100, padding:8, borderRadius:8, background:'#0b1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                      </>
                    )}
                  </div>
                </div>
                <div style={{ marginTop:8 }}>
                  <div style={{ color:'#94a3b8', marginBottom:6 }}>اقتراحات</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <input type="checkbox" defaultChecked={(it?.suggestions?.enabled??true)!==false} onChange={(e)=>{
                        const list=[...ensureArray(['data','sidebarItems'])]; const en=(e.target as HTMLInputElement).checked; const sg=it?.suggestions && !Array.isArray(it.suggestions)? it.suggestions: { items: [] }; list[idx] = { ...(list[idx]||{}), suggestions: { ...(sg||{}), enabled: en } }; setAtPath(['data','sidebarItems'], list);
                      }} /> تفعيل
                    </label>
                    <input placeholder="عنوان" defaultValue={String((it?.suggestions && !Array.isArray(it.suggestions)? it.suggestions.title: '')||'')} onBlur={(e)=>{
                      const list=[...ensureArray(['data','sidebarItems'])]; const sg=it?.suggestions && !Array.isArray(it.suggestions)? it.suggestions: { enabled:true, items: [] }; sg.title = (e.target as HTMLInputElement).value; list[idx] = { ...(list[idx]||{}), suggestions: sg }; setAtPath(['data','sidebarItems'], list);
                    }} style={{ padding:8, borderRadius:8, background:'#0b1320', border:'1px solid #1c2333', color:'#e2e8f0', minWidth:240 }} />
                    <button onClick={()=>{ setCatsPath(['data','sidebarItems', String(idx), 'suggestions','items']); setCatsOpen(true); }} style={{ padding:'6px 10px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>اختيار عناصر</button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={()=>{ const list=[...ensureArray(['data','sidebarItems']), { label:'', href:'', promoBanner:{ enabled:false }, featured:[], grid:{ mode:'filter', limit:36, sortBy:'name_asc' }, suggestions:{ enabled:true, items:[] } }]; setAtPath(['data','sidebarItems'], list); }} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>+ إضافة عنصر</button>
          </div>
          <div style={{ marginTop:12 }}>
            <div style={{ color:'#94a3b8', marginBottom:6 }}>معاينة مباشرة</div>
            <div style={{ border:'1px solid #1c2333', borderRadius:10, overflow:'hidden' }}>
              <iframe ref={iframeRef} src={`${process.env.NEXT_PUBLIC_MWEB_ORIGIN || 'https://m.jeeey.com'}/c/${encodeURIComponent(effectiveSlug)}`} style={{ width:'100%', height:700, background:'#fff' }} />
            </div>
          </div>
        </div>

        {/* JSON + Actions */}
        <div style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:12 }}>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <button onClick={saveDraft} disabled={busy} style={{ padding:'8px 12px', background: busy? '#6b7280':'#374151', color:'#e5e7eb', borderRadius:8 }}>{busy? 'جارٍ الحفظ…':'حفظ مسودة'}</button>
            <button onClick={preview} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>معاينة</button>
            <button onClick={publish} disabled={busy} style={{ padding:'8px 12px', background: busy? '#6b7280':'#800020', color:'#fff', borderRadius:8 }}>{busy? 'جارٍ النشر…':'نشر'}</button>
          </div>
          <div style={{ color:'#94a3b8', fontSize:12, marginBottom:6 }}>هيكل JSON (type = categories-v1)</div>
          <textarea value={json} onChange={(e)=> setJson((e.target as HTMLTextAreaElement).value)} rows={26} style={{ width:'100%', borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0', padding:10, fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }} />
        </div>
      </section>

      {/* Pickers */}
      <MediaPicker open={mediaOpen} onClose={()=>{ setMediaOpen(false); setMediaPath([]); }} onSelect={(url)=>{
        if (!mediaPath.length) return;
        setAtPath(mediaPath, url);
      }} />
      <CategoriesPicker open={catsOpen} onClose={()=>{ setCatsOpen(false); setCatsPath([]); }} onSelectMany={(items: CatMini[])=>{
        if (!catsPath.length) return;
        // If at grid.categories -> array of Mini; if suggestions.items -> Mini[]; if featured -> Mini[]
        setAtPath(catsPath, items);
      }} />
    </main>
  );
}


