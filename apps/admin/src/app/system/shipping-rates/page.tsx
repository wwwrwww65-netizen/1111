"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function ShippingRatesPage(): JSX.Element {
  const router = useRouter();
  const [zones, setZones] = React.useState<any[]>([]);
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [allChecked, setAllChecked] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1600); };

  // Geo cascade: Country -> City -> Area (UI helper for filtering)
  const [geoLoading, setGeoLoading] = React.useState(false);
  const [countriesOptions, setCountriesOptions] = React.useState<any[]>([]);
  const [citiesOptions, setCitiesOptions] = React.useState<any[]>([]);
  const [areasOptions, setAreasOptions] = React.useState<any[]>([]);
  const [countryId, setCountryId] = React.useState<string>('');
  const [cityId, setCityId] = React.useState<string>('');
  const [areaId, setAreaId] = React.useState<string>('');

  async function load() {
    setLoading(true); setError('');
    try {
      const z = await fetch('/api/admin/shipping/zones', { credentials: 'include' }); const zj = await z.json(); if (z.ok) setZones(zj.zones || []);
      const r = await fetch('/api/admin/shipping/rates', { credentials: 'include' }); const j = await r.json(); if (r.ok) setRows(j.rates || []); else setError(j.error || 'failed');
    } catch { setError('network'); }
    finally { setLoading(false); }
  }
  React.useEffect(() => { load(); }, []);

  // Load geo lists
  async function loadCountries() {
    try { setGeoLoading(true); const r = await fetch('/api/admin/geo/countries', { credentials: 'include' }); const j = await r.json(); if (r.ok) setCountriesOptions(j.countries || []); }
    catch { } finally { setGeoLoading(false); }
  }
  async function loadCities(cid: string) {
    if (!cid) { setCitiesOptions([]); return; }
    try { setGeoLoading(true); const r = await fetch(`/api/admin/geo/cities?countryId=${encodeURIComponent(cid)}`, { credentials: 'include' }); const j = await r.json(); if (r.ok) setCitiesOptions(j.cities || []); }
    catch { } finally { setGeoLoading(false); }
  }
  async function loadAreas(ccid: string) {
    if (!ccid) { setAreasOptions([]); return; }
    try { setGeoLoading(true); const r = await fetch(`/api/admin/geo/areas?cityId=${encodeURIComponent(ccid)}`, { credentials: 'include' }); const j = await r.json(); if (r.ok) setAreasOptions(j.areas || []); }
    catch { } finally { setGeoLoading(false); }
  }
  React.useEffect(() => { loadCountries(); }, []);
  React.useEffect(() => { setCityId(''); setAreaId(''); setCitiesOptions([]); setAreasOptions([]); if (countryId) loadCities(countryId); }, [countryId]);
  React.useEffect(() => { setAreaId(''); setAreasOptions([]); if (cityId) loadAreas(cityId); }, [cityId]);

  // Auto-filter zones by selected geo
  const filteredRows = React.useMemo(() => {
    if (!countryId && !cityId && !areaId) return rows;

    // Filter zones first
    const country = countriesOptions.find((c: any) => c.id === countryId);
    const city = citiesOptions.find((c: any) => c.id === cityId);
    const area = areasOptions.find((a: any) => a.id === areaId);

    const matchingZoneIds = new Set(zones.filter((z: any) => {
      // If area selected, require zone.areas include area.name
      if (area && Array.isArray(z.areas) && !z.areas.includes(area.name)) return false;
      // If city selected, require zone.cities include city.name
      if (city && Array.isArray(z.cities) && !z.cities.includes(city.name)) return false;
      // If country selected, require countryCodes include country code or code from name
      if (country) {
        const codes: string[] = Array.isArray(z.countryCodes) ? z.countryCodes : [];
        const iso = (country.code || '').toUpperCase();
        const nameCode = (country.name || '').trim().toUpperCase().slice(0, 2);
        if (!codes.includes(iso) && !codes.includes(nameCode)) return false;
      }
      return true;
    }).map(z => z.id));

    return rows.filter(r => matchingZoneIds.has(r.zoneId));
  }, [rows, zones, countryId, cityId, areaId, countriesOptions, citiesOptions, areasOptions]);

  async function remove(id: string) { if (!confirm('حذف السعر؟')) return; const r = await fetch(`/api/admin/shipping/rates/${id}`, { method: 'DELETE', credentials: 'include' }); if (r.ok) await load(); }

  return (
    <div className="container">
      <main className="panel" style={{ padding: 16 }}>
        {toast && (<div className="toast ok" style={{ marginBottom: 8 }}>{toast}</div>)}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ margin: 0 }}>أسعار التوصيل</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn danger" onClick={async () => {
              const ids = Object.keys(selected).filter(id => selected[id]); if (!ids.length) return;
              for (const id of ids) { try { await fetch(`/api/admin/shipping/rates/${id}`, { method: 'DELETE', credentials: 'include' }); } catch { } }
              setSelected({}); setAllChecked(false); await load(); showToast('تم حذف المحدد');
            }}>حذف المحدد</button>
            <button onClick={() => router.push('/system/shipping-rates/new')} className="btn">إضافة سعر</button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="panel" style={{ padding: 12, marginBottom: 16, display: 'flex', gap: 12, background: '#f9f9f9', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 'bold', color: '#555' }}>تصفية حسب الموقع:</span>
          <select value={countryId} onChange={(e) => setCountryId(e.target.value)} className="select" style={{ fontSize: 13 }}>
            <option value="">كل الدول</option>
            {countriesOptions.map((c: any) => (<option key={c.id} value={c.id}>{c.name}{c.code ? ` (${c.code})` : ''}</option>))}
          </select>
          <select value={cityId} onChange={(e) => setCityId(e.target.value)} className="select" style={{ fontSize: 13 }} disabled={!countryId}>
            <option value="">كل المدن</option>
            {citiesOptions.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="select" style={{ fontSize: 13 }} disabled={!cityId}>
            <option value="">كل المناطق</option>
            {areasOptions.map((a: any) => (<option key={a.id} value={a.id}>{a.name}</option>))}
          </select>
        </div>

        {loading ? <div role="status" aria-busy="true" className="skeleton" style={{ height: 200 }} /> : error ? <div className="error" aria-live="assertive">فشل: {error}</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" role="table" aria-label="قائمة أسعار التوصيل">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(e) => { const v = e.target.checked; setAllChecked(v); setSelected(Object.fromEntries(filteredRows.map(r => [r.id, v]))); }}
                    />
                  </th>
                  <th>المنطقة</th>
                  <th>استثناءات</th>
                  <th>المشغل</th>
                  <th>الرسوم الأساسية</th>
                  <th>لكل كجم</th>
                  <th>مجاني فوق</th>
                  <th>ETA</th>
                  <th>نشط</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(r => {
                  const z = zones.find(z => z.id === r.zoneId)
                  const excludedCount = Array.isArray(r.excludedZoneIds) ? r.excludedZoneIds.length : 0;
                  return (
                    <tr key={r.id}>
                      <td><input type="checkbox" checked={!!selected[r.id]} onChange={() => setSelected(s => ({ ...s, [r.id]: !s[r.id] }))} /></td>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>{z?.name || r.zoneId}</div>
                        <div style={{ fontSize: 11, color: '#666' }}>
                          {[
                            Array.isArray(z?.cities) && z.cities.length ? `${z.cities.length} مدن` : null,
                            Array.isArray(z?.areas) && z.areas.length ? `${z.areas.length} مناطق` : null
                          ].filter(Boolean).join('، ')}
                        </div>
                      </td>
                      <td>
                        {excludedCount > 0 ? <span className="badge" style={{ background: '#fdecea', color: '#d32f2f' }}>{excludedCount} مستثنى</span> : '—'}
                      </td>
                      <td>{r.carrier || '—'}</td>
                      <td>{r.baseFee}</td>
                      <td>{r.perKgFee ?? '—'}</td>
                      <td>{r.freeOverSubtotal ?? '—'}</td>
                      <td>{r.etaMinHours ? `${r.etaMinHours}-${r.etaMaxHours || r.etaMinHours} ساعة` : '—'}</td>
                      <td>{r.isActive ? 'نعم' : 'لا'}</td>
                      <td>
                        <button aria-label={`تعديل سعر ${zones.find(z => z.id === r.zoneId)?.name || ''}`} onClick={() => router.push(`/system/shipping-rates/${r.id}`)} className="btn btn-outline" style={{ marginInlineEnd: 6 }}>تعديل</button>
                        <button aria-label={`حذف سعر ${zones.find(z => z.id === r.zoneId)?.name || ''}`} onClick={() => remove(r.id)} className="btn btn-danger">حذف</button>
                      </td>
                    </tr>
                  )
                })}
                {filteredRows.length === 0 && (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: 20, color: '#666' }}>لا توجد أسعار مطابقة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
