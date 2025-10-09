"use client";
import React from 'react';

export default function ShippingRatesPage(): JSX.Element {
  const [zones, setZones] = React.useState<any[]>([]);
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<any|null>(null);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [allChecked, setAllChecked] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=> setToast(''), 1600); };

  const [zoneId, setZoneId] = React.useState('');
  const [carrier, setCarrier] = React.useState('');
  const [currency, setCurrency] = React.useState<string>('');
  const [baseFee, setBaseFee] = React.useState<number>(0);
  const [perKgFee, setPerKgFee] = React.useState<number|''>('');
  const [minWeightKg, setMinWeightKg] = React.useState<number|''>('');
  const [maxWeightKg, setMaxWeightKg] = React.useState<number|''>('');
  const [minSubtotal, setMinSubtotal] = React.useState<number|''>('');
  const [freeOverSubtotal, setFreeOverSubtotal] = React.useState<number|''>('');
  const [etaMinHours, setEtaMinHours] = React.useState<number|''>('');
  const [etaMaxHours, setEtaMaxHours] = React.useState<number|''>('');
  const [offerTitle, setOfferTitle] = React.useState('');
  const [activeFrom, setActiveFrom] = React.useState<string>('');
  const [activeUntil, setActiveUntil] = React.useState<string>('');
  const [isActive, setIsActive] = React.useState(true);

  // Geo cascade: Country -> City -> Area (UI helper)
  const [geoLoading, setGeoLoading] = React.useState(false);
  const [countriesOptions, setCountriesOptions] = React.useState<any[]>([]);
  const [citiesOptions, setCitiesOptions] = React.useState<any[]>([]);
  const [areasOptions, setAreasOptions] = React.useState<any[]>([]);
  const [countryId, setCountryId] = React.useState<string>('');
  const [cityId, setCityId] = React.useState<string>('');
  const [areaId, setAreaId] = React.useState<string>('');
  const [currencies, setCurrencies] = React.useState<Array<{id:string;code:string;name:string;symbol:string;isBase:boolean}>>([]);

  async function load(){
    setLoading(true); setError('');
    try{ const z = await fetch('/api/admin/shipping/zones', { credentials:'include' }); const zj = await z.json(); if (z.ok) setZones(zj.zones||[]);
      const r = await fetch('/api/admin/shipping/rates', { credentials:'include' }); const j = await r.json(); if (r.ok) setRows(j.rates||[]); else setError(j.error||'failed');
    }catch{ setError('network'); }
    finally{ setLoading(false); }
  }
  React.useEffect(()=>{ load(); }, []);

  // Load geo lists
  async function loadCountries(){
    try{ setGeoLoading(true); const r = await fetch('/api/admin/geo/countries', { credentials:'include' }); const j = await r.json(); if (r.ok) setCountriesOptions(j.countries||[]); }
    catch{} finally{ setGeoLoading(false); }
  }
  async function loadCities(cid:string){
    if(!cid){ setCitiesOptions([]); return; }
    try{ setGeoLoading(true); const r = await fetch(`/api/admin/geo/cities?countryId=${encodeURIComponent(cid)}`, { credentials:'include' }); const j = await r.json(); if (r.ok) setCitiesOptions(j.cities||[]); }
    catch{} finally{ setGeoLoading(false); }
  }
  async function loadAreas(ccid:string){
    if(!ccid){ setAreasOptions([]); return; }
    try{ setGeoLoading(true); const r = await fetch(`/api/admin/geo/areas?cityId=${encodeURIComponent(ccid)}`, { credentials:'include' }); const j = await r.json(); if (r.ok) setAreasOptions(j.areas||[]); }
    catch{} finally{ setGeoLoading(false); }
  }
  React.useEffect(()=>{ loadCountries(); }, []);
  React.useEffect(()=>{ (async()=>{ try{ const r=await fetch('/api/admin/currencies', { credentials:'include' }); const j=await r.json(); if(r.ok) setCurrencies(j.currencies||[]);}catch{ setCurrencies([]);} })(); }, []);
  React.useEffect(()=>{ setCityId(''); setAreaId(''); setCitiesOptions([]); setAreasOptions([]); if(countryId) loadCities(countryId); }, [countryId]);
  React.useEffect(()=>{ setAreaId(''); setAreasOptions([]); if(cityId) loadAreas(cityId); }, [cityId]);

  function reset(){ setEditing(null); setZoneId(''); setCarrier(''); setBaseFee(0); setPerKgFee(''); setMinWeightKg(''); setMaxWeightKg(''); setMinSubtotal(''); setFreeOverSubtotal(''); setEtaMinHours(''); setEtaMaxHours(''); setOfferTitle(''); setActiveFrom(''); setActiveUntil(''); setIsActive(true); }
  function openCreate(){ reset(); setShowForm(true); }
  function openEdit(r:any){ setEditing(r); setZoneId(r.zoneId||''); setCarrier(r.carrier||''); setCurrency(r.currency||''); setBaseFee(Number(r.baseFee||0)); setPerKgFee(r.perKgFee??''); setMinWeightKg(r.minWeightKg??''); setMaxWeightKg(r.maxWeightKg??''); setMinSubtotal(r.minSubtotal??''); setFreeOverSubtotal(r.freeOverSubtotal??''); setEtaMinHours(r.etaMinHours??''); setEtaMaxHours(r.etaMaxHours??''); setOfferTitle(r.offerTitle||''); setActiveFrom(r.activeFrom? String(r.activeFrom).slice(0,16):''); setActiveUntil(r.activeUntil? String(r.activeUntil).slice(0,16):''); setIsActive(Boolean(r.isActive)); setShowForm(true); }
  // Auto-filter zones by selected geo
  const filteredZones = React.useMemo(()=>{
    if (!countryId && !cityId && !areaId) return zones;
    // zones are synced per country code and lists of cities/areas by name; we can heuristically filter by name match when available
    // We only have IDs for geo; fetch names from options
    const country = countriesOptions.find((c:any)=> c.id===countryId);
    const city = citiesOptions.find((c:any)=> c.id===cityId);
    const area = areasOptions.find((a:any)=> a.id===areaId);
    return zones.filter((z:any)=>{
      // If area selected, require zone.areas include area.name
      if (area && Array.isArray(z.areas) && !z.areas.includes(area.name)) return false;
      // If city selected, require zone.cities include city.name
      if (city && Array.isArray(z.cities) && !z.cities.includes(city.name)) return false;
      // If country selected, require countryCodes include country code or code from name
      if (country) {
        const codes:string[] = Array.isArray(z.countryCodes)? z.countryCodes: [];
        const iso = (country.code||'').toUpperCase();
        const nameCode = (country.name||'').trim().toUpperCase().slice(0,2);
        if (!codes.includes(iso) && !codes.includes(nameCode)) return false;
      }
      return true;
    });
  }, [zones, countryId, cityId, areaId, countriesOptions, citiesOptions, areasOptions]);

  // Auto-select zone when there is a match; prefer the first if multiple; clear if current not in filtered
  React.useEffect(()=>{
    if (filteredZones.length >= 1) {
      const preferId = zoneId && filteredZones.some((z:any)=> z.id===zoneId) ? zoneId : filteredZones[0]?.id;
      if (preferId && zoneId !== preferId) setZoneId(preferId);
    } else if (zoneId) { setZoneId(''); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredZones, countryId, cityId, areaId]);

  async function submit(e:React.FormEvent){
    e.preventDefault(); setError('');
    try{
      const payload:any = { zoneId, carrier: carrier||undefined, currency: currency||undefined, baseFee: Number(baseFee), perKgFee: perKgFee===''? undefined : Number(perKgFee), minWeightKg: minWeightKg===''? undefined : Number(minWeightKg), maxWeightKg: maxWeightKg===''? undefined : Number(maxWeightKg), minSubtotal: minSubtotal===''? undefined : Number(minSubtotal), freeOverSubtotal: freeOverSubtotal===''? undefined : Number(freeOverSubtotal), etaMinHours: etaMinHours===''? undefined : Number(etaMinHours), etaMaxHours: etaMaxHours===''? undefined : Number(etaMaxHours), offerTitle: offerTitle||undefined, activeFrom: activeFrom||undefined, activeUntil: activeUntil||undefined, isActive };
      let r:Response; if (editing) r = await fetch(`/api/admin/shipping/rates/${editing.id}`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
      else r = await fetch('/api/admin/shipping/rates', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error||'failed'); setShowForm(false); reset(); await load();
      alert('تم الحفظ');
    }catch(err:any){ setError(err.message||'failed'); }
  }

  async function remove(id:string){ if (!confirm('حذف السعر؟')) return; const r = await fetch(`/api/admin/shipping/rates/${id}`, { method:'DELETE', credentials:'include' }); if (r.ok) await load(); }

  return (
    <div className="container">
      <main className="panel" style={{ padding:16 }}>
        {toast && (<div className="toast ok" style={{ marginBottom:8 }}>{toast}</div>)}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h1 style={{ margin:0 }}>أسعار التوصيل</h1>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn danger" onClick={async ()=>{
              const ids = Object.keys(selected).filter(id=> selected[id]); if (!ids.length) return;
              for (const id of ids) { try { await fetch(`/api/admin/shipping/rates/${id}`, { method:'DELETE', credentials:'include' }); } catch {} }
              setSelected({}); setAllChecked(false); await load(); showToast('تم حذف المحدد');
            }}>حذف المحدد</button>
            <button onClick={openCreate} className="btn">إضافة سعر</button>
          </div>
        </div>
        {loading ? <div role="status" aria-busy="true" className="skeleton" style={{ height: 200 }} /> : error ? <div className="error" aria-live="assertive">فشل: {error}</div> : (
          <div style={{ overflowX:'auto' }}>
            <table className="table" role="table" aria-label="قائمة أسعار التوصيل">
              <thead><tr><th><input type="checkbox" checked={allChecked} onChange={(e)=>{ const v=e.target.checked; setAllChecked(v); setSelected(Object.fromEntries(rows.map(r=> [r.id, v]))); }} /></th><th>المنطقة</th><th>المشغل</th><th>الرسوم الأساسية</th><th>لكل كجم</th><th>مجاني فوق</th><th>ETA</th><th>نشط</th><th></th></tr></thead>
              <tbody>
                {rows.map(r=> (
                  <tr key={r.id}>
                    <td><input type="checkbox" checked={!!selected[r.id]} onChange={()=> setSelected(s=> ({...s, [r.id]: !s[r.id]}))} /></td>
                    <td>{zones.find(z=>z.id===r.zoneId)?.name || r.zoneId}</td>
                    <td>{r.carrier||'—'}</td>
                    <td>{r.baseFee}</td>
                    <td>{r.perKgFee??'—'}</td>
                    <td>{r.freeOverSubtotal??'—'}</td>
                    <td>{r.etaMinHours? `${r.etaMinHours}-${r.etaMaxHours||r.etaMinHours} ساعة` : '—'}</td>
                    <td>{r.isActive? 'نعم':'لا'}</td>
                    <td>
                      <button aria-label={`تعديل سعر ${zones.find(z=>z.id===r.zoneId)?.name||''}`} onClick={()=>openEdit(r)} className="btn btn-outline" style={{ marginInlineEnd:6 }}>تعديل</button>
                      <button aria-label={`حذف سعر ${zones.find(z=>z.id===r.zoneId)?.name||''}`} onClick={()=>remove(r.id)} className="btn btn-danger">حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="panel" style={{ marginTop:16, padding:16 }}>
            <h2 style={{ marginTop:0 }}>{editing? 'تعديل سعر' : 'إضافة سعر'}</h2>
            <form onSubmit={submit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }} aria-label="نموذج سعر التوصيل">
              <label>الدولة
                <select value={countryId} onChange={(e)=> setCountryId(e.target.value)} className="select">
                  <option value="">اختر دولة</option>
                  {countriesOptions.map((c:any)=> (<option key={c.id} value={c.id}>{c.name}{c.code? ` (${c.code})`: ''}</option>))}
                </select>
              </label>
              <label>المدينة
                <select value={cityId} onChange={(e)=> setCityId(e.target.value)} className="select" disabled={!countryId}>
                  <option value="">اختر مدينة</option>
                  {citiesOptions.map((c:any)=> (<option key={c.id} value={c.id}>{c.name}{c.region? ` — ${c.region}`:''}</option>))}
                </select>
              </label>
              <label>المنطقة
                <select value={areaId} onChange={(e)=> setAreaId(e.target.value)} className="select" disabled={!cityId}>
                  <option value="">اختر منطقة</option>
                  {areasOptions.map((a:any)=> (<option key={a.id} value={a.id}>{a.name}</option>))}
                </select>
              </label>
              <div style={{ gridColumn:'1 / -1' }}>
                {filteredZones.length>0 ? (
                  <div className="panel" style={{ padding:10 }}>
                    <div style={{ color:'#666', fontSize:12, marginBottom:6 }}>سيتم استخدام منطقة الشحن المطابقة تلقائيًا</div>
                    <div><b>{(zones.find(z=> z.id===zoneId)?.name) || filteredZones[0]?.name}</b></div>
                  </div>
                ) : (
                  <div className="error" aria-live="polite">لا توجد منطقة شحن مطابقة — استخدم مزامنة المناطق أو أضف دولة/مدينة/منطقة</div>
                )}
              </div>
              <label>العملة
                <select className="select" value={currency} onChange={(e)=> setCurrency(e.target.value)}>
                  <option value="">اختر عملة</option>
                  {currencies.map((c)=> (
                    <option key={c.id} value={c.code}>{c.code} — {c.name} {c.isBase? '(الأساسية)': ''}</option>
                  ))}
                </select>
              </label>
              <label>المشغل (اختياري)<input value={carrier} onChange={(e)=> setCarrier(e.target.value)} className="input" /></label>
              <label>السعر الأساسي<input inputMode="decimal" pattern="[0-9]+([.,][0-9]+)?" value={String(baseFee)} onChange={(e)=> setBaseFee(Number(String(e.target.value).replace(',','.'))||0)} className="input" placeholder="0.00" required /></label>
              <label>لكل كجم<input inputMode="decimal" pattern="[0-9]+([.,][0-9]+)?" value={perKgFee} onChange={(e)=> setPerKgFee(e.target.value===''?'':Number(String(e.target.value).replace(',','.')))} className="input" placeholder="0.00" /></label>
              <label>الوزن الأدنى (كجم)<input inputMode="decimal" pattern="[0-9]+([.,][0-9]+)?" value={minWeightKg} onChange={(e)=> setMinWeightKg(e.target.value===''?'':Number(String(e.target.value).replace(',','.')))} className="input" placeholder="0.00" /></label>
              <label>الوزن الأقصى (كجم)<input inputMode="decimal" pattern="[0-9]+([.,][0-9]+)?" value={maxWeightKg} onChange={(e)=> setMaxWeightKg(e.target.value===''?'':Number(String(e.target.value).replace(',','.')))} className="input" placeholder="0.00" /></label>
              <label>المجموع الأدنى للطلب<input inputMode="decimal" pattern="[0-9]+([.,][0-9]+)?" value={minSubtotal} onChange={(e)=> setMinSubtotal(e.target.value===''?'':Number(String(e.target.value).replace(',','.')))} className="input" placeholder="0.00" /></label>
              <label>شحن مجاني فوق<input inputMode="decimal" pattern="[0-9]+([.,][0-9]+)?" value={freeOverSubtotal} onChange={(e)=> setFreeOverSubtotal(e.target.value===''?'':Number(String(e.target.value).replace(',','.')))} className="input" placeholder="0.00" /></label>
              <label>المدة (ساعات)
                <div style={{ display:'flex', gap:8 }}>
                  <input className="input" inputMode="numeric" pattern="[0-9]+" value={etaMinHours} onChange={(e)=> setEtaMinHours(e.target.value===''?'':Number(e.target.value))} placeholder="من" />
                  <input className="input" inputMode="numeric" pattern="[0-9]+" value={etaMaxHours} onChange={(e)=> setEtaMaxHours(e.target.value===''?'':Number(e.target.value))} placeholder="إلى" />
                </div>
              </label>
              <label>عنوان العرض (اختياري)<input value={offerTitle} onChange={(e)=> setOfferTitle(e.target.value)} className="input" /></label>
              <div style={{ gridColumn:'1 / -1' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <label style={{ flex:1 }}>ساري من<input type="date" value={activeFrom? String(activeFrom).slice(0,10): ''} onChange={(e)=> setActiveFrom(e.target.value? `${e.target.value}T00:00` : '')} className="input" /></label>
                  <label style={{ flex:1 }}>ساري إلى<input type="date" value={activeUntil? String(activeUntil).slice(0,10): ''} onChange={(e)=> setActiveUntil(e.target.value? `${e.target.value}T23:59` : '')} className="input" /></label>
                </div>
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={isActive} onChange={(e)=> setIsActive(e.target.checked)} /> مفعّل</label>
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

