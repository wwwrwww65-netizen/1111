"use client";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";

type CouponRules = {
  enabled?: boolean;
  min?: number | null;
  max?: number | null;
  includes?: string[];
  excludes?: string[];
  schedule?: { from?: string | null; to?: string | null };
  limitPerUser?: number | null;
  paymentMethods?: string[] | null;
  matchMode?: "all" | "any";
};

export default function NewCouponPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [editingCode, setEditingCode] = React.useState<string>("");
  const [code, setCode] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [kind, setKind] = React.useState("sitewide");
  const [discountType, setDiscountType] = React.useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = React.useState<string>("10");
  const [isActive, setIsActive] = React.useState(true);
  const [usageLimit, setUsageLimit] = React.useState<string>("");
  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [rules, setRules] = React.useState<CouponRules>({ enabled: true, min: 0, max: null, includes: [], excludes: [], schedule: { from: null, to: null }, limitPerUser: null, paymentMethods: null, matchMode: "all" });
  const [audience, setAudience] = React.useState<'everyone'|'guest'|'new_user'|'club'|'users'>("everyone");
  const [includeType, setIncludeType] = React.useState("category");
  const [includeValue, setIncludeValue] = React.useState("");
  const [excludeType, setExcludeType] = React.useState("brand");
  const [excludeValue, setExcludeValue] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [showIncludeCat, setShowIncludeCat] = React.useState(false);
  const [showExcludeCat, setShowExcludeCat] = React.useState(false);

  React.useEffect(()=>{
    // Prefill when code is provided in query (?code=...)
    try{
      const u = new URL(location.href);
      const codeParam = (u.searchParams.get('code')||'').toUpperCase();
      if (!codeParam) return;
      (async()=>{
        try{
          const r = await fetch(`${apiBase}/api/admin/coupons/${encodeURIComponent(codeParam)}`, { credentials:'include' });
          if (!r.ok) return;
          const j = await r.json();
          if (j?.coupon){
            setEditingCode(codeParam);
            setCode(codeParam);
            setDiscountType(j.coupon.discountType||'PERCENTAGE');
            setDiscountValue(String(j.coupon.discountValue||'10'));
            setIsActive(Boolean(j.coupon.isActive));
            setFrom(j.coupon.validFrom? String(j.coupon.validFrom).slice(0,10): '');
            setTo(j.coupon.validUntil? String(j.coupon.validUntil).slice(0,10): '');
          }
          const rulesObj = j?.rules||{};
          if (rulesObj){
            setTitle(String(rulesObj.title||''));
            setKind(String(rulesObj.kind||'sitewide'));
            setAudience((rulesObj.audience?.target||'everyone'));
            setRules({ ...rules, ...rulesObj });
          }
        } catch {}
      })();
    }catch{}
  }, [apiBase]);

  function addInclude(){ if (!includeValue.trim()) return; setRules(r=> ({ ...r, includes: [ ...(r.includes||[]), `${includeType}:${includeValue.trim()}` ] })); setIncludeValue(""); }
  function addExclude(){ if (!excludeValue.trim()) return; setRules(r=> ({ ...r, excludes: [ ...(r.excludes||[]), `${excludeType}:${excludeValue.trim()}` ] })); setExcludeValue(""); }

  async function submit(){
    setMsg("");
    const finalCode = code.trim().toUpperCase();
    if (!finalCode){ setMsg("الرجاء إدخال كود الكوبون"); return; }
    if (!Number.isFinite(Number(discountValue))){ setMsg("قيمة الخصم غير صالحة"); return; }
    setSaving(true);
    try{
      const validFrom = from? new Date(from).toISOString() : new Date().toISOString();
      const validUntil = to? new Date(to).toISOString() : new Date(Date.now()+7*86400000).toISOString();
      if (editingCode){
        // تحديث
        const r = await fetch(`${apiBase}/api/admin/coupons/${encodeURIComponent(finalCode)}`, { method:'PATCH', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ discountType, discountValue: Number(discountValue), validFrom, validUntil, isActive }) });
        if (!r.ok){ const j = await r.json().catch(()=>({})); throw new Error(j?.error||'failed'); }
      } else {
        // إنشاء
        const r = await fetch(`${apiBase}/api/admin/coupons`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ code: finalCode, discountType, discountValue: Number(discountValue), validFrom, validUntil }) });
        if (!r.ok){ const j = await r.json().catch(()=>({})); throw new Error(j?.error||'failed'); }
      }
      // حفظ القواعد
      function normalizeAudienceValue(v:string): string {
        const s = String(v||'').trim().toLowerCase();
        // Arabic → canonical
        if (s.includes('الجميع') || s==='everyone' || s==='all') return 'all';
        if (s.includes('الجدد') || s.includes('الجديدة') || s==='new' || s==='new_user' || s==='new_users' || s==='first' || s==='first_order') return 'new';
        if (s.includes('المسجلين') || s.includes('المُسجلين') || s.includes('المستخدمين المسجلين') || s==='users' || s==='registered' || s==='existing' || s==='users_existing') return 'users';
        return s || 'users';
      }
      const normalizedAudience = normalizeAudienceValue(audience);
      const normalized: CouponRules = normalizeRulesObject({ ...rules, title: title.trim()||undefined, kind, audience: { target: normalizedAudience }, schedule: { from: from? new Date(from).toISOString() : null, to: to? new Date(to).toISOString() : null } } as any);
      await fetch(`${apiBase}/api/admin/coupons/${encodeURIComponent(finalCode)}/rules`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ rules: normalized }) }).catch(()=>{});
      // تفعيل/تعطيل إذا لزم
      if (isActive===false){
        // نجلب الكوبون للعثور على id أو نعيد للقائمة ونسمح بتغييره هناك؛ كحل سريع: نعيد للقائمة
      }
      setMsg('تم الإنشاء بنجاح');
      window.location.assign('/coupons');
    } catch(e:any){ setMsg(e?.message||'فشل إنشاء الكوبون'); }
    finally { setSaving(false); }
  }

  return (
    <main>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom: 16 }}>
        <h1 style={{ margin:0 }}>إنشاء كوبون</h1>
        <a href="/coupons" className="btn btn-outline">عودة للقائمة</a>
      </div>
      <div className="panel" style={{ display:'grid', gap:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <label>اسم/عنوان الكوبون
            <input className="input" value={title} onChange={(e)=> setTitle(e.target.value)} placeholder="مثال: كوبون على مستوى الموقع" />
          </label>
          <label>الكود
            <input className="input" value={code} onChange={(e)=> setCode(e.target.value)} placeholder="CODE" />
          </label>
          <label>نشط
            <div><input type="checkbox" checked={isActive} onChange={(e)=> setIsActive(e.target.checked)} /> <span style={{ marginInlineStart:8 }}>{isActive? 'سيكون مفعل عند الحفظ':'غير مفعل'}</span></div>
          </label>
          <label>نوع الخصم
            <select className="input" value={discountType} onChange={(e)=> setDiscountType(e.target.value)}>
              <option value="PERCENTAGE">PERCENTAGE</option>
              <option value="FIXED">FIXED</option>
            </select>
          </label>
          <label>قيمة الخصم
            <input type="number" className="input" value={discountValue} onChange={(e)=> setDiscountValue(e.target.value)} placeholder="10" />
          </label>
          <label>تصنيف/نوع العرض
            <select className="input" value={kind} onChange={(e)=> setKind(e.target.value)}>
              <option value="sitewide">على مستوى الموقع</option>
              <option value="limited_time">لفترة محدودة</option>
              <option value="shipping">شحن مجاني</option>
              <option value="club">JEEEY CLUB</option>
              <option value="category_offer">عرض فئة</option>
            </select>
          </label>
          <label>حد الاستخدام الإجمالي (اختياري)
            <input type="number" className="input" value={usageLimit} onChange={(e)=> setUsageLimit(e.target.value)} placeholder="مثال: 100" />
          </label>
          <div />
          <label>يبدأ من
            <input type="date" className="input" value={from} onChange={(e)=> setFrom(e.target.value)} />
          </label>
          <label>ينتهي في
            <input type="date" className="input" value={to} onChange={(e)=> setTo(e.target.value)} />
          </label>
        </div>

        <div className="panel" style={{ padding:12 }}>
          <h3 style={{ marginTop:0 }}>الجمهور المستهدف</h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
            {[
              { k:'everyone', l:'الجميع' },
              { k:'guest', l:'الزوار (غير المسجلين)' },
              { k:'new_user', l:'المستخدمون الجدد' },
              { k:'users', l:'المستخدمون (مسجلون)' },
              { k:'club', l:'أعضاء JEEEY CLUB' },
            ].map(opt=> (
              <label key={opt.k} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <input type="radio" name="aud" checked={audience===opt.k} onChange={()=> setAudience(opt.k as any)} /> {opt.l}
              </label>
            ))}
          </div>
        </div>

        <div className="panel" style={{ padding:12 }}>
          <h3 style={{ marginTop:0 }}>القواعد المتقدمة</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={!!rules.enabled} onChange={(e)=> setRules(r=> ({ ...r, enabled: e.target.checked }))} /> مفعل
            </label>
            <label>وضع المطابقة
              <select className="input" value={rules.matchMode||'all'} onChange={(e)=> setRules(r=> ({ ...r, matchMode: (e.target.value as any) }))}>
                <option value="all">كل الشروط</option>
                <option value="any">أي شرط</option>
              </select>
            </label>
            <label>حد أدنى للطلب
              <input type="number" className="input" value={rules.min ?? ''} onChange={(e)=> setRules(r=> ({ ...r, min: e.target.value===''? null : Number(e.target.value) }))} />
            </label>
            <label>حد أقصى للخصم
              <input type="number" className="input" value={rules.max ?? ''} onChange={(e)=> setRules(r=> ({ ...r, max: e.target.value===''? null : Number(e.target.value) }))} />
            </label>
            <label>حد لكل مستخدم
              <input type="number" className="input" value={rules.limitPerUser ?? ''} onChange={(e)=> setRules(r=> ({ ...r, limitPerUser: e.target.value===''? null : Number(e.target.value) }))} />
            </label>
            <label>طرق الدفع المسموحة (CSV)
              <input className="input" placeholder="COD, STRIPE" value={(rules.paymentMethods||[] as string[]).join(', ')} onChange={(e)=> { const parts = e.target.value.split(',').map(s=> s.trim()).filter(Boolean); setRules(r=> ({ ...r, paymentMethods: parts.length? parts: null })); }} />
            </label>
          </div>
          <div className="panel" style={{ padding:12, marginTop:12 }}>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
              <b>يشمل</b>
              <select value={includeType} onChange={(e)=> setIncludeType(e.target.value)} className="input" style={{ width:150 }}>
                <option value="category">فئة</option>
                <option value="brand">علامة تجارية</option>
                <option value="product">منتج</option>
                <option value="sku">رمز SKU</option>
                <option value="vendor">بائع</option>
                <option value="user">مستخدم</option>
                <option value="email">بريد إلكتروني</option>
              </select>
            {includeType==='category' ? (
              <button className="btn btn-sm" onClick={()=> setShowIncludeCat(true)}>اختيار الفئات…</button>
            ) : (
              <AsyncPicker 
                kind={includeType}
                apiBase={apiBase}
                existingTokens={rules.includes||[]}
                preselectCategoryIds={(rules.includes||[]).filter(s=> s.startsWith('category:')).map(s=> s.split(':')[1])}
                onPick={(vals)=> setRules(r=> ({ ...r, includes: [ ...(r.includes||[]), ...vals.map(v=> `${includeType}:${v}`) ] }))}
              />
            )}
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {(rules.includes||[]).map((s, idx)=> (
                <span key={`${s}-${idx}`} style={{ background:'#1f2937', padding:'4px 8px', borderRadius:999, display:'inline-flex', alignItems:'center', gap:6 }}>
                  {s}
                  <button onClick={()=> setRules(r=> ({ ...r, includes: (r.includes||[]).filter((_, i)=> i!==idx) }))} aria-label="remove" style={{ background:'transparent', color:'#93c5fd' }}>×</button>
                </span>
              ))}
              {!(rules.includes||[]).length && (<span style={{ color:'#94a3b8' }}>لا عناصر</span>)}
            </div>
          </div>
          <div className="panel" style={{ padding:12, marginTop:12 }}>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
              <b>يستثني</b>
              <select value={excludeType} onChange={(e)=> setExcludeType(e.target.value)} className="input" style={{ width:150 }}>
                <option value="category">فئة</option>
                <option value="brand">علامة تجارية</option>
                <option value="product">منتج</option>
                <option value="sku">رمز SKU</option>
                <option value="vendor">بائع</option>
                <option value="user">مستخدم</option>
                <option value="email">بريد إلكتروني</option>
              </select>
            {excludeType==='category' ? (
              <button className="btn btn-sm" onClick={()=> setShowExcludeCat(true)}>اختيار الفئات…</button>
            ) : (
              <AsyncPicker 
                kind={excludeType}
                apiBase={apiBase}
                existingTokens={rules.excludes||[]}
                preselectCategoryIds={(rules.excludes||[]).filter(s=> s.startsWith('category:')).map(s=> s.split(':')[1])}
                onPick={(vals)=> setRules(r=> ({ ...r, excludes: [ ...(r.excludes||[]), ...vals.map(v=> `${excludeType}:${v}`) ] }))}
              />
            )}
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {(rules.excludes||[]).map((s, idx)=> (
                <span key={`${s}-${idx}`} style={{ background:'#1f2937', padding:'4px 8px', borderRadius:999, display:'inline-flex', alignItems:'center', gap:6 }}>
                  {s}
                  <button onClick={()=> setRules(r=> ({ ...r, excludes: (r.excludes||[]).filter((_, i)=> i!==idx) }))} aria-label="remove" style={{ background:'transparent', color:'#93c5fd' }}>×</button>
                </span>
              ))}
              {!(rules.excludes||[]).length && (<span style={{ color:'#94a3b8' }}>لا عناصر</span>)}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <a href="/coupons" className="btn btn-outline">إلغاء</a>
          <button className="btn" onClick={submit} disabled={saving}>{saving? 'جارٍ الحفظ…' : 'حفظ'}</button>
        </div>
        {msg && <div style={{ color: msg.includes('فشل')? '#ef4444':'#9ae6b4' }}>{msg}</div>}
      </div>
      {showIncludeCat && (
        <CategoryCascadePicker apiBase={apiBase} title="اختر فئات للإدراج" onClose={()=> setShowIncludeCat(false)} onConfirm={(ids)=> { if (!ids.length) return; setRules(r=> ({ ...r, includes: [ ...(r.includes||[]), ...ids.map(id=> `category:${id}`) ] })); setShowIncludeCat(false); }} />
      )}
      {showExcludeCat && (
        <CategoryCascadePicker apiBase={apiBase} title="اختر فئات للاستثناء" onClose={()=> setShowExcludeCat(false)} onConfirm={(ids)=> { if (!ids.length) return; setRules(r=> ({ ...r, excludes: [ ...(r.excludes||[]), ...ids.map(id=> `category:${id}`) ] })); setShowExcludeCat(false); }} />
      )}
    </main>
  );
}

