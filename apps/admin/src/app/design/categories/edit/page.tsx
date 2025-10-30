"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { resolveApiBase } from "../../../lib/apiBase";

type Site = "web" | "mweb";
type CategoryMini = { id: string; name: string; image?: string };
type SidebarItem = { label: string; icon?: string; tabKey?: string; href?: string };
type TabFilterGrid = { mode: "filter"; categoryIds?: string[]; parentId?: string; limit?: number; sortBy?: string };
type TabExplicitGrid = { mode: "explicit"; categories: CategoryMini[] };
type PromoBanner = { enabled: boolean; image?: string; title?: string; href?: string };
type TabConfig = { key: string; label: string; featured?: CategoryMini[]; grid?: TabExplicitGrid | TabFilterGrid; promoBanner?: PromoBanner };
type SuggestionsConfig = { enabled: boolean; title?: string; items?: CategoryMini[] };
type CategoriesPageConfig = { layout?: { showHeader?: boolean; showTabs?: boolean; showSidebar?: boolean; showPromoPopup?: boolean }; promoBanner?: PromoBanner; tabs: TabConfig[]; sidebar?: SidebarItem[]; suggestions?: SuggestionsConfig | CategoryMini[]; badges?: Array<{ categoryId: string; text: string }>; seo?: { title?: string; description?: string } };

