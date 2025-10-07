"use client";
import React from "react";

export default function DesignNavigationPage(): JSX.Element {
  const [site, setSite] = React.useState<'web'|'mweb'>('web');
  const [nav, setNav] = React.useState<any>({ web: { header: [] as Array<{label:string;href:string}>, footer: [] as Array<{label:string;href:string}> }, mweb: { tabs: [] as Array<{icon:string;label:string;href:string}> } });
  const [msg, setMsg] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(()=>{ (async()=>{
    try{
      const r = await fetch(`/api/admin/design/theme?site=${site}&mode=draft`, { credentials:'include' });
      const j = await r.json();
      const theme = j?.theme || {};
      setNav({
        web: theme.navigation?.web || { header: [], footer: [] },
        mweb: theme.navigation?.mweb || { tabs: [] },
      });
    }catch{}
  })() }, [site]);

  function setHeader(items: Array<{label:string;href:string}>){ setNav((n:any)=> ({ ...n, web: { ...(n.web||{}), header: items } })); }
  function setFooter(items: Array<{label:string;href:string}>){ setNav((n:any)=> ({ ...n, web: { ...(n.web||{}), footer: items } })); }
  function setTabs(items: Array<{icon:string;label:string;href:string}>){ setNav((n:any)=> ({ ...n, mweb: { ...(n.mweb||{}), tabs: items } })); }

  function addHeader(){ setHeader([...(nav.web?.header||[]), { label:'عن المتجر', href:'/about' }]); }
  function addFooter(){ setFooter([...(nav.web?.footer||[]), { label:'سياسة الخصوصية', href:'/legal/privacy' }]); }
  function addTab(){ setTabs([...(nav.mweb?.tabs||[]), { icon:'home', label:'الرئيسية', href:'/' }]); }

  function updateItem<T>(items: T[], idx:number, v:T){ const next=[...items]; next[idx]=v; return next; }
  function removeItem<T>(items: T[], idx:number){ return items.filter((_,i)=> i!==idx); }

  async function save(){
    setSaving(true); setMsg('');
    try{
      const r = await fetch('/api/admin/design/theme', { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site, mode:'draft', theme: { navigation: nav } }) });
      if (!r.ok) throw new Error('فشل الحفظ'); setMsg('تم الحفظ');
    }catch(e:any){ setMsg(e?.message||'فشل الحفظ'); }
    finally{ setSaving(false); setTimeout(()=> setMsg(''), 1600); }
  }
  async function publish(){
    if (!confirm('نشر التنقل إلى النسخة الحية؟')) return;
    setSaving(true); setMsg('');
    try{ const r = await fetch('/api/admin/design/theme/publish', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site }) }); if (!r.ok) throw new Error('فشل النشر'); setMsg('تم النشر'); }
    catch(e:any){ setMsg(e?.message||'فشل النشر'); }
    finally{ setSaving(false); setTimeout(()=> setMsg(''), 1600); }
  }

  return (
    <main>
      <h1 style={{ marginBottom: 12 }}>التنقل والشرائط</h1>
      {msg && (<div className={`toast ${/فشل/.test(msg)? 'err':'ok'}`}>{msg}</div>)}
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
        <select value={site} onChange={e=> setSite(e.target.value as any)} className="input">
          <option value="web">سطح المكتب (jeeey.com)</option>
          <option value="mweb">الجوال (م.jeeey.com)</option>
        </select>
        <button className="btn" onClick={save} disabled={saving}>حفظ</button>
        <button className="btn" onClick={publish} disabled={saving}>نشر</button>
      </div>

      <div className="panel" style={{ padding:12, display:'grid', gap:12 }}>
        <h3 style={{ margin:0 }}>Web - رأس الموقع</h3>
        <div style={{ display:'grid', gap:8 }}>
          {(nav.web?.header||[]).map((it:any, idx:number)=> (
            <div key={`h-${idx}`} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8 }}>
              <input value={it.label} onChange={e=> setHeader(updateItem(nav.web?.header||[], idx, { ...it, label: e.target.value }))} className="input" placeholder="التسمية" />
              <input value={it.href} onChange={e=> setHeader(updateItem(nav.web?.header||[], idx, { ...it, href: e.target.value }))} className="input" placeholder="/path" />
              <button className="btn btn-outline" onClick={()=> setHeader(removeItem(nav.web?.header||[], idx))}>حذف</button>
            </div>
          ))}
          <button className="btn btn-sm" onClick={addHeader}>+ إضافة عنصر</button>
        </div>
      </div>

      <div className="panel" style={{ padding:12, display:'grid', gap:12, marginTop:12 }}>
        <h3 style={{ margin:0 }}>Web - تذييل الموقع</h3>
        <div style={{ display:'grid', gap:8 }}>
          {(nav.web?.footer||[]).map((it:any, idx:number)=> (
            <div key={`f-${idx}`} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8 }}>
              <input value={it.label} onChange={e=> setFooter(updateItem(nav.web?.footer||[], idx, { ...it, label: e.target.value }))} className="input" placeholder="التسمية" />
              <input value={it.href} onChange={e=> setFooter(updateItem(nav.web?.footer||[], idx, { ...it, href: e.target.value }))} className="input" placeholder="/path" />
              <button className="btn btn-outline" onClick={()=> setFooter(removeItem(nav.web?.footer||[], idx))}>حذف</button>
            </div>
          ))}
          <button className="btn btn-sm" onClick={addFooter}>+ إضافة عنصر</button>
        </div>
      </div>

      <div className="panel" style={{ padding:12, display:'grid', gap:12, marginTop:12 }}>
        <h3 style={{ margin:0 }}>Mobile Web - شريط التبويبات</h3>
        <div style={{ display:'grid', gap:8 }}>
          {(nav.mweb?.tabs||[]).map((it:any, idx:number)=> (
            <div key={`t-${idx}`} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:8 }}>
              <input value={it.icon} onChange={e=> setTabs(updateItem(nav.mweb?.tabs||[], idx, { ...it, icon: e.target.value }))} className="input" placeholder="home | cart | user ..." />
              <input value={it.label} onChange={e=> setTabs(updateItem(nav.mweb?.tabs||[], idx, { ...it, label: e.target.value }))} className="input" placeholder="التسمية" />
              <input value={it.href} onChange={e=> setTabs(updateItem(nav.mweb?.tabs||[], idx, { ...it, href: e.target.value }))} className="input" placeholder="/path" />
              <button className="btn btn-outline" onClick={()=> setTabs(removeItem(nav.mweb?.tabs||[], idx))}>حذف</button>
            </div>
          ))}
          <button className="btn btn-sm" onClick={addTab}>+ إضافة تبويب</button>
        </div>
      </div>
    </main>
  );
}
