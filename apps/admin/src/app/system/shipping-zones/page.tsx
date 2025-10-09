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

  // Unified view rows (Country/City/Area) with inline edit/delete
  const [unRows, setUnRows] = React.useState<any[]>([]);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<any|null>(null);
  const [formName, setFormName] = React.useState('');
  const [formCode, setFormCode] = React.useState('');
  const [formRegion, setFormRegion] = React.useState('');
  const [formCountryId, setFormCountryId] = React.useState('');
  const [formCityId, setFormCityId] = React.useState('');
  const [formActive, setFormActive] = React.useState(true);

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

  // Build unified rows (countries/cities/areas)
  React.useEffect(()=>{
    (async()=>{
      try{
        const [cR, ciR, aR] = await Promise.all([
          fetch('/api/admin/geo/countries', { credentials:'include' }),
          fetch('/api/admin/geo/cities', { credentials:'include' }),
          fetch('/api/admin/geo/areas', { credentials:'include' }),
        ]);
        const cJ = await cR.json(); const ciJ = await ciR.json(); const aJ = await aR.json();
        const countries = (cJ.countries||[]).map((c:any)=> ({ type:'country', id:c.id, name:c.name, code:c.code||'', active: !!c.isActive }));
        const cities = (ciJ.cities||[]).map((x:any)=> ({ type:'city', id:x.id, name:x.name, region:x.region||'', countryId:x.countryId, countryName:x.country?.name||'', active: !!x.isActive }));
        const areas = (aJ.areas||[]).map((x:any)=> ({ type:'area', id:x.id, name:x.name, cityId:x.cityId, cityName:x.city?.name||'', countryId:x.city?.country?.id||'', countryName:x.city?.country?.name||'', active: !!x.isActive }));
        setUnRows([...countries, ...cities, ...areas]);
      }catch{}
    })();
  }, [toast]);

  // Load lists for edit form
  React.useEffect(()=>{
    if (!editOpen) return;
    loadCountries();
    if (formCountryId) loadCities(formCountryId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOpen]);
  React.useEffect(()=>{ if (editOpen && formCountryId) loadCities(formCountryId); // keep city list in sync
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formCountryId]);

  function appendCSV(setter: (v:string)=>void, current: string, value: string){
    const arr = current.split(',').map(s=>s.trim()).filter(Boolean);
    if(!arr.includes(value)) arr.push(value);
    setter(arr.join(', '));
  }
  function removeFromCSV(setter:(v:string)=>void, current:string, value:string){
    const arr = current.split(',').map(s=>s.trim()).filter(Boolean).filter(v=> v!==value);
    setter(arr.join(', '));
  }

  // Geo cascade: Countries -> Cities -> Areas (duplicate handlers removed)

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
                <button className="btn" onClick={async()=>{ try{ const r = await fetch('/api/admin/shipping/zones/sync-from-geo', { method:'POST', credentials:'include' }); if(!r.ok) throw 0; await load(); showToast('تمت المزامنة'); }catch{ showToast('فشل المزامنة'); } }}>مزامنة الآن</button>
              </div>
            </div>

            {loading ? <div role="status" aria-busy="true" className="skeleton" style={{ height: 180 }} /> : error ? <div className="error" aria-live="assertive">فشل: {error}</div> : (
              <div style={{ overflowX:'auto' }}>
                <table className="table" role="table" aria-label="قائمة موحّدة (دول/مدن/مناطق)">
                  <thead><tr><th>النوع</th><th>الاسم</th><th>تفاصيل</th><th>مفعّلة</th><th>إجراءات</th></tr></thead>
                  <tbody>
                    {unRows.map((r:any)=> (
                      <tr key={`${r.type}:${r.id}`}>
                        <td>{r.type==='country'? 'دولة' : r.type==='city'? 'مدينة' : 'منطقة'}</td>
                        <td>{r.name}{r.code? ` (${r.code})`: ''}</td>
                        <td>{r.type==='country'? '-' : r.type==='city'? (`دولة: ${r.countryName}${r.region? ` — إقليم: ${r.region}`:''}`) : (`دولة: ${r.countryName} — مدينة: ${r.cityName}`)}</td>
                        <td>{r.active? 'نعم':'لا'}</td>
                        <td>
                          <button className="btn btn-outline" onClick={()=>{ setEditRow(r); setFormName(r.name||''); setFormCode(r.code||''); setFormRegion(r.region||''); setFormCountryId(r.countryId||''); setFormCityId(r.cityId||''); setFormActive(!!r.active); setEditOpen(true); }}>تعديل</button>
                          <button className="btn btn-danger" style={{ marginInlineStart:6 }} onClick={async()=>{
                            try{
                              if (!confirm('تأكيد الحذف؟')) return;
                              if (r.type==='country') { await fetch(`/api/admin/geo/countries/${r.id}`, { method:'DELETE', credentials:'include' }); }
                              if (r.type==='city') { await fetch(`/api/admin/geo/cities/${r.id}`, { method:'DELETE', credentials:'include' }); }
                              if (r.type==='area') { await fetch(`/api/admin/geo/areas/${r.id}`, { method:'DELETE', credentials:'include' }); }
                              showToast('تم الحذف');
                            }catch{ showToast('فشل الحذف'); }
                          }}>حذف</button>
                        </td>
                      </tr>
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
        {/* Edit Drawer/Modal */}
        {editOpen && (
          <div className="panel" style={{ marginTop:12, padding:16 }}>
            <h3 style={{ marginTop:0 }}>تعديل {editRow?.type==='country'? 'الدولة' : editRow?.type==='city'? 'المدينة' : 'المنطقة'}</h3>
            <form onSubmit={async (e)=>{
              e.preventDefault();
              try{
                if (editRow?.type==='country') {
                  const r = await fetch(`/api/admin/geo/countries/${editRow.id}`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ name: formName, code: formCode||undefined, isActive: formActive }) });
                  if (!r.ok) throw 0;
                }
                if (editRow?.type==='city') {
                  const payload:any = { name: formName, region: formRegion||undefined, isActive: formActive };
                  if (formCountryId) payload.countryId = formCountryId;
                  const r = await fetch(`/api/admin/geo/cities/${editRow.id}`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
                  if (!r.ok) throw 0;
                }
                if (editRow?.type==='area') {
                  const payload:any = { name: formName, isActive: formActive };
                  if (formCityId) payload.cityId = formCityId;
                  const r = await fetch(`/api/admin/geo/areas/${editRow.id}`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
                  if (!r.ok) throw 0;
                }
                setEditOpen(false); setEditRow(null); setFormName(''); setFormCode(''); setFormRegion(''); setFormCountryId(''); setFormCityId('');
                showToast('تم الحفظ');
              }catch{ showToast('فشل الحفظ'); }
            }} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <label>الاسم<input className="input" value={formName} onChange={(e)=> setFormName(e.target.value)} required /></label>
              {editRow?.type==='country' && (
                <label>رمز الدولة (ISO)<input className="input" value={formCode} onChange={(e)=> setFormCode(e.target.value.toUpperCase())} maxLength={3} /></label>
              )}
              {editRow?.type==='city' && (
                <>
                  <label>الدولة<select className="input" value={formCountryId} onChange={(e)=> setFormCountryId(e.target.value)}>
                    <option value="">اختر الدولة</option>
                    {countriesOptions.map((c:any)=> (<option key={c.id} value={c.id}>{c.name}{c.code? ` (${c.code})`: ''}</option>))}
                  </select></label>
                  <label style={{ gridColumn:'1 / -1' }}>الإقليم/المنطقة<input className="input" value={formRegion} onChange={(e)=> setFormRegion(e.target.value)} placeholder="اختياري" /></label>
                </>
              )}
              {editRow?.type==='area' && (
                <>
                  <label>الدولة<select className="input" value={formCountryId} onChange={(e)=> setFormCountryId(e.target.value)}>
                    <option value="">اختر الدولة</option>
                    {countriesOptions.map((c:any)=> (<option key={c.id} value={c.id}>{c.name}{c.code? ` (${c.code})`: ''}</option>))}
                  </select></label>
                  <label>المدينة<select className="input" value={formCityId} onChange={(e)=> setFormCityId(e.target.value)} disabled={!formCountryId}>
                    <option value="">اختر المدينة</option>
                    {citiesOptions.map((c:any)=> (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select></label>
                </>
              )}
              <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={formActive} onChange={(e)=> setFormActive(e.target.checked)} /> مفعّلة</label>
              <div style={{ gridColumn:'1 / -1', display:'flex', justifyContent:'flex-end', gap:8 }}>
                <button type="submit" className="btn">حفظ</button>
                <button type="button" className="btn btn-outline" onClick={()=>{ setEditOpen(false); setEditRow(null); }}>إلغاء</button>
              </div>
            </form>
          </div>
        )}

        {/* creation/editing form removed in unified table mode */}
      </main>
    </div>
  );
}

