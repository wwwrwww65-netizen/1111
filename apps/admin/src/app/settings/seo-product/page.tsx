"use client";
import React from "react";

export default function SeoProductDefaultsPage(): JSX.Element {
  const [defaults, setDefaults] = React.useState<any>({
    titleTemplate: "{{name}} | Jeeey",
    ogSiteName: "Jeeey",
    canonicalBase: "https://m.jeeey.com",
    enableJsonLd: true,
  });
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(""), 1500); };
  async function load(){ try{ const j = await (await fetch(`/api/admin/seo/product/defaults`, { credentials:'include' })).json(); if (j?.defaults) setDefaults(j.defaults); }catch{} }
  React.useEffect(()=>{ load(); },[]);
  async function save(){ try{ setSaving(true); await fetch(`/api/admin/seo/product/defaults`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(defaults) }); showToast('تم الحفظ'); }catch{ showToast('فشل الحفظ'); } finally{ setSaving(false); } }
  return (
    <main className="panel">
      <h1>SEO المنتجات (افتراضات)</h1>
      <section style={{ display:'grid', gap:12, maxWidth:720 }}>
        <label>قالب العنوان
          <input value={defaults.titleTemplate||''} onChange={(e)=> setDefaults((d:any)=> ({ ...d, titleTemplate: e.target.value }))} />
        </label>
        <label>og:site_name
          <input value={defaults.ogSiteName||''} onChange={(e)=> setDefaults((d:any)=> ({ ...d, ogSiteName: e.target.value }))} />
        </label>
        <label>Canonical Base
          <input value={defaults.canonicalBase||''} onChange={(e)=> setDefaults((d:any)=> ({ ...d, canonicalBase: e.target.value }))} />
        </label>
        <label><input type="checkbox" checked={!!defaults.enableJsonLd} onChange={(e)=> setDefaults((d:any)=> ({ ...d, enableJsonLd: e.target.checked }))} /> تفعيل JSON‑LD</label>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={save} disabled={saving} className="btn">{saving? 'جارٍ الحفظ...':'حفظ'}</button>
          {toast && <span>{toast}</span>}
        </div>
      </section>
    </main>
  );
}


