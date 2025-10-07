"use client";
import React from "react";

export default function DesignBrandingPage(): JSX.Element {
  const [site, setSite] = React.useState<'web'|'mweb'>('web');
  const [theme, setTheme] = React.useState<any>({ branding: { logoLight:'', logoDark:'', favicon:'', appIcon512:'', banners: [] as Array<any> } });
  const [msg, setMsg] = React.useState<string>("");
  const [saving, setSaving] = React.useState<boolean>(false);

  React.useEffect(()=>{ (async()=>{
    try{ const r = await fetch(`/api/admin/design/theme?site=${site}&mode=draft`, { credentials:'include' }); const j = await r.json(); if (j?.theme) setTheme((t:any)=> ({ ...t, ...j.theme })); }catch{}
  })() }, [site]);

  async function save(){
    setSaving(true); setMsg('');
    try{
      const r = await fetch('/api/admin/design/theme', { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site, mode:'draft', theme }) });
      if (!r.ok) throw new Error('فشل الحفظ');
      setMsg('تم الحفظ');
    }catch(e:any){ setMsg(e?.message||'فشل الحفظ'); }
    finally{ setSaving(false); setTimeout(()=> setMsg(''), 1600); }
  }
  async function publish(){
    if (!confirm('نشر عناصر الهوية إلى النسخة الحية؟')) return;
    setSaving(true); setMsg('');
    try{ const r = await fetch('/api/admin/design/theme/publish', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site }) }); if (!r.ok) throw new Error('فشل النشر'); setMsg('تم النشر'); }
    catch(e:any){ setMsg(e?.message||'فشل النشر'); }
    finally{ setSaving(false); setTimeout(()=> setMsg(''), 1600); }
  }

  function setBrand(key: string, val: string){ setTheme((t:any)=> ({ ...t, branding: { ...(t.branding||{}), [key]: val } })); }

  async function onFilePick(e: React.ChangeEvent<HTMLInputElement>, key: string){
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader(); reader.onload = async ()=>{
      const base64 = String(reader.result||'');
      try{
        const resp = await fetch('/api/admin/media/upload', { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({ filename: f.name, contentType: f.type, base64 }) });
        if (resp.ok){ const out = await resp.json(); const url = out.url || out.presign?.url || base64; setBrand(key, url); setMsg('تم الرفع'); setTimeout(()=> setMsg(''), 1200); }
        else { setBrand(key, base64); setMsg('تم التحميل محلياً'); setTimeout(()=> setMsg(''), 1200); }
      }catch{ setBrand(key, base64); }
    }; reader.readAsDataURL(f);
  }

  function BannerRow({ idx, b }:{ idx:number; b:any }){
    return (
      <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr auto', gap:8, alignItems:'center' }}>
        <input value={b.url||''} onChange={e=> updateBanner(idx, { ...b, url: e.target.value })} placeholder="صورة البنر URL" className="input" />
        <input value={b.link||''} onChange={e=> updateBanner(idx, { ...b, link: e.target.value })} placeholder="رابط عند النقر" className="input" />
        <input type="date" value={b.activeFrom? String(b.activeFrom).slice(0,10):''} onChange={e=> updateBanner(idx, { ...b, activeFrom: e.target.value? new Date(e.target.value).toISOString(): null })} className="input" />
        <input type="date" value={b.activeUntil? String(b.activeUntil).slice(0,10):''} onChange={e=> updateBanner(idx, { ...b, activeUntil: e.target.value? new Date(e.target.value).toISOString(): null })} className="input" />
        <button className="btn btn-outline" onClick={()=> removeBanner(idx)}>حذف</button>
      </div>
    );
  }
  function updateBanner(idx:number, v:any){ const next = [...(theme.branding?.banners||[])]; next[idx]=v; setBrand('banners', next as any); }
  function removeBanner(idx:number){ const next = (theme.branding?.banners||[]).filter((_:any,i:number)=> i!==idx); setBrand('banners', next as any); }
  function addBanner(){ const next = [ ...(theme.branding?.banners||[]), { url:'', link:'', activeFrom:null, activeUntil:null } ]; setBrand('banners', next as any); }

  return (
    <main>
      <h1 style={{ marginBottom: 12 }}>الشعارات والأيقونات</h1>
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
        <h3 style={{ margin:0 }}>شعارات</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label>Logo (Light)
              <input value={theme.branding?.logoLight||''} onChange={e=> setBrand('logoLight', e.target.value)} className="input" />
              <input type="file" accept="image/*" onChange={e=> onFilePick(e, 'logoLight')} style={{ marginTop:6 }} />
            </label>
          </div>
          <div>
            <label>Logo (Dark)
              <input value={theme.branding?.logoDark||''} onChange={e=> setBrand('logoDark', e.target.value)} className="input" />
              <input type="file" accept="image/*" onChange={e=> onFilePick(e, 'logoDark')} style={{ marginTop:6 }} />
            </label>
          </div>
        </div>
        <h3 style={{ margin:0 }}>أيقونات</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label>Favicon
              <input value={theme.branding?.favicon||''} onChange={e=> setBrand('favicon', e.target.value)} className="input" />
              <input type="file" accept="image/*" onChange={e=> onFilePick(e, 'favicon')} style={{ marginTop:6 }} />
            </label>
          </div>
          <div>
            <label>App Icon (512x512)
              <input value={theme.branding?.appIcon512||''} onChange={e=> setBrand('appIcon512', e.target.value)} className="input" />
              <input type="file" accept="image/*" onChange={e=> onFilePick(e, 'appIcon512')} style={{ marginTop:6 }} />
            </label>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding:12, marginTop:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ margin:0 }}>بنرات الصفحة الرئيسية</h3>
          <button className="btn btn-outline" onClick={addBanner}>+ إضافة بنر</button>
        </div>
        <div style={{ display:'grid', gap:8, marginTop:8 }}>
          {(theme.branding?.banners||[]).map((b:any, idx:number)=> (
            <BannerRow key={idx} idx={idx} b={b} />
          ))}
          {!(theme.branding?.banners||[]).length && (<div style={{ color:'#94a3b8' }}>لا توجد بنرات مضافة</div>)}
        </div>
      </div>
    </main>
  );
}
