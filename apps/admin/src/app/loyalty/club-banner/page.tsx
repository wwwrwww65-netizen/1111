"use client";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";

type IdName = { id: string; name: string };

function useApiBase(){ return React.useMemo(()=> resolveApiBase(), []); }
function useAuthHeaders(){ return React.useCallback(()=>{ if (typeof document==='undefined') return {} as Record<string,string>; const m=document.cookie.match(/(?:^|; )auth_token=([^;]+)/); let t=m?m[1]:''; try{ t=decodeURIComponent(t);}catch{} return t? { Authorization:`Bearer ${t}` } : {}; },[]); }

export default function ClubBannerSettingsPage(): JSX.Element {
  const apiBase = useApiBase();
  const authHeaders = useAuthHeaders();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState("");

  const [enabled, setEnabled] = React.useState(false);
  const [sites, setSites] = React.useState<Array<'web'|'mweb'>>(['mweb','web']);
  const [discountType, setDiscountType] = React.useState<'percent'|'fixed'>('percent');
  const [discountValue, setDiscountValue] = React.useState<number>(5);
  const [textTemplate, setTextTemplate] = React.useState('وفر بخصم {{amount}} ر.س بعد الانضمام');
  const [joinUrl, setJoinUrl] = React.useState('/register?club=1');
  const [theme, setTheme] = React.useState('orange');
  const [rounded, setRounded] = React.useState(true);
  const [pdpEnabled, setPdpEnabled] = React.useState(true);
  const [pdpPosition, setPdpPosition] = React.useState<'price_below'|'header'|'shipping_block'>('price_below');

  const [productsInc, setProductsInc] = React.useState<string>('');
  const [productsExc, setProductsExc] = React.useState<string>('');
  const [categoriesInc, setCategoriesInc] = React.useState<string>('');
  const [categoriesExc, setCategoriesExc] = React.useState<string>('');
  const [vendorsInc, setVendorsInc] = React.useState<string>('');
  const [vendorsExc, setVendorsExc] = React.useState<string>('');
  const [brandsInc, setBrandsInc] = React.useState<string>('');
  const [brandsExc, setBrandsExc] = React.useState<string>('');

  React.useEffect(()=>{ (async()=>{
    try{
      const r = await fetch(`${apiBase}/api/admin/club/banner/settings`, { credentials:'include', headers:{ ...authHeaders() } });
      const j = await r.json();
      if (r.ok && j?.settings){
        const s = j.settings;
        setEnabled(!!s.enabled);
        setSites(Array.isArray(s.sites)? s.sites : ['mweb','web']);
        setDiscountType(s.discountType==='fixed'?'fixed':'percent');
        setDiscountValue(Number(s.discountValue||0));
        setTextTemplate(String(s.textTemplate||'وفر بخصم {{amount}} ر.س بعد الانضمام'));
        setJoinUrl(String(s.joinUrl||'/register?club=1'));
        setTheme(String(s?.style?.theme||'orange'));
        setRounded(!!s?.style?.rounded);
        setPdpEnabled(!!s?.placement?.pdp?.enabled);
        setPdpPosition(String(s?.placement?.pdp?.position||'price_below') as any);
        const t = s.targeting||{};
        setProductsInc(((t.products?.include)||[]).join(','));
        setProductsExc(((t.products?.exclude)||[]).join(','));
        setCategoriesInc(((t.categories?.include)||[]).join(','));
        setCategoriesExc(((t.categories?.exclude)||[]).join(','));
        setVendorsInc(((t.vendors?.include)||[]).join(','));
        setVendorsExc(((t.vendors?.exclude)||[]).join(','));
        setBrandsInc(((t.brands?.include)||[]).join(','));
        setBrandsExc(((t.brands?.exclude)||[]).join(','));
      }
    }catch{}
    setLoading(false);
  })(); }, [apiBase, authHeaders]);

  function showToast(m:string){ setToast(m); setTimeout(()=> setToast(''), 1600); }

  async function save(){
    try{
      setSaving(true);
      const payload = {
        enabled,
        sites,
        discountType,
        discountValue,
        textTemplate,
        joinUrl,
        style: { theme, rounded },
        placement: { pdp: { enabled: pdpEnabled, position: pdpPosition } },
        targeting: {
          products: { include: splitCsv(productsInc), exclude: splitCsv(productsExc) },
          categories: { include: splitCsv(categoriesInc), exclude: splitCsv(categoriesExc) },
          vendors: { include: splitCsv(vendorsInc), exclude: splitCsv(vendorsExc) },
          brands: { include: splitCsv(brandsInc), exclude: splitCsv(brandsExc) },
        }
      };
      const r = await fetch(`${apiBase}/api/admin/club/banner/settings`, { method:'PUT', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('save_failed');
      showToast('تم الحفظ');
    }catch{ showToast('فشل الحفظ'); } finally { setSaving(false); }
  }

  function splitCsv(s: string): string[] { return String(s||'').split(/[,\s]+/).map(x=>x.trim()).filter(Boolean); }

  if (loading) return <main style={{ padding:16 }}>Loading…</main>;

  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>شريط خصم JEEEY Club</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:12 }}>
        <section style={{ padding:12, border:'1px solid #1c2333', borderRadius:12 }}>
          <h2 style={{ margin:'0 0 12px 0' }}>الإعدادات العامة</h2>
          <label className="form-label">تفعيل
            <input type="checkbox" checked={enabled} onChange={(e)=> setEnabled(e.target.checked)} style={{ marginInlineStart:8 }} />
          </label>
          <label className="form-label">المواقع المستهدفة
            <div style={{ display:'flex', gap:8 }}>
              <label><input type="checkbox" checked={sites.includes('mweb')} onChange={(e)=> setSites((s)=> e.target.checked? Array.from(new Set([...s,'mweb'])): s.filter(x=> x!=='mweb'))} /> mweb</label>
              <label><input type="checkbox" checked={sites.includes('web')} onChange={(e)=> setSites((s)=> e.target.checked? Array.from(new Set([...s,'web'])): s.filter(x=> x!=='web'))} /> web</label>
            </div>
          </label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <label>نوع الخصم
              <select className="select" value={discountType} onChange={(e)=> setDiscountType(e.target.value as any)}>
                <option value="percent">نسبة %</option>
                <option value="fixed">مبلغ ثابت</option>
              </select>
            </label>
            <label>قيمة الخصم
              <input className="input" value={discountValue} onChange={(e)=> setDiscountValue(Number(e.target.value)||0)} inputMode="decimal" />
            </label>
          </div>
          <label>نص الشريط
            <input className="input" value={textTemplate} onChange={(e)=> setTextTemplate(e.target.value)} placeholder="وفر بخصم {{amount}} ر.س بعد الانضمام" />
          </label>
          <label>رابط الانضمام
            <input className="input" value={joinUrl} onChange={(e)=> setJoinUrl(e.target.value)} />
          </label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <label>السمة (Theme)
              <select className="select" value={theme} onChange={(e)=> setTheme(e.target.value)}>
                <option value="orange">Orange</option>
                <option value="rose">Rose</option>
                <option value="amber">Amber</option>
                <option value="emerald">Emerald</option>
                <option value="violet">Violet</option>
              </select>
            </label>
            <label>حواف مدورة
              <input type="checkbox" checked={rounded} onChange={(e)=> setRounded(e.target.checked)} style={{ marginInlineStart:8 }} />
            </label>
          </div>
        </section>

        <section style={{ padding:12, border:'1px solid #1c2333', borderRadius:12 }}>
          <h2 style={{ margin:'0 0 12px 0' }}>الظهور (Placement)</h2>
          <label><input type="checkbox" checked={pdpEnabled} onChange={(e)=> setPdpEnabled(e.target.checked)} /> إظهار في صفحة المنتج</label>
          <label>الموضع في PDP
            <select className="select" value={pdpPosition} onChange={(e)=> setPdpPosition(e.target.value as any)}>
              <option value="price_below">أسفل السعر</option>
              <option value="header">في الأعلى</option>
              <option value="shipping_block">داخل قسم الشحن</option>
            </select>
          </label>

          <h3 style={{ margin:'16px 0 8px 0' }}>الاستهداف</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <label>منتجات (Include)
              <input className="input" placeholder="IDs مفصولة بفواصل" value={productsInc} onChange={(e)=> setProductsInc(e.target.value)} />
            </label>
            <label>منتجات (Exclude)
              <input className="input" placeholder="IDs مفصولة بفواصل" value={productsExc} onChange={(e)=> setProductsExc(e.target.value)} />
            </label>
            <label>فئات (Include)
              <input className="input" placeholder="IDs مفصولة بفواصل" value={categoriesInc} onChange={(e)=> setCategoriesInc(e.target.value)} />
            </label>
            <label>فئات (Exclude)
              <input className="input" placeholder="IDs مفصولة بفواصل" value={categoriesExc} onChange={(e)=> setCategoriesExc(e.target.value)} />
            </label>
            <label>موردون (Include)
              <input className="input" placeholder="IDs مفصولة بفواصل" value={vendorsInc} onChange={(e)=> setVendorsInc(e.target.value)} />
            </label>
            <label>موردون (Exclude)
              <input className="input" placeholder="IDs مفصولة بفواصل" value={vendorsExc} onChange={(e)=> setVendorsExc(e.target.value)} />
            </label>
            <label>علامات تجارية (Include)
              <input className="input" placeholder="أسماء العلامات" value={brandsInc} onChange={(e)=> setBrandsInc(e.target.value)} />
            </label>
            <label>علامات تجارية (Exclude)
              <input className="input" placeholder="أسماء العلامات" value={brandsExc} onChange={(e)=> setBrandsExc(e.target.value)} />
            </label>
          </div>
        </section>
      </div>

      <div style={{ marginTop:12, display:'flex', gap:8 }}>
        <button className="btn" onClick={save} disabled={saving}>{saving? 'جارٍ الحفظ…' : 'حفظ'}</button>
        {toast && (<span className="badge ok">{toast}</span>)}
      </div>

      <PreviewCard discountType={discountType} discountValue={discountValue} textTemplate={textTemplate} theme={theme} rounded={rounded} />
    </main>
  );
}

