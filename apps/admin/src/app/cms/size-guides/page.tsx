"use client";
import React from "react";

export default function SizeGuidesPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [assignments, setAssignments] = React.useState<any>({ brandToSlug: {}, categoryToSlug: {}, defaultSlug: '' });
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(""), 1500); };

  async function load(){
    try{
      const j = await (await fetch(`/api/admin/size-guides`, { credentials:'include' })).json();
      setRows(j.pages||[]);
      setAssignments(j.assignments||{ brandToSlug:{}, categoryToSlug:{}, defaultSlug:'' });
    }catch{}
  }
  React.useEffect(()=>{ load(); },[]);

  async function save(){
    try{
      setSaving(true);
      await fetch(`/api/admin/size-guides/assignments`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(assignments) });
      showToast('تم الحفظ');
    }catch{ showToast('فشل الحفظ'); }
    finally{ setSaving(false); }
  }

  const allSlugs: string[] = rows.map((r:any)=> String(r.slug));

  return (
    <main className="panel">
      <h1>دلائل المقاسات</h1>
      <section style={{ display:'grid', gap:16 }}>
        <div>
          <h3>الصفحات المتاحة (CMS)</h3>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>Slug</th>
                  <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>العنوان</th>
                  <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>منشور؟</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r:any)=>(
                  <tr key={r.id}>
                    <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{r.slug}</td>
                    <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{r.title}</td>
                    <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{r.published? 'نعم':'لا'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3>التعيينات</h3>
          <div style={{ display:'grid', gap:8, maxWidth:720 }}>
            <label>الافتراضي
              <select value={assignments.defaultSlug||''} onChange={(e)=> setAssignments((s:any)=> ({ ...s, defaultSlug: e.target.value }))}>
                <option value="">---</option>
                {allSlugs.map(sl=> <option key={sl} value={sl}>{sl}</option>)}
              </select>
            </label>
            <details>
              <summary>ربط حسب العلامة التجارية</summary>
              <BrandOrCategoryMap label="العلامة" allSlugs={allSlugs} map={assignments.brandToSlug||{}} onChange={(m)=> setAssignments((s:any)=> ({ ...s, brandToSlug: m }))} />
            </details>
            <details>
              <summary>ربط حسب الفئة</summary>
              <BrandOrCategoryMap label="الفئة" allSlugs={allSlugs} map={assignments.categoryToSlug||{}} onChange={(m)=> setAssignments((s:any)=> ({ ...s, categoryToSlug: m }))} />
            </details>
          </div>
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={save} disabled={saving} className="btn">{saving? 'جارٍ الحفظ...':'حفظ'}</button>
          {toast && <span>{toast}</span>}
        </div>
      </section>
    </main>
  );
}

function BrandOrCategoryMap({ label, allSlugs, map, onChange }:{ label:string; allSlugs:string[]; map:Record<string,string>; onChange:(m:Record<string,string>)=>void }): JSX.Element {
  const [key, setKey] = React.useState("");
  const [value, setValue] = React.useState("");
  const add = ()=>{ if (!key.trim() || !value) return; onChange({ ...map, [key.trim()]: value }); setKey(""); setValue(""); };
  const remove = (k:string)=>{ const m = { ...map }; delete m[k]; onChange(m); };
  return (
    <div style={{ border:'1px solid #1c2333', borderRadius:8, padding:8, display:'grid', gap:8 }}>
      <div style={{ display:'flex', gap:8 }}>
        <input value={key} onChange={(e)=> setKey(e.target.value)} placeholder={`اسم ${label}`} />
        <select value={value} onChange={(e)=> setValue(e.target.value)}>
          <option value="">اختر دليل</option>
          {allSlugs.map(sl=> <option key={sl} value={sl}>{sl}</option>)}
        </select>
        <button onClick={add} className="btn btn-outline">إضافة</button>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>{label}</th>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>Slug</th>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}></th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(map).map(([k,v])=> (
              <tr key={k}>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{k}</td>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{v}</td>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}><button onClick={()=> remove(k)} className="btn btn-outline">حذف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


