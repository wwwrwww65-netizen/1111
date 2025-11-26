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
  const [toast, setToast] = React.useState<{ text: string, type: 'ok' | 'err' } | null>(null);

  const showToast = (text: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  async function remove(id: string) {
    if (!confirm('هل أنت متأكد من حذف سعر الشحن هذا؟')) return;
    try {
      const r = await fetch(`/api/admin/shipping/rates/${id}`, { method: 'DELETE', credentials: 'include' });
      if (r.ok) {
        showToast('تم الحذف بنجاح', 'ok');
        await load();
      } else {
        const j = await r.json().catch(() => ({}));
        showToast(j.error || 'فشل الحذف', 'err');
      }
    } catch (e) {
      showToast('خطأ في الاتصال', 'err');
    }
  }

  async function bulkRemove() {
    const ids = Object.keys(selected).filter(id => selected[id]);
    if (!ids.length) return;
    if (!confirm(`هل أنت متأكد من حذف ${ids.length} عنصر؟`)) return;
    
    let successCount = 0;
    for (const id of ids) {
      try {
        const r = await fetch(`/api/admin/shipping/rates/${id}`, { method: 'DELETE', credentials: 'include' });
        if (r.ok) successCount++;
      } catch { }
    }
    
    setSelected({});
    setAllChecked(false);
    await load();
    showToast(`تم حذف ${successCount} عنصر`, 'ok');
  }

  return (
    <div className="w-full space-y-6">
      {toast && (
        <div className={`fixed bottom-4 left-4 z-50 px-4 py-2 rounded shadow-lg text-white ${toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.text}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">أسعار التوصيل</h1>
          <p className="text-[var(--sub)] mt-1">إدارة أسعار الشحن للمناطق المختلفة</p>
        </div>
        <div className="flex gap-3">
          {Object.values(selected).some(Boolean) && (
            <button 
              className="btn bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
              onClick={bulkRemove}
            >
              حذف المحدد ({Object.values(selected).filter(Boolean).length})
            </button>
          )}
          <button 
            onClick={() => router.push('/system/shipping-rates/new')} 
            className="btn"
          >
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            إضافة سعر جديد
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="panel p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-[var(--sub)]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          <span className="text-sm font-medium">تصفية:</span>
        </div>
        <select 
          value={countryId} 
          onChange={(e) => setCountryId(e.target.value)} 
          className="select w-auto min-w-[160px] py-1.5 h-9 text-sm"
        >
          <option value="">كل الدول</option>
          {countriesOptions.map((c: any) => (<option key={c.id} value={c.id}>{c.name}{c.code ? ` (${c.code})` : ''}</option>))}
        </select>
        <select 
          value={cityId} 
          onChange={(e) => setCityId(e.target.value)} 
          className="select w-auto min-w-[160px] py-1.5 h-9 text-sm disabled:opacity-50" 
          disabled={!countryId}
        >
          <option value="">كل المدن</option>
          {citiesOptions.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <select 
          value={areaId} 
          onChange={(e) => setAreaId(e.target.value)} 
          className="select w-auto min-w-[160px] py-1.5 h-9 text-sm disabled:opacity-50" 
          disabled={!cityId}
        >
          <option value="">كل المناطق</option>
          {areasOptions.map((a: any) => (<option key={a.id} value={a.id}>{a.name}</option>))}
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-[var(--panel)] rounded w-full border border-[rgba(255,255,255,0.05)]"></div>
          <div className="h-64 bg-[var(--panel)] rounded w-full border border-[rgba(255,255,255,0.05)]"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-900/20 text-red-400 rounded-lg border border-red-900/50 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          فشل تحميل البيانات: {error}
        </div>
      ) : (
        <div className="panel overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.06)]">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(e) => { const v = e.target.checked; setAllChecked(v); setSelected(Object.fromEntries(filteredRows.map(r => [r.id, v]))); }}
                      className="rounded border-gray-600 bg-transparent text-[var(--primary)] focus:ring-[var(--primary)] h-4 w-4"
                    />
                  </th>
                  <th className="px-4 py-3 text-right">المنطقة</th>
                  <th className="px-4 py-3 text-right">استثناءات</th>
                  <th className="px-4 py-3 text-right">المشغل</th>
                  <th className="px-4 py-3 text-right">الرسوم الأساسية</th>
                  <th className="px-4 py-3 text-right">لكل كجم</th>
                  <th className="px-4 py-3 text-right">مجاني فوق</th>
                  <th className="px-4 py-3 text-right">مدة التوصيل</th>
                  <th className="px-4 py-3 text-center">الحالة</th>
                  <th className="px-4 py-3 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                {filteredRows.map(r => {
                  const z = zones.find(z => z.id === r.zoneId)
                  const excludedCount = Array.isArray(r.excludedZoneIds) ? r.excludedZoneIds.length : 0;
                  return (
                    <tr key={r.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={!!selected[r.id]} 
                          onChange={() => setSelected(s => ({ ...s, [r.id]: !s[r.id] }))} 
                          className="rounded border-gray-600 bg-transparent text-[var(--primary)] focus:ring-[var(--primary)] h-4 w-4"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--text)]">{z?.name || r.zoneId}</div>
                        <div className="text-xs text-[var(--sub)] mt-0.5">
                          {[
                            Array.isArray(z?.cities) && z.cities.length ? `${z.cities.length} مدن` : null,
                            Array.isArray(z?.areas) && z.areas.length ? `${z.areas.length} مناطق` : null
                          ].filter(Boolean).join('، ')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {excludedCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/30 text-red-400 border border-red-900/50">
                            {excludedCount} مستثنى
                          </span>
                        ) : (
                          <span className="text-[var(--sub)] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--sub)]">{r.carrier || '—'}</td>
                      <td className="px-4 py-3 font-medium text-[var(--text)]">{r.baseFee}</td>
                      <td className="px-4 py-3 text-sm text-[var(--sub)]">{r.perKgFee ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-[var(--sub)]">{r.freeOverSubtotal ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-[var(--sub)]">
                        {r.etaMinHours ? (
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {r.etaMinHours}-{r.etaMaxHours || r.etaMinHours} ساعة
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.isActive ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-gray-700/30 text-gray-400 border border-gray-700/50'}`}>
                          {r.isActive ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => router.push(`/system/shipping-rates/${r.id}`)} 
                            className="p-1.5 text-[var(--sub)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors"
                            title="تعديل"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button 
                            onClick={() => remove(r.id)} 
                            className="p-1.5 text-[var(--sub)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="حذف"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredRows.length === 0 && (
                  <tr><td colSpan={10} className="px-6 py-12 text-center text-[var(--sub)] text-sm">لا توجد أسعار شحن مطابقة لخيارات التصفية</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
