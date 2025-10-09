"use client";
import React from 'react';
import CountriesPage from '../geo/countries/page';
import CitiesPage from '../geo/cities/page';
import AreasPage from '../geo/areas/page';

export default function ShippingZonesPage(): JSX.Element {
  const [tab, setTab] = React.useState<'zones'|'countries'|'cities'|'areas'>('zones');
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
  const [query, setQuery] = React.useState('');
  const [onlyActive, setOnlyActive] = React.useState(false);

  // Geo cascade: Countries -> Cities -> Areas (picker helpers)
  const [geoLoading, setGeoLoading] = React.useState(false);
  const [countriesOptions, setCountriesOptions] = React.useState<any[]>([]);
  const [citiesOptions, setCitiesOptions] = React.useState<any[]>([]);
  const [areasOptions, setAreasOptions] = React.useState<any[]>([]);
  const [selCountryId, setSelCountryId] = React.useState<string>('');
  const [selCityId, setSelCityId] = React.useState<string>('');
  const [selAreaId, setSelAreaId] = React.useState<string>('');

  async function loadCountries(){
    try{ setGeoLoading(true); const r = await fetch('/api/admin/geo/countries', { credentials:'include' }); const j = await r.json(); if(r.ok) setCountriesOptions(j.countries||[]); }
    catch{} finally{ setGeoLoading(false); }
  }
  async function loadCities(countryId:string){
    if(!countryId){ setCitiesOptions([]); return; }
    try{ setGeoLoading(true); const r = await fetch(`/api/admin/geo/cities?countryId=${encodeURIComponent(countryId)}`, { credentials:'include' }); const j = await r.json(); if(r.ok) setCitiesOptions(j.cities||[]); }
    catch{} finally{ setGeoLoading(false); }
  }
  async function loadAreas(cityId:string){
    if(!cityId){ setAreasOptions([]); return; }
    try{ setGeoLoading(true); const r = await fetch(`/api/admin/geo/areas?cityId=${encodeURIComponent(cityId)}`, { credentials:'include' }); const j = await r.json(); if(r.ok) setAreasOptions(j.areas||[]); }
    catch{} finally{ setGeoLoading(false); }
  }
  React.useEffect(()=>{ loadCountries(); }, []);
  React.useEffect(()=>{ setSelCityId(''); setAreasOptions([]); loadCities(selCountryId); }, [selCountryId]);
  React.useEffect(()=>{ setSelAreaId(''); loadAreas(selCityId); }, [selCityId]);

  function appendCSV(setter: (v:string)=>void, current: string, value: string){
    const arr = current.split(',').map(s=>s.trim()).filter(Boolean);
    if(!arr.includes(value)) arr.push(value);
    setter(arr.join(', '));
  }
  function removeFromCSV(setter:(v:string)=>void, current:string, value:string){
    const arr = current.split(',').map(s=>s.trim()).filter(Boolean).filter(v=> v!==value);
    setter(arr.join(', '));
  }

  // Geo cascade: Countries -> Cities -> Areas (picker helpers)
  const [geoLoading, setGeoLoading] = React.useState(false);
  const [countriesOptions, setCountriesOptions] = React.useState<any[]>([]);
  const [citiesOptions, setCitiesOptions] = React.useState<any[]>([]);
  const [areasOptions, setAreasOptions] = React.useState<any[]>([]);
  const [selCountryId, setSelCountryId] = React.useState<string>('');
  const [selCityId, setSelCityId] = React.useState<string>('');
  const [selAreaId, setSelAreaId] = React.useState<string>('');

  async function loadCountries(){
    try{ setGeoLoading(true); const r = await fetch('/api/admin/geo/countries', { credentials:'include' }); const j = await r.json(); if(r.ok) setCountriesOptions(j.countries||[]); }
    catch{} finally{ setGeoLoading(false); }
  }
  async function loadCities(countryId:string){
    if(!countryId){ setCitiesOptions([]); return; }
    try{ setGeoLoading(true); const r = await fetch(`/api/admin/geo/cities?countryId=${encodeURIComponent(countryId)}`, { credentials:'include' }); const j = await r.json(); if(r.ok) setCitiesOptions(j.cities||[]); }
    catch{} finally{ setGeoLoading(false); }
  }
  async function loadAreas(cityId:string){
    if(!cityId){ setAreasOptions([]); return; }
    try{ setGeoLoading(true); const r = await fetch(`/api/admin/geo/areas?cityId=${encodeURIComponent(cityId)}`, { credentials:'include' }); const j = await r.json(); if(r.ok) setAreasOptions(j.areas||[]); }
    catch{} finally{ setGeoLoading(false); }
  }
  React.useEffect(()=>{ loadCountries(); }, []);
  React.useEffect(()=>{ setSelCityId(''); setAreasOptions([]); loadCities(selCountryId); }, [selCountryId]);
  React.useEffect(()=>{ setSelAreaId(''); loadAreas(selCityId); }, [selCityId]);

  function appendCSV(setter: (v:string)=>void, current: string, value: string){
    const arr = current.split(',').map(s=>s.trim()).filter(Boolean);
    if(!arr.includes(value)) arr.push(value);
    setter(arr.join(', '));
  }
  function removeFromCSV(setter:(v:string)=>void, current:string, value:string){
    const arr = current.split(',').map(s=>s.trim()).filter(Boolean).filter(v=> v!==value);
    setter(arr.join(', '));
  }

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
  async function remove(id:string){ if (!confirm('حذف المنطقة؟')) return; const r = await fetch(`/api/admin/shipping/zones/${id}`, { method:'DELETE', credentials:'include' }); if (r.ok) { await load(); showToast('تم الحذف'); } }

  function exportCSV(){
    try{
      const hdr = ['id','name','countryCodes','regions','cities','areas','isActive','createdAt'];
      const lines = [hdr.join(',')].concat(
        (rows||[]).map((r:any)=> [
          r.id,
          JSON.stringify(r.name||''),
          JSON.stringify((r.countryCodes||[]).join('|')),
          JSON.stringify(Array.isArray(r.regions)? r.regions.join('|'): ''),
          JSON.stringify(Array.isArray(r.cities)? r.cities.join('|'): ''),
          JSON.stringify(Array.isArray(r.areas)? r.areas.join('|'): ''),
          r.isActive? '1':'0',
          r.createdAt||''
        ].join(','))
      );
      const blob = new Blob([lines.join('\n')], { type:'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'shipping_zones.csv'; a.click(); URL.revokeObjectURL(a.href);
    }catch{}
  }

  const filtered = rows.filter((r:any)=>{
    if (onlyActive && !r.isActive) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    const cc = (r.countryCodes||[]).join(', ');
    return String(r.name||'').toLowerCase().includes(q) || cc.toLowerCase().includes(q);
  });

  return (
    <div className="container">
      <main className="panel" style={{ padding:16 }}>
        {toast && (<div className="toast ok" style={{ marginBottom:8 }}>{toast}</div>)}
        {/* Tabs */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
          <nav aria-label="التبويبات" style={{ display:'flex', gap:8 }}>
            {[
              { key:'zones', label:'مناطق الشحن' },
              { key:'countries', label:'الدول' },
              { key:'cities', label:'المحافظات/المدن' },
              { key:'areas', label:'المناطق/الأحياء' },
            ].map((t:any)=> (
              <button key={t.key} onClick={()=> setTab(t.key)} className={`btn ${tab===t.key? '' : 'btn-outline'}`} aria-pressed={tab===t.key}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {tab==='zones' && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h1 style={{ margin:0 }}>مناطق الشحن</h1>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input className="input" placeholder="بحث بالاسم/الدول" value={query} onChange={(e)=> setQuery(e.target.value)} />
                <label style={{ display:'flex', alignItems:'center', gap:6 }}><input type="checkbox" checked={onlyActive} onChange={(e)=> setOnlyActive(e.target.checked)} /> فعّالة فقط</label>
                <button className="btn" onClick={exportCSV}>تصدير CSV</button>
                <button className="btn" onClick={load}>تحديث</button>
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
                  <thead><tr><th><input type="checkbox" checked={allChecked} onChange={(e)=>{ const v=e.target.checked; setAllChecked(v); setSelected(Object.fromEntries(filtered.map((r:any)=> [r.id, v]))); }} /></th><th>الاسم</th><th>الدول</th><th>محافظات</th><th>مدن</th><th>مناطق</th><th>مفعّلة</th><th></th></tr></thead>
                  <tbody>
                    {filtered.map((r:any)=> (
                      <tr key={r.id}><td><input type="checkbox" checked={!!selected[r.id]} onChange={()=> setSelected(s=> ({...s, [r.id]: !s[r.id]}))} /></td><td>{r.name}</td><td>{(r.countryCodes||[]).join(', ')}</td><td>{Array.isArray(r.regions)? r.regions.length: 0}</td><td>{Array.isArray(r.cities)? r.cities.length: 0}</td><td>{Array.isArray(r.areas)? r.areas.length: 0}</td><td>{r.isActive? 'نعم':'لا'}</td><td>
                        <button aria-label={`تعديل ${r.name}`} onClick={()=>openEdit(r)} className="btn btn-outline" style={{ marginInlineEnd:6 }}>تعديل</button>
                        <button aria-label={`حذف ${r.name}`} onClick={()=>remove(r.id)} className="btn btn-danger">حذف</button>
                      </td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab==='countries' && (
          <div className="panel" style={{ marginTop:8 }}>
            <CountriesPage />
          </div>
        )}
        {tab==='cities' && (
          <div className="panel" style={{ marginTop:8 }}>
            <CitiesPage />
          </div>
        )}
        {tab==='areas' && (
          <div className="panel" style={{ marginTop:8 }}>
            <AreasPage />
          </div>
        )}
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

        {tab==='zones' && showForm && (
          <div className="panel" style={{ marginTop:16, padding:16 }}>
            <h2 style={{ marginTop:0 }}>{editing? 'تعديل منطقة' : 'إضافة منطقة'}</h2>
            <form onSubmit={submit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <label>الاسم<input aria-label="اسم المنطقة" value={name} onChange={(e)=> setName(e.target.value)} required className="input" /></label>
              <label>الدول (رموز ISO مفصولة بفواصل)
                <div style={{ display:'flex', gap:8 }}>
                  <input aria-label="قائمة الدول" value={countryCodes} onChange={(e)=> setCountryCodes(e.target.value)} required className="input" />
                  <select className="input" value={selCountryId} onChange={(e)=> setSelCountryId(e.target.value)}>
                    <option value="">اختر دولة</option>
                    {countriesOptions.map((c:any)=> (<option key={c.id} value={c.id}>{c.name}{c.code? ` (${c.code})`:''}</option>))}
                  </select>
                  <button type="button" className="btn" disabled={!selCountryId || geoLoading} onClick={()=>{
                    const c = countriesOptions.find((x:any)=> x.id===selCountryId);
                    const code = (c?.code || c?.name || '').toString().trim().toUpperCase(); if(!code) return;
                    appendCSV(setCountryCodes, countryCodes, code);
                  }}>إضافة</button>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                  {countryCodes.split(',').map(s=> s.trim()).filter(Boolean).map(code=> (
                    <span key={code} className="chip">{code}<button type="button" aria-label={`إزالة ${code}`} onClick={()=> removeFromCSV(setCountryCodes, countryCodes, code)} className="chip-del">×</button></span>
                  ))}
                </div>
              </label>
              <label style={{ gridColumn:'1 / -1' }}>المحافظات/الأقاليم (أدخل أسماء مفصولة بفواصل)
                <textarea value={regions} onChange={(e)=> setRegions(e.target.value)} rows={2} className="input" placeholder='الرياض، مكة، الشرقية' />
              </label>
              <label style={{ gridColumn:'1 / -1' }}>المدن (أدخل أسماء مفصولة بفواصل)
                <div style={{ display:'flex', gap:8 }}>
                  <textarea value={cities} onChange={(e)=> setCities(e.target.value)} rows={2} className="input" placeholder='الرياض، جدة، الدمام' />
                  <select className="input" value={selCityId} onChange={(e)=> setSelCityId(e.target.value)} disabled={!selCountryId}>
                    <option value="">اختر مدينة</option>
                    {citiesOptions.map((c:any)=> (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                  <button type="button" className="btn" disabled={!selCityId || geoLoading} onClick={()=>{
                    const c = citiesOptions.find((x:any)=> x.id===selCityId);
                    const nm = (c?.name||'').toString().trim(); if(!nm) return;
                    appendCSV(setCities, cities, nm);
                  }}>إضافة</button>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                  {cities.split(',').map(s=> s.trim()).filter(Boolean).map(nm=> (
                    <span key={nm} className="chip">{nm}<button type="button" aria-label={`إزالة ${nm}`} onClick={()=> removeFromCSV(setCities, cities, nm)} className="chip-del">×</button></span>
                  ))}
                </div>
              </label>
              <label style={{ gridColumn:'1 / -1' }}>المناطق/الأحياء (أدخل أسماء مفصولة بفواصل)
                <div style={{ display:'flex', gap:8 }}>
                  <textarea value={areas} onChange={(e)=> setAreas(e.target.value)} rows={2} className="input" placeholder='النسيم، العليا، الصفوة' />
                  <select className="input" value={selAreaId} onChange={(e)=> setSelAreaId(e.target.value)} disabled={!selCityId}>
                    <option value="">اختر منطقة</option>
                    {areasOptions.map((a:any)=> (<option key={a.id} value={a.id}>{a.name}</option>))}
                  </select>
                  <button type="button" className="btn" disabled={!selAreaId || geoLoading} onClick={()=>{
                    const a = areasOptions.find((x:any)=> x.id===selAreaId);
                    const nm = (a?.name||'').toString().trim(); if(!nm) return;
                    appendCSV(setAreas, areas, nm);
                  }}>إضافة</button>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                  {areas.split(',').map(s=> s.trim()).filter(Boolean).map(nm=> (
                    <span key={nm} className="chip">{nm}<button type="button" aria-label={`إزالة ${nm}`} onClick={()=> removeFromCSV(setAreas, areas, nm)} className="chip-del">×</button></span>
                  ))}
                </div>
              </label>
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

