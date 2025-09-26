"use client";
import React from 'react';

export default function ShippingZonesPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<any|null>(null);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [allChecked, setAllChecked] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=> setToast(''), 1600); };

  const [name, setName] = React.useState('');
  const [countryCodes, setCountryCodes] = React.useState<string>('SA');
  const [regions, setRegions] = React.useState<string>('');
  const [cities, setCities] = React.useState<string>('');
  const [areas, setAreas] = React.useState<string>('');
  const [isActive, setIsActive] = React.useState(true);

  async function load(){
    setLoading(true); setError('');
    try{ const r = await fetch('/api/admin/shipping/zones', { credentials:'include' }); const j = await r.json(); if (r.ok) setRows(j.zones||[]); else setError(j.error||'failed'); }
    catch{ setError('network'); }
    finally{ setLoading(false); }
  }
  React.useEffect(()=>{ load(); }, []);

  function reset(){ setEditing(null); setName(''); setCountryCodes('SA'); setRegions(''); setCities(''); setAreas(''); setIsActive(true); }
  function openCreate(){ reset(); setShowForm(true); }
  function openEdit(r:any){ setEditing(r); setName(r.name||''); setCountryCodes((r.countryCodes||[]).join(',')); setRegions(Array.isArray(r.regions)? r.regions.join(',') : ''); setCities(Array.isArray(r.cities)? r.cities.join(',') : ''); setAreas(Array.isArray(r.areas)? r.areas.join(',') : ''); setIsActive(Boolean(r.isActive)); setShowForm(true); }

  async function submit(e:React.FormEvent){
    e.preventDefault(); setError('');
    try{
      const payload:any = { name, countryCodes: countryCodes.split(',').map(s=>s.trim()).filter(Boolean), isActive };
      if (regions.trim()) payload.regions = regions;
      if (cities.trim()) payload.cities = cities;
      if (areas.trim()) payload.areas = areas;
      let r:Response; if (editing) r = await fetch(`/api/admin/shipping/zones/${editing.id}`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
      else r = await fetch('/api/admin/shipping/zones', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error||'failed'); setShowForm(false); reset(); await load();
      showToast('تم الحفظ');
    }catch(err:any){ setError(err.message||'failed'); }
  }
  async function remove(id:string){ if (!confirm('حذف المنطقة؟')) return; const r = await fetch(`/api/admin/shipping/zones/${id}`, { method:'DELETE', credentials:'include' }); if (r.ok) await load(); }

  return (
    <div className="container">
      <main className="panel" style={{ padding:16 }}>
        {toast && (<div className="toast ok" style={{ marginBottom:8 }}>{toast}</div>)}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h1 style={{ margin:0 }}>مناطق الشحن</h1>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn danger" onClick={async ()=>{
              const ids = Object.keys(selected).filter(id=> selected[id]); if (!ids.length) return;
              for (const id of ids) { try { await fetch(`/api/admin/shipping/zones/${id}`, { method:'DELETE', credentials:'include' }); } catch {} }
              setSelected({}); setAllChecked(false); await load(); showToast('تم حذف المحدد');
            }}>حذف المحدد</button>
            <button onClick={openCreate} className="btn">إضافة منطقة</button>
          </div>
        </div>
        {loading ? <div role="status" aria-busy="true" className="skeleton" style={{ height: 180 }} /> : error ? <div className="error" aria-live="assertive">فشل: {error}</div> : (
          <div style={{ overflowX:'auto' }}>
            <table className="table" role="table" aria-label="قائمة مناطق الشحن">
              <thead><tr><th><input type="checkbox" checked={allChecked} onChange={(e)=>{ const v=e.target.checked; setAllChecked(v); setSelected(Object.fromEntries(rows.map(r=> [r.id, v]))); }} /></th><th>الاسم</th><th>الدول</th><th>مفعّلة</th><th></th></tr></thead>
              <tbody>
                {rows.map(r=> (
                  <tr key={r.id}><td><input type="checkbox" checked={!!selected[r.id]} onChange={()=> setSelected(s=> ({...s, [r.id]: !s[r.id]}))} /></td><td>{r.name}</td><td>{(r.countryCodes||[]).join(', ')}</td><td>{r.isActive? 'نعم':'لا'}</td><td>
                    <button aria-label={`تعديل ${r.name}`} onClick={()=>openEdit(r)} className="btn btn-outline" style={{ marginInlineEnd:6 }}>تعديل</button>
                    <button aria-label={`حذف ${r.name}`} onClick={()=>remove(r.id)} className="btn btn-danger">حذف</button>
                  </td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="panel" style={{ marginTop:16, padding:16 }}>
            <h2 style={{ marginTop:0 }}>{editing? 'تعديل منطقة' : 'إضافة منطقة'}</h2>
            <form onSubmit={submit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <label>الاسم<input aria-label="اسم المنطقة" value={name} onChange={(e)=> setName(e.target.value)} required className="input" /></label>
              <label>الدول (رموز ISO مفصولة بفواصل)<input aria-label="قائمة الدول" value={countryCodes} onChange={(e)=> setCountryCodes(e.target.value)} required className="input" /></label>
              <label style={{ gridColumn:'1 / -1' }}>المحافظات/الأقاليم (أدخل أسماء مفصولة بفواصل)<textarea value={regions} onChange={(e)=> setRegions(e.target.value)} rows={2} className="input" placeholder='الرياض، مكة، الشرقية' /></label>
              <label style={{ gridColumn:'1 / -1' }}>المدن (أدخل أسماء مفصولة بفواصل)<textarea value={cities} onChange={(e)=> setCities(e.target.value)} rows={2} className="input" placeholder='الرياض، جدة، الدمام' /></label>
              <label style={{ gridColumn:'1 / -1' }}>المناطق/الأحياء (أدخل أسماء مفصولة بفواصل)<textarea value={areas} onChange={(e)=> setAreas(e.target.value)} rows={2} className="input" placeholder='النسيم، العليا، الصفوة' /></label>
              <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={isActive} onChange={(e)=> setIsActive(e.target.checked)} /> مفعّلة</label>
              <div style={{ gridColumn:'1 / -1', display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button aria-label="حفظ المنطقة" type="submit" className="btn">حفظ</button>
                <button type="button" onClick={()=> { setShowForm(false); reset(); }} className="btn btn-outline">إلغاء</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

