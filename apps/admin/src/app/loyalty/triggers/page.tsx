"use client";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";

export default function TriggersPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [config, setConfig] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);
  // Pickers state (IDs + labels)
  const [pickOpen, setPickOpen] = React.useState<{type?: 'products'|'categories'|'vendors'|'products_ex'|'categories_ex'|'vendors_ex'; open:boolean}>({ open:false });
  const [search, setSearch] = React.useState('');
  const [options, setOptions] = React.useState<Array<{id:string;name:string}>>([]);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  // Auto-load options when picker opens
  React.useEffect(()=>{
    if (!pickOpen.open || !pickOpen.type) return;
    (async ()=>{
      try{
        if (pickOpen.type.startsWith('products')){
          const url = new URL(`${apiBase}/api/admin/products`); url.searchParams.set('limit','20'); url.searchParams.set('suggest','1');
          const j = await (await fetch(url.toString(), { credentials:'include' })).json();
          setOptions((j.products||[]).map((p:any)=> ({ id:p.id, name:p.name })));
        } else if (pickOpen.type.startsWith('categories')){
          const j = await (await fetch(`${apiBase}/api/admin/categories`, { credentials:'include' })).json();
          setOptions((j.categories||[]).map((c:any)=> ({ id:c.id, name:c.name })));
        } else {
          const j = await (await fetch(`${apiBase}/api/admin/vendors/list`, { credentials:'include' })).json();
          setOptions((j.vendors||[]).map((v:any)=> ({ id:v.id, name:v.name })));
        }
        setSelected({});
      }catch{ setOptions([]); }
    })();
  }, [pickOpen.open, pickOpen.type, apiBase]);
  async function load(){
    setBusy(true);
    try{ const j = await (await fetch(`${apiBase}/api/admin/points/triggers`, { credentials:'include' })).json(); setConfig(j.config||{}); }catch{ setConfig({}); }
    setBusy(false);
  }
  React.useEffect(()=>{ void load(); },[apiBase]);
  async function save(){
    setBusy(true);
    const r = await fetch(`${apiBase}/api/admin/points/triggers`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify(config||{}) });
    setBusy(false);
    if (!r.ok) return alert('فشل الحفظ');
    alert('تم الحفظ');
  }
  if (!config) return <main><h1>قواعد النقاط</h1><div>جارٍ التحميل…</div></main>;
  return (
    <main>
      <h1 style={{ marginBottom: 12 }}>قواعد منح النقاط (Triggers)</h1>
      <div className="panel" style={{ display:'grid', gap:8 }}>
        <label><input type="checkbox" checked={config.enabled!==false} onChange={e=> setConfig((c:any)=> ({...c, enabled: e.target.checked}))} /> مفعّل</label>
        <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <label className="grid" style={{gap:4}}>
            <span>نقاط لكل وحدة عملة</span>
            <input className="input" type="number" step="0.01" value={config?.purchase?.pointsPerCurrency??0.1} onChange={e=> setConfig((c:any)=> ({...c, purchase:{...(c?.purchase||{}), pointsPerCurrency: Number(e.target.value||0)}}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>تأكيد نقاط الشراء عند</span>
            <select className="input" value={config?.purchase?.confirmOn||'paid'} onChange={e=> setConfig((c:any)=> ({...c, purchase:{...(c?.purchase||{}), confirmOn: e.target.value}}))}>
              <option value="paid">الدفع</option>
              <option value="shipped">الشحن</option>
              <option value="delivered">التسليم</option>
            </select>
          </label>
          <label className="grid" style={{gap:4}}>
            <span>تسجيل أول مرة (نقاط)</span>
            <input className="input" type="number" value={config?.registration?.points??0} onChange={e=> setConfig((c:any)=> ({...c, registration:{ points: Number(e.target.value||0) }}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>تسجيل يومي (نقاط)</span>
            <input className="input" type="number" value={config?.dailyCheckIn?.points??0} onChange={e=> setConfig((c:any)=> ({...c, dailyCheckIn:{ ...(c?.dailyCheckIn||{}), points: Number(e.target.value||0) }}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>نقاط كتابة تعليق</span>
            <input className="input" type="number" value={config?.review?.base??0} onChange={e=> setConfig((c:any)=> ({...c, review:{ ...(c?.review||{}), base: Number(e.target.value||0) }}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>إضافة صورة في التعليق (نقاط إضافية)</span>
            <input className="input" type="number" value={config?.review?.withPhotoBonus??0} onChange={e=> setConfig((c:any)=> ({...c, review:{ ...(c?.review||{}), withPhotoBonus: Number(e.target.value||0) }}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>مكافأة عند بلوغ إعجابات X</span>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <input className="input" placeholder="عدد الإعجابات" type="number" value={config?.review?.likeThreshold?.count??''} onChange={e=> setConfig((c:any)=> ({...c, review:{ ...(c?.review||{}), likeThreshold:{ ...(c?.review?.likeThreshold||{}), count: Number(e.target.value||0) } }}))} />
              <input className="input" placeholder="نقاط المكافأة" type="number" value={config?.review?.likeThreshold?.bonus??''} onChange={e=> setConfig((c:any)=> ({...c, review:{ ...(c?.review||{}), likeThreshold:{ ...(c?.review?.likeThreshold||{}), bonus: Number(e.target.value||0) } }}))} />
            </div>
          </label>
          <label className="grid" style={{gap:4}}>
            <span>نقاط المشاركة</span>
            <input className="input" type="number" value={config?.share?.view??0} onChange={e=> setConfig((c:any)=> ({...c, share:{ ...(c?.share||{}), view: Number(e.target.value||0) }}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>نقاط المشاركة مع شراء (share → purchase)</span>
            <input className="input" type="number" value={config?.share?.withPurchase??0} onChange={e=> setConfig((c:any)=> ({...c, share:{ ...(c?.share||{}), withPurchase: Number(e.target.value||0) }}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>Referral Sign-up (referrer)</span>
            <input className="input" type="number" value={config?.referral?.signUp?.referrer??0} onChange={e=> setConfig((c:any)=> ({...c, referral:{ ...(c?.referral||{}), signUp:{ ...(c?.referral?.signUp||{}), referrer: Number(e.target.value||0) }}}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>Referral Sign-up (referred)</span>
            <input className="input" type="number" value={config?.referral?.signUp?.referred??0} onChange={e=> setConfig((c:any)=> ({...c, referral:{ ...(c?.referral||{}), signUp:{ ...(c?.referral?.signUp||{}), referred: Number(e.target.value||0) }}}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>Referral Purchase % (referrer)</span>
            <input className="input" type="number" step="0.01" value={config?.referral?.purchase?.referrerPercent??0} onChange={e=> setConfig((c:any)=> ({...c, referral:{ ...(c?.referral||{}), purchase:{ ...(c?.referral?.purchase||{}), referrerPercent: Number(e.target.value||0) }}}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>حد أدنى للسلة للاحتساب (Referral Purchase)</span>
            <input className="input" type="number" step="0.01" value={config?.referral?.purchase?.minSubtotal??0} onChange={e=> setConfig((c:any)=> ({...c, referral:{ ...(c?.referral||{}), purchase:{ ...(c?.referral?.purchase||{}), minSubtotal: Number(e.target.value||0) }}}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>حد أدنى لقيمة السلة لاحتساب النقاط</span>
            <input className="input" type="number" step="0.01" value={config?.conditions?.minCartValue??0} onChange={e=> setConfig((c:any)=> ({...c, conditions:{ ...(c?.conditions||{}), minCartValue: Number(e.target.value||0) }}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>تأكيد نقاط الشراء عند</span>
            <select className="input" value={config?.confirmDelays?.purchase||config?.purchase?.confirmOn||'paid'} onChange={e=> setConfig((c:any)=> ({...c, confirmDelays:{ ...(c?.confirmDelays||{}), purchase: e.target.value }}))}>
              <option value="placed">عند إنشاء الطلب</option>
              <option value="paid">عند الدفع</option>
              <option value="shipped">عند الشحن</option>
              <option value="delivered">عند التسليم</option>
            </select>
          </label>
        </div>
        {/* Pickers-like UI */}
        <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <fieldset className="grid" style={{gap:8}}>
            <legend style={{fontWeight:600}}>تضمين (اختيار من القوائم)</legend>
            <div className="grid" style={{gridTemplateColumns:'1fr auto', display:'grid', gap:6}}>
              <div className="chips">{(config?.conditions?.include?.products||[]).map((id:string)=> (<span key={id} className="chip">{id}</span>))}</div>
              <button type="button" className="btn btn-sm" onClick={()=>{ setPickOpen({ type:'products', open:true }); }}>اختر منتجات</button>
            </div>
            <div className="grid" style={{gridTemplateColumns:'1fr auto', display:'grid', gap:6}}>
              <div className="chips">{(config?.conditions?.include?.categories||[]).map((id:string)=> (<span key={id} className="chip">{id}</span>))}</div>
              <button type="button" className="btn btn-sm" onClick={()=>{ setPickOpen({ type:'categories', open:true }); }}>اختر فئات</button>
            </div>
            <div className="grid" style={{gridTemplateColumns:'1fr auto', display:'grid', gap:6}}>
              <div className="chips">{(config?.conditions?.include?.vendors||[]).map((id:string)=> (<span key={id} className="chip">{id}</span>))}</div>
              <button type="button" className="btn btn-sm" onClick={()=>{ setPickOpen({ type:'vendors', open:true }); }}>اختر مورّدين</button>
            </div>
          </fieldset>
          <fieldset className="grid" style={{gap:8}}>
            <legend style={{fontWeight:600}}>استثناء (اختيار من القوائم)</legend>
            <div className="grid" style={{gridTemplateColumns:'1fr auto', display:'grid', gap:6}}>
              <div className="chips">{(config?.conditions?.exclude?.products||[]).map((id:string)=> (<span key={id} className="chip">{id}</span>))}</div>
              <button type="button" className="btn btn-sm" onClick={()=>{ setPickOpen({ type:'products_ex', open:true }); }}>استثنِ منتجات</button>
            </div>
            <div className="grid" style={{gridTemplateColumns:'1fr auto', display:'grid', gap:6}}>
              <div className="chips">{(config?.conditions?.exclude?.categories||[]).map((id:string)=> (<span key={id} className="chip">{id}</span>))}</div>
              <button type="button" className="btn btn-sm" onClick={()=>{ setPickOpen({ type:'categories_ex', open:true }); }}>استثنِ فئات</button>
            </div>
            <div className="grid" style={{gridTemplateColumns:'1fr auto', display:'grid', gap:6}}>
              <div className="chips">{(config?.conditions?.exclude?.vendors||[]).map((id:string)=> (<span key={id} className="chip">{id}</span>))}</div>
              <button type="button" className="btn btn-sm" onClick={()=>{ setPickOpen({ type:'vendors_ex', open:true }); }}>استثنِ مورّدين</button>
            </div>
          </fieldset>
        </div>
        <div className="grid" style={{ gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
          <label className="grid" style={{gap:4}}>
            <span>حد أقصى لكل طلب</span>
            <input className="input" type="number" step="1" value={config?.caps?.perOrderMax??''} onChange={e=> setConfig((c:any)=> ({...c, caps:{ ...(c?.caps||{}), perOrderMax: e.target.value? Number(e.target.value): undefined }}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>حد يومي</span>
            <input className="input" type="number" step="1" value={config?.caps?.perDay??''} onChange={e=> setConfig((c:any)=> ({...c, caps:{ ...(c?.caps||{}), perDay: e.target.value? Number(e.target.value): undefined }}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>حد شهري</span>
            <input className="input" type="number" step="1" value={config?.caps?.perMonth??''} onChange={e=> setConfig((c:any)=> ({...c, caps:{ ...(c?.caps||{}), perMonth: e.target.value? Number(e.target.value): undefined }}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>الحد الأدنى لكل عملية</span>
            <input className="input" type="number" step="1" value={config?.caps?.minPerOp??''} onChange={e=> setConfig((c:any)=> ({...c, caps:{ ...(c?.caps||{}), minPerOp: e.target.value? Number(e.target.value): undefined }}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>الحد الأقصى لكل عملية</span>
            <input className="input" type="number" step="1" value={config?.caps?.maxPerOp??''} onChange={e=> setConfig((c:any)=> ({...c, caps:{ ...(c?.caps||{}), maxPerOp: e.target.value? Number(e.target.value): undefined }}))} />
          </label>
          <label className="grid" style={{gap:4}}>
            <span>الحد الإجمالي للحساب</span>
            <input className="input" type="number" step="1" value={config?.caps?.totalMax??''} onChange={e=> setConfig((c:any)=> ({...c, caps:{ ...(c?.caps||{}), totalMax: e.target.value? Number(e.target.value): undefined }}))} />
          </label>
        </div>
        <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button className="btn" onClick={save} disabled={busy}>حفظ</button>
        </div>
      </div>

      {/* Picker popover (inline, مثل صفحة الكوبونات) */}
      {pickOpen.open && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ width:720 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 className="text-lg">{pickOpen.type?.includes('ex')? 'استثناء' : 'تضمين'} — {pickOpen.type?.startsWith('products')? 'منتجات' : pickOpen.type?.startsWith('categories')? 'فئات' : 'مورّدين'}</h3>
              <button className="btn btn-outline" onClick={()=> setPickOpen({ open:false })}>إغلاق</button>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <input className="input" placeholder="بحث" value={search} onChange={e=> setSearch(e.target.value)} />
              <button className="btn btn-sm" onClick={async ()=>{
                try{
                  if (pickOpen.type?.startsWith('products')){
                    const url = new URL(`${apiBase}/api/admin/products`);
                    url.searchParams.set('search', search.trim()); url.searchParams.set('limit','20'); url.searchParams.set('suggest','1');
                    const j = await (await fetch(url, { credentials:'include' })).json();
                    const arr = (j.products||[]).map((p:any)=> ({ id: p.id, name: p.name, image: Array.isArray(p.images) && p.images[0] ? p.images[0] : undefined })); setOptions(arr as any);
                  } else if (pickOpen.type?.startsWith('categories')){
                    const j = await (await fetch(`${apiBase}/api/admin/categories`, { credentials:'include' })).json();
                    const arr = (j.categories||[]).filter((c:any)=> !search || String(c.name||'').includes(search)).map((c:any)=> ({ id:c.id, name:c.name }));
                    setOptions(arr);
                  } else {
                    const j = await (await fetch(`${apiBase}/api/admin/vendors/list`, { credentials:'include' })).json();
                    const arr = (j.vendors||[]).filter((v:any)=> !search || String(v.name||'').includes(search)).map((v:any)=> ({ id:v.id, name:v.name }));
                    setOptions(arr);
                  }
                  setSelected({});
                }catch{ setOptions([]); }
              }}>بحث</button>
            </div>
            <div style={{ maxHeight:420, overflow:'auto', marginTop:8 }}>
              {options.map((opt:any)=> (
                <label key={opt.id} style={{ display:'grid', gridTemplateColumns:'24px 28px 1fr', alignItems:'center', gap:10, padding:'6px 0' }}>
                  <input type="checkbox" checked={!!selected[opt.id]} onChange={()=> setSelected(s=> ({...s, [opt.id]: !s[opt.id]}))} />
                  <span style={{ width:28, height:28, display:'inline-block', borderRadius:6, overflow:'hidden', background:'#f3f4f6' }}>
                    {opt.image ? (<img src={opt.image} alt="" style={{ width:28, height:28, objectFit:'cover' }} />) : null}
                  </span>
                  <span><span style={{ fontFamily:'ui-monospace' }}>{opt.id.slice(0,6)}</span> — {opt.name}</span>
                </label>
              ))}
              {!options.length && <div className="muted">— لا نتائج —</div>}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:8 }}>
              <button className="btn btn-outline" onClick={()=> setPickOpen({ open:false })}>إلغاء</button>
              <button className="btn" onClick={()=>{
                const ids = Object.keys(selected).filter(id=> selected[id]);
                if (!ids.length) { setPickOpen({ open:false }); return; }
                const path = pickOpen.type||'products';
                setConfig((c:any)=>{
                  const next = { ...(c?.conditions||{}), include:{ ...(c?.conditions?.include||{}) }, exclude:{ ...(c?.conditions?.exclude||{}) } } as any;
                  if (path==='products') next.include.products = Array.from(new Set([...(next.include.products||[]), ...ids]));
                  if (path==='categories') next.include.categories = Array.from(new Set([...(next.include.categories||[]), ...ids]));
                  if (path==='vendors') next.include.vendors = Array.from(new Set([...(next.include.vendors||[]), ...ids]));
                  if (path==='products_ex') next.exclude.products = Array.from(new Set([...(next.exclude.products||[]), ...ids]));
                  if (path==='categories_ex') next.exclude.categories = Array.from(new Set([...(next.exclude.categories||[]), ...ids]));
                  if (path==='vendors_ex') next.exclude.vendors = Array.from(new Set([...(next.exclude.vendors||[]), ...ids]));
                  return { ...c, conditions: next };
                });
                setPickOpen({ open:false });
              }}>إضافة</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


