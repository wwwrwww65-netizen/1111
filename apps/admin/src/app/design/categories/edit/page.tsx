"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { resolveApiBase } from "../../../lib/apiBase";

type Site = "web" | "mweb";
type CategoryMini = { id: string; name: string; image?: string };
type TabFilterGrid = { mode: "filter"; categoryIds?: string[]; parentId?: string; limit?: number; sortBy?: string };
type TabExplicitGrid = { mode: "explicit"; categories: CategoryMini[] };
type PromoBanner = { enabled: boolean; image?: string; title?: string; href?: string };
type SuggestionsConfig = { enabled: boolean; title?: string; items?: CategoryMini[] };
type SidebarItem = {
  label: string;
  icon?: string;
  tabKey?: string;
  tab?: string;
  href?: string;
  promoBanner?: PromoBanner;
  featured?: CategoryMini[];
  grid?: TabExplicitGrid | TabFilterGrid;
  suggestions?: SuggestionsConfig;
};
type TabConfig = {
  key: string;
  label: string;
  featured?: CategoryMini[];
  grid?: TabExplicitGrid | TabFilterGrid;
  promoBanner?: PromoBanner;
  sidebarItems?: SidebarItem[];
  suggestions?: SuggestionsConfig;
};
type CategoriesPageConfig = {
  layout?: { showHeader?: boolean; showTabs?: boolean; showSidebar?: boolean; showPromoPopup?: boolean };
  promoBanner?: PromoBanner;
  tabs: TabConfig[];
  sidebar?: SidebarItem[];
  suggestions?: SuggestionsConfig | CategoryMini[];
  badges?: Array<{ categoryId: string; text: string }>;
  seo?: { title?: string; description?: string };
};

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
    tabs: [ { key: "all", label: "كل", grid: { mode: "explicit", categories: [] }, sidebarItems: [] } ],
    sidebar: [ { label: "ملابس نسائية", icon: "👗", tabKey: "women" } ],
    suggestions: { enabled: true, title: "ربما يعجبك هذا أيضاً", items: [] }, badges: [], seo: { title: "الفئات", description: "تصفح فئات jeeey" },
  });
  const [activeTabIdx, setActiveTabIdx] = React.useState<number>(0);
  const [activeSidebarIdx, setActiveSidebarIdx] = React.useState<number>(-1);

  const tabs = React.useMemo(() => Array.isArray(config.tabs) ? config.tabs : [], [config.tabs]);
  const currentTab = React.useMemo(() => (activeTabIdx >= 0 && activeTabIdx < tabs.length ? tabs[activeTabIdx] : undefined), [activeTabIdx, tabs]);
  const currentSidebarItems = React.useMemo(() => Array.isArray(currentTab?.sidebarItems) ? currentTab?.sidebarItems || [] : [], [currentTab]);
  const currentSidebarItem = React.useMemo(() => (activeSidebarIdx >= 0 && activeSidebarIdx < currentSidebarItems.length ? currentSidebarItems[activeSidebarIdx] : undefined), [activeSidebarIdx, currentSidebarItems]);

  React.useEffect(() => {
    if (!tabs.length) {
      setActiveTabIdx(-1);
      setActiveSidebarIdx(-1);
      return;
    }
    setActiveTabIdx((idx) => {
      if (idx == null || idx < 0) return 0;
      if (idx >= tabs.length) return tabs.length - 1;
      return idx;
    });
  }, [tabs]);

  React.useEffect(() => {
    const items = currentTab?.sidebarItems || [];
    if (!items.length) {
      setActiveSidebarIdx(-1);
      return;
    }
    setActiveSidebarIdx((idx) => {
      if (idx == null || idx < 0) return 0;
      if (idx >= items.length) return items.length - 1;
      return idx;
    });
  }, [currentTab?.sidebarItems]);

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
  function setSuggestions(items: CategoryMini[]){
    setConfig(c=> ({ ...c, suggestions: Array.isArray(c.suggestions) ? items : { ...(c.suggestions as SuggestionsConfig||{enabled:true,title:"ربما يعجبك هذا أيضاً"}), items } }));
  }
  function setSuggestionsMeta(upd: Partial<SuggestionsConfig>){
    setConfig(c=> ({ ...c, suggestions: Array.isArray(c.suggestions) ? { enabled: (upd.enabled??true), title: upd.title||"ربما يعجبك هذا أيضاً", items: c.suggestions as any } : { ...(c.suggestions as SuggestionsConfig||{enabled:true}), ...upd } }));
  }
  function setPromo(upd: Partial<PromoBanner>){ setConfig(c=> ({ ...c, promoBanner: { ...(c.promoBanner||{enabled:false}), ...upd } })); }
  function setSeo(upd: Partial<NonNullable<CategoriesPageConfig['seo']>>){ setConfig(c=> ({ ...c, seo: { ...(c.seo||{}), ...upd } })); }
  function removeAt<T>(arr: T[], idx:number){ return arr.filter((_,i)=> i!==idx); }

  const suggestionsDefaultTitle = "ربما يعجبك هذا أيضاً";

  function createEmptySidebarItem(): SidebarItem {
    return {
      label: "عنصر جديد",
      promoBanner: { enabled: false, image: "", title: "", href: "" },
      featured: [],
      grid: { mode: "explicit", categories: [] },
      suggestions: { enabled: true, title: suggestionsDefaultTitle, items: [] },
    };
  }

  function createEmptyTab(): TabConfig {
    const key = `tab-${Date.now().toString(36)}`;
    return {
      key,
      label: "تبويب جديد",
      grid: { mode: "explicit", categories: [] },
      promoBanner: { enabled: false, image: "", title: "", href: "" },
      featured: [],
      sidebarItems: [createEmptySidebarItem()],
    };
  }

  function mutateTabs(updater: (items: TabConfig[]) => TabConfig[]) {
    setConfig((c) => {
      const base = Array.isArray(c.tabs) ? c.tabs : [];
      const next = updater(base);
      return { ...c, tabs: next };
    });
  }

  function mutateTab(index: number, updater: (tab: TabConfig) => TabConfig) {
    mutateTabs((items) => {
      if (!items[index]) return items;
      const next = [...items];
      next[index] = updater(next[index]);
      return next;
    });
  }

  function mutateSidebarItem(tabIndex: number, itemIndex: number, updater: (item: SidebarItem) => SidebarItem) {
    mutateTab(tabIndex, (tab) => {
      const list = Array.isArray(tab.sidebarItems) ? tab.sidebarItems : [];
      if (!list[itemIndex]) return { ...tab, sidebarItems: list };
      const nextList = [...list];
      nextList[itemIndex] = updater(nextList[itemIndex]);
      return { ...tab, sidebarItems: nextList };
    });
  }

  function handleAddTab() {
    const nextIndex = tabs.length;
    mutateTabs((items) => [...items, createEmptyTab()]);
    setActiveTabIdx(nextIndex);
    setActiveSidebarIdx(0);
  }

  function handleRemoveTab(idx: number) {
    mutateTabs((items) => removeAt(items, idx));
    setActiveTabIdx((prev) => {
      if (prev > idx) return prev - 1;
      if (prev === idx) return Math.max(0, prev - 1);
      return prev;
    });
  }

  function handleMoveTab(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= tabs.length) return;
    mutateTabs((items) => {
      const next = [...items];
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      return next;
    });
    setActiveTabIdx((prev) => (prev === idx ? target : prev === target ? idx : prev));
  }

  function handleAddSidebarItem() {
    if (activeTabIdx < 0) return;
    const newIndex = currentSidebarItems.length;
    mutateTab(activeTabIdx, (tab) => {
      const list = Array.isArray(tab.sidebarItems) ? tab.sidebarItems : [];
      return { ...tab, sidebarItems: [...list, createEmptySidebarItem()] };
    });
    setActiveSidebarIdx(newIndex);
  }

  function handleRemoveSidebarItem(idx: number) {
    if (activeTabIdx < 0) return;
    mutateTab(activeTabIdx, (tab) => {
      const list = Array.isArray(tab.sidebarItems) ? tab.sidebarItems : [];
      return { ...tab, sidebarItems: removeAt(list, idx) };
    });
    setActiveSidebarIdx((prev) => {
      if (prev > idx) return prev - 1;
      if (prev === idx) return Math.max(-1, prev - 1);
      return prev;
    });
  }

  function handleMoveSidebarItem(idx: number, dir: -1 | 1) {
    if (activeTabIdx < 0) return;
    const list = currentSidebarItems;
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    mutateTab(activeTabIdx, (tab) => {
      const arr = Array.isArray(tab.sidebarItems) ? [...tab.sidebarItems] : [];
      const tmp = arr[idx];
      arr[idx] = arr[target];
      arr[target] = tmp;
      return { ...tab, sidebarItems: arr };
    });
    setActiveSidebarIdx((prev) => (prev === idx ? target : prev === target ? idx : prev));
  }

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
          <div className="card" style={{display:'grid', gap:12}}>
            <div className="toolbar" style={{marginBottom:0}}>
              <div className="muted">الإعدادات العامة للصفحة</div>
            </div>
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
            <div style={{height:1, background:'rgba(148,163,184,0.12)'}} />
            <div className="toolbar" style={{marginBottom:0}}>
              <div className="muted">البانر العام</div>
              <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                <input type="checkbox" checked={!!config.promoBanner?.enabled} onChange={e=> setPromo({ enabled: e.target.checked })} /> مفعّل
              </label>
            </div>
            <input className="input" placeholder="عنوان" value={config.promoBanner?.title||''} onChange={e=> setPromo({ title: e.target.value })} disabled={!config.promoBanner?.enabled} />
            <input className="input" placeholder="رابط عند النقر" value={config.promoBanner?.href||''} onChange={e=> setPromo({ href: e.target.value })} disabled={!config.promoBanner?.enabled} />
            <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:8}}>
              <input className="input" placeholder="رابط صورة" value={config.promoBanner?.image||''} onChange={e=> setPromo({ image: e.target.value })} disabled={!config.promoBanner?.enabled} />
              <button className="btn btn-outline" disabled={!config.promoBanner?.enabled} onClick={()=> config.promoBanner?.enabled && openMediaPicker((u)=> setPromo({ image: u }))}>اختر صورة</button>
            </div>
          </div>
          <div className="card" style={{display:'grid', gap:16}}>
            <div style={{display:'grid', gridTemplateColumns:'minmax(260px, 300px) 1fr', gap:16}}>
              <div style={{display:'grid', gap:12}}>
                <div className="toolbar" style={{marginBottom:0}}>
                  <div className="muted">التبويبات</div>
                  <div className="actions">
                    <button className="btn btn-outline btn-sm" onClick={handleAddTab}>+ تبويب</button>
                  </div>
                </div>
                <div style={{display:'grid', gap:8}}>
                  {tabs.map((tab, idx)=> {
                    const active = activeTabIdx === idx;
                    return (
                      <div
                        key={`tab-${tab.key||idx}`}
                        ref={el=> { try{ tabRefs.current[String(tab.key||idx)] = el; }catch{} }}
                        onClick={()=> { setActiveTabIdx(idx); setActiveSidebarIdx(0); }}
                        style={{
                          border:`1px solid ${active ? '#2563eb' : '#1c2333'}`,
                          background: active ? '#0f172a' : '#0b0e14',
                          borderRadius:10,
                          padding:'10px 12px',
                          display:'flex',
                          alignItems:'center',
                          gap:8,
                          cursor:'pointer'
                        }}
                      >
                        <div style={{flex:1, textAlign:'start', display:'grid', gap:4}}>
                          <div style={{fontWeight:600}}>{tab.label?.trim() || '— بدون عنوان'}</div>
                          <div className="muted" style={{fontSize:12}}>{tab.key || '— لا يوجد مفتاح'}</div>
                        </div>
                        <div style={{display:'flex', gap:6}}>
                          <button type="button" className="btn btn-outline btn-sm" onClick={e=> { e.stopPropagation(); handleMoveTab(idx, -1); }} aria-label="تحريك لأعلى">▲</button>
                          <button type="button" className="btn btn-outline btn-sm" onClick={e=> { e.stopPropagation(); handleMoveTab(idx, 1); }} aria-label="تحريك لأسفل">▼</button>
                          <button type="button" className="btn btn-outline btn-sm" onClick={e=> { e.stopPropagation(); if (window.confirm('حذف التبويب؟')) handleRemoveTab(idx); }} aria-label="حذف التبويب">✕</button>
                        </div>
                      </div>
                    );
                  })}
                  {!tabs.length && <div className="muted">أضف تبويباً جديداً لبدء تخصيص الصفحة.</div>}
                </div>
              </div>
              <div style={{display:'grid', gap:16}}>
                {currentTab ? (
                  <>
                    <div style={{display:'grid', gap:12, border:'1px solid #1c2333', borderRadius:10, padding:16, background:'#0b0e14'}}>
                      <div className="toolbar" style={{marginBottom:0}}>
                        <div className="muted">إعدادات التبويب</div>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                        <input className="input" placeholder="المفتاح (مثال: women)" value={currentTab.key} onChange={e=> mutateTab(activeTabIdx, (tab) => ({ ...tab, key: e.target.value }))} />
                        <input className="input" placeholder="التسمية (مثال: نساء)" value={currentTab.label} onChange={e=> mutateTab(activeTabIdx, (tab) => ({ ...tab, label: e.target.value }))} />
                      </div>
                      <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                        <input type="checkbox" checked={!!currentTab.promoBanner?.enabled} onChange={e=> mutateTab(activeTabIdx, (tab) => ({ ...tab, promoBanner: { ...(tab.promoBanner||{ enabled:false, image:'', title:'', href:'' }), enabled: e.target.checked } }))} /> بانر التبويب
                      </label>
                      <div style={{display:'grid', gap:8, opacity: currentTab.promoBanner?.enabled ? 1 : 0.45}}>
                        <input className="input" placeholder="عنوان البانر" value={currentTab.promoBanner?.title||''} onChange={e=> mutateTab(activeTabIdx, (tab) => ({ ...tab, promoBanner: { ...(tab.promoBanner||{ enabled:true, image:'', href:'' }), title: e.target.value } }))} disabled={!currentTab.promoBanner?.enabled} />
                        <input className="input" placeholder="رابط عند النقر" value={currentTab.promoBanner?.href||''} onChange={e=> mutateTab(activeTabIdx, (tab) => ({ ...tab, promoBanner: { ...(tab.promoBanner||{ enabled:true, image:'' }), href: e.target.value } }))} disabled={!currentTab.promoBanner?.enabled} />
                        <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:8}}>
                          <input className="input" placeholder="رابط صورة" value={currentTab.promoBanner?.image||''} onChange={e=> mutateTab(activeTabIdx, (tab) => ({ ...tab, promoBanner: { ...(tab.promoBanner||{ enabled:true }), image: e.target.value } }))} disabled={!currentTab.promoBanner?.enabled} />
                          <button className="btn btn-outline btn-sm" disabled={!currentTab.promoBanner?.enabled} onClick={()=> currentTab.promoBanner?.enabled && openMediaPicker((u)=> mutateTab(activeTabIdx, (tab) => ({ ...tab, promoBanner: { ...(tab.promoBanner||{ enabled:true }), image: u } })))}>اختر صورة</button>
                        </div>
                      </div>
                    </div>
                    <div style={{display:'grid', gap:12, border:'1px solid #1c2333', borderRadius:10, padding:16, background:'#0b0e14'}}>
                      <div className="toolbar" style={{marginBottom:0}}>
                        <div className="muted">شرائح التبويب (Featured)</div>
                        <div className="actions" style={{display:'flex', gap:8}}>
                          <button className="btn btn-outline btn-sm" onClick={()=> openCategoriesPicker((items)=> mutateTab(activeTabIdx, (tab) => ({ ...tab, featured: items })))}>اختيار فئات</button>
                          {currentTab.featured?.length ? <button className="btn btn-outline btn-sm" onClick={()=> mutateTab(activeTabIdx, (tab) => ({ ...tab, featured: [] }))}>مسح</button> : null}
                        </div>
                      </div>
                      <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                        {(currentTab.featured||[]).map((c) => (
                          <div key={c.id} className="badge" style={{gap:6}}>
                            {c.image && <img src={c.image} alt={c.name} style={{ width:18, height:18, objectFit:'cover', borderRadius:4 }} />}
                            <span>{c.name}</span>
                          </div>
                        ))}
                        {!(currentTab.featured||[]).length && <div className="muted">— لا عناصر</div>}
                      </div>
                    </div>
                    <div style={{display:'grid', gap:12, border:'1px solid #1c2333', borderRadius:10, padding:16, background:'#0b0e14'}}>
                      <div className="toolbar" style={{marginBottom:0}}>
                        <div className="muted">شبكة التبويب الرئيسية</div>
                        <div className="actions" style={{display:'flex', gap:8}}>
                          <button className="btn btn-outline btn-sm" onClick={()=> mutateTab(activeTabIdx, (tab) => ({ ...tab, grid: { mode:'explicit', categories: Array.isArray((tab.grid as any)?.categories) ? [...(tab.grid as any).categories] : [] } }))}>قائمة صريحة</button>
                          <button className="btn btn-outline btn-sm" onClick={()=> mutateTab(activeTabIdx, (tab) => ({ ...tab, grid: { mode:'filter', limit: Number((tab.grid as any)?.limit)||36, sortBy: (tab.grid as any)?.sortBy || 'name_asc', categoryIds: (tab.grid as any)?.categoryIds } as TabFilterGrid }))}>فلترة</button>
                        </div>
                      </div>
                      {currentTab.grid?.mode==='explicit' ? (
                        <div style={{display:'grid', gap:8}}>
                          <div className="actions" style={{display:'flex', gap:8}}>
                            <button className="btn btn-outline btn-sm" onClick={()=> openCategoriesPicker((items)=> mutateTab(activeTabIdx, (tab) => ({ ...tab, grid: { mode:'explicit', categories: items } })))}>اختيار فئات</button>
                            {(currentTab.grid as TabExplicitGrid)?.categories?.length ? <button className="btn btn-outline btn-sm" onClick={()=> mutateTab(activeTabIdx, (tab) => ({ ...tab, grid: { mode:'explicit', categories: [] } }))}>مسح</button> : null}
                          </div>
                          <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
                            {((currentTab.grid as TabExplicitGrid)?.categories||[]).map((c, catIdx) => (
                              <div key={c.id} className="badge" style={{gap:6, display:'inline-flex', alignItems:'center'}}>
                                {c.image && <img src={c.image} alt={c.name} style={{ width:18, height:18, objectFit:'cover', borderRadius:4 }} />}
                                <span>{c.name}</span>
                                <div style={{display:'inline-flex', gap:4, marginInlineStart:6}}>
                                  <button className="btn btn-outline btn-sm" onClick={()=> mutateTab(activeTabIdx, (tab) => ({ ...tab, grid: { mode:'explicit', categories: (():CategoryMini[]=>{ const arr=[...(tab.grid as TabExplicitGrid)?.categories||[]]; if (catIdx>0){ const tmp = arr[catIdx-1]; arr[catIdx-1] = arr[catIdx]; arr[catIdx] = tmp; } return arr; })() } }))}>▲</button>
                                  <button className="btn btn-outline btn-sm" onClick={()=> mutateTab(activeTabIdx, (tab) => ({ ...tab, grid: { mode:'explicit', categories: (():CategoryMini[]=>{ const arr=[...(tab.grid as TabExplicitGrid)?.categories||[]]; if (catIdx < ((tab.grid as TabExplicitGrid)?.categories?.length||0)-1){ const tmp = arr[catIdx+1]; arr[catIdx+1] = arr[catIdx]; arr[catIdx] = tmp; } return arr; })() } }))}>▼</button>
                                </div>
                              </div>
                            ))}
                            {!((currentTab.grid as TabExplicitGrid)?.categories||[]).length && <div className="muted">— لا عناصر</div>}
                          </div>
                        </div>
                      ) : (
                        <div style={{display:'grid', gap:8, gridTemplateColumns:'1fr 1fr'}}>
                          <label className="form-label">الحد</label>
                          <input type="number" className="input" value={Number((currentTab.grid as TabFilterGrid)?.limit||36)} onChange={e=> mutateTab(activeTabIdx, (tab) => ({ ...tab, grid: { ...(tab.grid as TabFilterGrid)||{ mode:'filter' }, mode:'filter', limit: Math.max(1, Number((e.target as HTMLInputElement).value||36)), sortBy: (tab.grid as TabFilterGrid)?.sortBy || 'name_asc', categoryIds: (tab.grid as TabFilterGrid)?.categoryIds } as TabFilterGrid }))} />
                          <label className="form-label">الترتيب</label>
                          <select className="select" value={(currentTab.grid as TabFilterGrid)?.sortBy||'name_asc'} onChange={e=> mutateTab(activeTabIdx, (tab) => ({ ...tab, grid: { ...(tab.grid as TabFilterGrid)||{ mode:'filter' }, mode:'filter', sortBy: (e.target as HTMLSelectElement).value, limit: (tab.grid as TabFilterGrid)?.limit, categoryIds: (tab.grid as TabFilterGrid)?.categoryIds } as TabFilterGrid }))}>
                            <option value="name_asc">الاسم تصاعدي</option>
                            <option value="name_desc">الاسم تنازلي</option>
                            <option value="created_desc">الأحدث</option>
                          </select>
                          <div style={{gridColumn:'1 / -1', display:'grid', gap:8}}>
                            <div className="toolbar" style={{marginBottom:0}}>
                              <div className="muted">العناصر المختارة (IDs)</div>
                              <div className="actions" style={{display:'flex', gap:8}}>
                                <button className="btn btn-outline btn-sm" onClick={()=> openCategoriesPicker((items)=> mutateTab(activeTabIdx, (tab) => ({ ...tab, grid: { ...(tab.grid as TabFilterGrid)||{ mode:'filter' }, mode:'filter', categoryIds: items.map((x) => x.id), limit: (tab.grid as TabFilterGrid)?.limit, sortBy: (tab.grid as TabFilterGrid)?.sortBy || 'name_asc' } as TabFilterGrid })))}>اختيار فئات</button>
                                {Array.isArray((currentTab.grid as TabFilterGrid)?.categoryIds) && (currentTab.grid as TabFilterGrid)?.categoryIds?.length ? <button className="btn btn-outline btn-sm" onClick={()=> mutateTab(activeTabIdx, (tab) => ({ ...tab, grid: { ...(tab.grid as TabFilterGrid)||{ mode:'filter' }, mode:'filter', categoryIds: [], limit: (tab.grid as TabFilterGrid)?.limit, sortBy: (tab.grid as TabFilterGrid)?.sortBy || 'name_asc' } as TabFilterGrid }))}>مسح</button> : null}
                              </div>
                            </div>
                            <code dir="ltr" style={{fontSize:12, color:'#94a3b8'}}>{JSON.stringify(((currentTab.grid as TabFilterGrid)?.categoryIds||[]))}</code>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{display:'grid', gap:12, border:'1px solid #1c2333', borderRadius:10, padding:16, background:'#0b0e14'}}>
                      <div className="toolbar" style={{marginBottom:0}}>
                        <div className="muted">عناصر الشريط الجانبي</div>
                        <div className="actions">
                          <button className="btn btn-outline btn-sm" onClick={handleAddSidebarItem}>+ عنصر</button>
                        </div>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'minmax(220px, 240px) 1fr', gap:16}}>
                        <div style={{display:'grid', gap:8}}>
                          {currentSidebarItems.map((item, idx)=> {
                            const active = activeSidebarIdx === idx;
                            return (
                              <div
                                key={`sidebar-${idx}`}
                                onClick={()=> setActiveSidebarIdx(idx)}
                                style={{
                                  border:`1px solid ${active ? '#2563eb' : '#1c2333'}`,
                                  background: active ? '#111b2f' : '#0b0e14',
                                  borderRadius:8,
                                  padding:'10px 12px',
                                  display:'flex',
                                  alignItems:'center',
                                  gap:8,
                                  cursor:'pointer'
                                }}
                              >
                                <div style={{flex:1, textAlign:'start', display:'grid', gap:4}}>
                                  <div style={{fontWeight:600}}>{item.label?.trim() || 'عنصر بدون عنوان'}</div>
                                  <div className="muted" style={{fontSize:12}}>{item.grid?.mode==='filter' ? 'وضع فلترة' : `${((item.grid as TabExplicitGrid)?.categories||[]).length} فئات`}</div>
                                </div>
                                <div style={{display:'flex', gap:6}}>
                                  <button type="button" className="btn btn-outline btn-sm" onClick={e=> { e.stopPropagation(); handleMoveSidebarItem(idx, -1); }} aria-label="تحريك لأعلى">▲</button>
                                  <button type="button" className="btn btn-outline btn-sm" onClick={e=> { e.stopPropagation(); handleMoveSidebarItem(idx, 1); }} aria-label="تحريك لأسفل">▼</button>
                                  <button type="button" className="btn btn-outline btn-sm" onClick={e=> { e.stopPropagation(); if (window.confirm('حذف العنصر؟')) handleRemoveSidebarItem(idx); }} aria-label="حذف العنصر">✕</button>
                                </div>
                              </div>
                            );
                          })}
                          {!currentSidebarItems.length && <div className="muted">— لا عناصر</div>}
                        </div>
                        <div style={{display:'grid', gap:12}}>
                          {currentSidebarItem ? (
                            <>
                              <div className="toolbar" style={{marginBottom:0}}>
                                <div className="muted">تفاصيل العنصر المختار</div>
                              </div>
                              <input className="input" placeholder="التسمية" value={currentSidebarItem.label} onChange={e=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, label: e.target.value }))} />
                              <input className="input" placeholder="رابط اختياري (href)" value={currentSidebarItem.href||''} onChange={e=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, href: e.target.value }))} />
                              <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                                <input type="checkbox" checked={!!currentSidebarItem.promoBanner?.enabled} onChange={e=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, promoBanner: { ...(item.promoBanner||{ enabled:false, image:'', title:'', href:'' }), enabled: e.target.checked } }))} /> بانر للعنصر
                              </label>
                              <div style={{display:'grid', gap:8, opacity: currentSidebarItem.promoBanner?.enabled ? 1 : 0.45}}>
                                <input className="input" placeholder="عنوان البانر" value={currentSidebarItem.promoBanner?.title||''} onChange={e=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, promoBanner: { ...(item.promoBanner||{ enabled:true, image:'', href:'' }), title: e.target.value } }))} disabled={!currentSidebarItem.promoBanner?.enabled} />
                                <input className="input" placeholder="رابط عند النقر" value={currentSidebarItem.promoBanner?.href||''} onChange={e=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, promoBanner: { ...(item.promoBanner||{ enabled:true, image:'' }), href: e.target.value } }))} disabled={!currentSidebarItem.promoBanner?.enabled} />
                                <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:8}}>
                                  <input className="input" placeholder="رابط صورة" value={currentSidebarItem.promoBanner?.image||''} onChange={e=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, promoBanner: { ...(item.promoBanner||{ enabled:true }), image: e.target.value } }))} disabled={!currentSidebarItem.promoBanner?.enabled} />
                                  <button className="btn btn-outline btn-sm" disabled={!currentSidebarItem.promoBanner?.enabled} onClick={()=> currentSidebarItem.promoBanner?.enabled && openMediaPicker((u)=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, promoBanner: { ...(item.promoBanner||{ enabled:true }), image: u } })))}>اختر صورة</button>
                                </div>
                              </div>
                              <div className="toolbar" style={{marginBottom:0}}>
                                <div className="muted">شبكة العنصر</div>
                                <div className="actions" style={{display:'flex', gap:8}}>
                                  <button className="btn btn-outline btn-sm" onClick={()=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, grid: { mode:'explicit', categories: Array.isArray((item.grid as any)?.categories) ? [...(item.grid as any).categories] : [] } }))}>قائمة صريحة</button>
                                  <button className="btn btn-outline btn-sm" onClick={()=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, grid: { mode:'filter', limit: Number((item.grid as any)?.limit)||36, sortBy: (item.grid as any)?.sortBy || 'name_asc', categoryIds: (item.grid as any)?.categoryIds } as TabFilterGrid }))}>فلترة</button>
                                </div>
                              </div>
                              {currentSidebarItem.grid?.mode==='explicit' ? (
                                <div style={{display:'grid', gap:8}}>
                                  <div className="actions" style={{display:'flex', gap:8}}>
                                    <button className="btn btn-outline btn-sm" onClick={()=> openCategoriesPicker((items)=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, grid: { mode:'explicit', categories: items } })))}>اختيار فئات</button>
                                    {(currentSidebarItem.grid as TabExplicitGrid)?.categories?.length ? <button className="btn btn-outline btn-sm" onClick={()=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, grid: { mode:'explicit', categories: [] } }))}>مسح</button> : null}
                                  </div>
                                  <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                                    {((currentSidebarItem.grid as TabExplicitGrid)?.categories||[]).map((c, catIdx) => (
                                      <div key={c.id} className="badge" style={{gap:6, display:'inline-flex', alignItems:'center'}}>
                                        {c.image && <img src={c.image} alt={c.name} style={{ width:18, height:18, objectFit:'cover', borderRadius:4 }} />}
                                        <span>{c.name}</span>
                                        <div style={{display:'inline-flex', gap:4, marginInlineStart:6}}>
                                          <button className="btn btn-outline btn-sm" onClick={()=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, grid: { mode:'explicit', categories: (():CategoryMini[]=>{ const arr=[...(item.grid as TabExplicitGrid)?.categories||[]]; if (catIdx>0){ const tmp = arr[catIdx-1]; arr[catIdx-1] = arr[catIdx]; arr[catIdx] = tmp; } return arr; })() } }))}>▲</button>
                                          <button className="btn btn-outline btn-sm" onClick={()=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, grid: { mode:'explicit', categories: (():CategoryMini[]=>{ const arr=[...(item.grid as TabExplicitGrid)?.categories||[]]; if (catIdx < ((item.grid as TabExplicitGrid)?.categories?.length||0)-1){ const tmp = arr[catIdx+1]; arr[catIdx+1] = arr[catIdx]; arr[catIdx] = tmp; } return arr; })() } }))}>▼</button>
                                        </div>
                                      </div>
                                    ))}
                                    {!((currentSidebarItem.grid as TabExplicitGrid)?.categories||[]).length && <div className="muted">— لا عناصر</div>}
                                  </div>
                                </div>
                              ) : (
                                <div style={{display:'grid', gap:8, gridTemplateColumns:'1fr 1fr'}}>
                                  <label className="form-label">الحد</label>
                                  <input type="number" className="input" value={Number((currentSidebarItem.grid as TabFilterGrid)?.limit||36)} onChange={e=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, grid: { ...(item.grid as TabFilterGrid)||{ mode:'filter' }, mode:'filter', limit: Math.max(1, Number((e.target as HTMLInputElement).value||36)), sortBy: (item.grid as TabFilterGrid)?.sortBy || 'name_asc', categoryIds: (item.grid as TabFilterGrid)?.categoryIds } as TabFilterGrid }))} />
                                  <label className="form-label">الترتيب</label>
                                  <select className="select" value={(currentSidebarItem.grid as TabFilterGrid)?.sortBy||'name_asc'} onChange={e=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, grid: { ...(item.grid as TabFilterGrid)||{ mode:'filter' }, mode:'filter', sortBy: (e.target as HTMLSelectElement).value, limit: (item.grid as TabFilterGrid)?.limit, categoryIds: (item.grid as TabFilterGrid)?.categoryIds } as TabFilterGrid }))}>
                                    <option value="name_asc">الاسم تصاعدي</option>
                                    <option value="name_desc">الاسم تنازلي</option>
                                    <option value="created_desc">الأحدث</option>
                                  </select>
                                  <div style={{gridColumn:'1 / -1', display:'grid', gap:8}}>
                                    <div className="toolbar" style={{marginBottom:0}}>
                                      <div className="muted">العناصر المختارة (IDs)</div>
                                      <div className="actions" style={{display:'flex', gap:8}}>
                                        <button className="btn btn-outline btn-sm" onClick={()=> openCategoriesPicker((items)=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, grid: { ...(item.grid as TabFilterGrid)||{ mode:'filter' }, mode:'filter', categoryIds: items.map((x) => x.id), limit: (item.grid as TabFilterGrid)?.limit, sortBy: (item.grid as TabFilterGrid)?.sortBy || 'name_asc' } as TabFilterGrid })))}>اختيار فئات</button>
                                        {Array.isArray((currentSidebarItem.grid as TabFilterGrid)?.categoryIds) && (currentSidebarItem.grid as TabFilterGrid)?.categoryIds?.length ? <button className="btn btn-outline btn-sm" onClick={()=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, grid: { ...(item.grid as TabFilterGrid)||{ mode:'filter' }, mode:'filter', categoryIds: [], limit: (item.grid as TabFilterGrid)?.limit, sortBy: (item.grid as TabFilterGrid)?.sortBy || 'name_asc' } as TabFilterGrid }))}>مسح</button> : null}
                                      </div>
                                    </div>
                                    <code dir="ltr" style={{fontSize:12, color:'#94a3b8'}}>{JSON.stringify(((currentSidebarItem.grid as TabFilterGrid)?.categoryIds||[]))}</code>
                                  </div>
                                </div>
                              )}
                              <div className="toolbar" style={{marginBottom:0}}>
                                <div className="muted">قسم الاقتراحات (ربما يعجبك أيضًا)</div>
                                <div className="actions" style={{display:'flex', gap:8}}>
                                  <label className="muted" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                                    <input type="checkbox" checked={currentSidebarItem.suggestions?.enabled !== false} onChange={e=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, suggestions: { ...(item.suggestions||{ enabled:true, title: suggestionsDefaultTitle, items: [] }), enabled: e.target.checked } }))} /> مفعّل
                                  </label>
                                  <button className="btn btn-outline btn-sm" onClick={()=> openCategoriesPicker((items)=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, suggestions: { ...(item.suggestions||{ enabled:true, title: suggestionsDefaultTitle }), items } })))}>اختيار فئات</button>
                                  {currentSidebarItem.suggestions?.items?.length ? <button className="btn btn-outline btn-sm" onClick={()=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, suggestions: { ...(item.suggestions||{ enabled:true, title: suggestionsDefaultTitle }), items: [] } }))}>مسح</button> : null}
                                </div>
                              </div>
                              <input className="input" placeholder="عنوان الاقتراحات" value={currentSidebarItem.suggestions?.title||suggestionsDefaultTitle} onChange={e=> mutateSidebarItem(activeTabIdx, activeSidebarIdx, (item) => ({ ...item, suggestions: { ...(item.suggestions||{ enabled:true, items: [] }), title: e.target.value } }))} />
                            </>
                          ) : (
                            <div className="muted">اختر عنصرًا من القائمة لتعديله.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="muted">اختر تبويبًا من القائمة اليسرى لتعديل محتواه.</div>
                )}
              </div>
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
            <input className="input" placeholder="عنوان القسم" value={Array.isArray(config.suggestions)? suggestionsDefaultTitle : ((config.suggestions as SuggestionsConfig)?.title||'')} onChange={e=> setSuggestionsMeta({ title: (e.target as HTMLInputElement).value })} />
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {(Array.isArray(config.suggestions)? (config.suggestions as CategoryMini[]) : (((config.suggestions as SuggestionsConfig)?.items)||[])).map((c) => (
                <div key={c.id} className="badge" style={{gap:6}}>
                  {c.image && <img src={c.image} alt="thumb" style={{ width:18, height:18, objectFit:'cover', borderRadius:4 }} />}
                  <span>{c.name}</span>
                </div>
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
