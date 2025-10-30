"use client";
import React from "react";

// Types
type Site = "web" | "mweb";
type CategoryMini = { id: string; name: string; image?: string };

type SidebarItem = { label: string; icon?: string; tabKey?: string };

type TabConfig = {
  key: string; // e.g. women | men | kids
  label: string;
  featured?: CategoryMini[]; // chips row
  grid?: { mode: "explicit"; categories: CategoryMini[] } | { mode: "filter"; categoryIds?: string[]; limit?: number; sortBy?: string };
};

type PromoBanner = { enabled: boolean; image?: string; title?: string; href?: string };

type CategoriesPageConfig = {
  layout?: { showHeader?: boolean; showTabs?: boolean; showSidebar?: boolean; showPromoPopup?: boolean };
  promoBanner?: PromoBanner;
  tabs: TabConfig[];
  sidebar?: SidebarItem[];
  suggestions?: CategoryMini[];
  badges?: Array<{ categoryId: string; text: string }>;
  seo?: { title?: string; description?: string };
};

function useApiBase(){ return React.useMemo(()=> (typeof window!=="undefined"? "" : ""), []); }

export default function CategoriesDesignerPage(): JSX.Element {
  const apiBase = useApiBase();
  const [site, setSite] = React.useState<Site>("mweb");
  const [pickerOpen, setPickerOpen] = React.useState<boolean>(false);
  const pickerCbRef = React.useRef<(items: CategoryMini[])=>void>(()=>{});
  function openCategoriesPicker(cb:(items: CategoryMini[])=>void){ pickerCbRef.current = cb; setPickerOpen(true); }
  const [mediaOpen, setMediaOpen] = React.useState<boolean>(false);
  const mediaOnSelectRef = React.useRef<(url:string)=>void>(()=>{});
  function openMediaPicker(cb:(url:string)=>void){ mediaOnSelectRef.current = cb; setMediaOpen(true); }
  const [config, setConfig] = React.useState<CategoriesPageConfig>({
    layout: { showHeader: true, showTabs: true, showSidebar: true, showPromoPopup: false },
    promoBanner: { enabled: true, image: "", title: "", href: "/products" },
    tabs: [
      { key: "all", label: "كل", grid: { mode: "explicit", categories: [] } },
      { key: "women", label: "نساء", featured: [], grid: { mode: "explicit", categories: [] } },
      { key: "men", label: "رجال", featured: [], grid: { mode: "explicit", categories: [] } },
    ],
    sidebar: [ { label: "ملابس نسائية", icon: "👗", tabKey: "women" }, { label: "ملابس رجالية", icon: "👔", tabKey: "men" } ],
    suggestions: [],
    badges: [],
    seo: { title: "الفئات", description: "تصفح فئات jeeey" },
  });
  const [msg, setMsg] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  // Load draft
  React.useEffect(()=>{ (async()=>{
    try{
      const r = await fetch(`/api/admin/categories/page?site=${site}&mode=draft`, { credentials:'include' });
      const j = await r.json();
      if (j?.config) setConfig(j.config as CategoriesPageConfig);
    }catch{}
  })(); }, [site]);

  function setLayout(upd: Partial<NonNullable<CategoriesPageConfig['layout']>>){ setConfig(c=> ({ ...c, layout: { ...(c.layout||{}), ...upd } })); }
  function setTabs(items: TabConfig[]){ setConfig(c=> ({ ...c, tabs: items })); }
  function setSidebar(items: SidebarItem[]){ setConfig(c=> ({ ...c, sidebar: items })); }
  function setSuggestions(items: CategoryMini[]){ setConfig(c=> ({ ...c, suggestions: items })); }
  function setPromo(upd: Partial<PromoBanner>){ setConfig(c=> ({ ...c, promoBanner: { ...(c.promoBanner||{enabled:false}), ...upd } })); }
  function setSeo(upd: Partial<NonNullable<CategoriesPageConfig['seo']>>){ setConfig(c=> ({ ...c, seo: { ...(c.seo||{}), ...upd } })); }

  function updateAt<T>(arr: T[], idx:number, v:T){ const next=[...arr]; next[idx]=v; return next; }
  function removeAt<T>(arr: T[], idx:number){ return arr.filter((_,i)=> i!==idx); }

  async function save(){
    setSaving(true); setMsg("");
    try{
      const r = await fetch('/api/admin/categories/page', { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site, mode:'draft', config }) });
      if (!r.ok) throw new Error('فشل الحفظ');
      setMsg('تم الحفظ');
    }catch(e:any){ setMsg(e?.message||'فشل الحفظ'); }
    finally{ setSaving(false); setTimeout(()=> setMsg(''), 1600); }
  }
  async function publish(){
    if (!confirm('نشر صفحة الفئات للنسخة الحية؟')) return;
    setSaving(true); setMsg("");
    try{ const r = await fetch('/api/admin/categories/page/publish', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site }) }); if (!r.ok) throw new Error('فشل النشر'); setMsg('تم النشر'); }
    catch(e:any){ setMsg(e?.message||'فشل النشر'); }
    finally{ setSaving(false); setTimeout(()=> setMsg(''), 1600); }
  }

  async function signPreviewToken(): Promise<string|undefined> {
    try{
      const r = await fetch('/api/admin/categories/page/preview/sign', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ content: config }) });
      if (!r.ok) return undefined; const j = await r.json(); return j?.token;
    }catch{ return undefined; }
  }
  async function openExternalPreview(){
    try{
      const token = await signPreviewToken();
      const qs = new URLSearchParams(); if (token) qs.set('token', token);
      const url = `https://m.jeeey.com/categories?${qs.toString()}`;
      window.open(url, '_blank');
    }catch{}
  }

  return (
    <main>
      <div className="panel">
        <div className="toolbar">
          <div>
            <h1 className="h1">مصمم صفحة الفئات (الجوال)</h1>
            <div className="muted">تحكم مرئي شامل لصفحة الفئات مع معاينة فورية</div>
          </div>
          <div className="actions" style={{display:'flex', gap:8}}>
            <select value={site} onChange={e=> setSite(e.target.value as Site)} className="select" style={{minWidth:140}}>
              <option value="mweb">الجوال (m.jeeey.com)</option>
              <option value="web">سطح المكتب (jeeey.com)</option>
            </select>
            <button className="btn" onClick={save} disabled={saving}>حفظ</button>
            <button className="btn" onClick={publish} disabled={saving}>نشر</button>
            <button className="btn btn-outline" onClick={openExternalPreview}>معاينة خارجية</button>
          </div>
        </div>
        {msg && (<div className={`toast ${/فشل/.test(msg)? 'err':'ok'}`}>{msg}</div>)}
      </div>

      <div className="grid cols-2">
        {/* Builder */}
        <div className="panel" style={{display:'grid', gap:16}}>
          <div className="toolbar" style={{display:'grid', gap:8}}>
            <div style={{fontWeight:600}}>التخطيط</div>
            <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
              <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                <input type="checkbox" checked={config.layout?.showHeader!==false} onChange={e=> setLayout({ showHeader: e.target.checked })} /> هيدر
              </label>
              <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                <input type="checkbox" checked={config.layout?.showTabs!==false} onChange={e=> setLayout({ showTabs: e.target.checked })} /> تبويبات علوية
              </label>
              <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                <input type="checkbox" checked={config.layout?.showSidebar!==false} onChange={e=> setLayout({ showSidebar: e.target.checked })} /> شريط جانبي
              </label>
              <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                <input type="checkbox" checked={!!config.layout?.showPromoPopup} onChange={e=> setLayout({ showPromoPopup: e.target.checked })} /> بوب-أب ترويجي
              </label>
            </div>
          </div>

          {/* Promo banner */}
          <div className="card" style={{display:'grid', gap:8}}>
            <div className="toolbar" style={{marginBottom:0}}>
              <div className="muted">البانر الترويجي</div>
              <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                <input type="checkbox" checked={!!config.promoBanner?.enabled} onChange={e=> setPromo({ enabled: e.target.checked })} /> مفعّل
              </label>
            </div>
            <input className="input" placeholder="عنوان" value={config.promoBanner?.title||''} onChange={e=> setPromo({ title: e.target.value })} />
            <input className="input" placeholder="رابط عند النقر" value={config.promoBanner?.href||''} onChange={e=> setPromo({ href: e.target.value })} />
            <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:8}}>
              <input className="input" placeholder="رابط صورة" value={config.promoBanner?.image||''} onChange={e=> setPromo({ image: e.target.value })} />
              <button className="btn btn-outline" onClick={()=> openMediaPicker((u)=> setPromo({ image: u }))}>اختر صورة</button>
            </div>
          </div>

          {/* Tabs editor */}
          <div className="card" style={{display:'grid', gap:12}}>
            <div className="toolbar" style={{marginBottom:0}}>
              <div className="muted">التبويبات</div>
              <div className="actions"><button className="btn btn-outline btn-sm" onClick={()=> setTabs([...(config.tabs||[]), { key:'new', label:'جديد', grid:{ mode:'explicit', categories: [] }, featured: [] }])}>+ تبويب</button></div>
            </div>
            <div style={{display:'grid', gap:12}}>
              {(config.tabs||[]).map((t, idx)=> (
                <div key={idx} className="card" style={{display:'grid', gap:8}}>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8}}>
                    <input className="input" placeholder="المفتاح (women)" value={t.key} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, key: e.target.value }))} />
                    <input className="input" placeholder="التسمية (نساء)" value={t.label} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, label: e.target.value }))} />
                    <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}>
                      <button className="btn btn-outline btn-sm" onClick={()=> setTabs(removeAt(config.tabs, idx))}>حذف</button>
                    </div>
                  </div>
                  {/* Featured */}
                  <div className="toolbar" style={{marginBottom:0}}>
                    <div className="muted">فئات مميّزة (شرائح)</div>
                    <div className="actions"><button className="btn btn-outline btn-sm" onClick={()=> openCategoriesPicker((items)=> setTabs(updateAt(config.tabs, idx, { ...t, featured: items })))}>اختيار</button></div>
                  </div>
                  <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                    {(t.featured||[]).map((c)=> (
                      <div key={c.id} className="badge" style={{gap:6}}>
                        {c.image && <img src={c.image} alt="thumb" style={{ width:18, height:18, objectFit:'cover', borderRadius:4 }} />}
                        <span>{c.name}</span>
                      </div>
                    ))}
                    {!(t.featured||[]).length && <div className="muted">— لا عناصر</div>}
                  </div>
                  {/* Grid source */}
                  <div className="toolbar" style={{marginBottom:0}}>
                    <div className="muted">شبكة الفئات</div>
                    <div className="actions" style={{display:'flex', gap:8}}>
                      <button className="btn btn-outline btn-sm" onClick={()=> setTabs(updateAt(config.tabs, idx, { ...t, grid: { mode:'explicit', categories: [] } }))}>قائمة صريحة</button>
                      <button className="btn btn-outline btn-sm" onClick={()=> setTabs(updateAt(config.tabs, idx, { ...t, grid: { mode:'filter', limit:36, sortBy:'name_asc' } as any }))}>فلترة</button>
                    </div>
                  </div>
                  {t.grid?.mode==='explicit' ? (
                    <div style={{display:'grid', gap:8}}>
                      <div className="actions" style={{display:'flex', gap:8}}>
                        <button className="btn btn-outline btn-sm" onClick={()=> openCategoriesPicker((items)=> setTabs(updateAt(config.tabs, idx, { ...t, grid: { mode:'explicit', categories: items } })))}>اختيار فئات</button>
                        {(t.grid as any)?.categories?.length>0 && <button className="btn btn-outline btn-sm" onClick={()=> setTabs(updateAt(config.tabs, idx, { ...t, grid: { mode:'explicit', categories: [] } }))}>مسح</button>}
                      </div>
                      <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                        {((t.grid as any)?.categories||[]).map((c:CategoryMini)=> (
                          <div key={c.id} className="badge" style={{gap:6}}>
                            {c.image && <img src={c.image} alt="thumb" style={{ width:18, height:18, objectFit:'cover', borderRadius:4 }} />}
                            <span>{c.name}</span>
                          </div>
                        ))}
                        {!((t.grid as any)?.categories||[]).length && <div className="muted">— لا عناصر</div>}
                      </div>
                    </div>
                  ) : (
                    <div style={{display:'grid', gap:8, gridTemplateColumns:'1fr 1fr'}}>
                      <label className="form-label">الحد</label>
                      <input type="number" className="input" value={Number((t.grid as any)?.limit||36)} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, grid: { ...(t.grid as any), mode:'filter', limit: Math.max(1, Number(e.target.value||36)) } as any }))} />
                      <label className="form-label">الترتيب</label>
                      <select className="select" value={(t.grid as any)?.sortBy||'name_asc'} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, grid: { ...(t.grid as any), mode:'filter', sortBy: e.target.value } as any }))}>
                        <option value="name_asc">الاسم تصاعدي</option>
                        <option value="name_desc">الاسم تنازلي</option>
                        <option value="created_desc">الأحدث</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="card" style={{display:'grid', gap:8}}>
            <div className="toolbar" style={{marginBottom:0}}>
              <div className="muted">الشريط الجانبي</div>
              <div className="actions"><button className="btn btn-outline btn-sm" onClick={()=> setSidebar([...(config.sidebar||[]), { label:'عنصر', icon:'✨', tabKey:'' }])}>+ عنصر</button></div>
            </div>
            <div style={{display:'grid', gap:8}}>
              {(config.sidebar||[]).map((s, idx)=> (
                <div key={`${s.label}:${idx}`} style={{display:'grid', gridTemplateColumns:'1fr 120px 160px auto', gap:8}}>
                  <input className="input" placeholder="التسمية" value={s.label} onChange={e=> setSidebar(updateAt(config.sidebar||[], idx, { ...s, label: e.target.value }))} />
                  <input className="input" placeholder="أيقونة" value={s.icon||''} onChange={e=> setSidebar(updateAt(config.sidebar||[], idx, { ...s, icon: e.target.value }))} />
                  <input className="input" placeholder="tabKey (اختياري)" value={s.tabKey||''} onChange={e=> setSidebar(updateAt(config.sidebar||[], idx, { ...s, tabKey: e.target.value }))} />
                  <button className="btn btn-outline" onClick={()=> setSidebar(removeAt(config.sidebar||[], idx))}>حذف</button>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="card" style={{display:'grid', gap:8}}>
            <div className="toolbar" style={{marginBottom:0}}>
              <div className="muted">اقتراحات أسفل الصفحة</div>
              <div className="actions" style={{display:'flex', gap:8}}>
                <button className="btn btn-outline btn-sm" onClick={()=> openCategoriesPicker((items)=> setSuggestions(items))}>اختيار فئات</button>
                {(config.suggestions||[]).length>0 && <button className="btn btn-outline btn-sm" onClick={()=> setSuggestions([])}>مسح</button>}
              </div>
            </div>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {(config.suggestions||[]).map((c)=> (
                <div key={c.id} className="badge" style={{gap:6}}>
                  {c.image && <img src={c.image} alt="thumb" style={{ width:18, height:18, objectFit:'cover', borderRadius:4 }} />}
                  <span>{c.name}</span>
                </div>
              ))}
              {!(config.suggestions||[]).length && <div className="muted">— لا عناصر</div>}
            </div>
          </div>

          {/* SEO */}
          <div className="card" style={{display:'grid', gap:8}}>
            <div className="muted">SEO</div>
            <input className="input" placeholder="العنوان" value={config.seo?.title||''} onChange={e=> setSeo({ title: e.target.value })} />
            <textarea className="input" rows={3} placeholder="الوصف" value={config.seo?.description||''} onChange={e=> setSeo({ description: e.target.value })} />
          </div>
        </div>

        {/* Preview */}
        <div className="panel" style={{display:'grid', gap:16}}>
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <h2 className="h3" style={{margin:0}}>المعاينة الفورية</h2>
            <div className="actions"><button className="btn btn-outline btn-sm" onClick={openExternalPreview}>فتح المعاينة الخارجية</button></div>
          </div>
          <div className="panel" style={{ padding: 0 }}>
            <CategoriesLivePreview content={config} />
          </div>
          <details>
            <summary className="muted" style={{cursor:'pointer'}}>عرض JSON</summary>
            <pre dir="ltr" style={{fontSize:12, background:'rgba(255,255,255,0.03)', padding:12, borderRadius:8, overflow:'auto'}}>{JSON.stringify(config, null, 2)}</pre>
          </details>
        </div>
      </div>

      {/* Modals */}
      <CategoriesPickerModal open={pickerOpen} onClose={()=> setPickerOpen(false)} onSave={(items)=>{ try{ pickerCbRef.current && pickerCbRef.current(items); } finally{ setPickerOpen(false); } }} />
      <MediaPickerModal open={mediaOpen} onClose={()=> setMediaOpen(false)} onSelect={(u)=>{ try{ mediaOnSelectRef.current && mediaOnSelectRef.current(u); } finally { setMediaOpen(false); } }} />
    </main>
  );
}

function CategoriesLivePreview({ content }:{ content: CategoriesPageConfig }): JSX.Element {
  const frameRef = React.useRef<HTMLIFrameElement|null>(null);
  const [src, setSrc] = React.useState<string>("");
  React.useEffect(()=>{ (async()=>{
    try{
      const r = await fetch('/api/admin/categories/page/preview/sign', { method:'POST', headers:{ 'Content-Type':'application/json' }, credentials:'include', body: JSON.stringify({ content }) });
      const j = await r.json(); const token = j?.token||'';
      const qs = new URLSearchParams(); if (token) qs.set('token', token);
      setSrc(`https://m.jeeey.com/categories?${qs.toString()}`);
    }catch{ setSrc(''); }
  })(); }, [JSON.stringify(content)]);
  React.useEffect(()=>{
    try{
      const win = frameRef.current?.contentWindow; if (!win) return;
      win.postMessage({ __categories_preview: true, content }, 'https://m.jeeey.com');
    }catch{}
  }, [src, JSON.stringify(content)]);
  return (
    <iframe ref={frameRef} title="Live Categories Preview" src={src} style={{ width:'100%', height: 860, border:0 }} onLoad={()=>{
      try{ const win = frameRef.current?.contentWindow; if (!win) return; win.postMessage({ __categories_preview: true, content }, 'https://m.jeeey.com'); }catch{}
    }} />
  );
}

// ---- Categories Picker Modal (admin) ----
function CategoriesPickerModal({ open, onClose, onSave }:{ open:boolean; onClose:()=>void; onSave:(items: CategoryMini[])=>void }): JSX.Element|null {
  const [rows, setRows] = React.useState<CategoryMini[]>([]);
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<Record<string, CategoryMini>>({});
  React.useEffect(()=>{ if(!open) return; (async()=>{
    try{
      const r = await fetch(`/api/admin/categories?search=${encodeURIComponent(search)}`, { credentials:'include' });
      const j = await r.json(); const list = Array.isArray(j.categories)? j.categories : [];
      setRows(list.map((c:any)=> ({ id:c.id, name:c.name, image: c.image||'' })));
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
          {rows.map((c)=>{
            const isSel = !!selected[c.id];
            return (
              <button key={c.id} onClick={()=> setSelected(s=> ({ ...s, [c.id]: isSel? undefined as any : c }))} style={{ textAlign:'start', background: isSel? '#101828' : '#0f1320', border:'1px solid #1c2333', borderRadius:10, overflow:'hidden' }}>
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

// (no global picker state needed)

function MediaPickerModal({ open, onClose, onSelect }:{ open:boolean; onClose:()=>void; onSelect:(url:string)=>void }): JSX.Element|null {
  const [rows, setRows] = React.useState<Array<{ id:string; url:string; alt?:string }>>([]);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const limit = 24;

  const load = React.useCallback(async()=>{
    if (!open) return;
    try{
      const r = await fetch(`/api/admin/media/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { credentials:'include' });
      const j = await r.json(); setRows((j.assets||[]) as any); setTotal(Number(j.total||0));
    }catch{}
  },[open, page, search]);
  React.useEffect(()=>{ load(); },[load]);

  async function toBase64(file: File): Promise<string> {
    return await new Promise((resolve, reject)=>{ const reader = new FileReader(); reader.onload=()=> resolve(String(reader.result||'')); reader.onerror=reject; reader.readAsDataURL(file); });
  }
  async function uploadFiles(list: File[]){
    try{ setBusy(true);
      for (const f of list){
        try{ const b64 = await toBase64(f); await fetch(`/api/admin/media`, { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ base64: b64, type: f.type||'image' }) }); }catch{}
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
