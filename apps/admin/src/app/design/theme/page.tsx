"use client";
import React from "react";

export default function DesignThemePage(): JSX.Element {
  const [site, setSite] = React.useState<'web'|'mweb'>('web');
  const [mode, setMode] = React.useState<'draft'|'live'>('draft');
  const [theme, setTheme] = React.useState<any>({ colors: { primary:'#800020', secondary:'#111827', bg:'#0b0e14', text:'#e5e7eb' }, radius: { md: 10, lg: 14 }, shadows: { md:'0 4px 20px rgba(0,0,0,.25)' }, typography: { base: 14, fontFamily: 'system-ui' } });
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string>("");

  async function load(){
    try{
      const r = await fetch(`/api/admin/design/theme?site=${site}&mode=${mode}`, { credentials:'include' });
      const j = await r.json();
      if (j?.theme) setTheme(j.theme);
    }catch{}
  }
  React.useEffect(()=>{ load(); }, [site, mode]);

  function applyPreview(){
    const root = document.documentElement;
    const c = theme.colors||{};
    root.style.setProperty('--color-primary', c.primary||'#800020');
    root.style.setProperty('--color-secondary', c.secondary||'#111827');
    root.style.setProperty('--color-bg', c.bg||'#0b0e14');
    root.style.setProperty('--color-text', c.text||'#e5e7eb');
    const r = theme.radius||{};
    root.style.setProperty('--radius-md', String(r.md||10)+'px');
    root.style.setProperty('--radius-lg', String(r.lg||14)+'px');
  }

  async function save(){
    setSaving(true); setMsg('');
    try{
      const r = await fetch('/api/admin/design/theme', { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site, mode:'draft', theme }) });
      if (!r.ok) throw new Error('فشل الحفظ');
      setMsg('تم الحفظ');
    }catch(e:any){ setMsg(e?.message||'فشل الحفظ'); }
    finally{ setSaving(false); setTimeout(()=> setMsg(''), 1800); }
  }
  async function publish(){
    if (!confirm('نشر التغييرات إلى النسخة الحية؟')) return;
    setSaving(true); setMsg('');
    try{
      const r = await fetch('/api/admin/design/theme/publish', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site }) });
      if (!r.ok) throw new Error('فشل النشر');
      setMsg('تم النشر');
    }catch(e:any){ setMsg(e?.message||'فشل النشر'); }
    finally{ setSaving(false); setTimeout(()=> setMsg(''), 1800); }
  }

  return (
    <main>
      <h1 style={{ marginBottom: 12 }}>المظهر العام</h1>
      {msg && (<div className={`toast ${/فشل/.test(msg)? 'err':'ok'}`}>{msg}</div>)}
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
        <select value={site} onChange={e=> setSite(e.target.value as any)} className="input">
          <option value="web">سطح المكتب (jeeey.com)</option>
          <option value="mweb">الجوال (م.jeeey.com)</option>
        </select>
        <select value={mode} onChange={e=> setMode(e.target.value as any)} className="input">
          <option value="draft">Draft</option>
          <option value="live">Live</option>
        </select>
        <button className="btn" onClick={load}>تحديث</button>
        <button className="btn btn-outline" onClick={applyPreview}>تطبيق المعاينة</button>
        <button className="btn" onClick={save} disabled={saving}>حفظ المسودة</button>
        <button className="btn" onClick={publish} disabled={saving}>نشر</button>
      </div>

      <div className="panel" style={{ padding:12, display:'grid', gap:12 }}>
        <h3 style={{ margin:0 }}>الألوان</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(160px, 1fr))', gap:12 }}>
          {(['primary','secondary','bg','text'] as const).map((k)=> (
            <label key={k}> {k}
              <input type="color" value={theme.colors?.[k]||'#000000'} onChange={e=> setTheme((t:any)=> ({ ...t, colors: { ...(t.colors||{}), [k]: e.target.value } }))} className="input" />
            </label>
          ))}
        </div>
        <h3 style={{ margin:0 }}>الزوايا</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(160px, 1fr))', gap:12 }}>
          <label>radius.md<input type="number" value={theme.radius?.md??10} onChange={e=> setTheme((t:any)=> ({ ...t, radius: { ...(t.radius||{}), md: Number(e.target.value)||0 } }))} className="input" /></label>
          <label>radius.lg<input type="number" value={theme.radius?.lg??14} onChange={e=> setTheme((t:any)=> ({ ...t, radius: { ...(t.radius||{}), lg: Number(e.target.value)||0 } }))} className="input" /></label>
        </div>
        <h3 style={{ margin:0 }}>الطباعة</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(160px, 1fr))', gap:12 }}>
          <label>base size<input type="number" value={theme.typography?.base??14} onChange={e=> setTheme((t:any)=> ({ ...t, typography: { ...(t.typography||{}), base: Number(e.target.value)||14 } }))} className="input" /></label>
          <label>font family<input value={theme.typography?.fontFamily||'system-ui'} onChange={e=> setTheme((t:any)=> ({ ...t, typography: { ...(t.typography||{}), fontFamily: e.target.value } }))} className="input" /></label>
        </div>
      </div>

      <div className="panel" style={{ padding:12, marginTop:12 }}>
        <h3 style={{ marginTop:0 }}>معاينة</h3>
        <div style={{ border:'1px solid #1c2333', borderRadius:12, overflow:'hidden' }}>
          {(()=>{
            const webUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jeeey.com';
            const mwebUrl = process.env.NEXT_PUBLIC_MWEB_URL || 'https://m.jeeey.com';
            const src = site==='web'? webUrl : mwebUrl;
            return <iframe title="preview" src={src} style={{ width:'100%', height:420, background:'#0b0e14', border:'none' }} />
          })()}
        </div>
      </div>
    </main>
  );
}
