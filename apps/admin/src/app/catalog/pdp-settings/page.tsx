"use client";
import React from "react";

export default function PdpSettingsPage(): JSX.Element {
  const [settings, setSettings] = React.useState<any>({
    modulesOrder: ["gallery","price","variants","shipping","description","reviews","recommendations"],
    show: { price:true, variants:true, shipping:true, description:true, reviews:true, recommendations:true },
    placements: { crossSell: "below_description", upSell: "below_gallery" }
  });
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(""), 1500); };

  async function load(){
    try{ const r = await fetch(`/api/admin/pdp/settings`, { credentials:'include' }); const j = await r.json(); if (j?.settings) setSettings(j.settings); } catch {}
  }
  React.useEffect(()=>{ load(); },[]);

  async function save(){
    try{ setSaving(true); await fetch(`/api/admin/pdp/settings`, { method:'PUT', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify(settings) }); showToast('تم الحفظ'); } catch { showToast('فشل الحفظ'); } finally { setSaving(false); }
  }

  const toggle = (k: string)=> setSettings((s:any)=> ({ ...s, show: { ...s.show, [k]: !s.show?.[k] } }));
  const move = (dir: 'up'|'down', key: string)=> setSettings((s:any)=>{
    const arr = Array.from(s.modulesOrder||[]);
    const i = arr.indexOf(key); if (i<0) return s;
    const j = dir==='up'? i-1 : i+1; if (j<0 || j>=arr.length) return s;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...s, modulesOrder: arr };
  });

  const ModuleRow = ({ id, label }:{ id:string; label:string }): JSX.Element => (
    <div style={{ display:'flex', alignItems:'center', gap:8, border:'1px solid #1c2333', padding:8, borderRadius:8 }}>
      <input type="checkbox" checked={!!settings.show?.[id]} onChange={()=>toggle(id)} />
      <span style={{ flex:1 }}>{label}</span>
      <button onClick={()=>move('up', id)} className="btn btn-outline">↑</button>
      <button onClick={()=>move('down', id)} className="btn btn-outline">↓</button>
    </div>
  );

  return (
    <main className="panel">
      <h1>إعدادات صفحة المنتج (PDP)</h1>
      <section style={{ display:'grid', gap:12, maxWidth:720 }}>
        <ModuleRow id="gallery" label="معرض الصور" />
        <ModuleRow id="price" label="السعر" />
        <ModuleRow id="variants" label="المتغيرات (مقاس/لون)" />
        <ModuleRow id="shipping" label="الشحن والإرجاع" />
        <ModuleRow id="description" label="الوصف" />
        <ModuleRow id="reviews" label="المراجعات" />
        <ModuleRow id="recommendations" label="التوصيات" />

        <div style={{ display:'grid', gap:8 }}>
          <label>موضع Up‑sell
            <select value={settings.placements?.upSell||''} onChange={(e)=> setSettings((s:any)=> ({ ...s, placements: { ...s.placements, upSell: e.target.value } }))}>
              <option value="below_gallery">أسفل المعرض</option>
              <option value="below_price">أسفل السعر</option>
            </select>
          </label>
          <label>موضع Cross‑sell
            <select value={settings.placements?.crossSell||''} onChange={(e)=> setSettings((s:any)=> ({ ...s, placements: { ...s.placements, crossSell: e.target.value } }))}>
              <option value="below_description">أسفل الوصف</option>
              <option value="below_reviews">أسفل المراجعات</option>
            </select>
          </label>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={save} disabled={saving} className="btn">{saving? 'جارٍ الحفظ...':'حفظ'}</button>
          {toast && <span>{toast}</span>}
        </div>
      </section>
    </main>
  );
}


