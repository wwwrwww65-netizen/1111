"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function CitiesPage(): JSX.Element {
  const router = useRouter();
  const [countries, setCountries] = React.useState<any[]>([]);
  const [countryId, setCountryId] = React.useState<string>("");
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [allChecked, setAllChecked] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1600); };

  const [name, setName] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  async function loadCountries(){
    try{ const r = await fetch("/api/admin/geo/countries", { credentials:'include' }); const j = await r.json(); if(r.ok) setCountries(j.countries||[]); }catch{}
  }
  async function load(){
    setLoading(true); setError("");
    try{
      const qs = countryId? `?countryId=${encodeURIComponent(countryId)}`: '';
      const r = await fetch(`/api/admin/geo/cities${qs}`, { credentials: "include" });
      const j = await r.json();
      if (r.ok) setRows(j.cities || []); else setError(j.error || "failed");
    } catch { setError("network"); }
    finally { setLoading(false); }
  }
  React.useEffect(()=>{ loadCountries(); }, []);
  React.useEffect(()=>{ load(); }, [countryId]);

  function reset(){ setEditing(null); setName(""); setRegion(""); setIsActive(true); }
  function openCreate(){ reset(); setShowForm(true); }
  function openEdit(r:any){ setEditing(r); setName(r.name||""); setRegion(r.region||""); setIsActive(Boolean(r.isActive)); setCountryId(r.countryId||""); setShowForm(true); }

  async function submit(e: React.FormEvent){
    e.preventDefault(); setError("");
    try{
      if(!countryId) throw new Error("اختر الدولة");
      const payload:any = { countryId, name, region: region||undefined, isActive };
      let r: Response;
      if (editing) r = await fetch(`/api/admin/geo/cities/${editing.id}`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
      else r = await fetch('/api/admin/geo/cities', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
      const j = await r.json(); if(!r.ok) throw new Error(j.error||'failed');
      setShowForm(false); reset(); await load(); showToast('تم الحفظ');
    }catch(err:any){ setError(err.message||'failed'); }
  }
  async function remove(id:string){ if(!confirm('حذف المدينة؟')) return; const r = await fetch(`/api/admin/geo/cities/${id}`, { method:'DELETE', credentials:'include' }); if(r.ok) await load(); }

  return (
    <div className="container">
      <main className="panel" style={{ padding:16 }}>
        {toast && (<div className="toast ok" style={{ marginBottom:8 }}>{toast}</div>)}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h1 style={{ margin:0 }}>المحافظات/المدن</h1>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn danger" onClick={async ()=>{
              const ids = Object.keys(selected).filter(id=> selected[id]); if(!ids.length) return;
              for (const id of ids) { try { await fetch(`/api/admin/geo/cities/${id}`, { method:'DELETE', credentials:'include' }); } catch {} }
              setSelected({}); setAllChecked(false); await load(); showToast('تم حذف المحدد');
            }}>حذف المحدد</button>
            <button onClick={openCreate} className="btn">إضافة مدينة</button>
          </div>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <select className="input" value={countryId} onChange={(e)=> setCountryId(e.target.value)}>
            <option value="">اختر الدولة للتصفية</option>
            {countries.map((c:any)=> (<option key={c.id} value={c.id}>{c.name} {c.code? `(${c.code})`: ''}</option>))}
          </select>
        </div>

        {loading ? <div role="status" aria-busy="true" className="skeleton" style={{ height: 180 }} /> : error ? <div className="error" aria-live="assertive">فشل: {error}</div> : (
          <div style={{ overflowX:'auto' }}>
            <table className="table" role="table" aria-label="قائمة المدن">
              <thead><tr><th><input type="checkbox" checked={allChecked} onChange={(e)=>{ const v=e.target.checked; setAllChecked(v); setSelected(Object.fromEntries(rows.map((r:any)=> [r.id, v]))); }} /></th><th>الدولة</th><th>الاسم</th><th>الإقليم/المنطقة</th><th>مفعّلة</th><th></th></tr></thead>
              <tbody>
                {rows.map((r:any)=> (
                  <tr key={r.id}><td><input type="checkbox" checked={!!selected[r.id]} onChange={()=> setSelected(s=> ({...s, [r.id]: !s[r.id]}))} /></td><td>{r.country?.name}</td><td>{r.name}</td><td>{r.region||'-'}</td><td>{r.isActive? 'نعم':'لا'}</td><td>
                    <button aria-label={`تعديل ${r.name}`} onClick={()=>router.push(`/system/geo/cities/${r.id}`)} className="btn btn-outline" style={{ marginInlineEnd:6 }}>تعديل</button>
                    <button aria-label={`حذف ${r.name}`} onClick={()=>remove(r.id)} className="btn btn-danger">حذف</button>
                  </td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="panel" style={{ marginTop:16, padding:16 }}>
            <h2 style={{ marginTop:0 }}>{editing? 'تعديل مدينة' : 'إضافة مدينة'}</h2>
            <form onSubmit={submit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <label>الدولة<select value={countryId} onChange={(e)=> setCountryId(e.target.value)} required className="input">
                <option value="">اختر الدولة</option>
                {countries.map((c:any)=> (<option key={c.id} value={c.id}>{c.name} {c.code? `(${c.code})`: ''}</option>))}
              </select></label>
              <label>الاسم<input value={name} onChange={(e)=> setName(e.target.value)} required className="input" /></label>
              <label style={{ gridColumn:'1 / -1' }}>الإقليم/المنطقة (اختياري)<input value={region} onChange={(e)=> setRegion(e.target.value)} className="input" placeholder="الرياض/مكة/الشرقية..." /></label>
              <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={isActive} onChange={(e)=> setIsActive(e.target.checked)} /> مفعّلة</label>
              <div style={{ gridColumn:'1 / -1', display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="submit" className="btn">حفظ</button>
                <button type="button" onClick={()=> { setShowForm(false); reset(); }} className="btn btn-outline">إلغاء</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
