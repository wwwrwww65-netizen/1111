"use client";
import React from "react";

export default function RecommendationsRulesPage(): JSX.Element {
  const [rules, setRules] = React.useState<any>({ recent: { enabled:true, limit:8 }, similar: { enabled:true, limit:8 }, boost: { inStock:true, marginWeight:0.3 } });
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(""), 1500); };
  async function load(){ try{ const j = await (await fetch(`/api/admin/recommendations/rules`, { credentials:'include' })).json(); if (j?.rules) setRules(j.rules); }catch{} }
  React.useEffect(()=>{ load(); },[]);
  async function save(){ try{ setSaving(true); await fetch(`/api/admin/recommendations/rules`, { method:'PUT', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify(rules) }); showToast('تم الحفظ'); }catch{ showToast('فشل الحفظ'); } finally{ setSaving(false); } }
  return (
    <main className="panel">
      <h1>قواعد التوصيات</h1>
      <section style={{ display:'grid', gap:12, maxWidth:720 }}>
        <label><input type="checkbox" checked={!!rules.recent?.enabled} onChange={(e)=> setRules((r:any)=> ({ ...r, recent: { ...(r.recent||{}), enabled: e.target.checked } }))} /> تفعيل أحدث المنتجات</label>
        <label>عدد العناصر للأحدث
          <input type="number" value={Number(rules.recent?.limit||8)} onChange={(e)=> setRules((r:any)=> ({ ...r, recent:{ ...(r.recent||{}), limit: Number(e.target.value||8) } }))} />
        </label>
        <label><input type="checkbox" checked={!!rules.similar?.enabled} onChange={(e)=> setRules((r:any)=> ({ ...r, similar: { ...(r.similar||{}), enabled: e.target.checked } }))} /> تفعيل مشابه حسب الفئة</label>
        <label>عدد العناصر للمشابه
          <input type="number" value={Number(rules.similar?.limit||8)} onChange={(e)=> setRules((r:any)=> ({ ...r, similar:{ ...(r.similar||{}), limit: Number(e.target.value||8) } }))} />
        </label>
        <label>وزن الهامش في إعادة الترتيب
          <input type="number" step="0.05" value={Number(rules.boost?.marginWeight||0)} onChange={(e)=> setRules((r:any)=> ({ ...r, boost:{ ...(r.boost||{}), marginWeight: Number(e.target.value||0) } }))} />
        </label>
        <label><input type="checkbox" checked={!!rules.boost?.inStock} onChange={(e)=> setRules((r:any)=> ({ ...r, boost:{ ...(r.boost||{}), inStock: e.target.checked } }))} /> تفضيل المتوفر بالمخزون</label>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={save} disabled={saving} className="btn">{saving? 'جارٍ الحفظ...':'حفظ'}</button>
          {toast && <span>{toast}</span>}
        </div>
      </section>
    </main>
  );
}


