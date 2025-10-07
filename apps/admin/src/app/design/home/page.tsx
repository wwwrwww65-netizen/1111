"use client";
import React from "react";

export default function DesignHomeBuilderPage(): JSX.Element {
  const [site, setSite] = React.useState<'web'|'mweb'>('web');
  const [sections, setSections] = React.useState<Array<{ type:string; title?:string; config:any }>>([]);
  const [msg, setMsg] = React.useState('');

  React.useEffect(()=>{ (async()=>{
    try{
      const r = await fetch(`/api/admin/design/theme?site=${site}&mode=draft`, { credentials:'include' });
      const j = await r.json();
      const theme = j?.theme || {};
      setSections(theme.home?.sections || []);
    }catch{}
  })() }, [site]);

  function addSection(type:string){ setSections((s)=> ([...s, { type, title:'', config:{} }])); }
  function updateSection(idx:number, v:any){ const next=[...sections]; next[idx]=v; setSections(next); }
  function removeSection(idx:number){ setSections(sections.filter((_,i)=> i!==idx)); }
  function moveUp(idx:number){ if (idx<=0) return; const next=[...sections]; const [it]=next.splice(idx,1); next.splice(idx-1,0,it); setSections(next); }
  function moveDown(idx:number){ if (idx>=sections.length-1) return; const next=[...sections]; const [it]=next.splice(idx,1); next.splice(idx+1,0,it); setSections(next); }

  async function save(){
    try{
      const r = await fetch('/api/admin/design/theme', { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site, mode:'draft', theme: { home: { sections } } }) });
      if (!r.ok) throw new Error('فشل الحفظ'); setMsg('تم الحفظ'); setTimeout(()=> setMsg(''), 1200);
    }catch{ setMsg('فشل الحفظ'); setTimeout(()=> setMsg(''), 1200); }
  }
  async function publish(){
    if (!confirm('نشر الصفحة الرئيسية؟')) return;
    try{ const r = await fetch('/api/admin/design/theme/publish', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site }) }); if (!r.ok) throw new Error('فشل النشر'); setMsg('تم النشر'); setTimeout(()=> setMsg(''), 1200); }
    catch{ setMsg('فشل النشر'); setTimeout(()=> setMsg(''), 1200); }
  }

  return (
    <main>
      <h1 style={{ marginBottom:12 }}>مصمم الصفحة الرئيسية</h1>
      {msg && (<div className={`toast ${/فشل/.test(msg)? 'err':'ok'}`}>{msg}</div>)}
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
        <select value={site} onChange={e=> setSite(e.target.value as any)} className="input">
          <option value="web">سطح المكتب (jeeey.com)</option>
          <option value="mweb">الجوال (م.jeeey.com)</option>
        </select>
        <button className="btn" onClick={save}>حفظ</button>
        <button className="btn" onClick={publish}>نشر</button>
        <button className="btn btn-outline" onClick={()=> addSection('hero')}>+ Hero</button>
        <button className="btn btn-outline" onClick={()=> addSection('categories')}>+ فئات</button>
        <button className="btn btn-outline" onClick={()=> addSection('products')}>+ منتجات</button>
        <button className="btn btn-outline" onClick={()=> addSection('cta')}>+ CTA</button>
      </div>

      <div className="panel" style={{ padding:12, display:'grid', gap:12 }}>
        {(sections||[]).map((s, idx)=> (
          <div key={idx} style={{ border:'1px solid #1c2333', borderRadius:8, padding:10 }}>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <b>{s.type}</b>
              <input value={s.title||''} onChange={e=> updateSection(idx, { ...s, title: e.target.value })} placeholder="عنوان اختياري" className="input" />
              <button className="btn btn-sm" onClick={()=> moveUp(idx)}>▲</button>
              <button className="btn btn-sm" onClick={()=> moveDown(idx)}>▼</button>
              <button className="btn btn-sm btn-outline" onClick={()=> removeSection(idx)}>حذف</button>
            </div>
            <div style={{ marginTop:8 }}>
              {/* إعدادات بسيطة حسب النوع */}
              {s.type==='hero' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <label>صورة<input value={s.config?.image||''} onChange={e=> updateSection(idx, { ...s, config: { ...(s.config||{}), image: e.target.value } })} className="input" /></label>
                  <label>رابط<input value={s.config?.link||''} onChange={e=> updateSection(idx, { ...s, config: { ...(s.config||{}), link: e.target.value } })} className="input" /></label>
                </div>
              )}
              {s.type==='categories' && (
                <div>
                  <label>Slugs (comma)<input value={s.config?.slugs||''} onChange={e=> updateSection(idx, { ...s, config: { ...(s.config||{}), slugs: e.target.value } })} className="input" /></label>
                </div>
              )}
              {s.type==='products' && (
                <div>
                  <label>SKU List (comma)<input value={s.config?.skus||''} onChange={e=> updateSection(idx, { ...s, config: { ...(s.config||{}), skus: e.target.value } })} className="input" /></label>
                </div>
              )}
              {s.type==='cta' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <label>عنوان<input value={s.config?.title||''} onChange={e=> updateSection(idx, { ...s, config: { ...(s.config||{}), title: e.target.value } })} className="input" /></label>
                  <label>رابط<input value={s.config?.link||''} onChange={e=> updateSection(idx, { ...s, config: { ...(s.config||{}), link: e.target.value } })} className="input" /></label>
                </div>
              )}
            </div>
          </div>
        ))}
        {!(sections||[]).length && (<div style={{ color:'#94a3b8' }}>لا توجد أقسام. أضف أقسامًا من الأعلى.</div>)}
      </div>
    </main>
  );
}
