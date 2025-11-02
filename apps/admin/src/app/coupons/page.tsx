"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";
type CouponRules = {
  enabled?: boolean;
  min?: number | null;
  max?: number | null;
  includes?: string[];
  excludes?: string[];
  schedule?: { from?: string | null; to?: string | null };
  limitPerUser?: number | null;
  paymentMethods?: string[] | null;
};

export default function CouponsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [code, setCode] = React.useState("");
  const [discountType, setDiscountType] = React.useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = React.useState<string>("10");
  const [edit, setEdit] = React.useState<Record<string, number>>({});
  const [rules, setRules] = React.useState('{"enabled":true,"min":0,"max":null,"includes":[],"excludes":[],"schedule":{"from":null,"to":null}}');
  const [rulesModal, setRulesModal] = React.useState<{open:boolean, code:string, text:string, loading:boolean, visual:boolean, obj: CouponRules}>({ open:false, code:"", text:"", loading:false, visual:true, obj:{} });
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState<'all'|'active'|'inactive'>('all');
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<any|null>(null);
  const [analytics, setAnalytics] = React.useState<{ series:Array<{ day:string; count:number; revenue:number }>; summary:{ count:number; revenue:number } }|null>(null);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);

  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  async function load() {
    setLoading(true);
    const url = new URL(`${apiBase}/api/admin/coupons/list`);
    if (q.trim()) url.searchParams.set('q', q.trim());
    if (active!=='all') url.searchParams.set('active', active==='active'? 'true':'false');
    const res = await fetch(url.toString(), { credentials:'include' });
    const json = await res.json();
    setRows(json.coupons || []);
    setLoading(false);
  }
  React.useEffect(()=>{ load(); }, [apiBase]);

  async function create() {
    await fetch(`${apiBase}/api/admin/coupons`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ code, discountType, discountValue: Number(discountValue), rules: JSON.parse(rules), validFrom: new Date().toISOString(), validUntil: new Date(Date.now()+7*86400000).toISOString() }) });
    setCode("");
    await load();
  }

  async function loadAnalytics(code: string){
    try{
      setAnalyticsLoading(true);
      const r = await fetch(`${apiBase}/api/admin/coupons/analytics?code=${encodeURIComponent(code)}&days=30`, { credentials:'include' });
      const j = await r.json();
      setAnalytics({
        series: (j.series||[]).map((x:any)=> ({ day: x.day, count: Number(x.count||0), revenue: Number(x.revenue||0) })),
        summary: { count: Number(j.summary?.count||0), revenue: Number(j.summary?.revenue||0) }
      });
    } finally { setAnalyticsLoading(false); }
  }

  return (
    <main>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom: 16 }}>
        <h1 style={{ margin:0 }}>الكوبونات</h1>
        <a href="/coupons/new" className="btn">إنشاء كوبون</a>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
        <input value={q} onChange={(e)=> setQ(e.target.value)} placeholder="بحث بالكود" className="input" style={{ minWidth:220 }} />
        <select value={active} onChange={(e)=> setActive(e.target.value as any)} className="input" style={{ width:160 }}>
          <option value="all">الكل</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
        </select>
        <button onClick={load} className="btn">تصفية</button>
      </div>
      {/* تمت إزالة حقول الإنشاء من صفحة القائمة. زر الإنشاء ينقل لصفحة منفصلة */}
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الاسم</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الكود</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>النوع</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>القيمة</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الحالة</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>تحرير</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>القواعد</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>اختبار</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>تقرير</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c)=> (
            <tr key={c.id} onClick={()=> { setSelected(c); loadAnalytics(c.code).catch(()=>{}); }} style={{ cursor:'pointer' }}>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{/* عرض العنوان من القواعد */}
                <TitleFromRules apiBase={apiBase} code={c.code} />
              </td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{c.code}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{c.discountType}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{edit[c.id]!==undefined ? (
                <input type="number" value={edit[c.id]} onChange={(e)=>setEdit(s=>({...s,[c.id]:Number(e.target.value)}))} style={{ width:100, padding:6, borderRadius:6, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
              ) : c.discountValue}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                <span className={`badge ${c.isActive? 'ok':'warn'}`}>{c.isActive? 'نشط':'غير نشط'}</span>
                <button onClick={async ()=>{ await fetch(`${apiBase}/api/admin/coupons/${encodeURIComponent(c.id)}/activate`, { method:'PATCH', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ isActive: !c.isActive }) }); await load(); }} className="btn btn-sm btn-outline" style={{ marginInlineStart:8 }}>{c.isActive? 'تعطيل':'تفعيل'}</button>
              </td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                {edit[c.id]!==undefined ? (
                  <button onClick={async ()=>{ await fetch(`${apiBase}/api/admin/coupons`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ code: c.code, discountType: c.discountType, discountValue: edit[c.id], validFrom: c.validFrom, validUntil: c.validUntil }) }); setEdit(s=>{ const x={...s}; delete x[c.id]; return x; }); await load(); }} style={{ padding:'6px 10px', background:'#064e3b', color:'#e5e7eb', borderRadius:6 }}>حفظ</button>
                ) : (
                  <button onClick={()=>setEdit(s=>({...s,[c.id]:c.discountValue}))} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:6 }}>تحرير</button>
                )}
              </td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                <button onClick={async ()=>{
                  setRulesModal({ open:true, code:c.code, text:'', loading:true, visual:true, obj:{} });
                  try {
                    const r = await fetch(`${apiBase}/api/admin/coupons/${encodeURIComponent(c.code)}/rules`, { credentials:'include' });
                    const j = await r.json();
                    const obj = (j.rules || {}) as CouponRules;
                    setRulesModal({ open:true, code:c.code, text: JSON.stringify(obj ?? {}, null, 2), loading:false, visual:true, obj });
                  } catch {
                    setRulesModal({ open:true, code:c.code, text: '{}', loading:false, visual:true, obj:{} });
                  }
                }} style={{ padding:'6px 10px', background:'#1f2937', color:'#e5e7eb', borderRadius:6 }}>تحرير القواعد</button>
              </td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                <button onClick={async ()=>{
                  const payload = { cartTotal: 150, paymentMethod: 'COD', category:'', brand:'', productId:'', sku:'', vendor:'', email:'' };
                  try { const r = await fetch(`${apiBase}/api/admin/coupons/${encodeURIComponent(c.code)}/test`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) }); const j = await r.json(); alert(`نتيجة الاختبار: ${j.ok? 'ينطبق':'لا ينطبق'}\n${(j.reasons||[]).join(', ')}`); } catch { alert('فشل الاختبار'); }
                }} className="btn btn-sm btn-outline">اختبار سريع</button>
              </td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                <button className="btn btn-sm" onClick={async ()=>{
                  try{
                    const r = await fetch(`${apiBase}/api/admin/coupons/analytics?code=${encodeURIComponent(c.code)}&days=30`, { credentials:'include' });
                    const j = await r.json();
                    const lines = (j.series||[]).map((x:any)=> `${new Date(x.day).toLocaleDateString()} — ${x.count} طلب — ${Number(x.revenue||0).toFixed(2)} ر.س`);
                    alert(`آخر 30 يوم:\nالمجموع: ${j.summary?.count||0} طلب — ${Number(j.summary?.revenue||0).toFixed(2)} ر.س\n\n${lines.join('\n')}`);
                  }catch{ alert('تعذر جلب التقرير'); }
                }}>تقرير</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <div style={{ marginTop:8, color:'#94a3b8' }}>جارٍ التحميل…</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr min(380px, 32vw)', gap:16, alignItems:'start', marginTop:12 }}>
        <div className="panel">
          <div style={{ color:'#94a3b8' }}>تلميح: يمكن الضغط على صف لعرض تفاصيله في الشريط الجانبي.</div>
        </div>
        <aside className="panel" style={{ position:'sticky', top:12 }}>
          <h3 style={{ marginTop:0, marginBottom:8 }}>تفاصيل</h3>
          {!selected && <div style={{ color:'#94a3b8' }}>اختر كوبوناً من الجدول لعرض التفاصيل.</div>}
          {selected && (
            <div style={{ display:'grid', gap:10 }}>
              <div><b>الكود:</b> {selected.code}</div>
              <div><b>النوع:</b> {selected.discountType} · <b>القيمة:</b> {selected.discountValue}</div>
              <div><b>الحالة:</b> <span className={`badge ${selected.isActive? 'ok':'warn'}`}>{selected.isActive? 'نشط':'غير نشط'}</span></div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-sm" onClick={()=> setRulesModal({ open:true, code:selected.code, text:'', loading:true, visual:true, obj:{} })}>تحرير القواعد</button>
                <button className="btn btn-sm btn-outline" onClick={()=> loadAnalytics(selected.code)}>تحديث البيانات</button>
              </div>
              <div>
                <b>الأداء (30 يوماً):</b>
                {analyticsLoading && <div style={{ color:'#94a3b8' }}>جارٍ التحميل…</div>}
                {!analyticsLoading && analytics && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ color:'#9ae6b4', marginBottom:6 }}>طلبات: {analytics.summary.count} · الإيراد: {analytics.summary.revenue.toFixed(2)} ر.س</div>
                    <BarChart data={analytics.series.map(s=> s.count)} labels={analytics.series.map(s=> new Date(s.day).toLocaleDateString())} />
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
      {rulesModal.open && (
        <div role="dialog" aria-modal="true" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'grid', placeItems:'center', zIndex:1000 }}>
          <div style={{ width:'min(720px, 96vw)', background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <h2 style={{ margin:0 }}>قواعد الكوبون: {rulesModal.code}</h2>
              <button onClick={()=> setRulesModal({ open:false, code:'', text:'', loading:false, visual:true, obj:{} })} style={{ padding:'6px 10px' }}>إغلاق</button>
            </div>
            {rulesModal.loading ? (
              <div>جاري التحميل...</div>
            ) : (
              <div style={{ display:'grid', gap:10 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <button onClick={()=> setRulesModal(s=> ({ ...s, visual:true }))} style={{ padding:'6px 10px', background: rulesModal.visual? '#064e3b':'#1f2937', color:'#e5e7eb', borderRadius:6 }}>محرر بصري</button>
                  <button onClick={()=> setRulesModal(s=> ({ ...s, visual:false }))} className="btn btn-outline" style={{ padding:'6px 10px' }}>JSON خام</button>
                </div>
                {rulesModal.visual ? (
                  <RulesBuilder value={rulesModal.obj} onChange={(next)=> setRulesModal(s=> ({ ...s, obj: next, text: JSON.stringify(next, null, 2) }))} />
                ) : (
                  <textarea value={rulesModal.text} onChange={(e)=> {
                    const txt = e.target.value;
                    let parsed: CouponRules = {};
                    try { parsed = txt.trim()? JSON.parse(txt) : {}; } catch { /* ignore */ }
                    setRulesModal(s=> ({ ...s, text: txt, obj: parsed }));
                  }} style={{ width:'100%', minHeight:260, padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                )}
              </div>
            )}
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:12 }}>
              <button onClick={()=> setRulesModal({ open:false, code:'', text:'', loading:false, visual:true, obj:{} })} style={{ padding:'8px 12px' }}>إلغاء</button>
              <button onClick={async ()=>{
                try {
                  let payload: CouponRules = {};
                  if (rulesModal.visual) {
                    payload = normalizeRulesObject(rulesModal.obj);
                  } else {
                    payload = rulesModal.text.trim() ? JSON.parse(rulesModal.text) : {};
                  }
                  await fetch(`${apiBase}/api/admin/coupons/${encodeURIComponent(rulesModal.code)}/rules`, { method:'PUT', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ rules: payload }) });
                  setRulesModal({ open:false, code:'', text:'', loading:false, visual:true, obj:{} });
                } catch (err) {
                  alert('JSON غير صالح');
                }
              }} style={{ padding:'8px 12px', background:'#064e3b', color:'#e5e7eb', borderRadius:8 }}>حفظ</button>
            </div>
          </div>
        </div>
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

function RulesBuilder({ value, onChange }: { value: CouponRules; onChange: (v: CouponRules) => void }): JSX.Element {
  const rules = React.useMemo<CouponRules>(() => ({
    enabled: true,
    min: 0,
    max: null,
    includes: [],
    excludes: [],
    schedule: { from: null, to: null },
    limitPerUser: null,
    paymentMethods: null,
    ...value,
  }), [value]);

  const [includeType, setIncludeType] = React.useState<string>("category");
  const [includeValue, setIncludeValue] = React.useState<string>("");
  const [excludeType, setExcludeType] = React.useState<string>("brand");
  const [excludeValue, setExcludeValue] = React.useState<string>("");

  function update<K extends keyof CouponRules>(key: K, v: CouponRules[K]) {
    onChange({ ...rules, [key]: v });
  }

  function addInclude() {
    if (!includeValue.trim()) return;
    const next = [...(rules.includes || []), `${includeType}:${includeValue.trim()}`];
    update("includes", next);
    setIncludeValue("");
  }

  function addExclude() {
    if (!excludeValue.trim()) return;
    const next = [...(rules.excludes || []), `${excludeType}:${excludeValue.trim()}`];
    update("excludes", next);
    setExcludeValue("");
  }

  return (
    <div style={{ display:'grid', gap:12 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <label style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input type="checkbox" checked={!!rules.enabled} onChange={(e)=> update('enabled', e.target.checked)} />
          <span>مفعل</span>
        </label>
        <label>
          حد لكل مستخدم
          <input type="number" value={rules.limitPerUser ?? ''} onChange={(e)=> update('limitPerUser', e.target.value === '' ? null : Number(e.target.value))} className="input" style={{ width:'100%' }} />
        </label>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <label>
          حد أدنى للطلب
          <input type="number" value={rules.min ?? ''} onChange={(e)=> update('min', e.target.value === '' ? null : Number(e.target.value))} className="input" />
        </label>
        <label>
          حد أقصى للخصم
          <input type="number" value={rules.max ?? ''} onChange={(e)=> update('max', e.target.value === '' ? null : Number(e.target.value))} className="input" />
        </label>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <label>
          من (تاريخ)
          <input type="date" value={rules.schedule?.from ? String(rules.schedule.from).slice(0,10) : ''} onChange={(e)=> update('schedule', { ...(rules.schedule||{}), from: e.target.value? new Date(e.target.value).toISOString() : null })} className="input" />
        </label>
        <label>
          إلى (تاريخ)
          <input type="date" value={rules.schedule?.to ? String(rules.schedule.to).slice(0,10) : ''} onChange={(e)=> update('schedule', { ...(rules.schedule||{}), to: e.target.value? new Date(e.target.value).toISOString() : null })} className="input" />
        </label>
      </div>
      <div className="panel" style={{ padding:12 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
          <b>يشمل</b>
          <select value={includeType} onChange={(e)=> setIncludeType(e.target.value)} className="input" style={{ width:150 }}>
            <option value="category">category</option>
            <option value="brand">brand</option>
            <option value="product">product</option>
            <option value="sku">sku</option>
            <option value="vendor">vendor</option>
            <option value="user">user</option>
            <option value="email">email</option>
          </select>
          <input value={includeValue} onChange={(e)=> setIncludeValue(e.target.value)} placeholder="القيمة" className="input" />
          <button onClick={addInclude} className="btn btn-sm">إضافة</button>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {(rules.includes||[]).map((s, idx)=> (
            <span key={`${s}-${idx}`} style={{ background:'#1f2937', padding:'4px 8px', borderRadius:999, display:'inline-flex', alignItems:'center', gap:6 }}>
              {s}
              <button onClick={()=> {
                const next = (rules.includes||[]).filter((_, i)=> i!==idx);
                update('includes', next);
              }} aria-label="remove" style={{ background:'transparent', color:'#93c5fd' }}>×</button>
            </span>
          ))}
          {!(rules.includes||[]).length && (<span style={{ color:'#94a3b8' }}>لا عناصر</span>)}
        </div>
      </div>
      <div className="panel" style={{ padding:12 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
          <b>يستثني</b>
          <select value={excludeType} onChange={(e)=> setExcludeType(e.target.value)} className="input" style={{ width:150 }}>
            <option value="category">category</option>
            <option value="brand">brand</option>
            <option value="product">product</option>
            <option value="sku">sku</option>
            <option value="vendor">vendor</option>
            <option value="user">user</option>
            <option value="email">email</option>
          </select>
          <input value={excludeValue} onChange={(e)=> setExcludeValue(e.target.value)} placeholder="القيمة" className="input" />
          <button onClick={addExclude} className="btn btn-sm">إضافة</button>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {(rules.excludes||[]).map((s, idx)=> (
            <span key={`${s}-${idx}`} style={{ background:'#1f2937', padding:'4px 8px', borderRadius:999, display:'inline-flex', alignItems:'center', gap:6 }}>
              {s}
              <button onClick={()=> {
                const next = (rules.excludes||[]).filter((_, i)=> i!==idx);
                update('excludes', next);
              }} aria-label="remove" style={{ background:'transparent', color:'#93c5fd' }}>×</button>
            </span>
          ))}
          {!(rules.excludes||[]).length && (<span style={{ color:'#94a3b8' }}>لا عناصر</span>)}
        </div>
      </div>
      <div>
        <label>طرق الدفع المسموحة (اختياري)
          <input
            placeholder="مثال: COD, STRIPE"
            value={(rules.paymentMethods||[] as string[]).join(', ')}
            onChange={(e)=> {
              const parts = e.target.value.split(',').map(s=> s.trim()).filter(Boolean);
              update('paymentMethods', parts.length? parts : null);
            }}
            className="input" style={{ width:'100%' }}
          />
        </label>
      </div>
    </div>
  );
}

function TitleFromRules({ apiBase, code }: { apiBase: string; code: string }): JSX.Element {
  const [title, setTitle] = React.useState<string>('…');
  React.useEffect(()=>{ (async()=>{
    try{
      const r = await fetch(`${apiBase}/api/admin/coupons/${encodeURIComponent(code)}/rules`, { credentials:'include' });
      const j = await r.json();
      const t = j?.rules?.title;
      setTitle(t? String(t) : `كوبون ${code}`);
    } catch { setTitle(`كوبون ${code}`); }
  })(); }, [apiBase, code]);
  return <span>{title}</span>;
}

function BarChart({ data, labels }: { data: number[]; labels: string[] }): JSX.Element {
  const max = Math.max(1, ...data);
  const w = 320; const h = 120; const pad = 16;
  const step = data.length>0? (w - pad*2) / data.length : w - pad*2;
  const bars = data.map((v, i)=> {
    const x = pad + i*step + 2;
    const barW = Math.max(2, step - 6);
    const barH = Math.round((v / max) * (h - pad*2));
    const y = h - pad - barH;
    return <rect key={i} x={x} y={y} width={barW} height={barH} fill="#2563eb" rx={2} />;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="140" role="img" aria-label="مخطط أعمدة للأداء">
      <rect x={0} y={0} width={w} height={h} fill="#0b0e14" rx={8} />
      <g>
        {bars}
      </g>
    </svg>
  );
}