function normalizeRulesObject(input: CouponRules): CouponRules {
  const normalized: CouponRules = { ...input };
  if (normalized.min != null && Number.isNaN(Number(normalized.min))) normalized.min = null;
  if (normalized.max != null && Number.isNaN(Number(normalized.max))) normalized.max = null;
  if (normalized.includes && !Array.isArray(normalized.includes)) normalized.includes = [];
  if (normalized.excludes && !Array.isArray(normalized.excludes)) normalized.excludes = [];
  const fromIso = normalized.schedule?.from ? new Date(String(normalized.schedule.from)).toISOString() : null;
  const toIso = normalized.schedule?.to ? new Date(String(normalized.schedule.to)).toISOString() : null;
  if (normalized.schedule) normalized.schedule = { from: fromIso, to: toIso };
  return normalized;
}

function CategoryCascadePicker({ apiBase, title, onClose, onConfirm }: { apiBase: string; title: string; onClose: ()=>void; onConfirm: (ids: string[])=> void }): JSX.Element {
  const [tree, setTree] = React.useState<any[]>([]);
  const [flat, setFlat] = React.useState<Record<string, any>>({});
  const [path, setPath] = React.useState<Array<{ id:string; name:string }>>([]);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");

  React.useEffect(()=>{ (async()=>{
    try{
      setLoading(true);
      const [t, l] = await Promise.all([
        fetch(`${apiBase}/api/admin/categories/tree`, { credentials:'include' }).then(r=> r.json()).catch(()=>({ tree:[] })),
        fetch(`${apiBase}/api/admin/categories?limit=1000`, { credentials:'include' }).then(r=> r.json()).catch(()=>({ categories:[] })),
      ]);
      setTree(Array.isArray(t?.tree)? t.tree : []);
      const map: Record<string, any> = {};
      for (const c of (l?.categories||[])) map[String(c.id)] = c;
      setFlat(map);
    } finally { setLoading(false); }
  })(); }, [apiBase]);

  React.useEffect(()=>{ const prev = document.body.style.overflow; document.body.style.overflow='hidden'; return ()=> { document.body.style.overflow = prev; }; }, []);

  function currentLevel(): any[] {
    if (!path.length) return tree;
    let children = tree as any[];
    for (const p of path){
      const node = (children||[]).find(x=> String(x.id)===String(p.id));
      children = (node && node.children) ? node.children : [];
    }
    return children||[];
  }

  function imgFor(id:string): string | undefined {
    const c = flat[id]; const u = c?.image; if (!u) return undefined; const s=String(u); if (/^https?:\/\//i.test(s)) return s; if (s.startsWith('/')) return (window as any).API_BASE? `${(window as any).API_BASE}${s}`: s; return s;
  }

  const levelItems = currentLevel().filter((c:any)=> !query || String(c.name||'').toLowerCase().includes(query.toLowerCase()));
  const globalMatches = React.useMemo(()=>{
    if (!query.trim()) return [] as any[];
    const ql = query.toLowerCase();
    return Object.keys(flat).map(id=> flat[id]).filter((c:any)=> String(c.name||'').toLowerCase().includes(ql)).slice(0, 20);
  }, [query, flat]);

  return (
    <div role="dialog" aria-modal="true" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'grid', placeItems:'center', zIndex:1000 }}>
      <div className="panel" style={{ width:'min(900px, 96vw)', maxHeight:'90vh', overflow:'auto', background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:12 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <h3 style={{ margin:0 }}>{title}</h3>
          <button className="btn btn-sm btn-outline" onClick={onClose}>إغلاق</button>
        </div>
        <div style={{ marginBottom:8, display:'flex', gap:8 }}>
          <input className="input" placeholder="بحث عن فئة" value={query} onChange={(e)=> setQuery(e.target.value)} />
          <button className="btn btn-sm btn-outline" onClick={()=> setQuery("")}>مسح</button>
        </div>
        {loading ? (
          <div style={{ color:'#94a3b8' }}>جارٍ التحميل…</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, minHeight:360 }}>
            <div className="panel" style={{ padding:8 }}>
              <div style={{ color:'#94a3b8', marginBottom:6 }}>المستوى الحالي</div>
              <div style={{ display:'grid', gap:6 }}>
                {levelItems.map((c:any)=> (
                  <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 8px', border:'1px solid #1c2333', borderRadius:8 }}>
                    <input type="checkbox" checked={!!selected[c.id]} onChange={(e)=> setSelected(s=> ({ ...s, [String(c.id)]: e.target.checked }))} />
                    <img src={imgFor(String(c.id))||''} alt="" style={{ width:28, height:28, objectFit:'cover', borderRadius:6, background:'#0b0e14', border:'1px solid #1c2333' }} />
                    <button className="btn btn-sm btn-outline" onClick={()=> setPath(p=> ([...p, { id:String(c.id), name:String(c.name||'') }]))} style={{ marginInlineStart:'auto' }}>فتح</button>
                    <div style={{ color:'#e2e8f0' }}>{c.name}</div>
                  </div>
                ))}
                {!levelItems.length && <div style={{ color:'#94a3b8' }}>لا نتائج في هذا المستوى</div>}
              </div>
            </div>
            <div className="panel" style={{ padding:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div style={{ color:'#94a3b8' }}>المسار:</div>
                <button className="btn btn-sm btn-outline" onClick={()=> setPath([])}>الجذر</button>
                {path.map((p, idx)=> (
                  <button key={p.id} className="btn btn-sm" onClick={()=> setPath(path.slice(0, idx+1))}>{p.name||p.id}</button>
                ))}
              </div>
              {!!query.trim() && (
                <div style={{ marginTop:8 }}>
                  <div style={{ color:'#94a3b8', marginBottom:6 }}>نتائج البحث</div>
                  <div style={{ display:'grid', gap:6, maxHeight:240, overflow:'auto' }}>
                    {globalMatches.map((c:any)=> (
                      <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 8px', border:'1px solid #1c2333', borderRadius:8 }}>
                        <input type="checkbox" checked={!!selected[c.id]} onChange={(e)=> setSelected(s=> ({ ...s, [String(c.id)]: e.target.checked }))} />
                        <img src={imgFor(String(c.id))||''} alt="" style={{ width:28, height:28, objectFit:'cover', borderRadius:6, background:'#0b0e14', border:'1px solid #1c2333' }} />
                        <div style={{ color:'#e2e8f0' }}>{c.name}</div>
                      </div>
                    ))}
                    {!globalMatches.length && <div style={{ color:'#94a3b8' }}>لا نتائج مطابقة</div>}
                  </div>
                </div>
              )}
              <div style={{ color:'#94a3b8', marginBottom:6 }}>المحدد: {Object.keys(selected).filter(k=> selected[k]).length}</div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button className="btn btn-sm btn-outline" onClick={()=> setSelected({})}>مسح التحديد</button>
                <button className="btn btn-sm" onClick={()=> onConfirm(Object.keys(selected).filter(k=> selected[k]))}>اختيار</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AsyncPicker({ kind, apiBase, onPick, existingTokens, preselectCategoryIds }: { kind: string; apiBase: string; onPick: (ids: string[])=> void; existingTokens?: string[]; preselectCategoryIds?: string[] }): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState<Array<{ id:string; label:string; image?:string|null }>>([]);
  const [sel, setSel] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(false);

  async function fetchItems() {
    setLoading(true);
    try {
      const query = q.trim();
      const selectedTokens = (existingTokens||[]);
      const selectedSet = new Set(selectedTokens);
      const preCat = new Set(preselectCategoryIds||[]);
      const defaultSel: Record<string, boolean> = {};
      // Preferred dedicated search endpoint if available
      try {
        const url = new URL(`${apiBase}/api/admin/search/${kind}`);
        if (query) url.searchParams.set('q', query);
        const r = await fetch(url.toString(), { credentials:'include' });
        if (r.ok) {
          const j = await r.json();
          const arr = Array.isArray(j?.items) ? j.items : [];
          if (arr.length) {
            // Preselect by existing tokens if ids match
            for (const it of arr) {
              const token = `${kind}:${it.id}`;
              if (selectedSet.has(token)) defaultSel[it.id] = true;
            }
            setItems(arr);
            setSel(defaultSel);
            return;
          }
        }
      } catch {}

      // Fallbacks per kind using existing endpoints
      if (kind === 'product' || kind === 'sku' || kind === 'brand') {
        const url = new URL(`${apiBase}/api/admin/products`);
        if (query) url.searchParams.set('search', query);
        url.searchParams.set('limit', '100');
        const r = await fetch(url.toString(), { credentials:'include' });
        const j = await r.json().catch(()=>({}));
        const products = Array.isArray(j?.products) ? j.products : (Array.isArray(j?.items)? j.items: []);
        if (kind === 'product') {
          const mapped = products.map((p:any)=> ({ id: String(p.id), label: String(p.name||p.id), image: Array.isArray(p.images)&&p.images[0]? String(p.images[0]) : null, _cat: String(p.categoryId||'') })) as any[];
          for (const p of mapped) {
            if (selectedSet.has(`product:${p.id}`)) defaultSel[p.id] = true;
            if (p._cat && preCat.has(p._cat)) defaultSel[p.id] = true;
          }
          setItems(mapped.map(({id,label,image})=>({id,label,image})));
          setSel(defaultSel);
        } else if (kind === 'sku') {
          const filtered = products.filter((p:any)=> String(p.sku||'').toLowerCase().includes(query.toLowerCase()));
          const mapped = filtered.map((p:any)=> ({ id: String(p.sku||p.id), label: `${p.sku||''} — ${p.name||p.id}`, image: Array.isArray(p.images)&&p.images[0]? String(p.images[0]) : null, _cat: String(p.categoryId||'') })) as any[];
          for (const p of mapped) {
            if (selectedSet.has(`sku:${p.id}`)) defaultSel[p.id] = true;
            if (p._cat && preCat.has(p._cat)) defaultSel[p.id] = true;
          }
          setItems(mapped.map(({id,label,image})=>({id,label,image})));
          setSel(defaultSel);
        } else {
          // brand
          const uniq: Record<string, true> = {};
          const out: Array<{ id:string; label:string }> = [];
          for (const p of products) {
            const b = String(p.brand||'').trim();
            if (!b) continue;
            if (query && !b.toLowerCase().includes(query.toLowerCase())) continue;
            if (!uniq[b]) { uniq[b]=true; out.push({ id:b, label:b }); }
          }
          for (const it of out) {
            if (selectedSet.has(`brand:${it.id}`)) defaultSel[it.id] = true;
          }
          setItems(out);
          setSel(defaultSel);
        }
        return;
      }

      if (kind === 'vendor') {
        const url = new URL(`${apiBase}/api/admin/vendors/list`);
        if (query) url.searchParams.set('search', query);
        const r = await fetch(url.toString(), { credentials:'include' });
        const j = await r.json().catch(()=>({}));
        const vendors = Array.isArray(j?.vendors)? j.vendors : (Array.isArray(j?.items)? j.items: []);
        const mapped = vendors.map((v:any)=> ({ id: String(v.id||v._id||v.slug||v.name), label: String(v.name||v.title||v.id) }));
        for (const it of mapped) {
          if (selectedSet.has(`vendor:${it.id}`)) defaultSel[it.id] = true;
        }
        setItems(mapped);
        setSel(defaultSel);
        return;
      }

      if (kind === 'user' || kind === 'email') {
        const url = new URL(`${apiBase}/api/admin/users/list`);
        if (query) url.searchParams.set('search', query);
        const r = await fetch(url.toString(), { credentials:'include' });
        const j = await r.json().catch(()=>({}));
        const users = Array.isArray(j?.users)? j.users : (Array.isArray(j?.items)? j.items: []);
        if (kind === 'user') {
          const mapped = users.map((u:any)=> ({ id: String(u.id||u._id||u.email), label: String(u.email || u.name || u.id) }));
          for (const it of mapped) if (selectedSet.has(`user:${it.id}`)) defaultSel[it.id] = true;
          setItems(mapped);
          setSel(defaultSel);
        } else {
          // email
          const mapped = users.map((u:any)=> ({ id: String(u.email||u.id), label: String(u.email || u.name || u.id) }));
          for (const it of mapped) if (selectedSet.has(`email:${it.id}`)) defaultSel[it.id] = true;
          setItems(mapped);
          setSel(defaultSel);
        }
        return;
      }
    } finally { setLoading(false); }
  }

  React.useEffect(()=>{ if (!open) return; const t = setTimeout(fetchItems, 250); return ()=> clearTimeout(t); }, [q, open, kind, apiBase]);

  return (
    <div>
      <button className="btn btn-sm" onClick={()=> setOpen(true)}>اختيار…</button>
      {open && (
        <div role="dialog" aria-modal="true" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'grid', placeItems:'center', zIndex:1000 }}>
          <div className="panel" style={{ width:'min(720px, 96vw)', maxHeight:'90vh', overflow:'auto', background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:12 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <h3 style={{ margin:0 }}>اختيار {kind}</h3>
              <button className="btn btn-sm btn-outline" onClick={()=> setOpen(false)}>إغلاق</button>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input className="input" placeholder="بحث" value={q} onChange={(e)=> setQ(e.target.value)} />
              <button className="btn btn-sm btn-outline" onClick={()=> setQ("")}>مسح</button>
            </div>
            {loading? (<div style={{ color:'#94a3b8' }}>جارٍ التحميل…</div>) : (
              <div style={{ display:'grid', gap:6, maxHeight:360, overflow:'auto' }}>
                {items.map(it=> (
                  <div key={it.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 8px', border:'1px solid #1c2333', borderRadius:8 }}>
                    <input type="checkbox" checked={!!sel[it.id]} onChange={(e)=> setSel(s=> ({ ...s, [it.id]: e.target.checked }))} />
                    {it.image? (<img src={it.image} style={{ width:28, height:28, objectFit:'cover', borderRadius:6 }} />): (<div style={{ width:28, height:28, borderRadius:6, background:'#0b0e14', border:'1px solid #1c2333' }} />)}
                    <div style={{ color:'#e2e8f0' }}>{it.label}</div>
                  </div>
                ))}
                {!items.length && <div style={{ color:'#94a3b8' }}>لا نتائج</div>}
              </div>
            )}
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
              <button className="btn btn-sm btn-outline" onClick={()=> setSel({})}>مسح</button>
              <button className="btn btn-sm" onClick={()=> { const ids = Object.keys(sel).filter(k=> sel[k]); if (ids.length) onPick(ids); setOpen(false); }}>اختيار</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
