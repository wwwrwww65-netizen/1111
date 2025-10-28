"use client";
import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export const dynamic = 'force-dynamic';

type Version = { id:string; version:number; title?:string; notes?:string; createdAt:string };

type Device = 'MOBILE'|'DESKTOP';

type MediaAsset = { id:string; url:string; alt?:string; meta?:{ width?:number; height?:number } };

type Category = { id:string; name:string; image?:string };

type ProductMini = { id:string; name:string; image?:string; price?:number };

function useApiBase(){ return React.useMemo(()=> (typeof window!=='undefined' ? '' : ''), []); }

export default function TabPageBuilder(): JSX.Element {
  const params = useParams() as { id: string };
  const { id } = params;
  const apiBase = useApiBase();
  const [page, setPage] = React.useState<any>(null);
  const [versions, setVersions] = React.useState<Version[]>([]);
  const [content, setContent] = React.useState<any>({ sections: [] });
  const [title, setTitle] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [device, setDevice] = React.useState<Device>('MOBILE');
  const [published, setPublished] = React.useState<any>(null);
  const [selectedIdx, setSelectedIdx] = React.useState<number>(-1);
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);
  const [stats, setStats] = React.useState<{ series:any[]; totals:{ impressions:number; clicks:number; ctr:number } }|null>(null);
  const [scheduleAt, setScheduleAt] = React.useState<string>('');

  // Live preview state
  const [previewDevice, setPreviewDevice] = React.useState<Device>('MOBILE');
  const [previewLang, setPreviewLang] = React.useState<'ar'|'en'>('ar');

  // Validation state
  const [errors, setErrors] = React.useState<string[]>([]);

  // Media and pickers
  const [mediaOpen, setMediaOpen] = React.useState(false);
  const mediaOnSelectRef = React.useRef<(url:string)=>void>(()=>{});
  const openMediaPicker = (onSelect:(url:string)=>void)=>{ mediaOnSelectRef.current = onSelect; setMediaOpen(true); };

  const [categoriesOpen, setCategoriesOpen] = React.useState(false);
  const categoriesOnSaveRef = React.useRef<(items:Category[])=>void>(()=>{});
  const openCategoriesPicker = (onSave:(items:Category[])=>void)=>{ categoriesOnSaveRef.current = onSave; setCategoriesOpen(true); };

  const [productsOpen, setProductsOpen] = React.useState(false);
  const productsOnSaveRef = React.useRef<(items:ProductMini[])=>void>(()=>{});
  const openProductsPicker = (onSave:(items:ProductMini[])=>void)=>{ productsOnSaveRef.current = onSave; setProductsOpen(true); };

  // Load data
  React.useEffect(()=>{
    fetch(`${apiBase}/api/admin/tabs/pages/${id}/versions`, { credentials:'include' })
      .then(r=> r.ok? r.json(): r.json().then(j=> Promise.reject(j)))
      .then(j=> setVersions(j.versions||[]));
  },[apiBase,id]);

  React.useEffect(()=>{
    fetch(`${apiBase}/api/admin/tabs/pages/${id}`, { credentials:'include' })
      .then(r=> r.ok? r.json(): r.json().then(j=> Promise.reject(j)))
      .then(async j=>{
        const p = j.page; setPage(p||null);
        if (p?.slug){
          const pub = await fetch(`${apiBase}/api/tabs/${encodeURIComponent(p.slug)}`, { credentials:'include' }).then(r=> r.ok? r.json(): null).catch(()=> null);
          if (pub) setPublished(pub);
        }
        // Try load latest version content for editing experience
        try{
          const vers = await fetch(`${apiBase}/api/admin/tabs/pages/${id}/versions`, { credentials:'include' }).then(r=> r.json()).catch(()=>({versions:[]}));
          const latest = Array.isArray(vers.versions)? vers.versions[0] : null;
          if (latest?.content) setContent(latest.content);
        } catch {}
      }).catch(()=>{});
    // Stats
    fetch(`${apiBase}/api/admin/tabs/pages/${id}/stats?since=30d`, { credentials:'include' })
      .then(r=> r.ok? r.json(): null).then(j=> j && setStats(j)).catch(()=>{});
  },[apiBase,id]);

  // Local autosave (debounced) — safe and fast; server versions remain manual
  const autosaveKey = React.useMemo(()=> `tabs_builder_autosave_${id}`, [id]);
  React.useEffect(()=>{
    const t = setTimeout(()=>{
      try{ if (typeof window!=='undefined') window.localStorage.setItem(autosaveKey, JSON.stringify({ content, title, notes, at: Date.now() })); }catch{}
    }, 600);
    return ()=> clearTimeout(t);
  }, [content, title, notes, autosaveKey]);
  const [hasLocal, setHasLocal] = React.useState<any>(null);
  React.useEffect(()=>{
    try{
      if (typeof window==='undefined') return;
      const raw = window.localStorage.getItem(autosaveKey);
      if (raw) setHasLocal(JSON.parse(raw));
    }catch{}
  }, [autosaveKey]);

  React.useEffect(()=>{
    setErrors(validateContent(content));
  }, [content]);

  function addSection(type:string){
    setContent((c:any)=> ({ ...c, sections: [...(Array.isArray(c.sections)? c.sections:[]), { id: (globalThis as any).crypto?.randomUUID?.() || String(Date.now()), type, config:{} }] }));
  }

  function moveSection(idx:number, dir:-1|1){
    setContent((c:any)=>{
      const arr = Array.isArray(c.sections)? [...c.sections]:[];
      const ni = idx+dir; if (ni<0 || ni>=arr.length) return c;
      const tmp = arr[idx]; arr[idx] = arr[ni]; arr[ni] = tmp;
      return { ...c, sections: arr };
    })
  }

  function removeSection(idx:number){
    setContent((c:any)=>{
      const arr = Array.isArray(c.sections)? [...c.sections]:[];
      arr.splice(idx,1);
      return { ...c, sections: arr };
    })
  }

  async function saveDraft(){
    setSaving(true);
    try{
      const r = await fetch(`${apiBase}/api/admin/tabs/pages/${id}/versions`, { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ title, notes, content }) });
      if (!r.ok) throw new Error('save_failed');
      const j = await r.json();
      setVersions((v)=> [j.version, ...v]);
      setTitle(''); setNotes('');
    } finally { setSaving(false); }
  }

  async function publish(version:number){
    await fetch(`${apiBase}/api/admin/tabs/pages/${id}/publish`, { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ version }) });
  }

  async function rollback(version:number){
    await fetch(`${apiBase}/api/admin/tabs/pages/${id}/rollback`, { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ version }) });
  }

  async function schedule(){
    const payload:any = scheduleAt ? { at: scheduleAt } : { pause: true };
    await fetch(`${apiBase}/api/admin/tabs/pages/${id}/schedule`, { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
  }

  async function flushCache(){
    await fetch(`${apiBase}/api/admin/tabs/pages/${id}/flush-cache`, { method:'POST', credentials:'include' });
  }

  function buildPreviewUrl(): string {
    try{
      const q = `?device=${previewDevice}&payload=${encodeURIComponent(JSON.stringify(content))}`;
      return `/__preview/tabs${q}`;
    }catch{ return '/__preview/tabs'; }
  }
  function openExternalPreview(){ try{ window.open(buildPreviewUrl(), '_blank'); }catch{} }
  async function copyExternalPreview(){ try{ await navigator.clipboard.writeText((location.origin||'') + buildPreviewUrl()); }catch{} }

  return (
    <div className="container centered">
      <div className="panel">
        <div className="toolbar">
          <div>
            <h1 className="h1">مصمم تبويبات الصفحة</h1>
            <div className="muted">ID: {id} {page?.slug? `(/${page.slug})`: ''}</div>
            {hasLocal && (
              <div className="muted" style={{marginTop:8, display:'flex', gap:8, alignItems:'center'}}>
                <span>تم العثور على مسودة محلية غير محفوظة.</span>
                <button className="btn btn-outline btn-sm" onClick={()=>{ try{ setContent(hasLocal.content||{sections:[]}); setTitle(hasLocal.title||''); setNotes(hasLocal.notes||''); }catch{} }}>استعادة</button>
                <button className="btn btn-outline btn-sm" onClick={()=>{ try{ if (typeof window!=='undefined'){ window.localStorage.removeItem(autosaveKey); setHasLocal(null); } }catch{} }}>حذف</button>
              </div>
            )}
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <select value={previewDevice} onChange={e=> setPreviewDevice(e.target.value as Device)} className="select" style={{minWidth:140}}>
              <option value="MOBILE">Preview: Mobile</option>
              <option value="DESKTOP">Preview: Desktop</option>
            </select>
            <select value={previewLang} onChange={e=> setPreviewLang(e.target.value as any)} className="select" style={{minWidth:120}}>
              <option value="ar">AR</option>
              <option value="en">EN</option>
            </select>
            <Link href="/design/tabs" className="btn btn-outline btn-md">رجوع للقائمة</Link>
          </div>
        </div>
      </div>
      <div className="grid cols-2">
        <div className="panel">
          <div className="toolbar">
            <h2 className="h2" style={{margin:0}}>المحتوى</h2>
            <select value={device} onChange={e=> setDevice(e.target.value as Device)} className="select" style={{minWidth:140}}>
              <option value="MOBILE">Mobile</option>
              <option value="DESKTOP">Desktop</option>
            </select>
          </div>
          <div className="toolbar">
            <button onClick={()=> addSection('hero')} className="btn btn-outline btn-sm">Hero</button>
            <button onClick={()=> addSection('promoTiles')} className="btn btn-outline btn-sm">Promo Tiles</button>
            <button onClick={()=> addSection('productCarousel')} className="btn btn-outline btn-sm">Product Carousel</button>
            <button onClick={()=> addSection('categories')} className="btn btn-outline btn-sm">Categories</button>
            <button onClick={()=> addSection('brands')} className="btn btn-outline btn-sm">Brands</button>
            <button onClick={()=> addSection('masonryForYou')} className="btn btn-outline btn-sm">Masonry</button>
          </div>
          <div style={{display:'grid', gap:12}}>
            {(Array.isArray(content.sections)? content.sections:[]).map((s:any, i:number)=> (
              <div
                key={s.id||i}
                className="card"
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer', outline: selectedIdx===i? '2px solid #2563eb' : 'none'}}
                draggable
                onClick={()=> setSelectedIdx(i)}
                onDragStart={(e)=>{ setDragIdx(i); e.dataTransfer.setData('text/plain', String(i)); }}
                onDragOver={(e)=> e.preventDefault()}
                onDrop={(e)=>{
                  e.preventDefault(); const from = dragIdx ?? Number(e.dataTransfer.getData('text/plain')||-1); const to = i; if (!isFinite(from) || from===to) return;
                  setContent((c:any)=>{ const arr = Array.isArray(c.sections)? [...c.sections]:[]; const [m] = arr.splice(from,1); arr.splice(to,0,m); return { ...c, sections: arr }; }); setDragIdx(null);
                }}
              >
                <div style={{fontWeight:600}}>{s.type}</div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <button onClick={()=> moveSection(i,-1)} className="btn btn-outline btn-sm">↑</button>
                  <button onClick={()=> moveSection(i, 1)} className="btn btn-outline btn-sm">↓</button>
                  <button onClick={()=> removeSection(i)} className="btn danger btn-sm">حذف</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <details>
              <summary className="muted" style={{cursor:'pointer'}}>عرض JSON</summary>
              <pre style={{fontSize:12, background:'rgba(255,255,255,0.03)', padding:12, borderRadius:8, overflow:'auto'}} dir="ltr">{JSON.stringify(content, null, 2)}</pre>
            </details>
          </div>
          <div className="toolbar mt-2">
            <input value={title} onChange={e=> setTitle(e.target.value)} placeholder="عنوان الإصدار" className="input" />
            <input value={notes} onChange={e=> setNotes(e.target.value)} placeholder="ملاحظات" className="input" />
            <button disabled={saving || errors.length>0} onClick={saveDraft} className="btn btn-md" style={{whiteSpace:'nowrap'}}>حفظ كإصدار</button>
            {errors.length>0 && <div className="muted" style={{color:'#f59e0b'}}>({errors.length}) أخطاء يجب إصلاحها قبل الحفظ</div>}
          </div>
        </div>
        <div className="panel" style={{display:'grid', gap:16}}>
          {/* Preview (live) */}
          <div>
            <div className="toolbar" style={{ marginBottom: 0 }}>
              <h2 className="h3" style={{margin:0}}>المعاينة الفورية</h2>
              <div className="actions">
                <button className="btn btn-outline btn-sm" onClick={openExternalPreview}>فتح المعاينة الخارجية</button>
                <button className="btn btn-outline btn-sm" onClick={copyExternalPreview}>نسخ رابط المعاينة</button>
              </div>
            </div>
            <div className="panel" style={{ padding: 0 }}>
              <TabPreview content={content} device={previewDevice} lang={previewLang} />
            </div>
          </div>

          {/* Inspector */}
          <div>
            <h2 className="h3" style={{marginBottom:8}}>المحرر</h2>
            {selectedIdx>=0 && (content.sections?.[selectedIdx]) ? (
              <SectionInspector
                section={content.sections[selectedIdx]}
                onChange={(upd)=>{
                  setContent((c:any)=>{ const arr = Array.isArray(c.sections)? [...c.sections]:[]; arr[selectedIdx] = { ...arr[selectedIdx], ...upd }; return { ...c, sections: arr }; });
                }}
                openMedia={openMediaPicker}
                openCategories={openCategoriesPicker}
                openProducts={openProductsPicker}
              />
            ) : (
              <div className="muted">اختر قسماً لتحريره</div>
            )}
          </div>

          {/* Versions */}
          <div>
            <h2 className="h3" style={{marginBottom:8}}>الإصدارات</h2>
            <div style={{display:'grid', gap:8}}>
              {versions.map(v=> (
                <div key={v.id} className="card" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontWeight:600}}>Version {v.version}</div>
                    <div className="muted" style={{fontSize:12}}>{v.title||'-'}</div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=> publish(v.version)} className="btn btn-outline btn-sm">نشر</button>
                    <button onClick={()=> rollback(v.version)} className="btn btn-outline btn-sm">استرجاع</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Publish/Schedule */}
          <div>
            <h2 className="h3" style={{marginBottom:8}}>النشر والجدولة</h2>
            <div className="toolbar">
              <input type="datetime-local" value={scheduleAt} onChange={e=> setScheduleAt(e.target.value)} className="input" />
              <button onClick={schedule} className="btn btn-outline btn-sm">حفظ الجدولة/إيقاف</button>
              <button onClick={flushCache} className="btn btn-outline btn-sm">تفريغ الكاش</button>
            </div>
          </div>

          {/* Stats */}
          <div>
            <h2 className="h3" style={{marginBottom:8}}>الإحصاءات (30 يوم)</h2>
            {stats? (
              <div>
                <div className="muted" style={{marginBottom:8, fontSize:12}}>Impressions: <b>{stats.totals.impressions}</b> • Clicks: <b>{stats.totals.clicks}</b> • CTR: <b>{(stats.totals.ctr*100).toFixed(2)}%</b></div>
                <div className="table-wrapper" style={{maxHeight:200, overflow:'auto'}}>
                  <table className="table">
                    <thead><tr><th>التاريخ</th><th>الظهور</th><th>النقرات</th></tr></thead>
                    <tbody>
                      {stats.series.map((r:any,i:number)=> (
                        <tr key={i}><td>{String(r.date).slice(0,10)}</td><td>{r.impressions}</td><td>{r.clicks}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : <div className="muted">—</div>}
          </div>

          {/* Published preview */}
          <div>
            <h3 className="h3" style={{marginBottom:8}}>المعاينة (المنشور)</h3>
            {published? (
              <pre style={{fontSize:12, background:'rgba(255,255,255,0.03)', padding:12, borderRadius:8, overflow:'auto'}} dir="ltr">{JSON.stringify(published, null, 2)}</pre>
            ) : (
              <div className="muted">لا يوجد محتوى منشور بعد</div>
            )}
          </div>
        </div>
      </div>

      {/* Shared modals */}
      <MediaPickerModal open={mediaOpen} onClose={()=> setMediaOpen(false)} onSelect={(u)=>{ try{ mediaOnSelectRef.current && mediaOnSelectRef.current(u); } finally { setMediaOpen(false); } }} />
      <CategoriesPickerModal open={categoriesOpen} onClose={()=> setCategoriesOpen(false)} onSave={(items)=>{ try{ categoriesOnSaveRef.current && categoriesOnSaveRef.current(items); } finally { setCategoriesOpen(false); } }} />
      <ProductsPickerModal open={productsOpen} onClose={()=> setProductsOpen(false)} onSave={(items)=>{ try{ productsOnSaveRef.current && productsOnSaveRef.current(items); } finally { setProductsOpen(false); } }} />
    </div>
  );
}

function validateContent(c:any): string[] {
  const errs: string[] = [];
  const sections = Array.isArray(c?.sections)? c.sections : [];
  sections.forEach((s:any, idx:number)=>{
    const t = String(s?.type||'');
    const cfg = s?.config||{};
    if (t==='hero'){
      const slides = Array.isArray(cfg.slides)? cfg.slides : [];
      if (!slides.length) errs.push(`hero: لا توجد شرائح`);
      slides.forEach((sl:any,i:number)=>{ if (!sl?.image) errs.push(`hero: شريحة ${i+1} بدون صورة`); });
    }
    if (t==='promoTiles'){
      const tiles = Array.isArray(cfg.tiles)? cfg.tiles : [];
      tiles.forEach((tl:any,i:number)=>{ if (!tl?.image) errs.push(`promoTiles: بلاطة ${i+1} بدون صورة`); });
    }
    if (t==='categories' || t==='brands'){
      const list = Array.isArray(cfg[t])? cfg[t] : [];
      if (!list.length) errs.push(`${t}: اختر عناصر`);
    }
    if (t==='productCarousel'){
      const hasExplicit = Array.isArray(cfg.products) && cfg.products.length>0;
      const hasFilter = cfg.filter && typeof cfg.filter==='object';
      if (!hasExplicit && !hasFilter) errs.push('productCarousel: حدد منتجات أو أنشئ فلترة');
    }
  });
  return errs;
}

function SectionInspector({ section, onChange, openMedia, openCategories, openProducts }:{ section:any; onChange:(upd:any)=>void; openMedia:(cb:(url:string)=>void)=>void; openCategories:(cb:(items:Category[])=>void)=>void; openProducts:(cb:(items:ProductMini[])=>void)=>void }): JSX.Element {
  const t = String(section?.type||'');

  // Helpers for image pick/drag
  const handleDrop = (e:React.DragEvent, onUrl:(url:string)=>void)=>{ e.preventDefault(); const f = (e.dataTransfer?.files||[null])[0] as File|null; if (!f) return; const reader = new FileReader(); reader.onload=()=> onUrl(String(reader.result||'')); reader.readAsDataURL(f); };

  if (t==='hero') {
    const slides: Array<{ image?:string; href?:string; title?:string; subtitle?:string }> = Array.isArray(section.config?.slides)
      ? section.config.slides
      : (section.config?.image ? [{ image: section.config.image, href: section.config?.ctaHref||'' }] : []);
    const setSlides = (arr:any[])=> onChange({ config: { ...section.config, slides: arr } });
    return (
      <div style={{display:'grid',gap:12}}>
        <div className="toolbar">
          <button className="btn btn-outline btn-sm" onClick={()=> setSlides([ ...slides, { image:'', href:'' } ])}>إضافة شريحة</button>
        </div>
        <div style={{display:'grid', gap:12}}>
          {slides.map((sl, idx)=> (
            <div key={idx} className="card" style={{display:'grid', gap:8}}>
              <div onDragOver={(e)=> e.preventDefault()} onDrop={(e)=> handleDrop(e, (u)=>{ const arr=[...slides]; arr[idx]={ ...arr[idx], image:u }; setSlides(arr); })}>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <div style={{flex:1, border:'1px dashed #334155', borderRadius:10, padding:8, minHeight:120, display:'grid', placeItems:'center', overflow:'hidden'}}>
                    {sl.image ? (<img src={sl.image} alt="slide" style={{ width:'100%', height:180, objectFit:'cover', borderRadius:8 }} />) : (<span className="muted">اسحب صورة هنا أو اختر</span>)}
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={()=> openMedia((u)=>{ const arr=[...slides]; arr[idx]={ ...arr[idx], image:u }; setSlides(arr); })}>اختر صورة</button>
                </div>
              </div>
              <input className="input" placeholder="رابط الانتقال عند النقر" value={sl.href||''} onChange={(e)=>{ const arr=[...slides]; arr[idx]={ ...arr[idx], href: e.target.value }; setSlides(arr); }} />
              <div style={{display:'flex', gap:8, justifyContent:'space-between'}}>
                <div style={{display:'flex', gap:8}}>
                  <button className="btn btn-outline btn-sm" onClick={()=>{ const arr=[...slides]; if (idx>0){ const tmp=arr[idx-1]; arr[idx-1]=arr[idx]; arr[idx]=tmp; setSlides(arr); } }}>↑</button>
                  <button className="btn btn-outline btn-sm" onClick={()=>{ const arr=[...slides]; if (idx<arr.length-1){ const tmp=arr[idx+1]; arr[idx+1]=arr[idx]; arr[idx]=tmp; setSlides(arr); } }}>↓</button>
                </div>
                <button className="btn danger btn-sm" onClick={()=>{ const arr=[...slides]; arr.splice(idx,1); setSlides(arr); }}>حذف الشريحة</button>
              </div>
            </div>
          ))}
          {!slides.length && <div className="muted">لا توجد شرائح بعد</div>}
        </div>
      </div>
    );
  }

  if (t==='promoTiles') {
    const tiles = Array.isArray(section.config?.tiles)? section.config.tiles : [];
    const setTiles = (arr:any[])=> onChange({ config: { ...section.config, tiles: arr } });
    return (
      <div style={{display:'grid',gap:12}}>
        <button className="btn btn-outline btn-sm" onClick={()=> setTiles([ ...tiles, { image:'', title:'' } ])}>إضافة بلاطة</button>
        <div style={{display:'grid', gap:12}}>
          {tiles.map((tile:any, idx:number)=> (
            <div key={idx} className="card" style={{display:'grid', gap:8}}>
              <div onDragOver={(e)=> e.preventDefault()} onDrop={(e)=> handleDrop(e, (u)=>{ const arr=[...tiles]; arr[idx]={ ...arr[idx], image:u }; setTiles(arr); })}>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <div style={{flex:1, border:'1px dashed #334155', borderRadius:10, padding:8, minHeight:100, display:'grid', placeItems:'center', overflow:'hidden'}}>
                    {tile.image ? (<img src={tile.image} alt="tile" style={{ width:'100%', height:120, objectFit:'cover', borderRadius:8 }} />) : (<span className="muted">اسحب صورة هنا أو اختر</span>)}
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={()=> openMedia((u)=>{ const arr=[...tiles]; arr[idx]={ ...arr[idx], image:u }; setTiles(arr); })}>اختر صورة</button>
                </div>
              </div>
              <input className="input" placeholder={`عنوان #${idx+1}`} value={tile.title||''} onChange={(e)=>{ const arr=[...tiles]; arr[idx]={ ...arr[idx], title:e.target.value }; setTiles(arr); }} />
              <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                <button className="btn danger btn-sm" onClick={()=>{ const arr=[...tiles]; arr.splice(idx,1); setTiles(arr); }}>حذف</button>
              </div>
            </div>
          ))}
          {!tiles.length && <div className="muted">لا توجد بلاطات</div>}
        </div>
      </div>
    );
  }

  if (t==='productCarousel') {
    const cfg = section.config||{};
    const products: ProductMini[] = Array.isArray(cfg.products)? cfg.products : [];
    const filter: any = (cfg.filter && typeof cfg.filter==='object')? cfg.filter : {};
    const setCfg = (next:any)=> onChange({ config: { ...cfg, ...next } });
    return (
      <div style={{display:'grid',gap:12}}>
        <input className="input" placeholder="عنوان القسم" value={cfg.title||''} onChange={e=> setCfg({ title: e.target.value })} />
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <label className="muted" style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12}}><input type="checkbox" checked={!!cfg.autoScroll} onChange={e=> setCfg({ autoScroll: e.target.checked })} />تمرير تلقائي</label>
          <label className="muted" style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12}}><input type="checkbox" checked={!!cfg.showPrice} onChange={e=> setCfg({ showPrice: e.target.checked })} />عرض السعر</label>
        </div>
        <div className="card" style={{display:'grid', gap:8}}>
          <div className="toolbar" style={{marginBottom:0}}>
            <div className="muted">اختيار منتجات محددة</div>
            <div className="actions">
              <button className="btn btn-outline btn-sm" onClick={()=> openProducts((items)=> setCfg({ products: items }))}>اختر منتجات</button>
              {Array.isArray(products) && products.length>0 && (
                <button className="btn btn-outline btn-sm" onClick={()=> setCfg({ products: [] })}>مسح</button>
              )}
            </div>
          </div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            {products.map((p)=> (
              <div key={p.id} className="badge" style={{gap:6}}>
                {p.image && <img src={p.image} alt="thumb" style={{ width:18, height:18, objectFit:'cover', borderRadius:4 }} />}
                <span className="line-2" style={{ maxWidth:160 }}>{p.name}</span>
              </div>
            ))}
            {!products.length && <div className="muted">— لا توجد منتجات محددة</div>}
          </div>
        </div>
        <div className="card" style={{display:'grid', gap:8}}>
          <div className="toolbar" style={{marginBottom:0}}>
            <div className="muted">منشئ فلترة (بديل للاختيار اليدوي)</div>
            <div className="actions">
              <button className="btn btn-outline btn-sm" onClick={()=> openCategories((cats)=> setCfg({ filter: { ...(filter||{}), categoryIds: cats.map(c=> c.id) } }))}>اختر فئات</button>
              <button className="btn btn-outline btn-sm" onClick={()=> setCfg({ filter: {} })}>مسح</button>
            </div>
          </div>
          <div style={{display:'grid', gap:10, gridTemplateColumns:'1fr 1fr'}}>
            <label className="form-label">الترتيب</label>
            <select className="select" value={filter.sortBy||'newest'} onChange={(e)=> setCfg({ filter: { ...filter, sortBy: e.target.value } })}>
              <option value="newest">الأحدث</option>
              <option value="bestseller">الأكثر مبيعاً</option>
              <option value="price_asc">السعر تصاعدي</option>
              <option value="price_desc">السعر تنازلي</option>
            </select>
            <label className="form-label">حد العناصر</label>
            <input type="number" className="input" value={Number(filter.limit||12)} onChange={(e)=> setCfg({ filter: { ...filter, limit: Math.max(1, Number(e.target.value||12)) } })} />
          </div>
          <label className="muted" style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12}}>
            <input type="checkbox" checked={!!filter.onlyDiscounted} onChange={(e)=> setCfg({ filter: { ...filter, onlyDiscounted: e.target.checked } })} />
            منتجات مخفّضة فقط
          </label>
          <textarea className="input" rows={4} placeholder="قواعد إضافية (JSON)" value={JSON.stringify(filter||{},null,0)} onChange={e=> { try{ setCfg({ filter: JSON.parse(e.target.value||'{}') }); }catch{} }} />
        </div>
      </div>
    );
  }

  if (t==='categories' || t==='brands') {
    const key = t==='categories'? 'categories' : 'brands';
    const list = Array.isArray(section.config?.[key])? section.config[key] : [];
    const setList = (arr:any[])=> onChange({ config: { ...section.config, [key]: arr } });
    return (
      <div style={{display:'grid',gap:12}}>
        <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
          <button className="btn btn-outline btn-sm" onClick={()=> openCategories((items)=> setList(items))}>{t==='categories'? 'اختر فئات' : 'اختر علامات تجارية'}</button>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            {list.map((it:any, idx:number)=> (
              <div key={`${it.id||idx}:${it.name||''}`} className="badge" style={{gap:6}}>
                {it.image && <img src={it.image} alt="thumb" style={{ width:18, height:18, objectFit:'cover', borderRadius:4 }} />}
                <span>{it.name||it.id}</span>
                <button className="btn btn-outline btn-sm" style={{minHeight:24, padding:'0 6px', fontSize:11}} onClick={()=>{ const arr=[...list]; arr.splice(idx,1); setList(arr); }}>إزالة</button>
              </div>
            ))}
          </div>
        </div>
        {!list.length && <div className="muted">لا توجد عناصر محددة</div>}
      </div>
    );
  }

  if (t==='masonryForYou') {
    return (
      <div style={{display:'grid',gap:12}}>
        <label className="form-label">عدد الأعمدة</label>
        <input type="number" className="input" value={Number(section.config?.columns||2)} onChange={e=> onChange({ config: { ...section.config, columns: Number(e.target.value||2) } })} />
        <textarea className="input" rows={4} placeholder="قواعد التوصيات (JSON)" value={JSON.stringify(section.config?.recommend||{},null,0)} onChange={e=> { try{ onChange({ config: { ...section.config, recommend: JSON.parse(e.target.value||'{}') } }) }catch{} }} />
      </div>
    );
  }
  return <div className="muted">لا يوجد محرر لهذا النوع</div>;
}

function TabPreview({ content, device, lang }:{ content:any; device:Device; lang:'ar'|'en' }): JSX.Element {
  const sections: any[] = Array.isArray(content?.sections) ? content.sections : [];
  const isMobile = device==='MOBILE';
  return (
    <div style={{ width:'100%', padding: 12 }}>
      <div style={{ marginBottom: 8, color:'#94a3b8', fontSize:12 }}>المعاينة: {device==='MOBILE'? 'موبايل' : 'ديسكتوب'} • اللغة: {lang.toUpperCase()}</div>
      <div style={{ maxWidth: isMobile? 420 : 980, margin:'0 auto', border:'1px solid #1c2333', borderRadius:12, overflow:'hidden', background:'#0b0e14' }}>
        {sections.map((s:any, idx:number)=> {
          const cfg = s?.config||{};
          if (s.type==='hero'){
            const slides = Array.isArray(cfg.slides)? cfg.slides : (cfg.image? [{ image: cfg.image, href: cfg.ctaHref||'' }]: []);
            return (
              <div key={idx} style={{ position:'relative' }}>
                {slides.length? (
                  <div style={{ display:'grid', gridTemplateColumns: `repeat(${slides.length}, 100%)`, overflowX:'auto', scrollSnapType:'x mandatory' }}>
                    {slides.map((sl:any, i:number)=> (
                      <a key={i} href={sl.href||'#'} style={{ display:'block', scrollSnapAlign:'start' }}>
                        <img src={sl.image||''} alt="slide" style={{ width:'100%', height: isMobile? 220: 360, objectFit:'cover' }} />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div style={{ height: isMobile? 220: 360, display:'grid', placeItems:'center', background:'#0f1420' }} className="muted">Hero</div>
                )}
              </div>
            );
          }
          if (s.type==='promoTiles'){
            const tiles = Array.isArray(cfg.tiles)? cfg.tiles: [];
            const cols = isMobile? 2 : 4;
            return (
              <div key={idx} style={{ padding: 12 }}>
                <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols}, minmax(0,1fr))`, gap:12 }}>
                  {tiles.map((t:any, i:number)=> (
                    <div key={i} style={{ background:'#0f1420', border:'1px solid #1c2333', borderRadius:10, overflow:'hidden' }}>
                      {t.image ? <img src={t.image} alt={t.title||''} style={{ width:'100%', height: isMobile? 100: 140, objectFit:'cover' }} /> : <div style={{ height:isMobile? 100: 140 }} className="muted" />}
                      {t.title && <div style={{ padding:'6px 8px' }}>{t.title}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          if (s.type==='productCarousel'){
            const count = isMobile? 6 : 10;
            return (
              <div key={idx} style={{ padding:12 }}>
                {cfg.title && <div style={{ marginBottom:8, fontWeight:700 }}>{cfg.title}</div>}
                <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile? 2: 5}, minmax(0,1fr))`, gap:12 }}>
                  {Array.from({ length: count }).map((_,i)=> (
                    <div key={i} style={{ background:'#0f1420', border:'1px solid #1c2333', borderRadius:10, overflow:'hidden' }}>
                      <div style={{ height: isMobile? 120: 140, background:'#101828' }} />
                      <div style={{ padding:8 }}>
                        <div className="line-2" style={{ height:32 }}>اسم منتج</div>
                        {cfg.showPrice && <div style={{ marginTop:4, color:'#22c55e' }}>99.00</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          if (s.type==='categories' || s.type==='brands'){
            const list = Array.isArray(cfg[s.type])? cfg[s.type] : [];
            const cols = isMobile? 3 : 6;
            return (
              <div key={idx} style={{ padding:12 }}>
                <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols}, minmax(0,1fr))`, gap:12 }}>
                  {list.map((it:any, i:number)=> (
                    <div key={i} style={{ textAlign:'center' }}>
                      {it.image ? (<img src={it.image} alt={it.name||''} style={{ width:'100%', height:isMobile? 72: 90, objectFit:'cover', borderRadius:10, border:'1px solid #1c2333' }} />) : (<div style={{ height:isMobile? 72: 90, background:'#101828', borderRadius:10 }} />)}
                      <div style={{ marginTop:6, fontSize:12 }} className="line-2">{it.name||'-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          if (s.type==='masonryForYou'){
            return (
              <div key={idx} style={{ padding:12 }}>
                <div className="muted">For You (masonry) — المعاينة مكان حامل</div>
              </div>
            );
          }
          return (
            <div key={idx} style={{ padding:12 }}>
              <div className="muted">قسم غير مدعوم في المعاينة</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MediaPickerModal({ open, onClose, onSelect }:{ open:boolean; onClose:()=>void; onSelect:(url:string)=>void }): JSX.Element|null {
  const [rows, setRows] = React.useState<MediaAsset[]>([]);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const limit = 24;

  const load = React.useCallback(async()=>{
    if (!open) return;
    try{
      const r = await fetch(`/api/admin/media/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { credentials:'include' });
      const j = await r.json(); setRows(j.assets||[]); setTotal(j.total||0);
    }catch{}
  },[open, page, search]);

  React.useEffect(()=>{ load(); },[load]);

  async function toBase64(file: File): Promise<string> {
    return await new Promise((resolve, reject)=>{ const reader = new FileReader(); reader.onload=()=> resolve(String(reader.result||'')); reader.onerror=reject; reader.readAsDataURL(file); });
  }

  async function uploadFiles(list: File[]){
    try{ setBusy(true);
      for (const f of list){
        try{
          const b64 = await toBase64(f);
          await fetch(`/api/admin/media`, { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ base64: b64, type: f.type||'image' }) });
        }catch{}
      }
      await load();
    } finally { setBusy(false); }
  }

  if (!open) return null;
  const pages = Math.max(1, Math.ceil(total/limit));
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000 }} onClick={onClose}>
      <div style={{ width:'min(1000px, 94vw)', maxHeight:'86vh', overflow:'auto', background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }} onClick={(e)=> e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h3 style={{ margin:0 }}>الوسائط</h3>
          <button onClick={onClose} className="btn btn-outline btn-sm">إغلاق</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginBottom:12 }}>
          <input value={search} onChange={(e)=> setSearch((e.target as HTMLInputElement).value)} placeholder="بحث" className="input" />
          <label className="btn btn-outline btn-sm" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            اختر ملفات
            <input type="file" accept="image/*" multiple style={{ display:'none' }} onChange={(e)=>{ const list = Array.from((e.target as HTMLInputElement).files||[]); if (list.length) uploadFiles(list); }} />
          </label>
        </div>
        <div onDragOver={(e)=> e.preventDefault()} onDrop={(e)=>{ e.preventDefault(); const list = Array.from(e.dataTransfer?.files||[]); if (list.length) uploadFiles(list); }} style={{ border:'1px dashed #334155', borderRadius:10, padding:12, textAlign:'center', color:'#94a3b8', marginBottom:12 }}>
          {busy? 'جارٍ الرفع…' : 'اسحب وأفلت الصور هنا أو اختر من جهازك'}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(120px, 1fr))', gap:10 }}>
          {rows.map((a)=> (
            <button key={a.id} onClick={()=> onSelect(a.url)} style={{ background:'#0f1320', border:'1px solid #1c2333', borderRadius:8, padding:6 }}>
              <img src={a.url} alt={a.alt||''} style={{ width:'100%', borderRadius:6 }} />
            </button>
          ))}
          {!rows.length && <div className="muted">لا توجد عناصر</div>}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
          <div style={{ color:'#94a3b8', fontSize:12 }}>{total} عنصر</div>
          <div style={{ display:'flex', gap:6 }}>
            <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1, p-1))} className="btn btn-outline btn-sm">السابق</button>
            <span style={{ color:'#94a3b8' }}>{page} / {pages}</span>
            <button disabled={page>=pages} onClick={()=> setPage(p=> Math.min(pages, p+1))} className="btn btn-outline btn-sm">التالي</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoriesPickerModal({ open, onClose, onSave }:{ open:boolean; onClose:()=>void; onSave:(items:Category[])=>void }): JSX.Element|null {
  const [rows, setRows] = React.useState<Category[]>([]);
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<Record<string, Category>>({});

  React.useEffect(()=>{ if(!open) return; (async()=>{
    try{
      const r = await fetch(`/api/admin/categories?search=${encodeURIComponent(search)}`, { credentials:'include' });
      const j = await r.json(); const list = Array.isArray(j.categories)? j.categories : []; setRows(list);
    }catch{}
  })(); },[open, search]);

  if (!open) return null;
  const items = Object.values(selected);
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000 }} onClick={onClose}>
      <div style={{ width:'min(900px, 94vw)', maxHeight:'86vh', overflow:'auto', background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }} onClick={(e)=> e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h3 style={{ margin:0 }}>اختيار الفئات</h3>
          <button onClick={onClose} className="btn btn-outline btn-sm">إغلاق</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginBottom:12 }}>
          <input value={search} onChange={(e)=> setSearch((e.target as HTMLInputElement).value)} placeholder="بحث" className="input" />
          <button className="btn btn-outline btn-sm" onClick={()=> setSelected({})}>مسح</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:12 }}>
          {rows.map((c: any)=>{
            const isSel = !!selected[c.id];
            return (
              <button key={c.id} onClick={()=> setSelected(s=> ({ ...s, [c.id]: isSel? undefined as any : { id:c.id, name:c.name, image:c.image } }))} style={{ textAlign:'start', background: isSel? '#101828' : '#0f1320', border:'1px solid #1c2333', borderRadius:10, overflow:'hidden' }}>
                {c.image ? <img src={c.image} alt={c.name||''} style={{ width:'100%', height:100, objectFit:'cover' }} /> : <div style={{ height:100, background:'#101828' }} />}
                <div style={{ padding:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span className="line-2" style={{ fontSize:14 }}>{c.name}</span>
                  <span className="badge" style={{ height:24 }}>{isSel? '✓' : '+'}</span>
                </div>
              </button>
            );
          })}
          {!rows.length && <div className="muted">لا توجد نتائج</div>}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>إلغاء</button>
          <button className="btn btn-sm" onClick={()=> onSave(items)}>تأكيد</button>
        </div>
      </div>
    </div>
  );
}

