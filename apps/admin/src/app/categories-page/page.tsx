"use client";
import React from "react";
import { MediaPicker } from "../../components/MediaPicker";
import { CategoriesPicker, Mini as CatMini } from "../../components/CategoriesPicker";

export const dynamic = 'force-dynamic';

export default function CategoriesPageBuilder(): JSX.Element {
  const [toast, setToast] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [site, setSite] = React.useState('mweb');
  const [json, setJson] = React.useState<string>(JSON.stringify({
    layout: { showHeader: true, showTabs: true, showSidebar: true, showPromoPopup: false },
    promoBanner: { enabled: false, image: '', title: '', href: '' },
    tabs: [],
    sidebar: [],
    suggestions: { enabled: true, title: 'ربما يعجبك هذا أيضاً', items: [] },
    badges: [],
    seo: { title: 'الفئات', description: '' }
  }, null, 2));
  const iframeRef = React.useRef<HTMLIFrameElement|null>(null);
  const [parsed, setParsed] = React.useState<any>(null);
  const [mediaOpen, setMediaOpen] = React.useState(false);
  const [mediaPath, setMediaPath] = React.useState<string[]>([]);
  const [catsOpen, setCatsOpen] = React.useState(false);
  const [catsPath, setCatsPath] = React.useState<string[]>([]);
  const [activeTabIdx, setActiveTabIdx] = React.useState<number>(0);

  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {} as Record<string,string>;
  },[]);

  const showToast = (m:string)=>{ setToast(m); setTimeout(()=> setToast(""), 1600); };

  async function load(){
    try{
      const r = await fetch(`/api/admin/categories/page?site=${encodeURIComponent(site)}`, { credentials:'include', cache:'no-store', headers: { ...authHeaders() } });
      const j = await r.json();
      const effective = j?.draft || j?.live || j?.effective || {};
      if (effective && typeof effective==='object') setJson(JSON.stringify(effective, null, 2));
    }catch{ showToast('تعذر جلب الإعدادات'); }
  }
  React.useEffect(()=>{ load(); },[site]);
  React.useEffect(()=>{ try{ setParsed(JSON.parse(json)); }catch{} }, [json]);

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

  // Live postMessage into mweb /categories
  React.useEffect(()=>{
    try{
      const win = iframeRef.current?.contentWindow; if (!win) return;
      const obj = JSON.parse(json);
      win.postMessage({ __categories_preview: true, content: obj }, '*');
    }catch{}
  }, [json]);

  async function saveDraft(){
    setBusy(true);
    try{
      let content:any = null; try{ content = JSON.parse(json); }catch{ showToast('JSON غير صالح'); return; }
      const r = await fetch(`/api/admin/categories/page?site=${encodeURIComponent(site)}`, { method:'PUT', credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify({ config: content }) });
      if (!r.ok){ const t=await r.text().catch(()=>""); showToast(`فشل الحفظ${t? ': '+t: ''}`); return; }
      showToast('تم الحفظ');
    } finally { setBusy(false); }
  }

  async function publish(){
    setBusy(true);
    try{
      const r = await fetch(`/api/admin/categories/page/publish?site=${encodeURIComponent(site)}`, { method:'POST', credentials:'include', headers:{ ...authHeaders() } });
      if (!r.ok){ const t=await r.text().catch(()=>""); showToast(`فشل النشر${t? ': '+t: ''}`); return; }
      showToast('تم النشر');
    } finally { setBusy(false); }
  }

  async function openPreview(){
    try{
      let content:any = null; try{ content = JSON.parse(json); }catch{ showToast('JSON غير صالح'); return; }
      const r = await fetch(`/api/admin/categories/page/preview/sign`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify({ content }) });
      const j = await r.json();
      if (!j?.token){ showToast('فشل إنشاء المعاينة'); return; }
      const url = `/categories?previewToken=${encodeURIComponent(j.token)}`;
      window.open(url, '_blank');
    }catch{ showToast('فشل المعاينة'); }
  }

  return (
    <main style={{ padding:16 }}>
      <h1 style={{ margin:'0 0 12px', fontSize:22, fontWeight:700 }}>إدارة صفحة الفئات</h1>
      {toast && (<div style={{ marginBottom:8, background:'#111827', color:'#e5e7eb', padding:'6px 10px', borderRadius:8 }}>{toast}</div>)}

      <section style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:12, alignItems:'start' }}>
        <div style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:12 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
            <label>الموقع
              <select value={site} onChange={(e)=> setSite((e.target as HTMLSelectElement).value)} style={{ marginInlineStart:8, padding:8, borderRadius:8, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }}>
                <option value="mweb">mweb</option>
                <option value="web">web</option>
              </select>
            </label>
            <button onClick={load} style={{ marginInlineStart:'auto', padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>تحديث</button>
          </div>
          {/* Layout toggles */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:12 }}>
            {[
              ['layout','showHeader','إظهار الهيدر', true],
              ['layout','showTabs','إظهار التبويبات', true],
              ['layout','showSidebar','إظهار الشريط الجانبي', true],
              ['layout','showPromoPopup','نافذة ترويجية', false],
            ].map(([a,b,label,def]: any)=> (
              <label key={String(a)+String(b)} style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input type="checkbox" checked={!!getAtPath([a,b], def)} onChange={(e)=> setAtPath([a,b], (e.target as HTMLInputElement).checked)} /> {label}
              </label>
            ))}
          </div>

          {/* Global promo banner */}
          <div style={{ borderTop:'1px solid #1c2333', margin:'8px 0 12px' }} />
          <h3 style={{ margin:'0 0 8px' }}>بنر عام</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <label style={{ display:'flex', gap:6, alignItems:'center' }}>
              <input type="checkbox" checked={!!getAtPath(['promoBanner','enabled'], false)} onChange={(e)=> setAtPath(['promoBanner','enabled'], (e.target as HTMLInputElement).checked)} /> تفعيل
            </label>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{ setMediaPath(['promoBanner','image']); setMediaOpen(true); }} style={{ padding:'6px 10px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>اختيار صورة</button>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:8 }}>
            <label>العنوان<input value={getAtPath(['promoBanner','title'],'')} onChange={(e)=> setAtPath(['promoBanner','title'], (e.target as HTMLInputElement).value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
            <label>الرابط<input value={getAtPath(['promoBanner','href'],'')} onChange={(e)=> setAtPath(['promoBanner','href'], (e.target as HTMLInputElement).value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
          </div>

          {/* Suggestions */}
          <div style={{ borderTop:'1px solid #1c2333', margin:'12px 0' }} />
          <h3 style={{ margin:'0 0 8px' }}>اقتراحات عامة</h3>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <label style={{ display:'flex', gap:6, alignItems:'center' }}>
              <input type="checkbox" defaultChecked={(getAtPath(['suggestions','enabled'], true)!==false)} onChange={(e)=>{ const en=(e.target as HTMLInputElement).checked; const sg=getAtPath(['suggestions'], { enabled:true, items:[] }); setAtPath(['suggestions'], { ...(sg||{}), enabled: en }); }} /> تفعيل
            </label>
            <input placeholder="عنوان" defaultValue={String(getAtPath(['suggestions','title'],''))} onBlur={(e)=>{ const sg=getAtPath(['suggestions'], { enabled:true, items:[] }); (sg as any).title=(e.target as HTMLInputElement).value; setAtPath(['suggestions'], sg); }} style={{ padding:8, borderRadius:8, background:'#0b1320', border:'1px solid #1c2333', color:'#e2e8f0', minWidth:240 }} />
            <button onClick={()=>{ setCatsPath(['suggestions','items']); setCatsOpen(true); }} style={{ padding:'6px 10px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>اختيار عناصر</button>
          </div>

          {/* Default categories tab */}
          <div style={{ borderTop:'1px solid #1c2333', margin:'12px 0' }} />
          <h3 style={{ margin:'0 0 8px' }}>التبويب الافتراضي</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, alignItems:'center' }}>
            <input placeholder="slug التبويب (مثال: women)" value={String(getAtPath(['defaultTabSlug'],''))} onChange={(e)=> setAtPath(['defaultTabSlug'], (e.target as HTMLInputElement).value)} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            <span style={{ color:'#94a3b8', fontSize:12 }}>عند فتح /categories سيتم فتح هذا التبويب إن كان منشوراً</span>
          </div>

          {/* Tabs editor */}
          <div style={{ borderTop:'1px solid #1c2333', margin:'12px 0' }} />
          <h3 style={{ margin:'0 0 8px' }}>التبويبات</h3>
          <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:12 }}>
            <div>
              <div style={{ display:'grid', gap:6 }}>
                {ensureArray(['tabs']).map((t:any, i:number)=> (
                  <button key={i} onClick={()=> setActiveTabIdx(i)} style={{ textAlign:'start', padding:'8px 10px', borderRadius:8, background: i===activeTabIdx? '#111827':'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }}>
                    {t?.label||t?.key||`تبويب ${i+1}`}
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button onClick={()=>{ const list=[...ensureArray(['tabs']), { key:`t${Date.now()}`, label:'', sidebarItems:[] }]; setAtPath(['tabs'], list); setActiveTabIdx(list.length-1); }} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>+ إضافة تبويب</button>
                {ensureArray(['tabs']).length>0 && (
                  <button onClick={()=>{ const list=[...ensureArray(['tabs'])]; list.splice(activeTabIdx,1); setAtPath(['tabs'], list); setActiveTabIdx(Math.max(0, activeTabIdx-1)); }} style={{ padding:'8px 12px', background:'#7c2d12', color:'#fff', borderRadius:8 }}>حذف</button>
                )}
              </div>
            </div>
            <div>
              {ensureArray(['tabs']).length>0 ? (
                <div style={{ display:'grid', gap:10 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <label>Key<input defaultValue={String(getAtPath(['tabs', String(activeTabIdx), 'key'],''))} onBlur={(e)=>{ const list=[...ensureArray(['tabs'])]; list[activeTabIdx] = { ...(list[activeTabIdx]||{}), key: (e.target as HTMLInputElement).value }; setAtPath(['tabs'], list); }} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
                    <label>الاسم<input defaultValue={String(getAtPath(['tabs', String(activeTabIdx), 'label'],''))} onBlur={(e)=>{ const list=[...ensureArray(['tabs'])]; list[activeTabIdx] = { ...(list[activeTabIdx]||{}), label: (e.target as HTMLInputElement).value }; setAtPath(['tabs'], list); }} style={{ width:'100%', padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
                  </div>
                  <div>
                    <div style={{ color:'#94a3b8', marginBottom:6 }}>بنر التبويب</div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <button onClick={()=>{ setMediaPath(['tabs', String(activeTabIdx), 'promoBanner','image']); setMediaOpen(true); }} style={{ padding:'6px 10px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>اختيار صورة</button>
                      <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <input type="checkbox" checked={!!getAtPath(['tabs', String(activeTabIdx), 'promoBanner','enabled'], false)} onChange={(e)=>{ const list=[...ensureArray(['tabs'])]; const en=(e.target as HTMLInputElement).checked; const pb = getAtPath(['tabs', String(activeTabIdx), 'promoBanner'], {}); list[activeTabIdx] = { ...(list[activeTabIdx]||{}), promoBanner: { ...(pb||{}), enabled: en } }; setAtPath(['tabs'], list); }} /> تفعيل
                      </label>
                    </div>
                  </div>
                  <div>
                    <div style={{ color:'#94a3b8', marginBottom:6 }}>Featured</div>
                    <button onClick={()=>{ setCatsPath(['tabs', String(activeTabIdx), 'featured']); setCatsOpen(true); }} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>اختيار فئات</button>
                  </div>
                  <div>
                    <div style={{ color:'#94a3b8', marginBottom:6 }}>Grid</div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <input type="radio" name={`tgrid-${activeTabIdx}`} defaultChecked={(getAtPath(['tabs', String(activeTabIdx), 'grid','mode'],'filter')==='explicit')} onChange={(e)=>{ if(!(e.target as HTMLInputElement).checked) return; const list=[...ensureArray(['tabs'])]; list[activeTabIdx] = { ...(list[activeTabIdx]||{}), grid: { mode:'explicit', categories: [] as CatMini[] } }; setAtPath(['tabs'], list); }} /> explicit
                      </label>
                      <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <input type="radio" name={`tgrid-${activeTabIdx}`} defaultChecked={(getAtPath(['tabs', String(activeTabIdx), 'grid','mode'],'filter')==='filter')} onChange={(e)=>{ if(!(e.target as HTMLInputElement).checked) return; const list=[...ensureArray(['tabs'])]; list[activeTabIdx] = { ...(list[activeTabIdx]||{}), grid: { mode:'filter', categoryIds: [], limit:36, sortBy:'name_asc' } }; setAtPath(['tabs'], list); }} /> filter
                      </label>
                      {getAtPath(['tabs', String(activeTabIdx), 'grid','mode'],'filter')==='explicit' ? (
                        <button onClick={()=>{ setCatsPath(['tabs', String(activeTabIdx), 'grid','categories']); setCatsOpen(true); }} style={{ padding:'6px 10px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>اختيار فئات للشبكة</button>
                      ) : (
                        <>
                          <input placeholder="IDs مفصولة بفاصلة" defaultValue={Array.isArray(getAtPath<string[]>(['tabs', String(activeTabIdx), 'grid','categoryIds'],[]))? getAtPath<string[]>(['tabs', String(activeTabIdx), 'grid','categoryIds'],[]).join(','): ''} onBlur={(e)=>{ const list=[...ensureArray(['tabs'])]; const ids=String((e.target as HTMLInputElement).value||'').split(',').map(s=>s.trim()).filter(Boolean); const g:any=getAtPath(['tabs', String(activeTabIdx), 'grid'], { mode:'filter' }); g.mode='filter'; g.categoryIds=ids; list[activeTabIdx] = { ...(list[activeTabIdx]||{}), grid: g }; setAtPath(['tabs'], list); }} style={{ padding:8, borderRadius:8, background:'#0b1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                          <input type="number" placeholder="limit" defaultValue={Number(getAtPath(['tabs', String(activeTabIdx), 'grid','limit'],36))} onBlur={(e)=>{ const list=[...ensureArray(['tabs'])]; const v=Number((e.target as HTMLInputElement).value||36); const g:any=getAtPath(['tabs', String(activeTabIdx), 'grid'], { mode:'filter' }); g.mode='filter'; g.limit=v; list[activeTabIdx] = { ...(list[activeTabIdx]||{}), grid: g }; setAtPath(['tabs'], list); }} style={{ width:100, padding:8, borderRadius:8, background:'#0b1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                        </>
                      )}
                    </div>
                  </div>
                  {/* Sidebar items under tab */}
                  <div>
                    <div style={{ color:'#94a3b8', marginBottom:6 }}>عناصر الشريط الجانبي</div>
                    <div style={{ display:'grid', gap:8 }}>
                      {ensureArray(['tabs', String(activeTabIdx), 'sidebarItems']).map((it:any, idx:number)=> (
                        <div key={idx} style={{ padding:10, border:'1px solid #1c2333', borderRadius:10, background:'#0f1320' }}>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            <strong style={{ color:'#e2e8f0' }}>عنصر #{idx+1}</strong>
                            <div style={{ display:'flex', gap:6 }}>
                              <button disabled={idx===0} onClick={()=>{ const list=[...ensureArray(['tabs', String(activeTabIdx), 'sidebarItems'])]; if (idx>0){ const t=list[idx-1]; list[idx-1]=list[idx]; list[idx]=t; setAtPath(['tabs', String(activeTabIdx), 'sidebarItems'], list); } }} style={{ padding:'6px 10px', background: idx===0? '#374151':'#111827', color:'#e5e7eb', borderRadius:8 }}>↑</button>
                              <button disabled={idx===ensureArray(['tabs', String(activeTabIdx), 'sidebarItems']).length-1} onClick={()=>{ const list=[...ensureArray(['tabs', String(activeTabIdx), 'sidebarItems'])]; if (idx<list.length-1){ const t=list[idx+1]; list[idx+1]=list[idx]; list[idx]=t; setAtPath(['tabs', String(activeTabIdx), 'sidebarItems'], list); } }} style={{ padding:'6px 10px', background: idx===ensureArray(['tabs', String(activeTabIdx), 'sidebarItems']).length-1? '#374151':'#111827', color:'#e5e7eb', borderRadius:8 }}>↓</button>
                            </div>
                            <button onClick={()=>{ const list=[...ensureArray(['tabs', String(activeTabIdx), 'sidebarItems'])]; list.splice(idx,1); setAtPath(['tabs', String(activeTabIdx), 'sidebarItems'], list); }} style={{ marginInlineStart:'auto', padding:'6px 10px', background:'#7c2d12', color:'#fff', borderRadius:8 }}>حذف</button>
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:8 }}>
                            <label>الاسم
                              <input defaultValue={String(it?.label||'')} onBlur={(e)=>{ const list=[...ensureArray(['tabs', String(activeTabIdx), 'sidebarItems'])]; list[idx] = { ...(list[idx]||{}), label: (e.target as HTMLInputElement).value }; setAtPath(['tabs', String(activeTabIdx), 'sidebarItems'], list); }} style={{ width:'100%', padding:10, borderRadius:10, background:'#0b1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                            </label>
                            <label>رابط
                              <input defaultValue={String(it?.href||'')} onBlur={(e)=>{ const list=[...ensureArray(['tabs', String(activeTabIdx), 'sidebarItems'])]; list[idx] = { ...(list[idx]||{}), href: (e.target as HTMLInputElement).value }; setAtPath(['tabs', String(activeTabIdx), 'sidebarItems'], list); }} style={{ width:'100%', padding:10, borderRadius:10, background:'#0b1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                            </label>
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:8 }}>
                            <div>
                              <div style={{ color:'#94a3b8', marginBottom:6 }}>بنر</div>
                              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                                <button onClick={()=>{ setMediaPath(['tabs', String(activeTabIdx), 'sidebarItems', String(idx), 'promoBanner','image']); setMediaOpen(true); }} style={{ padding:'6px 10px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>اختيار صورة</button>
                                <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                                  <input type="checkbox" checked={!!it?.promoBanner?.enabled} onChange={(e)=>{ const list=[...ensureArray(['tabs', String(activeTabIdx), 'sidebarItems'])]; const en=(e.target as HTMLInputElement).checked; list[idx] = { ...(list[idx]||{}), promoBanner: { ...(list[idx]?.promoBanner||{}), enabled: en } }; setAtPath(['tabs', String(activeTabIdx), 'sidebarItems'], list); }} /> تفعيل
                                </label>
                              </div>
                            </div>
                            <div>
                              <div style={{ color:'#94a3b8', marginBottom:6 }}>Featured</div>
                              <button onClick={()=>{ setCatsPath(['tabs', String(activeTabIdx), 'sidebarItems', String(idx), 'featured']); setCatsOpen(true); }} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>اختيار فئات</button>
                            </div>
                          </div>
                          <div style={{ marginTop:8 }}>
                            <div style={{ color:'#94a3b8', marginBottom:6 }}>Grid</div>
                            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                              <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                                <input type="radio" name={`sgrid-${activeTabIdx}-${idx}`} defaultChecked={(it?.grid?.mode||'filter')==='explicit'} onChange={(e)=>{ if(!(e.target as HTMLInputElement).checked) return; const list=[...ensureArray(['tabs', String(activeTabIdx), 'sidebarItems'])]; list[idx] = { ...(list[idx]||{}), grid: { mode:'explicit', categories: Array.isArray(it?.grid?.categories)? it.grid.categories: [] } }; setAtPath(['tabs', String(activeTabIdx), 'sidebarItems'], list); }} /> explicit
                              </label>
                              <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                                <input type="radio" name={`sgrid-${activeTabIdx}-${idx}`} defaultChecked={(it?.grid?.mode||'filter')==='filter'} onChange={(e)=>{ if(!(e.target as HTMLInputElement).checked) return; const list=[...ensureArray(['tabs', String(activeTabIdx), 'sidebarItems'])]; list[idx] = { ...(list[idx]||{}), grid: { mode:'filter', categoryIds: [], limit:36, sortBy:'name_asc' } }; setAtPath(['tabs', String(activeTabIdx), 'sidebarItems'], list); }} /> filter
                              </label>
                              {(it?.grid?.mode||'filter')==='explicit' ? (
                                <button onClick={()=>{ setCatsPath(['tabs', String(activeTabIdx), 'sidebarItems', String(idx), 'grid','categories']); setCatsOpen(true); }} style={{ padding:'6px 10px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>اختيار فئات للشبكة</button>
                              ) : (
                                <>
                                  <input placeholder="IDs مفصولة بفاصلة" defaultValue={Array.isArray(it?.grid?.categoryIds)? it.grid.categoryIds.join(','): ''} onBlur={(e)=>{ const list=[...ensureArray(['tabs', String(activeTabIdx), 'sidebarItems'])]; const ids=String((e.target as HTMLInputElement).value||'').split(',').map(s=>s.trim()).filter(Boolean); const g:any = { ...(list[idx]?.grid||{ mode:'filter' }) }; g.mode='filter'; g.categoryIds=ids; list[idx] = { ...(list[idx]||{}), grid: g }; setAtPath(['tabs', String(activeTabIdx), 'sidebarItems'], list); }} style={{ padding:8, borderRadius:8, background:'#0b1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                                  <input type="number" placeholder="limit" defaultValue={Number(it?.grid?.limit||36)} onBlur={(e)=>{ const list=[...ensureArray(['tabs', String(activeTabIdx), 'sidebarItems'])]; const v=Number((e.target as HTMLInputElement).value||36); const g:any = { ...(list[idx]?.grid||{ mode:'filter' }) }; g.mode='filter'; g.limit=v; list[idx] = { ...(list[idx]||{}), grid: g }; setAtPath(['tabs', String(activeTabIdx), 'sidebarItems'], list); }} style={{ width:100, padding:8, borderRadius:8, background:'#0b1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                                </>
                              )}
                            </div>
                          </div>
                          <div style={{ marginTop:8 }}>
                            <div style={{ color:'#94a3b8', marginBottom:6 }}>اقتراحات</div>
                            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                              <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                                <input type="checkbox" defaultChecked={(it?.suggestions?.enabled??true)!==false} onChange={(e)=>{ const list=[...ensureArray(['tabs', String(activeTabIdx), 'sidebarItems'])]; const en=(e.target as HTMLInputElement).checked; const sg=it?.suggestions && !Array.isArray(it.suggestions)? it.suggestions: { items: [] }; list[idx] = { ...(list[idx]||{}), suggestions: { ...(sg||{}), enabled: en } }; setAtPath(['tabs', String(activeTabIdx), 'sidebarItems'], list); }} /> تفعيل
                              </label>
                              <input placeholder="عنوان" defaultValue={String((it?.suggestions && !Array.isArray(it.suggestions)? it.suggestions.title: '')||'')} onBlur={(e)=>{ const list=[...ensureArray(['tabs', String(activeTabIdx), 'sidebarItems'])]; const sg=it?.suggestions && !Array.isArray(it.suggestions)? it.suggestions: { enabled:true, items: [] }; sg.title = (e.target as HTMLInputElement).value; list[idx] = { ...(list[idx]||{}), suggestions: sg }; setAtPath(['tabs', String(activeTabIdx), 'sidebarItems'], list); }} style={{ padding:8, borderRadius:8, background:'#0b1320', border:'1px solid #1c2333', color:'#e2e8f0', minWidth:240 }} />
                              <button onClick={()=>{ setCatsPath(['tabs', String(activeTabIdx), 'sidebarItems', String(idx), 'suggestions','items']); setCatsOpen(true); }} style={{ padding:'6px 10px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>اختيار عناصر</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button onClick={()=>{ const list=[...ensureArray(['tabs', String(activeTabIdx), 'sidebarItems']), { label:'', href:'', promoBanner:{ enabled:false }, featured:[], grid:{ mode:'filter', limit:36, sortBy:'name_asc' }, suggestions:{ enabled:true, items:[] } }]; setAtPath(['tabs', String(activeTabIdx), 'sidebarItems'], list); }} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>+ إضافة عنصر</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color:'#94a3b8' }}>لا توجد تبويبات بعد</div>
              )}
            </div>
          </div>

          {/* Badges editor */}
          <div style={{ borderTop:'1px solid #1c2333', margin:'12px 0' }} />
          <h3 style={{ margin:'0 0 8px' }}>Badges</h3>
          <div style={{ display:'grid', gap:8 }}>
            {(Array.isArray(getAtPath(['badges'], []))? getAtPath<any[]>(['badges'], []): []).map((b:any, i:number)=> (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, alignItems:'center' }}>
                <div style={{ color:'#94a3b8' }}>{b?.categoryId||'-'}</div>
                <input defaultValue={String(b?.text||'')} onBlur={(e)=>{ const list=[...(getAtPath<any[]>(['badges'], [])||[])]; list[i] = { categoryId: b?.categoryId, text: (e.target as HTMLInputElement).value }; setAtPath(['badges'], list); }} style={{ padding:8, borderRadius:8, background:'#0b1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                <button onClick={()=>{ const list=[...(getAtPath<any[]>(['badges'], [])||[])]; list.splice(i,1); setAtPath(['badges'], list); }} style={{ padding:'6px 10px', background:'#7c2d12', color:'#fff', borderRadius:8 }}>حذف</button>
              </div>
            ))}
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{ setCatsPath(['__badges_add']); setCatsOpen(true); }} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>+ إضافة بادج لفئات</button>
            </div>
          </div>

          {/* Actions + JSON */}
          <div style={{ display:'flex', gap:8, marginTop:12, marginBottom:8 }}>
            <button onClick={saveDraft} disabled={busy} style={{ padding:'8px 12px', background: busy? '#6b7280':'#374151', color:'#e5e7eb', borderRadius:8 }}>{busy? 'جارٍ الحفظ…':'حفظ مسودة'}</button>
            <button onClick={openPreview} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>معاينة في نافذة</button>
            <button onClick={publish} disabled={busy} style={{ padding:'8px 12px', background: busy? '#6b7280':'#800020', color:'#fff', borderRadius:8 }}>{busy? 'جارٍ النشر…':'نشر'}</button>
          </div>
          <div style={{ color:'#94a3b8', fontSize:12, marginBottom:6 }}>JSON (مطابق لمخطط الصفحة الحالي)</div>
          <textarea value={json} onChange={(e)=> setJson((e.target as HTMLTextAreaElement).value)} rows={26} style={{ width:'100%', borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0', padding:10, fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }} />
        </div>
        <div style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:12 }}>
          <div style={{ color:'#94a3b8', marginBottom:6 }}>معاينة مباشرة</div>
          <div style={{ border:'1px solid #1c2333', borderRadius:10, overflow:'hidden' }}>
            <iframe ref={iframeRef} src={`${process.env.NEXT_PUBLIC_MWEB_ORIGIN || 'http://localhost:5173'}/categories`} style={{ width:'100%', height:750, background:'#fff' }} />
          </div>
          <div style={{ color:'#94a3b8', marginTop:8, fontSize:12 }}>يتم إرسال التغييرات مباشرة إلى المعاينة عبر postMessage.</div>
        </div>
      </section>

      {/* Pickers */}
      <MediaPicker open={mediaOpen} onClose={()=>{ setMediaOpen(false); setMediaPath([]); }} onSelect={(url)=>{ if (!mediaPath.length) return; setAtPath(mediaPath, url); }} />
      <CategoriesPicker open={catsOpen} onClose={()=>{ 
        setCatsOpen(false);
        if (catsPath[0]==='__badges_add') { setCatsPath([]); return; }
        setCatsPath([]);
      }} onSelectMany={(items: CatMini[])=>{ 
        if (!catsPath.length) return; 
        if (catsPath[0]==='__badges_add'){
          const list = [...(getAtPath<any[]>(['badges'], [])||[])];
          for (const it of items){ if (it?.id) list.push({ categoryId: it.id, text: '' }); }
          setAtPath(['badges'], list);
          setCatsPath([]); setCatsOpen(false);
          return;
        }
        setAtPath(catsPath, items); 
      }} />
    </main>
  );
}


