"use client";
import React from 'react';

function useApiBase(){ return (typeof window!=='undefined' ? (window as any).API_BASE || '' : '') }
function useAuthHeaders(){
  return React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  },[]);
}

export default function PdpPoliciesPage(): JSX.Element {
  const apiBase = useApiBase();
  const authHeaders = useAuthHeaders();
  const [loading, setLoading] = React.useState(true);
  const [enabled, setEnabled] = React.useState(true);
  const [codEnabled, setCodEnabled] = React.useState(true);
  const [codTitle, setCodTitle] = React.useState('خدمة الدفع عند الاستلام');
  const [codContent, setCodContent] = React.useState('');
  const [retEnabled, setRetEnabled] = React.useState(true);
  const [retTitle, setRetTitle] = React.useState('سياسة الإرجاع');
  const [retContent, setRetContent] = React.useState('');
  const [secEnabled, setSecEnabled] = React.useState(true);
  const [secTitle, setSecTitle] = React.useState('آمن للتسوق');
  const [secContent, setSecContent] = React.useState('');
  const [applyAll, setApplyAll] = React.useState(true);
  const [tProducts, setTProducts] = React.useState('');
  const [tCategories, setTCategories] = React.useState('');
  const [tVendors, setTVendors] = React.useState('');
  const [tBrands, setTBrands] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [toast, setToast] = React.useState('');
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=> setToast(''), 1600); };

  React.useEffect(()=>{ (async()=>{
    try{
      const r = await fetch(`${apiBase}/api/admin/policies/pdp/settings`, { credentials:'include', headers:{ ...authHeaders() } });
      const j = await r.json();
      const s = j?.settings||{};
      setEnabled(!!s.enabled);
      setCodEnabled(!(s.cod?.enabled===false)); setCodTitle(s.cod?.title||''); setCodContent(s.cod?.content||'');
      setRetEnabled(!(s.returns?.enabled===false)); setRetTitle(s.returns?.title||''); setRetContent(s.returns?.content||'');
      setSecEnabled(!(s.secure?.enabled===false)); setSecTitle(s.secure?.title||''); setSecContent(s.secure?.content||'');
      setTProducts((s.targeting?.products?.include||[]).join(','));
      setTCategories((s.targeting?.categories?.include||[]).join(','));
      setTVendors((s.targeting?.vendors?.include||[]).join(','));
      setTBrands((s.targeting?.brands?.include||[]).join(','));
      setFrom(s.schedule?.from||''); setTo(s.schedule?.to||'');
      const anyTarget = (s.targeting?.products?.include?.length || s.targeting?.categories?.include?.length || s.targeting?.vendors?.include?.length || s.targeting?.brands?.include?.length);
      setApplyAll(!anyTarget);
    } finally { setLoading(false); }
  })(); }, [apiBase, authHeaders]);

  async function save(){
    const payload = {
      enabled,
      cod: { enabled: codEnabled, title: codTitle, content: codContent },
      returns: { enabled: retEnabled, title: retTitle, content: retContent },
      secure: { enabled: secEnabled, title: secTitle, content: secContent },
      targeting: applyAll ? { products:{include:[],exclude:[]}, categories:{include:[],exclude:[]}, vendors:{include:[],exclude:[]}, brands:{include:[],exclude:[]}, tags:{include:[],exclude:[]} } : {
        products: { include: tProducts.split(',').map(s=>s.trim()).filter(Boolean), exclude: [] },
        categories: { include: tCategories.split(',').map(s=>s.trim()).filter(Boolean), exclude: [] },
        vendors: { include: tVendors.split(',').map(s=>s.trim()).filter(Boolean), exclude: [] },
        brands: { include: tBrands.split(',').map(s=>s.trim()).filter(Boolean), exclude: [] },
      },
      schedule: { from: from||null, to: to||null },
    };
    const r = await fetch(`${apiBase}/api/admin/policies/pdp/settings`, { method:'PUT', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify(payload) });
    showToast(r.ok ? 'تم الحفظ' : 'فشل الحفظ')
  }

  if (loading) return <main className="panel" style={{ padding:16 }}>Loading…</main>;
  return (
    <main className="panel" style={{ padding:16 }}>
      {toast && (<div className="toast">{toast}</div>)}
      <h1 style={{ marginTop:0, marginBottom:12 }}>سياسات صفحة المنتج</h1>
      <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:8 }}>
        <label><input type="checkbox" checked={enabled} onChange={e=> setEnabled(e.target.checked)} /> تفعيل</label>
        <label><input type="checkbox" checked={applyAll} onChange={e=> setApplyAll(e.target.checked)} /> تفعيل لجميع المنتجات</label>
      </div>
      <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
        <fieldset style={{ border:'1px solid #eee', padding:12 }}>
          <legend>الدفع عند الاستلام</legend>
          <label><input type="checkbox" checked={codEnabled} onChange={e=> setCodEnabled(e.target.checked)} /> تفعيل</label>
          <label>العنوان<input className="input" value={codTitle} onChange={e=> setCodTitle(e.target.value)} /></label>
          <label>النص<textarea className="input" value={codContent} onChange={e=> setCodContent(e.target.value)} rows={6} /></label>
        </fieldset>
        <fieldset style={{ border:'1px solid #eee', padding:12 }}>
          <legend>سياسة الإرجاع</legend>
          <label><input type="checkbox" checked={retEnabled} onChange={e=> setRetEnabled(e.target.checked)} /> تفعيل</label>
          <label>العنوان<input className="input" value={retTitle} onChange={e=> setRetTitle(e.target.value)} /></label>
          <label>النص<textarea className="input" value={retContent} onChange={e=> setRetContent(e.target.value)} rows={6} /></label>
        </fieldset>
        <fieldset style={{ border:'1px solid #eee', padding:12 }}>
          <legend>آمن للتسوق</legend>
          <label><input type="checkbox" checked={secEnabled} onChange={e=> setSecEnabled(e.target.checked)} /> تفعيل</label>
          <label>العنوان<input className="input" value={secTitle} onChange={e=> setSecTitle(e.target.value)} /></label>
          <label>النص<textarea className="input" value={secContent} onChange={e=> setSecContent(e.target.value)} rows={6} /></label>
        </fieldset>
      </div>
      {!applyAll && (<>
      <h3 style={{ marginTop:16 }}>الاستهداف (IDs مفصولة بفواصل)</h3>
      <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <label>منتجات<input className="input" value={tProducts} onChange={e=> setTProducts(e.target.value)} /></label>
        <label>فئات<input className="input" value={tCategories} onChange={e=> setTCategories(e.target.value)} /></label>
        <label>موردون<input className="input" value={tVendors} onChange={e=> setTVendors(e.target.value)} /></label>
        <label>علامات<input className="input" value={tBrands} onChange={e=> setTBrands(e.target.value)} /></label>
      </div>
      </>)}
      <h3 style={{ marginTop:16 }}>الجدولة</h3>
      <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <label>من<input type="datetime-local" className="input" value={from} onChange={e=> setFrom(e.target.value)} /></label>
        <label>إلى<input type="datetime-local" className="input" value={to} onChange={e=> setTo(e.target.value)} /></label>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
        <button className="btn" onClick={save}>حفظ</button>
      </div>
    </main>
  );
}