export default function CategoriesDesignerPage(): JSX.Element {
  const sp = useSearchParams();
  const siteParam = (sp?.get('site') as Site) || undefined;
  const tabParam = sp?.get('tab') || '';
  const [site, setSite] = React.useState<Site>(siteParam||"mweb");
  React.useEffect(()=>{ if (siteParam && (siteParam==='mweb'||siteParam==='web')) setSite(siteParam); },[siteParam]);

  const [pickerOpen, setPickerOpen] = React.useState<boolean>(false);
  const pickerCbRef = React.useRef<(items: CategoryMini[])=>void>(()=>{});
  function openCategoriesPicker(cb:(items: CategoryMini[])=>void){ pickerCbRef.current = cb; setPickerOpen(true); }
  const [mediaOpen, setMediaOpen] = React.useState<boolean>(false);
  const mediaOnSelectRef = React.useRef<(url:string)=>void>(()=>{});
  function openMediaPicker(cb:(url:string)=>void){ mediaOnSelectRef.current = cb; setMediaOpen(true); }
  const [config, setConfig] = React.useState<CategoriesPageConfig>({
    layout: { showHeader: true, showTabs: true, showSidebar: true, showPromoPopup: false },
    promoBanner: { enabled: true, image: "", title: "", href: "/products" },
    tabs: [ { key: "all", label: "كل", grid: { mode: "explicit", categories: [] } } ],
    sidebar: [ { label: "ملابس نسائية", icon: "👗", tabKey: "women" } ],
    suggestions: { enabled: true, title: "ربما يعجبك هذا أيضاً", items: [] }, badges: [], seo: { title: "الفئات", description: "تصفح فئات jeeey" },
  });

  React.useEffect(()=>{ (async()=>{
    try{
      const r = await fetch(`${resolveApiBase()}/api/admin/categories/page?site=${site}&mode=draft`, { credentials:'include' });
      if (!r.ok) {
        if (r.status === 404) {
          await fetch(`${resolveApiBase()}/api/admin/categories/page/import-default`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site }) });
          const r2 = await fetch(`${resolveApiBase()}/api/admin/categories/page?site=${site}&mode=draft`, { credentials:'include' });
          const j2 = await r2.json(); if (j2?.config) setConfig(j2.config as CategoriesPageConfig); return;
        }
        throw new Error('failed');
      }
      const j = await r.json(); if (j?.config) setConfig(j.config as CategoriesPageConfig);
    }catch{}
  })(); }, [site]);

  // Scroll to tab if provided
  const tabRefs = React.useRef<Record<string, HTMLDivElement|null>>({});
  React.useEffect(()=>{ try{ if(!tabParam) return; const el = tabRefs.current[tabParam]; if(el) el.scrollIntoView({ behavior:'smooth', block:'center' }); }catch{} }, [tabParam, JSON.stringify(config.tabs||[])]);

  function setLayout(upd: Partial<NonNullable<CategoriesPageConfig['layout']>>){ setConfig(c=> ({ ...c, layout: { ...(c.layout||{}), ...upd } })); }
  function setTabs(items: TabConfig[]){ setConfig(c=> ({ ...c, tabs: items })); }
  function setSidebar(items: SidebarItem[]){ setConfig(c=> ({ ...c, sidebar: items })); }
  function setSuggestions(items: CategoryMini[]){
    setConfig(c=> ({ ...c, suggestions: Array.isArray(c.suggestions) ? items : { ...(c.suggestions as SuggestionsConfig||{enabled:true,title:"ربما يعجبك هذا أيضاً"}), items } }));
  }
  function setSuggestionsMeta(upd: Partial<SuggestionsConfig>){
    setConfig(c=> ({ ...c, suggestions: Array.isArray(c.suggestions) ? { enabled: (upd.enabled??true), title: upd.title||"ربما يعجبك هذا أيضاً", items: c.suggestions as any } : { ...(c.suggestions as SuggestionsConfig||{enabled:true}), ...upd } }));
  }
  function setPromo(upd: Partial<PromoBanner>){ setConfig(c=> ({ ...c, promoBanner: { ...(c.promoBanner||{enabled:false}), ...upd } })); }
  function setSeo(upd: Partial<NonNullable<CategoriesPageConfig['seo']>>){ setConfig(c=> ({ ...c, seo: { ...(c.seo||{}), ...upd } })); }
  function updateAt<T>(arr: T[], idx:number, v:T){ const next=[...arr]; next[idx]=v; return next; }
  function removeAt<T>(arr: T[], idx:number){ return arr.filter((_,i)=> i!==idx); }

  async function save(){ try{ const r = await fetch(`${resolveApiBase()}/api/admin/categories/page`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site, mode:'draft', config }) }); if (!r.ok) throw new Error('failed'); alert('تم الحفظ'); }catch{ alert('فشل الحفظ'); } }
  async function publish(){ if (!confirm('نشر صفحة الفئات للنسخة الحية؟')) return; try{ const r = await fetch(`${resolveApiBase()}/api/admin/categories/page/publish`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site }) }); if (!r.ok) throw new Error('failed'); alert('تم النشر'); }catch{ alert('فشل النشر'); } }
  async function signPreviewToken(): Promise<string|undefined> { try{ const r = await fetch(`${resolveApiBase()}/api/admin/categories/page/preview/sign`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ content: config }) }); if (!r.ok) return; const j = await r.json(); return j?.token; }catch{ return; } }
  async function openExternalPreview(){ try{ const token = await signPreviewToken(); const qs = new URLSearchParams(); if (token) qs.set('token', token); window.open(`https://m.jeeey.com/categories?${qs.toString()}`, '_blank'); }catch{} }

  return (
    <main>
      <div className="toolbar">
        <div>
          <h1 className="h1">مصمم صفحة الفئات</h1>
          <div className="muted">الموقع: {site}</div>
        </div>
        <div className="actions" style={{display:'flex', gap:8}}>
          <select value={site} onChange={e=> setSite(e.target.value as Site)} className="select" style={{minWidth:140}}>
            <option value="mweb">الجوال (m.jeeey.com)</option>
            <option value="web">سطح المكتب (jeeey.com)</option>
          </select>
          <button className="btn" onClick={save}>حفظ</button>
          <button className="btn" onClick={publish}>نشر</button>
          <button className="btn btn-outline" onClick={openExternalPreview}>معاينة خارجية</button>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="panel" style={{display:'grid', gap:16}}>
          <div className="toolbar" style={{display:'grid', gap:8}}>
            <div style={{fontWeight:600}}>التخطيط</div>
            <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
              <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}><input type="checkbox" checked={config.layout?.showHeader!==false} onChange={e=> setLayout({ showHeader: e.target.checked })} /> هيدر</label>
              <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}><input type="checkbox" checked={config.layout?.showTabs!==false} onChange={e=> setLayout({ showTabs: e.target.checked })} /> تبويبات علوية</label>
              <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}><input type="checkbox" checked={config.layout?.showSidebar!==false} onChange={e=> setLayout({ showSidebar: e.target.checked })} /> شريط جانبي</label>
              <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}><input type="checkbox" checked={!!config.layout?.showPromoPopup} onChange={e=> setLayout({ showPromoPopup: e.target.checked })} /> بوب-أب ترويجي</label>
            </div>
          </div>

          <div className="card" style={{display:'grid', gap:8}}>
            <div className="toolbar" style={{marginBottom:0}}>
              <div className="muted">البانر الترويجي</div>
              <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}><input type="checkbox" checked={!!config.promoBanner?.enabled} onChange={e=> setPromo({ enabled: e.target.checked })} /> مفعّل</label>
            </div>
            <input className="input" placeholder="عنوان" value={config.promoBanner?.title||''} onChange={e=> setPromo({ title: e.target.value })} />
            <input className="input" placeholder="رابط عند النقر" value={config.promoBanner?.href||''} onChange={e=> setPromo({ href: e.target.value })} />
            <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:8}}>
              <input className="input" placeholder="رابط صورة" value={config.promoBanner?.image||''} onChange={e=> setPromo({ image: e.target.value })} />
              <button className="btn btn-outline" onClick={()=> openMediaPicker((u)=> setPromo({ image: u }))}>اختر صورة</button>
            </div>
          </div>

          <div className="card" style={{display:'grid', gap:12}}>
            <div className="toolbar" style={{marginBottom:0}}>
              <div className="muted">التبويبات</div>
              <div className="actions"><button className="btn btn-outline btn-sm" onClick={()=> setTabs([...(config.tabs||[]), { key:'new', label:'جديد', grid:{ mode:'explicit', categories: [] }, featured: [] }])}>+ تبويب</button></div>
            </div>
            <div style={{display:'grid', gap:12}}>
              {(config.tabs||[]).map((t, idx)=> (
                <div key={`tab-${t.key||idx}`} ref={el=> { try{ tabRefs.current[String(t.key||'')] = el; }catch{} }} className="card" style={{display:'grid', gap:8}}>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr auto auto', gap:8}}>
                    <input className="input" placeholder="المفتاح (women)" value={t.key} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, key: e.target.value }))} />
                    <input className="input" placeholder="التسمية (نساء)" value={t.label} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, label: e.target.value }))} />
                    <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}><button className="btn btn-outline btn-sm" onClick={()=> setTabs(removeAt(config.tabs, idx))}>حذف</button></div>
                    <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}>
                      <button className="btn btn-outline btn-sm" onClick={()=> idx>0 && setTabs((()=>{ const next=[...config.tabs]; const tmp=next[idx-1]; next[idx-1]=next[idx]; next[idx]=tmp; return next; })())}>▲</button>
                      <button className="btn btn-outline btn-sm" onClick={()=> idx<((config.tabs||[]).length-1) && setTabs((()=>{ const next=[...config.tabs]; const tmp=next[idx+1]; next[idx+1]=next[idx]; next[idx]=tmp; return next; })())}>▼</button>
                    </div>
                  </div>
                  <div className="toolbar" style={{marginBottom:0}}>
                    <div className="muted">فئات مميّزة (شرائح)</div>
                    <div className="actions"><button className="btn btn-outline btn-sm" onClick={()=> openCategoriesPicker((items)=> setTabs(updateAt(config.tabs, idx, { ...t, featured: items })))}>اختيار</button></div>
                  </div>
                  <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                    {(t.featured||[]).map((c)=> (<div key={c.id} className="badge" style={{gap:6}}>{c.image && <img src={c.image} alt="thumb" style={{ width:18, height:18, objectFit:'cover', borderRadius:4 }} />}<span>{c.name}</span></div>))}
                    {!(t.featured||[]).length && <div className="muted">— لا عناصر</div>}
                  </div>

                  <div className="toolbar" style={{marginBottom:0}}>
                    <div className="muted">الشريط الجانبي لهذا التبويب</div>
                    <div className="actions"><button className="btn btn-outline btn-sm" onClick={()=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: [ ...((t as any).sidebarItems||[]), { label:'عنصر', href:'' } ] }))}>+ عنصر</button></div>
                  </div>
                  <div style={{display:'grid', gap:8}}>
                    {(((t as any).sidebarItems)||[]).map((s:any, si:number)=> (
                      <div key={`si-${si}`} className="card" style={{display:'grid', gap:8}}>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr auto auto', gap:8}}>
                          <input className="input" placeholder="التسمية" value={s.label||''} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; arr[si]={ ...arr[si], label:(e.target as HTMLInputElement).value }; return arr; })() }))} />
                          <input className="input" placeholder="href (اختياري)" value={s.href||''} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; arr[si]={ ...arr[si], href:(e.target as HTMLInputElement).value }; return arr; })() }))} />
                          <button className="btn btn-outline btn-sm" onClick={()=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; if(si>0){ const tmp=arr[si-1]; arr[si-1]=arr[si]; arr[si]=tmp; } return arr; })() }))}>▲</button>
                          <button className="btn btn-outline btn-sm" onClick={()=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; if(si<(((t as any).sidebarItems||[]).length-1)){ const tmp=arr[si+1]; arr[si+1]=arr[si]; arr[si]=tmp; } return arr; })() }))}>▼</button>
                        </div>
                    <div className="toolbar" style={{marginBottom:0}}>
                      <div className="muted">بانر هذا العنصر</div>
                      <div className="actions" />
                    </div>
                        <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                          <input type="checkbox" checked={!!s.promoBanner?.enabled} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; arr[si]={ ...arr[si], promoBanner: { ...(arr[si]?.promoBanner||{}), enabled: e.target.checked } }; return arr; })() }))} /> مفعّل
                        </label>
                        <input className="input" placeholder="عنوان" value={s.promoBanner?.title||''} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; arr[si]={ ...arr[si], promoBanner: { ...(arr[si]?.promoBanner||{enabled:true}), title: (e.target as HTMLInputElement).value } }; return arr; })() }))} />
                        <input className="input" placeholder="رابط عند النقر" value={s.promoBanner?.href||''} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; arr[si]={ ...arr[si], promoBanner: { ...(arr[si]?.promoBanner||{enabled:true}), href: (e.target as HTMLInputElement).value } }; return arr; })() }))} />
                        <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:8}}>
                          <input className="input" placeholder="رابط صورة" value={s.promoBanner?.image||''} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; arr[si]={ ...arr[si], promoBanner: { ...(arr[si]?.promoBanner||{enabled:true}), image: (e.target as HTMLInputElement).value } }; return arr; })() }))} />
                          <button className="btn btn-outline btn-sm" onClick={()=> openMediaPicker((u)=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; arr[si]={ ...arr[si], promoBanner: { ...(arr[si]?.promoBanner||{enabled:true}), image: u } }; return arr; })() })))}>اختر صورة</button>
                        </div>

                        <div className="toolbar" style={{marginBottom:0}}>
                          <div className="muted">شبكة هذا العنصر</div>
                          <div className="actions" style={{display:'flex', gap:8}}>
                            <button className="btn btn-outline btn-sm" onClick={()=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; arr[si]={ ...arr[si], grid: { mode:'explicit', categories: [] } }; return arr; })() }))}>قائمة صريحة</button>
                            <button className="btn btn-outline btn-sm" onClick={()=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; arr[si]={ ...arr[si], grid: { mode:'filter', limit:36, sortBy:'name_asc' } as any } ; return arr; })() }))}>فلترة</button>
                          </div>
                        </div>
                        {s.grid?.mode==='explicit' ? (
                          <div style={{display:'grid', gap:8}}>
                            <div className="actions" style={{display:'flex', gap:8}}>
                              <button className="btn btn-outline btn-sm" onClick={()=> openCategoriesPicker((items)=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; arr[si]={ ...arr[si], grid: { mode:'explicit', categories: items } }; return arr; })() })))}>اختيار فئات</button>
                              {(s.grid as any)?.categories?.length>0 && <button className="btn btn-outline btn-sm" onClick={()=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; arr[si]={ ...arr[si], grid: { mode:'explicit', categories: [] } }; return arr; })() }))}>مسح</button>}
                            </div>
                            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                              {((s.grid as any)?.categories||[]).map((c:CategoryMini)=> (<div key={c.id} className="badge" style={{gap:6}}>{c.image && <img src={c.image} alt="thumb" style={{ width:18, height:18, objectFit:'cover', borderRadius:4 }} />}<span>{c.name}</span></div>))}
                              {!((s.grid as any)?.categories||[]).length && <div className="muted">— لا عناصر</div>}
                            </div>
                          </div>
                        ) : (
                          <div style={{display:'grid', gap:8, gridTemplateColumns:'1fr 1fr'}}>
                            <label className="form-label">الحد</label>
                            <input type="number" className="input" value={Number((s.grid as any)?.limit||36)} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; arr[si]={ ...arr[si], grid: { ...(arr[si]?.grid||{}), mode:'filter', limit: Math.max(1, Number((e.target as HTMLInputElement).value||36)) } as any } ; return arr; })() }))} />
                            <label className="form-label">الترتيب</label>
                            <select className="select" value={(s.grid as any)?.sortBy||'name_asc'} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; arr[si]={ ...arr[si], grid: { ...(arr[si]?.grid||{}), mode:'filter', sortBy: (e.target as HTMLSelectElement).value } as any } ; return arr; })() }))}>
                              <option value="name_asc">الاسم تصاعدي</option>
                              <option value="name_desc">الاسم تنازلي</option>
                              <option value="created_desc">الأحدث</option>
                            </select>
                            <div style={{gridColumn:'1 / -1', display:'grid', gap:8}}>
                              <div className="toolbar" style={{marginBottom:0}}>
                                <div className="muted">العناصر المختارة (IDs)</div>
                                <div className="actions" style={{display:'flex', gap:8}}>
                                  <button className="btn btn-outline btn-sm" onClick={()=> openCategoriesPicker((items)=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; arr[si]={ ...arr[si], grid: { ...(arr[si]?.grid||{}), mode:'filter', categoryIds: items.map((x:any)=> x.id) } as any } ; return arr; })() })))}>اختيار فئات</button>
                                  {Array.isArray((s.grid as any)?.categoryIds) && (s.grid as any).categoryIds.length>0 && (
                                    <button className="btn btn-outline btn-sm" onClick={()=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; arr[si]={ ...arr[si], grid: { ...(arr[si]?.grid||{}), mode:'filter', categoryIds: [] } as any } ; return arr; })() }))}>مسح</button>
                                  )}
                                </div>
                              </div>
                              <code dir="ltr" style={{fontSize:12, color:'#94a3b8'}}>{JSON.stringify(((s.grid as any)?.categoryIds||[]))}</code>
                            </div>
                          </div>
                        )}
                        <div style={{display:'flex', justifyContent:'flex-end'}}>
                          <button className="btn btn-outline btn-sm" onClick={()=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: ((t as any).sidebarItems||[]).filter((_:any, j:number)=> j!==si) }))}>حذف العنصر</button>
                        </div>

                        <div className="toolbar" style={{marginBottom:0}}>
                          <div className="muted">اقتراحات أسفل الصفحة (للعنصر)</div>
                          <div className="actions" style={{display:'flex', gap:8}}>
                            <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                              <input type="checkbox" checked={!!s.suggestions?.enabled} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; const cur=arr[si]?.suggestions||{ enabled:false, title:'ربما يعجبك هذا أيضاً', items: [] }; arr[si]={ ...arr[si], suggestions: { ...cur, enabled: e.target.checked } }; return arr; })() }))} /> مفعّل
                            </label>
                            <button className="btn btn-outline btn-sm" onClick={()=> openCategoriesPicker((items)=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; const cur=arr[si]?.suggestions||{ enabled:true, title:'ربما يعجبك هذا أيضاً', items: [] }; arr[si]={ ...arr[si], suggestions: { ...cur, items } }; return arr; })() })))}>اختيار فئات</button>
                            <button className="btn btn-outline btn-sm" onClick={()=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; const cur=arr[si]?.suggestions||{ enabled:true, title:'ربما يعجبك هذا أيضاً', items: [] }; arr[si]={ ...arr[si], suggestions: { ...cur, items: [] } }; return arr; })() }))}>مسح</button>
                          </div>
                        </div>
                        <input className="input" placeholder="عنوان الاقتراحات" value={(s.suggestions?.title||'') as string} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, sidebarItems: (():any[]=>{ const arr=[...((t as any).sidebarItems||[])]; const cur=arr[si]?.suggestions||{ enabled:true, title:'', items: [] }; arr[si]={ ...arr[si], suggestions: { ...cur, title: (e.target as HTMLInputElement).value } }; return arr; })() }))} />
                      </div>
                    ))}
                    {!((t as any).sidebarItems||[]).length && <div className="muted">— لا عناصر</div>}
                  </div>
                  <div className="toolbar" style={{marginBottom:0}}>
                    <div className="muted">بانر التبويب</div>
                    <div className="actions" />
                  </div>
                  <div style={{display:'grid', gap:8}}>
                    <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                      <input type="checkbox" checked={!!t.promoBanner?.enabled} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, promoBanner: { ...(t.promoBanner||{}), enabled: e.target.checked } }))} /> مفعّل
                    </label>
                    <input className="input" placeholder="عنوان" value={t.promoBanner?.title||''} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, promoBanner: { ...(t.promoBanner||{enabled:true}), title: e.target.value } }))} />
                    <input className="input" placeholder="رابط عند النقر" value={t.promoBanner?.href||''} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, promoBanner: { ...(t.promoBanner||{enabled:true}), href: e.target.value } }))} />
                    <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:8}}>
                      <input className="input" placeholder="رابط صورة" value={t.promoBanner?.image||''} onChange={e=> setTabs(updateAt(config.tabs, idx, { ...t, promoBanner: { ...(t.promoBanner||{enabled:true}), image: e.target.value } }))} />
                      <button className="btn btn-outline btn-sm" onClick={()=> openMediaPicker((u)=> setTabs(updateAt(config.tabs, idx, { ...t, promoBanner: { ...(t.promoBanner||{enabled:true}), image: u } })))}>اختر صورة</button>
                    </div>
                  </div>
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
                      <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
                        {((t.grid as any)?.categories||[]).map((c:CategoryMini, ci:number)=> (
                          <div key={c.id} className="badge" style={{gap:6, display:'inline-flex', alignItems:'center'}}>
                            {c.image && <img src={c.image} alt="thumb" style={{ width:18, height:18, objectFit:'cover', borderRadius:4 }} />}
                            <span>{c.name}</span>
                            <div style={{display:'inline-flex', gap:4, marginInlineStart:6}}>
                              <button className="btn btn-outline btn-sm" onClick={()=> setTabs(updateAt(config.tabs, idx, { ...t, grid: { mode:'explicit', categories: (():CategoryMini[]=>{ const arr=[...((t.grid as any).categories||[])]; if(ci>0){ const tmp=arr[ci-1]; arr[ci-1]=arr[ci]; arr[ci]=tmp; } return arr; })() } }))}>▲</button>
                              <button className="btn btn-outline btn-sm" onClick={()=> setTabs(updateAt(config.tabs, idx, { ...t, grid: { mode:'explicit', categories: (():CategoryMini[]=>{ const arr=[...((t.grid as any).categories||[])]; if(ci<(((t.grid as any).categories||[]).length-1)){ const tmp=arr[ci+1]; arr[ci+1]=arr[ci]; arr[ci]=tmp; } return arr; })() } }))}>▼</button>
                            </div>
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
                      <div style={{gridColumn:'1 / -1', display:'grid', gap:8}}>
                        <div className="toolbar" style={{marginBottom:0}}>
                          <div className="muted">العناصر المختارة (IDs)</div>
                          <div className="actions" style={{display:'flex', gap:8}}>
                            <button className="btn btn-outline btn-sm" onClick={()=> openCategoriesPicker((items)=> setTabs(updateAt(config.tabs, idx, { ...t, grid: { ...(t.grid as any), mode:'filter', categoryIds: items.map(x=> x.id) } as any })))}>اختيار فئات</button>
                            {Array.isArray((t.grid as any)?.categoryIds) && (t.grid as any).categoryIds.length>0 && (
                              <button className="btn btn-outline btn-sm" onClick={()=> setTabs(updateAt(config.tabs, idx, { ...t, grid: { ...(t.grid as any), mode:'filter', categoryIds: [] } as any }))}>مسح</button>
                            )}
                          </div>
                        </div>
                        <code dir="ltr" style={{fontSize:12, color:'#94a3b8'}}>{JSON.stringify(((t.grid as any)?.categoryIds||[]))}</code>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{display:'grid', gap:8}}>
            <div className="toolbar" style={{marginBottom:0}}><div className="muted">الشريط الجانبي</div><div className="actions"><button className="btn btn-outline btn-sm" onClick={()=> setSidebar([...(config.sidebar||[]), { label:'عنصر', tabKey:'', href:'' }])}>+ عنصر</button></div></div>
            <div style={{display:'grid', gap:8}}>
              {(config.sidebar||[]).map((s, idx)=> (
                <div key={`gs-${idx}`} style={{display:'grid', gridTemplateColumns:'1fr 160px 1fr auto', gap:8}}>
                  <input className="input" placeholder="التسمية" value={s.label} onChange={e=> setSidebar(updateAt(config.sidebar||[], idx, { ...s, label: e.target.value }))} />
                  <input className="input" placeholder="tabKey (اختياري)" value={s.tabKey||''} onChange={e=> setSidebar(updateAt(config.sidebar||[], idx, { ...s, tabKey: e.target.value }))} />
                  <input className="input" placeholder="href (اختياري)" value={(s as any).href||''} onChange={e=> setSidebar(updateAt(config.sidebar||[], idx, { ...s, href: (e.target as HTMLInputElement).value }))} />
                  <button className="btn btn-outline" onClick={()=> setSidebar(removeAt(config.sidebar||[], idx))}>حذف</button>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{display:'grid', gap:8}}>
            <div className="toolbar" style={{marginBottom:0}}>
              <div className="muted">اقتراحات أسفل الصفحة</div>
              <div className="actions" style={{display:'flex', gap:8}}>
                <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                  <input type="checkbox" checked={Array.isArray(config.suggestions)? (config.suggestions.length>0) : !!(config.suggestions as SuggestionsConfig)?.enabled} onChange={e=> setSuggestionsMeta({ enabled: e.target.checked })} /> مفعّل
                </label>
                <button className="btn btn-outline btn-sm" onClick={()=> openCategoriesPicker((items)=> setSuggestions(items))}>اختيار فئات</button>
                <button className="btn btn-outline btn-sm" onClick={()=> setSuggestions([])}>مسح</button>
              </div>
            </div>
            <input className="input" placeholder="عنوان القسم" value={Array.isArray(config.suggestions)? 'ربما يعجبك هذا أيضاً' : ((config.suggestions as SuggestionsConfig)?.title||'')} onChange={e=> setSuggestionsMeta({ title: (e.target as HTMLInputElement).value })} />
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {(Array.isArray(config.suggestions)? (config.suggestions as CategoryMini[]) : (((config.suggestions as SuggestionsConfig)?.items)||[])).map((c)=> (
                <div key={c.id} className="badge" style={{gap:6}}>{c.image && <img src={c.image} alt="thumb" style={{ width:18, height:18, objectFit:'cover', borderRadius:4 }} />}<span>{c.name}</span></div>
              ))}
              {!(Array.isArray(config.suggestions)? (config.suggestions as CategoryMini[]).length : ((((config.suggestions as SuggestionsConfig)?.items)||[]).length)) && <div className="muted">— لا عناصر</div>}
            </div>
          </div>

          <div className="card" style={{display:'grid', gap:8}}>
            <div className="muted">SEO</div>
            <input className="input" placeholder="العنوان" value={config.seo?.title||''} onChange={e=> setSeo({ title: e.target.value })} />
            <textarea className="input" rows={3} placeholder="الوصف" value={config.seo?.description||''} onChange={e=> setSeo({ description: e.target.value })} />
          </div>
        </div>

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

      <CategoriesPickerModal open={pickerOpen} onClose={()=> setPickerOpen(false)} onSave={(items)=>{ try{ pickerCbRef.current && pickerCbRef.current(items); } finally{ setPickerOpen(false); } }} />
      <MediaPickerModal open={mediaOpen} onClose={()=> setMediaOpen(false)} onSelect={(u)=>{ try{ mediaOnSelectRef.current && mediaOnSelectRef.current(u); } finally { setMediaOpen(false); } }} />
    </main>
  );
}

function CategoriesLivePreview({ content }:{ content: CategoriesPageConfig }): JSX.Element {
  const frameRef = React.useRef<HTMLIFrameElement|null>(null);
  const [src, setSrc] = React.useState<string>("");
  React.useEffect(()=>{ (async()=>{ try{ const r = await fetch(`${resolveApiBase()}/api/admin/categories/page/preview/sign`, { method:'POST', headers:{ 'Content-Type':'application/json' }, credentials:'include', body: JSON.stringify({ content }) }); const j = await r.json(); const token = j?.token||''; const qs = new URLSearchParams(); if (token) qs.set('token', token); setSrc(`https://m.jeeey.com/categories?${qs.toString()}`); }catch{ setSrc(''); } })(); }, [JSON.stringify(content)]);
  return (<iframe ref={frameRef} title="Live Categories Preview" src={src} style={{ width:'100%', height: 860, border:0 }} onLoad={()=>{ try{ const win = frameRef.current?.contentWindow; if (!win) return; win.postMessage({ __categories_preview: true, content }, '*'); }catch{} }} />);
}

function CategoriesPickerModal({ open, onClose, onSave }:{ open:boolean; onClose:()=>void; onSave:(items: CategoryMini[])=>void }): JSX.Element|null {
  const [rows, setRows] = React.useState<CategoryMini[]>([]);
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<Record<string, CategoryMini>>({});
  React.useEffect(()=>{ if(!open) return; (async()=>{ try{ const r = await fetch(`${resolveApiBase()}/api/admin/categories?search=${encodeURIComponent(search)}`, { credentials:'include' }); const j = await r.json(); const list = Array.isArray(j.categories)? j.categories : []; setRows(list.map((c:any)=> ({ id:c.id, name:c.name, image: c.image||'' }))); }catch{} })(); },[open, search]);
  if (!open) return null; const items = Object.values(selected);
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000 }} onClick={onClose}>
      <div style={{ width:'min(900px, 94vw)', maxHeight:'86vh', overflow:'auto', background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }} onClick={(e)=> e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}><h3 style={{ margin:0 }}>اختيار الفئات</h3><button onClick={onClose} className="btn btn-outline btn-sm">إغلاق</button></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginBottom:12 }}>
          <input value={search} onChange={(e)=> setSearch((e.target as HTMLInputElement).value)} placeholder="بحث" className="input" />
          <button className="btn btn-outline btn-sm" onClick={()=> setSelected({})}>مسح</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:12 }}>
          {rows.map((c)=>{ const isSel = !!selected[c.id]; return (
            <button key={c.id} onClick={()=> setSelected(s=> ({ ...s, [c.id]: isSel? undefined as any : c }))} style={{ textAlign:'start', background: isSel? '#101828' : '#0f1320', border:'1px solid #1c2333', borderRadius:10, overflow:'hidden' }}>
              {c.image ? <img src={c.image} alt={c.name||''} style={{ width:'100%', height:100, objectFit:'cover' }} /> : <div style={{ height:100, background:'#101828' }} />}
              <div style={{ padding:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span className="line-2" style={{ fontSize:14 }}>{c.name}</span>
                <span className="badge" style={{ height:24 }}>{isSel? '✓' : '+'}</span>
              </div>
            </button>
          ); })}
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

function MediaPickerModal({ open, onClose, onSelect }:{ open:boolean; onClose:()=>void; onSelect:(url:string)=>void }): JSX.Element|null {
  const [rows, setRows] = React.useState<Array<{ id:string; url:string; alt?:string }>>([]);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const limit = 24;
  const load = React.useCallback(async()=>{ if (!open) return; try{ const r = await fetch(`${resolveApiBase()}/api/admin/media/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { credentials:'include' }); const j = await r.json(); setRows((j.assets||[]) as any); setTotal(Number(j.total||0)); }catch{} },[open, page, search]);
  React.useEffect(()=>{ load(); },[load]);
  async function toBase64(file: File): Promise<string> { return await new Promise((resolve, reject)=>{ const reader = new FileReader(); reader.onload=()=> resolve(String(reader.result||'')); reader.onerror=reject; reader.readAsDataURL(file); }); }
  async function uploadFiles(list: File[]){ try{ setBusy(true); for (const f of list){ try{ const b64 = await toBase64(f); await fetch(`${resolveApiBase()}/api/admin/media`, { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ base64: b64, type: f.type||'image' }) }); }catch{} } await load(); } finally { setBusy(false); } }
  if (!open) return null; const pages = Math.max(1, Math.ceil(total/limit));
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000 }} onClick={onClose}>
      <div style={{ width:'min(1000px, 94vw)', maxHeight:'86vh', overflow:'auto', background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }} onClick={(e)=> e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}><h3 style={{ margin:0 }}>الوسائط</h3><button onClick={onClose} className="btn btn-outline btn-sm">إغلاق</button></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginBottom:12 }}>
          <input value={search} onChange={(e)=> setSearch((e.target as HTMLInputElement).value)} placeholder="بحث" className="input" />
          <label className="btn btn-outline btn-sm" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>اختر ملفات<input type="file" accept="image/*" multiple style={{ display:'none' }} onChange={(e)=>{ const list = Array.from((e.target as HTMLInputElement).files||[]); if (list.length) uploadFiles(list); }} /></label>
        </div>
        <div onDragOver={(e)=> e.preventDefault()} onDrop={(e)=>{ e.preventDefault(); const list = Array.from(e.dataTransfer?.files||[]); if (list.length) uploadFiles(list); }} style={{ border:'1px dashed #334155', borderRadius:10, padding:12, textAlign:'center', color:'#94a3b8', marginBottom:12 }}>{busy? 'جارٍ الرفع…' : 'اسحب وأفلت الصور هنا أو اختر من جهازك'}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(120px, 1fr))', gap:10 }}>
          {rows.map((a)=> (<button key={a.id} onClick={()=> onSelect(a.url)} style={{ background:'#0f1320', border:'1px solid #1c2333', borderRadius:8, padding:6 }}><img src={a.url} alt={a.alt||''} style={{ width:'100%', borderRadius:6 }} /></button>))}
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