function PreviewCard({ discountType, discountValue, textTemplate, theme, rounded }:{ discountType:'percent'|'fixed'; discountValue:number; textTemplate:string; theme:string; rounded:boolean }): JSX.Element {
  const price = 129;
  const amount = Math.max(0, discountType==='percent' ? (price*discountValue/100) : Math.min(discountValue, price));
  const text = textTemplate.replace(/\{\{\s*amount\s*\}\}/g, String(Math.round(amount*100)/100));
  const cls = themeClass(theme);
  return (
    <div style={{ marginTop:16 }}>
      <div className={`flex items-center justify-between px-3 py-2.5 ${cls} ${rounded? 'rounded-md' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-black/20 text-white flex items-center justify-center text-[11px] font-bold">S</div>
          <span className="text-[13px]">{text}</span>
        </div>
        <span className="text-[12px] opacity-80">Preview</span>
      </div>
    </div>
  );
}

function themeClass(theme: string): string {
  switch (theme) {
    case 'rose': return 'bg-rose-50 text-rose-700';
    case 'amber': return 'bg-amber-50 text-amber-700';
    case 'emerald': return 'bg-emerald-50 text-emerald-700';
    case 'violet': return 'bg-violet-50 text-violet-700';
    default: return 'bg-orange-50 text-orange-700';
  }
}


