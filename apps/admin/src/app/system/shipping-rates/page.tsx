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
    <div className="container mx-auto p-6">
      <main className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {toast && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-down">
            {toast}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">أسعار التوصيل</h1>
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                const ids = Object.keys(selected).filter(id => selected[id]); if (!ids.length) return;
                if (!confirm(`هل أنت متأكد من حذف ${ids.length} عنصر؟`)) return;
                for (const id of ids) { try { await fetch(`/api/admin/shipping/rates/${id}`, { method: 'DELETE', credentials: 'include' }); } catch { } }
                setSelected({}); setAllChecked(false); await load(); showToast('تم حذف المحدد');
              }}
              disabled={!Object.values(selected).some(Boolean)}
            >
              حذف المحدد
            </button>
            <button 
              onClick={() => router.push('/system/shipping-rates/new')} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
            >
              إضافة سعر
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-center border border-gray-100">
          <span className="text-sm font-semibold text-gray-700">تصفية حسب الموقع:</span>
          <select 
            value={countryId} 
            onChange={(e) => setCountryId(e.target.value)} 
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-1.5"
          >
            <option value="">كل الدول</option>
            {countriesOptions.map((c: any) => (<option key={c.id} value={c.id}>{c.name}{c.code ? ` (${c.code})` : ''}</option>))}
          </select>
          <select 
            value={cityId} 
            onChange={(e) => setCityId(e.target.value)} 
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-1.5 disabled:bg-gray-100 disabled:text-gray-400" 
            disabled={!countryId}
          >
            <option value="">كل المدن</option>
            {citiesOptions.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <select 
            value={areaId} 
            onChange={(e) => setAreaId(e.target.value)} 
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-1.5 disabled:bg-gray-100 disabled:text-gray-400" 
            disabled={!cityId}
          >
            <option value="">كل المناطق</option>
            {areasOptions.map((a: any) => (<option key={a.id} value={a.id}>{a.name}</option>))}
          </select>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-40 bg-gray-100 rounded w-full"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">فشل: {error}</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(e) => { const v = e.target.checked; setAllChecked(v); setSelected(Object.fromEntries(filteredRows.map(r => [r.id, v]))); }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المنطقة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">استثناءات</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المشغل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الرسوم الأساسية</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">لكل كجم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مجاني فوق</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ETA</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نشط</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRows.map(r => {
                  const z = zones.find(z => z.id === r.zoneId)
                  const excludedCount = Array.isArray(r.excludedZoneIds) ? r.excludedZoneIds.length : 0;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          checked={!!selected[r.id]} 
                          onChange={() => setSelected(s => ({ ...s, [r.id]: !s[r.id] }))} 
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{z?.name || r.zoneId}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {[
                            Array.isArray(z?.cities) && z.cities.length ? `${z.cities.length} مدن` : null,
                            Array.isArray(z?.areas) && z.areas.length ? `${z.areas.length} مناطق` : null
                          ].filter(Boolean).join('، ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {excludedCount > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {excludedCount} مستثنى
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.carrier || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.baseFee}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.perKgFee ?? '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.freeOverSubtotal ?? '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {r.etaMinHours ? `${r.etaMinHours}-${r.etaMaxHours || r.etaMinHours} ساعة` : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {r.isActive ? 'نعم' : 'لا'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => router.push(`/system/shipping-rates/${r.id}`)} 
                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded transition-colors"
                          >
                            تعديل
                          </button>
                          <button 
                            onClick={() => remove(r.id)} 
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredRows.length === 0 && (
                  <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-500 text-sm">لا توجد أسعار مطابقة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