function ProductsPickerModal({ open, onClose, onSave }:{ open:boolean; onClose:()=>void; onSave:(items:ProductMini[])=>void }): JSX.Element|null {
  const [rows, setRows] = React.useState<ProductMini[]>([]);
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<Record<string, ProductMini>>({});
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  React.useEffect(()=>{ if(!open) return; (async()=>{
    try{
      const r = await fetch(`/api/admin/products?page=${page}&limit=24&search=${encodeURIComponent(search)}`, { credentials:'include' });
      const j = await r.json();
      const list = Array.isArray(j.products)? j.products : (Array.isArray(j.items)? j.items: []);
      setRows(list.map((p:any)=> ({ id:p.id, name:p.name, image: (p.images||[])[0]||'', price: p.price })));
      const total = j.pagination?.totalPages || 1; setTotalPages(total);
    }catch{}
  })(); },[open, search, page]);

  if (!open) return null;
  const items = Object.values(selected);
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000 }} onClick={onClose}>
      <div style={{ width:'min(1000px, 94vw)', maxHeight:'86vh', overflow:'auto', background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }} onClick={(e)=> e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h3 style={{ margin:0 }}>اختيار المنتجات</h3>
          <button onClick={onClose} className="btn btn-outline btn-sm">إغلاق</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginBottom:12 }}>
          <input value={search} onChange={(e)=> setSearch((e.target as HTMLInputElement).value)} placeholder="بحث" className="input" />
          <button className="btn btn-outline btn-sm" onClick={()=> setSelected({})}>مسح</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:12 }}>
          {rows.map((p)=>{
            const isSel = !!selected[p.id];
            return (
              <button key={p.id} onClick={()=> setSelected(s=> ({ ...s, [p.id]: isSel? undefined as any : p }))} style={{ textAlign:'start', background: isSel? '#101828' : '#0f1320', border:'1px solid #1c2333', borderRadius:10, overflow:'hidden' }}>
                {p.image ? <img src={p.image} alt={p.name||''} style={{ width:'100%', height:120, objectFit:'cover' }} /> : <div style={{ height:120, background:'#101828' }} />}
                <div style={{ padding:8 }}>
                  <div className="line-2" style={{ fontSize:14 }}>{p.name}</div>
                  {p.price!=null && <div style={{ color:'#22c55e', marginTop:4, fontSize:12 }}>{Number(p.price).toLocaleString()}</div>}
                </div>
              </button>
            );
          })}
          {!rows.length && <div className="muted">لا توجد نتائج</div>}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
          <div className="muted">صفحة {page} من {totalPages}</div>
          <div style={{ display:'flex', gap:6 }}>
            <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1, p-1))} className="btn btn-outline btn-sm">السابق</button>
            <button disabled={page>=totalPages} onClick={()=> setPage(p=> Math.min(totalPages, p+1))} className="btn btn-outline btn-sm">التالي</button>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>إلغاء</button>
          <button className="btn btn-sm" onClick={()=> onSave(items)}>تأكيد</button>
        </div>
      </div>
    </div>
  );
}
