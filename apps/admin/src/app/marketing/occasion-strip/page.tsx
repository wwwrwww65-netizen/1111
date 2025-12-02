"use client";
import React from 'react';

function useApiBase(){
  return React.useMemo(()=> (typeof window!=='undefined' ? (window as any).API_BASE || '' : ''), []);
}
function useAuthHeaders(){
  return React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  },[]);
}

export default function OccasionStripPage(): JSX.Element {
  const apiBase = useApiBase();
  const authHeaders = useAuthHeaders();
  const [loading, setLoading] = React.useState(true);
  const [enabled, setEnabled] = React.useState(false);
  const [title, setTitle] = React.useState('مناسبة المطلة');
  const [subtitle, setSubtitle] = React.useState('');
  const [kpiText, setKpiText] = React.useState('');
  const [ctaLabel, setCtaLabel] = React.useState('');
  const [ctaUrl, setCtaUrl] = React.useState('');
  const [gradientFrom, setGradientFrom] = React.useState('#fdf2f8');
  const [gradientTo, setGradientTo] = React.useState('#fffbeb');
  const [borderColor, setBorderColor] = React.useState('#fbcfe8');
  const [pdpEnabled, setPdpEnabled] = React.useState(true);
  const [position, setPosition] = React.useState('products_top');
  const [scheduleFrom, setScheduleFrom] = React.useState('');
  const [scheduleTo, setScheduleTo] = React.useState('');
  const [tProducts, setTProducts] = React.useState('');
  const [tCategories, setTCategories] = React.useState('');
  const [tVendors, setTVendors] = React.useState('');
  const [tBrands, setTBrands] = React.useState('');
  const [toast, setToast] = React.useState<string>('');
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=> setToast(''), 1800); };

  React.useEffect(()=>{ (async()=>{
    try{
      const r = await fetch(`${apiBase}/api/admin/occasion/strip/settings`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' });
      const j = await r.json();
      const s = j?.settings||{};
      setEnabled(!!s.enabled);
      setTitle(s.title||'');
      setSubtitle(s.subtitle||'');
      setKpiText(s.kpiText||'');
      setCtaLabel(s.cta?.label||'');
      setCtaUrl(s.cta?.url||'');
      setGradientFrom(s.theme?.gradientFrom||'#fdf2f8');
      setGradientTo(s.theme?.gradientTo||'#fffbeb');
      setBorderColor(s.theme?.borderColor||'#fbcfe8');
      setPdpEnabled(!(s.placement?.pdp?.enabled===false));
      setPosition(s.placement?.pdp?.position||'products_top');
      setScheduleFrom(s.schedule?.from||'');
      setScheduleTo(s.schedule?.to||'');
      const t = s.targeting||{};
      setTProducts((t.products?.include||[]).join(','));
      setTCategories((t.categories?.include||[]).join(','));
      setTVendors((t.vendors?.include||[]).join(','));
      setTBrands((t.brands?.include||[]).join(','));
    } finally { setLoading(false); }
  })(); }, [apiBase]);

  async function save(){
    const payload = {
      enabled,
      title, subtitle, kpiText,
      cta: { label: ctaLabel, url: ctaUrl },
      theme: { gradientFrom, gradientTo, borderColor },
      placement: { pdp: { enabled: pdpEnabled, position } },
      schedule: { from: scheduleFrom||null, to: scheduleTo||null },
      targeting: {
        products: { include: tProducts.split(',').map(s=>s.trim()).filter(Boolean), exclude: [] },
        categories: { include: tCategories.split(',').map(s=>s.trim()).filter(Boolean), exclude: [] },
        vendors: { include: tVendors.split(',').map(s=>s.trim()).filter(Boolean), exclude: [] },
        brands: { include: tBrands.split(',').map(s=>s.trim()).filter(Boolean), exclude: [] },
      },
    };
    const r = await fetch(`${apiBase}/api/admin/occasion/strip/settings`, { method:'PUT', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify(payload) });
    if (r.ok) showToast('تم الحفظ'); else showToast('فشل الحفظ');
  }

  if (loading) return <main className="panel" style={{ padding:16 }}>Loading…</main>;
  return (
    <main className="panel" style={{ padding:16 }}>
      {toast && (<div className="toast">{toast}</div>)}
      <h1 style={{ marginTop:0, marginBottom:12 }}>مناسبة المطلة</h1>
      <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <label><input type="checkbox" checked={enabled} onChange={(e)=> setEnabled(e.target.checked)} /> تفعيل</label>
        <label><input type="checkbox" checked={pdpEnabled} onChange={(e)=> setPdpEnabled(e.target.checked)} /> إظهار في صفحة المنتج</label>
        <label>العنوان<input className="input" value={title} onChange={(e)=> setTitle(e.target.value)} /></label>
        <label>وصف قصير<input className="input" value={subtitle} onChange={(e)=> setSubtitle(e.target.value)} /></label>
        <label>KPI (مثلاً ارتفاع14%)<input className="input" value={kpiText} onChange={(e)=> setKpiText(e.target.value)} /></label>
        <label>CTA نص<input className="input" value={ctaLabel} onChange={(e)=> setCtaLabel(e.target.value)} /></label>
        <label>CTA رابط<input className="input" value={ctaUrl} onChange={(e)=> setCtaUrl(e.target.value)} /></label>
        <label>موضع الظهور<select className="select" value={position} onChange={(e)=> setPosition(e.target.value)}><option value="products_top">أعلى قسم السلع</option></select></label>
        <label>لون بداية التدرج<input className="input" value={gradientFrom} onChange={(e)=> setGradientFrom(e.target.value)} /></label>
        <label>لون نهاية التدرج<input className="input" value={gradientTo} onChange={(e)=> setGradientTo(e.target.value)} /></label>
        <label>لون الإطار<input className="input" value={borderColor} onChange={(e)=> setBorderColor(e.target.value)} /></label>
        <label>بداية الجدولة<input type="datetime-local" className="input" value={scheduleFrom} onChange={(e)=> setScheduleFrom(e.target.value)} /></label>
        <label>نهاية الجدولة<input type="datetime-local" className="input" value={scheduleTo} onChange={(e)=> setScheduleTo(e.target.value)} /></label>
      </div>
      <h3 style={{ marginTop:16 }}>الاستهداف (قوائم مفصولة بفواصل)</h3>
      <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <label>منتجات (IDs)<input className="input" value={tProducts} onChange={(e)=> setTProducts(e.target.value)} placeholder="id1,id2" /></label>
        <label>فئات (IDs)<input className="input" value={tCategories} onChange={(e)=> setTCategories(e.target.value)} placeholder="cat1,cat2" /></label>
        <label>موردون (IDs)<input className="input" value={tVendors} onChange={(e)=> setTVendors(e.target.value)} placeholder="v1,v2" /></label>
        <label>علامات (نص)<input className="input" value={tBrands} onChange={(e)=> setTBrands(e.target.value)} placeholder="brand1,brand2" /></label>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
        <button className="btn" onClick={save}>حفظ</button>
      </div>
    </main>
  );
}


