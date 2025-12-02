"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import CountriesPage from '../geo/countries/page';
import CitiesPage from '../geo/cities/page';
import AreasPage from '../geo/areas/page';

export default function ShippingZonesPage(): JSX.Element {
  const router = useRouter();
  const [tab, setTab] = React.useState<'zones'|'countries'|'cities'|'areas'>('zones');
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<any|null>(null);
  const [toast, setToast] = React.useState<{ text: string, type: 'ok' | 'err' } | null>(null);

  const showToast = (text: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Form State
  const [name, setName] = React.useState('');
  const [countryCodes, setCountryCodes] = React.useState<string>('SA');
  const [regions, setRegions] = React.useState<string>('');
  const [cities, setCities] = React.useState<string>('');
  const [areas, setAreas] = React.useState<string>('');
  const [isActive, setIsActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  async function load(){
    setLoading(true); setError('');
    try{ const r = await fetch('/api/admin/shipping/zones', { credentials:'include' }); const j = await r.json(); if (r.ok) setRows(j.zones||[]); else setError(j.error||'failed'); }
    catch{ setError('network'); }
    finally{ setLoading(false); }
  }
  React.useEffect(()=>{ load(); }, []);

  function reset(){ setEditing(null); setName(''); setCountryCodes('SA'); setRegions(''); setCities(''); setAreas(''); setIsActive(true); }
  function openCreate(){ reset(); setShowForm(true); }
  function openEdit(r:any){ 
    setEditing(r); 
    setName(r.name||''); 
    setCountryCodes((r.countryCodes||[]).join(', ')); 
    setRegions(Array.isArray(r.regions)? r.regions.join(', ') : ''); 
    setCities(Array.isArray(r.cities)? r.cities.join(', ') : ''); 
    setAreas(Array.isArray(r.areas)? r.areas.join(', ') : ''); 
    setIsActive(Boolean(r.isActive)); 
    setShowForm(true); 
  }

  async function submit(e:React.FormEvent){
    e.preventDefault(); 
    setSaving(true);
    try{
      const payload:any = { 
        name, 
        countryCodes: countryCodes.split(',').map(s=>s.trim()).filter(Boolean), 
        isActive 
      };
      if (regions.trim()) payload.regions = regions.split(',').map(s=>s.trim()).filter(Boolean);
      if (cities.trim()) payload.cities = cities.split(',').map(s=>s.trim()).filter(Boolean);
      if (areas.trim()) payload.areas = areas.split(',').map(s=>s.trim()).filter(Boolean);

      let r:Response; 
      if (editing) r = await fetch(`/api/admin/shipping/zones/${editing.id}`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
      else r = await fetch('/api/admin/shipping/zones', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
      
      const j = await r.json(); 
      if (!r.ok) throw new Error(j.error||'failed'); 
      
      setShowForm(false); 
      reset(); 
      await load();
      showToast('تم الحفظ بنجاح', 'ok');
    }catch(err:any){ 
      showToast(err.message||'فشل الحفظ', 'err'); 
    } finally {
      setSaving(false);
    }
  }

  async function remove(id:string){ 
    if (!confirm('هل أنت متأكد من حذف هذه المنطقة؟ سيتم حذف جميع أسعار الشحن المرتبطة بها.')) return; 
    try {
      const r = await fetch(`/api/admin/shipping/zones/${id}`, { method:'DELETE', credentials:'include' }); 
      if (r.ok) { 
        await load(); 
        showToast('تم الحذف بنجاح', 'ok'); 
      } else {
        showToast('فشل الحذف', 'err');
      }
    } catch {
      showToast('خطأ في الاتصال', 'err');
    }
  }

  async function syncFromGeo(){
    if(!confirm('سيتم مزامنة المناطق من قاعدة البيانات الجغرافية. هل أنت متأكد؟')) return;
    setLoading(true);
    showToast('جاري المزامنة...', 'ok'); // Immediate feedback
    try {
      const r = await fetch('/api/admin/shipping/zones/sync-from-geo', { method:'POST', credentials:'include' });
      const j = await r.json();
      if (r.ok) {
        await load();
        showToast(j.message || 'تمت المزامنة بنجاح', 'ok');
      } else {
        showToast(j.error || 'فشل المزامنة', 'err');
      }
    } catch {
      showToast('خطأ في الاتصال', 'err');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[100] px-6 py-3 rounded shadow-xl text-white font-medium transition-all transform translate-y-0 ${toast.type === 'ok' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.text}
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">إدارة المناطق الجغرافية</h1>
          <p className="text-[var(--sub)] mt-1">تكوين مناطق الشحن والدول والمدن</p>
        </div>
        <div className="flex bg-[var(--panel)] p-1 rounded-lg border border-[rgba(255,255,255,0.08)]">
          {[
            { key:'zones', label:'مناطق الشحن' },
            { key:'countries', label:'الدول' },
            { key:'cities', label:'المدن' },
            { key:'areas', label:'الأحياء' },
          ].map((t:any)=> (
            <button 
              key={t.key} 
              onClick={()=> setTab(t.key)} 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab===t.key ? 'bg-[var(--primary)] text-white' : 'text-[var(--sub)] hover:text-[var(--text)]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {tab==='zones' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[var(--text)]">مناطق الشحن المعرفة</h2>
              <div className="flex gap-2">
                <button onClick={syncFromGeo} className="btn btn-outline" disabled={loading}>
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  مزامنة المناطق
                </button>
                <button onClick={openCreate} className="btn">
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  إضافة منطقة جديدة
                </button>
              </div>
            </div>

            {showForm && (
              <div className="panel border border-[var(--primary)]/20">
                <h3 className="text-lg font-bold mb-4 text-[var(--text)]">{editing ? 'تعديل المنطقة' : 'منطقة جديدة'}</h3>
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">اسم المنطقة</label>
                      <input className="input" value={name} onChange={e=>setName(e.target.value)} required placeholder="مثال: المنطقة الوسطى" />
                    </div>
                    <div>
                      <label className="form-label">رموز الدول (ISO)</label>
                      <input className="input" value={countryCodes} onChange={e=>setCountryCodes(e.target.value)} placeholder="SA, AE, KW" />
                      <p className="text-xs text-[var(--sub)] mt-1">افصل بين الرموز بفاصلة</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">المدن المشمولة</label>
                    <textarea className="input min-h-[80px]" value={cities} onChange={e=>setCities(e.target.value)} placeholder="الرياض, جدة, الدمام..." />
                    <p className="text-xs text-[var(--sub)] mt-1">اكتب أسماء المدن مفصولة بفواصل. اتركها فارغة لتشمل كل المدن في الدول المحددة.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">الأحياء المشمولة (اختياري)</label>
                      <input className="input" value={areas} onChange={e=>setAreas(e.target.value)} placeholder="حي العليا, حي الملز..." />
                    </div>
                    <div>
                      <label className="form-label">المناطق الإدارية (اختياري)</label>
                      <input className="input" value={regions} onChange={e=>setRegions(e.target.value)} placeholder="منطقة الرياض, منطقة مكة..." />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" id="active" checked={isActive} onChange={e=>setIsActive(e.target.checked)} className="rounded border-gray-600 bg-transparent text-[var(--primary)] focus:ring-[var(--primary)] h-4 w-4" />
                    <label htmlFor="active" className="text-sm font-medium text-[var(--text)]">تفعيل هذه المنطقة</label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                    <button type="button" onClick={()=>setShowForm(false)} className="btn btn-outline">إلغاء</button>
                    <button type="submit" className="btn" disabled={saving}>
                      {saving ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-12 bg-[var(--panel)] rounded w-full border border-[rgba(255,255,255,0.05)]"></div>
                <div className="h-40 bg-[var(--panel)] rounded w-full border border-[rgba(255,255,255,0.05)]"></div>
              </div>
            ) : (
              <div className="panel overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.06)]">
                        <th className="px-4 py-3 text-right">الاسم</th>
                        <th className="px-4 py-3 text-right">الدول</th>
                        <th className="px-4 py-3 text-right">المدن</th>
                        <th className="px-4 py-3 text-right">المناطق/الأحياء</th>
                        <th className="px-4 py-3 text-center">الحالة</th>
                        <th className="px-4 py-3 text-left">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                      {rows.map((r:any)=> (
                        <tr key={r.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                          <td className="px-4 py-3 font-medium text-[var(--text)]">{r.name}</td>
                          <td className="px-4 py-3 text-sm text-[var(--sub)]">
                            {(r.countryCodes||[]).map((c:string) => <span key={c} className="inline-block bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 rounded text-xs mr-1">{c}</span>)}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--sub)]">
                            {Array.isArray(r.cities) && r.cities.length > 0 ? (
                              <span title={r.cities.join(', ')}>{r.cities.length} مدينة</span>
                            ) : 'الكل'}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--sub)]">
                            <div className="flex flex-col gap-1">
                              {Array.isArray(r.regions) && r.regions.length > 0 && (
                                <span title={r.regions.join(', ')} className="text-xs">
                                  {r.regions.length} منطقة إدارية
                                </span>
                              )}
                              {Array.isArray(r.areas) && r.areas.length > 0 && (
                                <span title={r.areas.join(', ')} className="text-xs">
                                  {r.areas.length} حي
                                </span>
                              )}
                              {(!r.regions?.length && !r.areas?.length) && '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.isActive ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-gray-700/30 text-gray-400 border border-gray-700/50'}`}>
                              {r.isActive ? 'نشط' : 'معطل'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={()=>openEdit(r)}
                                className="p-1.5 text-[var(--sub)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors"
                                title="تعديل"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button 
                                onClick={()=>remove(r.id)}
                                className="p-1.5 text-[var(--sub)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                title="حذف"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-[var(--sub)] text-sm">لا توجد مناطق شحن معرفة</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='countries' && (
          <div className="panel mt-4">
            <CountriesPage />
          </div>
        )}
        {tab==='cities' && (
          <div className="panel mt-4">
            <CitiesPage />
          </div>
        )}
        {tab==='areas' && (
          <div className="panel mt-4">
            <AreasPage />
          </div>
        )}
      </div>
    </div>
  );
}

