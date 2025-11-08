"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";
import { MediaPicker } from "../components/MediaPicker";

type Campaign = {
  id: string;
  name: string;
  status: 'DRAFT'|'LIVE'|'PAUSED'|'ENDED';
  priority: number;
  schedule?: any;
  targeting?: any;
  frequency?: any;
  variantA?: any;
  variantB?: any;
  abWeights?: { A?: number; B?: number };
  rewardId?: string|null;
  createdAt?: string;
};

export default function CampaignsPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [rows, setRows] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [activeOnly, setActiveOnly] = React.useState(false);
  const [modal, setModal] = React.useState<{
    open: boolean;
    item: Partial<Campaign>|null;
    saving: boolean;
    step: number;
    lang: 'ar'|'en';
    previewDevice: 'mobile'|'desktop';
    error?: string;
  }>({ open:false, item:null, saving:false, step:0, lang:'ar', previewDevice:'mobile' });
  const [mediaOpen, setMediaOpen] = React.useState(false);
  const [coupons, setCoupons] = React.useState<Array<{ code:string }>>([]);
  const [couponPickerOpen, setCouponPickerOpen] = React.useState(false);
  const [linkPickerOpen, setLinkPickerOpen] = React.useState<{ open:boolean; index:number|null }>({ open:false, index:null });
  const [publishConfirmOpen, setPublishConfirmOpen] = React.useState(false);
  const [sandboxLogs, setSandboxLogs] = React.useState<Array<{ t:string; type:string; meta?:any }>>([]);
  const [sandboxRunning, setSandboxRunning] = React.useState(false);
  const [fullscreenWizard, setFullscreenWizard] = React.useState(false);

  // Deep-linking to wizard mode
  React.useEffect(()=>{
    try{
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('mode')==='wizard'){
        setFullscreenWizard(true);
        const id = sp.get('id')||'';
        const create = sp.get('create')||'';
        if (create==='1'){ openCreate(); return; }
        if (id){
          (async()=>{
            await load();
            const found = (rows||[]).find(r=> String(r.id)===id);
            if (found) openEdit(found);
            else setFullscreenWizard(false);
          })();
        }
      }
    }catch{}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`${apiBase}/api/admin/promotions/campaigns`, { credentials:'include', headers: { ...authHeaders() } });
      const j = await res.json();
      let list: Campaign[] = Array.isArray(j?.campaigns) ? j.campaigns : [];
      if (activeOnly) list = list.filter(r=> r.status==='LIVE' || r.status==='PAUSED');
      if (q.trim()) list = list.filter(r=> (r.name||'').toLowerCase().includes(q.trim().toLowerCase()));
      setRows(list);
    }catch(e:any){
      console.error(e);
    }finally{
      setLoading(false);
    }
  }
  React.useEffect(()=>{ load(); }, [apiBase]);
  React.useEffect(()=>{ (async()=>{ try{ const j = await (await fetch(`${apiBase}/api/admin/coupons/list`, { credentials:'include' })).json(); const list = Array.isArray(j?.coupons)? j.coupons : []; setCoupons(list.map((c:any)=> ({ code: c.code })))}catch{} })(); }, [apiBase]);

  function newItem(): Partial<Campaign> {
    return {
      name: '', status: 'DRAFT', priority: 0,
      schedule: { start: '', end: '' },
      targeting: { audience:'all', includePaths:[], excludePaths:[], languages:[], sources:[], slug:'', owner:'', geoCountries:[] },
      frequency: { cap: 'session', days: 0, dontShowAgain: false },
      variantA: {
        type:'coupon',
        content: {
          title:'', subtitle:'', description:'',
          descriptionHtml:'',
          media:{ type:'image', src:'' },
          gallery: [],
          lazy: true,
          couponCode:'',
          coupons: [],
          points:0,
          ctas: [],
          translations: { en: { title:'', subtitle:'', description:'', descriptionHtml:'' } }
        },
        design:{ theme:'default', colors:{ primary:'#0B5FFF', background:'#ffffff', text:'#111827' }, size:'md', radius:12, maxWidth:480, shadow:'lg', textAlign:'start', animation:'fade-scale' },
        triggers:{ on:'first_visit', delaySeconds:0, scrollPercent:0, exitIntent:false, afterAddToCart:false, afterPurchase:false, multi: [] }
      },
      variantB: null,
      abWeights: { A: 100, B: 0 },
    } as any;
  }

  function openCreate(){ setModal(m=> ({ ...m, open:true, item: newItem(), saving:false, step:0, error:'' as any })); }
  function openEdit(row: Campaign){ setModal(m=> ({ ...m, open:true, item: JSON.parse(JSON.stringify(row)), saving:false, step:0, error:'' as any })); }
  function closeModal(){ if (modal.saving) return; setModal(m=> ({ ...m, open:false, item:null, saving:false, step:0 })); }

  function normalizeForSave(payload: any): any {
    const body = { ...payload };
    body.abWeights = { A: Number(body?.abWeights?.A||0), B: Number(body?.abWeights?.B||0) };
    const cList = Array.isArray(body?.variantA?.content?.coupons)? body.variantA.content.coupons : [];
    if (cList.length && !body.variantA.content.couponCode) body.variantA.content.couponCode = cList[0];
    const t = body?.variantA?.triggers||{};
    if (Array.isArray(t.multi) && t.multi.length){
      const order = ['first_visit','time','scroll','exit','add_to_cart','post_purchase'];
      const first = t.multi.find((x:string)=> order.includes(x)) || 'first_visit';
      body.variantA.triggers.on = first;
      body.variantA.triggers.afterAddToCart = t.multi.includes('add_to_cart');
      body.variantA.triggers.afterPurchase = t.multi.includes('post_purchase');
      body.variantA.triggers.exitIntent = t.multi.includes('exit');
    }
    return body;
  }

  async function save(){
    if (!modal.item) return;
    setModal(m=> ({ ...m, saving:true, error:'' }));
    try{
      const body = normalizeForSave({ ...modal.item } as any);
      const isNew = !body.id;
      const url = isNew ? `${apiBase}/api/admin/promotions/campaigns` : `${apiBase}/api/admin/promotions/campaigns/${encodeURIComponent(body.id)}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, { method, credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify(body) });
      if (!res.ok){
        const txt = await res.text().catch(()=>'');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      closeModal();
      await load();
    }catch(e:any){
      setModal(m=> ({ ...m, error: e?.message||'failed' }));
    }finally{
      setModal(m=> ({ ...m, saving:false }));
    }
  }

  async function remove(id: string){
    if (!confirm('حذف الحملة؟')) return;
    await fetch(`${apiBase}/api/admin/promotions/campaigns/${encodeURIComponent(id)}`, { method:'DELETE', credentials:'include', headers: { ...authHeaders() } });
    await load();
  }

  function set<K extends keyof Campaign>(key: K, val: any){ if (!modal.item) return; setModal(m=> ({ ...m, item: { ...(m.item as any), [key]: val } })); }
  function setNested(path: string, val:any){ if (!modal.item) return; const obj:any = { ...(modal.item as any) }; const seg = path.split('.'); let cur = obj; for (let i=0;i<seg.length-1;i++){ const k=seg[i]; cur[k] = cur[k]??{}; cur = cur[k]; } cur[seg[seg.length-1]] = val; setModal(m=> ({ ...m, item: obj })); }

  function statusLabel(s: string|undefined): string {
    switch (String(s||'').toUpperCase()){
      case 'DRAFT': return 'مسودة';
      case 'LIVE': return 'نشطة';
      case 'PAUSED': return 'موقوفة';
      case 'ENDED': return 'منتهية';
      default: return String(s||'');
    }
  }

  function authHeaders(): Record<string,string> {
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {} as Record<string,string>;
  }

  function StepLabel(idx:number): string {
    const labels = ['الأساسيات','المحتوى','التصميم','المحفزات','الاستهداف','التكرار','A/B','المراجعة والنشر'];
    return labels[idx]||'';
  }

  function validateStep(step:number): string|undefined {
    const it:any = modal.item||{};
    if (step===0){
      if (!it.name || !String(it.name).trim()) return 'الاسم العربي مطلوب';
      if (it.schedule?.start && it.schedule?.end && new Date(it.schedule.start) > new Date(it.schedule.end)) return 'تاريخ النهاية يجب أن يكون بعد البداية';
    }
    if (step===1){
      const c = it?.variantA?.content||{};
      if (!c.title || !String(c.title).trim()) return 'العنوان مطلوب';
    }
    if (step===2){
      const d = it?.variantA?.design||{};
      if (Number(d?.maxWidth||0) <= 0) return 'أقصى عرض يجب أن يكون أكبر من الصفر';
    }
    return;
  }

  return (
    <main>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom: 16 }}>
        <h1 style={{ margin:0 }}>الحملات الترويجية (Popups/Modals)</h1>
        <button className="btn" onClick={()=> { window.location.assign('/promotions/campaigns/new'); }}>إنشاء حملة</button>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
        <input value={q} onChange={(e)=> setQ(e.target.value)} placeholder="بحث بالاسم" className="input" style={{ minWidth:220 }} />
        <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
          <input type="checkbox" checked={activeOnly} onChange={(e)=> setActiveOnly(e.target.checked)} /> نشط/مؤقت فقط
        </label>
        <button onClick={load} className="btn">تحديث</button>
      </div>
      {!fullscreenWizard && (
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'start', padding:'8px 6px' }}>الاسم</th>
            <th style={{ textAlign:'start', padding:'8px 6px' }}>الحالة</th>
            <th style={{ textAlign:'start', padding:'8px 6px' }}>الأولوية</th>
            <th style={{ textAlign:'start', padding:'8px 6px' }}>الفترة</th>
            <th style={{ textAlign:'start', padding:'8px 6px' }}>AB</th>
            <th style={{ textAlign:'end', padding:'8px 6px' }}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={6} style={{ padding:12 }}>تحميل...</td></tr>
          )}
          {!loading && rows.map((r)=> (
            <tr key={r.id} style={{ borderTop:'1px solid var(--border,#eee)' }}>
              <td style={{ padding:'8px 6px' }}>{r.name}</td>
              <td style={{ padding:'8px 6px' }}>{statusLabel(r.status)}</td>
              <td style={{ padding:'8px 6px' }}>{r.priority}</td>
              <td style={{ padding:'8px 6px' }}>{(r.schedule?.start||'') + (r.schedule?.end? ' → '+r.schedule.end : '')}</td>
              <td style={{ padding:'8px 6px' }}>{(r.abWeights?.A??100)+'/'+(r.abWeights?.B??0)}</td>
              <td style={{ padding:'8px 6px', textAlign:'end' }}>
                 <button className="btn btn-sm" onClick={()=> { window.location.assign(`/promotions/campaigns/${encodeURIComponent(r.id)}`); }}>تعديل</button>
                <button className="btn btn-sm btn-outline" style={{ marginInlineStart:8 }} onClick={()=> remove(r.id)}>حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}

      {modal.open && modal.item && (
        <div style={{ position: fullscreenWizard? 'static':'fixed', inset: fullscreenWizard? 'auto' : 0, background: fullscreenWizard? 'transparent' : 'rgba(0,0,0,.4)', display: fullscreenWizard? 'block' : 'grid', placeItems: fullscreenWizard? undefined : 'center', zIndex:1000 }} onClick={fullscreenWizard? undefined : closeModal}>
          <div style={{ background:'var(--panel,#fff)', color:'var(--fg,#111)', width: fullscreenWizard? '100%' : 'min(1200px, 98vw)', maxHeight: fullscreenWizard? 'none' : '92vh', overflow: fullscreenWizard? 'visible' : 'hidden', borderRadius:12, padding:0, display:'grid', gridTemplateColumns:'minmax(0,1fr) 380px' }} onClick={(e)=> e.stopPropagation()}>
            <div style={{ padding:16, overflow:'auto' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <h2 style={{ margin:0 }}>{modal.item.id? 'تعديل حملة':'إنشاء حملة'}</h2>
                  <span style={{ fontSize:12, padding:'2px 8px', borderRadius:999, background:'var(--chip,#f3f4f6)' }}>{StepLabel(modal.step)}</span>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <select className="input" value={modal.lang} onChange={(e)=> setModal(m=> ({ ...m, lang: e.target.value as any }))}>
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                  <button className="btn btn-outline btn-sm" onClick={closeModal} aria-label="إغلاق">إغلاق</button>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(8, minmax(0,1fr))', gap:6, marginTop:12 }}>
                {['الأساسيات','المحتوى','التصميم','المحفزات','الاستهداف','التكرار','A/B','المراجعة والنشر'].map((t, i)=> (
                  <button key={i} className={`btn btn-sm ${modal.step===i? '':'btn-outline'}`} onClick={()=> setModal(m=> ({ ...m, step:i }))}>{t}</button>
                ))}
              </div>

              {modal.error && (<div className="toast err" style={{ marginTop:12 }}>{modal.error}</div>)}

              {modal.step===0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12, marginTop:12 }}>
                  <label>اسم الحملة (عربي)
                    <input className="input" value={modal.item.name||''} onChange={(e)=> set('name', e.target.value)} />
                    <div className="muted">الاسم الظاهر للمدير. استخدم تسمية واضحة.</div>
                  </label>
                  <label>اسم الحملة (إنجليزي)
                    <input className="input" value={modal.item?.variantA?.content?.translations?.en?.title||''} onChange={(e)=> setNested('variantA.content.translations.en.title', e.target.value)} />
                  </label>
                  <label>وصف قصير
                    <input className="input" value={modal.item?.variantA?.content?.subtitle||''} onChange={(e)=> setNested('variantA.content.subtitle', e.target.value)} />
                    <div className="muted">يظهر أسفل العنوان داخل النافذة.</div>
                  </label>
                  <label>نوع الحملة
                    <select className="input" value={modal.item.variantA?.type||'coupon'} onChange={(e)=> setNested('variantA.type', e.target.value)}>
                      <option value="coupon">كوبون</option>
                      <option value="subscribe">اشتراك</option>
                      <option value="points">نقاط</option>
                      <option value="rich">محتوى غني</option>
                      <option value="form">نموذج</option>
                    </select>
                    <div className="muted">حدّد الهدف الأساسي للنافذة.</div>
                  </label>
                  <label>المالك (Owner)
                    <select className="input" value={modal.item?.targeting?.owner||''} onChange={(e)=> setNested('targeting.owner', e.target.value)}>
                      <option value="">— اختر —</option>
                      <option value="marketing">التسويق</option>
                      <option value="growth">النمو</option>
                      <option value="loyalty">الولاء</option>
                    </select>
                    <div className="muted">المسؤول عن الحملة.</div>
                  </label>
                  <label>الحالة
                    <select className="input" value={modal.item.status||'DRAFT'} onChange={(e)=> set('status', e.target.value as any)}>
                      <option value="DRAFT">مسودة</option>
                      <option value="LIVE">مفعلة</option>
                      <option value="PAUSED">موقوفة</option>
                      <option value="ENDED">منتهية</option>
                    </select>
                    <div className="muted">مفعلة تعني قابلة للعرض ضمن فترة الجدولة.</div>
                  </label>
                  <label>قالب الحملة
                    <select className="input" value={modal.item.targeting?.slug||''} onChange={(e)=> setNested('targeting.slug', e.target.value)}>
                      <option value="">— اختر قالب —</option>
                      <option value="winter_sale">تخفيضات الشتاء</option>
                      <option value="new_user_coupon">كوبون مستخدم جديد</option>
                      <option value="free_shipping_weekend">شحن مجاني نهاية الأسبوع</option>
                    </select>
                    <div className="muted">اختر قالبًا جاهزًا بالعربية مع إعدادات مقترحة.</div>
                  </label>
                  <label>بداية الحملة
                    <input className="input" type="datetime-local" value={modal.item.schedule?.start||''} onChange={(e)=> setNested('schedule.start', e.target.value)} />
                    <div className="muted">وقت انطلاق العرض.</div>
                  </label>
                  <label>نهاية الحملة
                    <input className="input" type="datetime-local" value={modal.item.schedule?.end||''} onChange={(e)=> setNested('schedule.end', e.target.value)} />
                    <div className="muted">يجب أن تكون بعد وقت البداية.</div>
                  </label>
                </div>
              )}

              {modal.step===1 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12, marginTop:12 }}>
                  <label>العنوان
                    <input className="input" value={modal.item.variantA?.content?.title||''} onChange={(e)=> setNested('variantA.content.title', e.target.value)} />
                    <div className="muted">النص الرئيسي أعلى النافذة.</div>
                  </label>
                  <label>سطر الوصف
                    <input className="input" value={modal.item.variantA?.content?.subtitle||''} onChange={(e)=> setNested('variantA.content.subtitle', e.target.value)} />
                  </label>
                  <div style={{ gridColumn:'1 / -1' }}>
                    <div style={{ marginBottom:6 }}>محرر المحتوى (WYSIWYG)</div>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      style={{ border:'1px solid var(--border,#e5e7eb)', borderRadius:8, minHeight:120, padding:10 }}
                      onInput={(e)=> setNested('variantA.content.descriptionHtml', (e.target as HTMLElement).innerHTML)}
                      dangerouslySetInnerHTML={{ __html: modal.item.variantA?.content?.descriptionHtml||'' }}
                    />
                    <div className="muted">يمكنك تنسيق النصوص (عريض/مائل/قوائم).</div>
                  </div>

                  <div style={{ gridColumn:'1 / -1', display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12 }}>
                    <div>
                      <div style={{ marginBottom:6 }}>صور الحملة</div>
                      <div
                        onDragOver={(e)=> e.preventDefault()}
                        onDrop={(e)=>{
                          e.preventDefault();
                          const files = Array.from(e.dataTransfer.files||[]);
                          const urls = files.map(f=> URL.createObjectURL(f as any));
                          const prev = Array.isArray((modal.item as any)?.variantA?.content?.gallery)? (modal.item as any).variantA.content.gallery : [];
                          setNested('variantA.content.gallery', [...prev, ...urls]);
                          if (!((modal.item as any)?.variantA?.content?.media?.src)) setNested('variantA.content.media.src', urls[0]||'');
                        }}
                        style={{ border:'1px dashed #cbd5e1', borderRadius:8, padding:16, textAlign:'center' }}
                      >
                        اسحب وأفلت الصور هنا أو
                        <button type="button" className="btn btn-sm" style={{ marginInlineStart:8 }} onClick={()=> setMediaOpen(true)}>اختر من المكتبة</button>
                      </div>
                      <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                        {(modal.item as any)?.variantA?.content?.gallery?.map((url:string, idx:number)=> (
                          <div key={url+idx} draggable onDragStart={(e)=>{ e.dataTransfer.setData('text/plain', String(idx)); }} onDrop={(e)=>{
                            e.preventDefault();
                            const from = Number(e.dataTransfer.getData('text/plain')||-1);
                            const to = idx;
                            const arr = [ ...(modal.item as any).variantA.content.gallery ];
                            if (from>=0 && from!==to){ const [moved] = arr.splice(from,1); arr.splice(to,0,moved); setNested('variantA.content.gallery', arr); }
                          }} onDragOver={(e)=> e.preventDefault()} style={{ width:88, height:88, border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden', position:'relative' }}>
                            <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} loading={(modal.item as any)?.variantA?.content?.lazy? 'lazy': undefined} />
                          </div>
                        ))}
                      </div>
                      <label style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:8 }}>
                        <input type="checkbox" checked={!!(modal.item as any)?.variantA?.content?.lazy} onChange={(e)=> setNested('variantA.content.lazy', e.target.checked)} /> تفعيل Lazy-load
                      </label>
                    </div>
                    <div>
                      <label>الوسائط الرئيسية
                        <div style={{ display:'flex', gap:6 }}>
                          <input className="input" value={(modal.item as any)?.variantA?.content?.media?.src||''} onChange={(e)=> setNested('variantA.content.media.src', e.target.value)} placeholder="https://..." />
                          <button className="btn" type="button" onClick={()=> setMediaOpen(true)}>مكتبة الوسائط</button>
                        </div>
                      </label>
                      <label>نوع الوسائط
                        <select className="input" value={(modal.item as any)?.variantA?.content?.media?.type||'image'} onChange={(e)=> setNested('variantA.content.media.type', e.target.value)}>
                          <option value="image">صورة</option>
                          <option value="video">فيديو</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div style={{ gridColumn:'1 / -1', display:'grid', gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap:12 }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                        <div>الكوبونات</div>
                        <div>
                          <button className="btn btn-sm" type="button" onClick={()=> setCouponPickerOpen(true)}>اختيار كوبونات</button>
                        </div>
                      </div>
                      <div className="muted">يمكن اختيار أكثر من كوبون وترتيبهم.</div>
                      <div style={{ display:'grid', gap:8, marginTop:8 }}>
                        {Array.isArray((modal.item as any)?.variantA?.content?.coupons) && (modal.item as any).variantA.content.coupons.map((code:string, idx:number)=> (
                          <div key={code+idx} draggable onDragStart={(e)=> e.dataTransfer.setData('text/plain', String(idx))} onDrop={(e)=>{
                            e.preventDefault();
                            const from = Number(e.dataTransfer.getData('text/plain')||-1);
                            const to = idx;
                            const arr = [ ...(modal.item as any).variantA.content.coupons ];
                            if (from>=0 && from!==to){ const [moved] = arr.splice(from,1); arr.splice(to,0,moved); setNested('variantA.content.coupons', arr); }
                          }} onDragOver={(e)=> e.preventDefault()} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{ width:44, height:28, background:'#f3f4f6', borderRadius:6 }} />
                              <div>
                                <div style={{ fontWeight:700 }}>{code}</div>
                                <div className="muted" style={{ fontSize:12 }}>بطاقة كوبون (معاينة)</div>
                              </div>
                            </div>
                            <button className="btn btn-sm btn-outline" type="button" onClick={()=>{
                              const arr = [ ...(modal.item as any).variantA.content.coupons ].filter((c:string)=> c!==code);
                              setNested('variantA.content.coupons', arr);
                              if ((modal.item as any).variantA.content.couponCode===code) setNested('variantA.content.couponCode', arr[0]||'');
                            }}>إزالة</button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                        <div>أزرار الدعوة (CTAs)</div>
                        <button className="btn btn-sm btn-outline" type="button" onClick={()=> setNested('variantA.content.ctas', [ ...((modal.item as any)?.variantA?.content?.ctas||[]), { label:'', href:'', behavior:{ guest:'signup_redirect', user:'open_coupons' } } ])}>+ إضافة</button>
                      </div>
                      <div className="muted">اختر الوجهة عبر منتقي الروابط.</div>
                      <div style={{ display:'grid', gap:8, marginTop:8 }}>
                        {(((modal.item as any)?.variantA?.content?.ctas)||[]).map((c:any, i:number)=> (
                          <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10, display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:8 }}>
                            <label>النص
                              <input className="input" value={c.label||''} onChange={(e)=>{
                                const arr = [ ...((modal.item as any)?.variantA?.content?.ctas||[]) ];
                                arr[i] = { ...(arr[i]||{}), label: e.target.value };
                                setNested('variantA.content.ctas', arr);
                              }} />
                            </label>
                            <label>الرابط
                              <div style={{ display:'flex', gap:6 }}>
                                <input className="input" value={c.href||''} onChange={(e)=>{
                                  const arr = [ ...((modal.item as any)?.variantA?.content?.ctas||[]) ];
                                  arr[i] = { ...(arr[i]||{}), href: e.target.value };
                                  setNested('variantA.content.ctas', arr);
                                }} placeholder="https://... أو /internal" />
                                <button className="btn btn-sm" type="button" onClick={()=> setLinkPickerOpen({ open:true, index:i })}>اختيار</button>
                              </div>
                            </label>
                            <label>سلوك الزر (زائر)
                              <select className="input" value={c?.behavior?.guest||'signup_redirect'} onChange={(e)=>{
                                const arr = [ ...((modal.item as any)?.variantA?.content?.ctas||[]) ];
                                arr[i] = { ...(arr[i]||{}), behavior: { ...(arr[i]?.behavior||{}), guest: e.target.value } };
                                setNested('variantA.content.ctas', arr);
                              }}>
                                <option value="signup_redirect">تحويل للتسجيل مع إعادة التوجيه بعده</option>
                                <option value="none">بدون</option>
                              </select>
                            </label>
                            <label>سلوك الزر (مسجل)
                              <select className="input" value={c?.behavior?.user||'open_coupons'} onChange={(e)=>{
                                const arr = [ ...((modal.item as any)?.variantA?.content?.ctas||[]) ];
                                arr[i] = { ...(arr[i]||{}), behavior: { ...(arr[i]?.behavior||{}), user: e.target.value } };
                                setNested('variantA.content.ctas', arr);
                              }}>
                                <option value="open_coupons">فتح صفحة كوبوناتي + إضافة تلقائية</option>
                                <option value="navigate">فتح الرابط مباشرة</option>
                              </select>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modal.step===2 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:12, marginTop:12 }}>
                  <label>قالب
                    <select className="input" value={modal.item.variantA?.design?.theme||'default'} onChange={(e)=> setNested('variantA.design.theme', e.target.value)}>
                      <option value="default">افتراضي</option>
                      <option value="hero">بطولي</option>
                      <option value="card">بطاقة</option>
                    </select>
                  </label>
                  <label>اللون الأساسي<input className="input" type="color" value={modal.item.variantA?.design?.colors?.primary||'#0B5FFF'} onChange={(e)=> setNested('variantA.design.colors.primary', e.target.value)} /></label>
                  <label>الخلفية<input className="input" type="color" value={modal.item.variantA?.design?.colors?.background||'#ffffff'} onChange={(e)=> setNested('variantA.design.colors.background', e.target.value)} /></label>
                  <label>النص<input className="input" type="color" value={modal.item.variantA?.design?.colors?.text||'#111827'} onChange={(e)=> setNested('variantA.design.colors.text', e.target.value)} /></label>
                  <label>الحجم<select className="input" value={modal.item.variantA?.design?.size||'md'} onChange={(e)=> setNested('variantA.design.size', e.target.value)}>
                    <option value="sm">صغير</option><option value="md">متوسط</option><option value="lg">كبير</option>
                  </select></label>
                  <label>انحناء الحواف<input className="input" type="number" value={modal.item.variantA?.design?.radius??12} onChange={(e)=> setNested('variantA.design.radius', Number(e.target.value))} /></label>
                  <label>أقصى عرض (px)<input className="input" type="number" value={modal.item.variantA?.design?.maxWidth??480} onChange={(e)=> setNested('variantA.design.maxWidth', Number(e.target.value))} /></label>
                  <label>الظل<select className="input" value={modal.item.variantA?.design?.shadow||'lg'} onChange={(e)=> setNested('variantA.design.shadow', e.target.value)}>
                    <option value="none">بدون</option><option value="sm">صغير</option><option value="md">متوسط</option><option value="lg">كبير</option>
                  </select></label>
                  <label>محاذاة النص<select className="input" value={modal.item.variantA?.design?.textAlign||'start'} onChange={(e)=> setNested('variantA.design.textAlign', e.target.value)}>
                    <option value="start">بداية</option><option value="center">وسط</option><option value="end">نهاية</option>
                  </select></label>
                  <label>الحركة
                    <select className="input" value={(modal.item as any)?.variantA?.design?.animation||'fade-scale'} onChange={(e)=> setNested('variantA.design.animation', e.target.value)}>
                      <option value="none">بدون</option>
                      <option value="fade-scale">Fade + Scale</option>
                      <option value="fade-up">Fade Up</option>
                    </select>
                  </label>
                </div>
              )}

              {modal.step===3 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:12, marginTop:12 }}>
                  <div style={{ gridColumn:'1 / -1', marginBottom:8 }}>المحفزات</div>
                  <label style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={((modal.item as any)?.variantA?.triggers?.multi||[]).includes('first_visit')} onChange={(e)=>{
                      const cur = new Set<string>(((modal.item as any)?.variantA?.triggers?.multi)||[]);
                      e.target.checked? cur.add('first_visit') : cur.delete('first_visit');
                      setNested('variantA.triggers.multi', Array.from(cur));
                    }} /> زيارة أولى
                  </label>
                  <label>بعد X ثانية
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <input type="checkbox" checked={((modal.item as any)?.variantA?.triggers?.multi||[]).includes('time')} onChange={(e)=>{
                        const cur = new Set<string>(((modal.item as any)?.variantA?.triggers?.multi)||[]);
                        e.target.checked? cur.add('time') : cur.delete('time');
                        setNested('variantA.triggers.multi', Array.from(cur));
                      }} />
                      <input className="input" type="number" value={(modal.item as any)?.variantA?.triggers?.delaySeconds??0} onChange={(e)=> setNested('variantA.triggers.delaySeconds', Number(e.target.value))} placeholder="Delay (sec)" />
                    </div>
                    <div className="muted">Delay = عدد الثواني قبل الظهور.</div>
                  </label>
                  <label>بعد نسبة تمرير
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <input type="checkbox" checked={((modal.item as any)?.variantA?.triggers?.multi||[]).includes('scroll')} onChange={(e)=>{
                        const cur = new Set<string>(((modal.item as any)?.variantA?.triggers?.multi)||[]);
                        e.target.checked? cur.add('scroll') : cur.delete('scroll');
                        setNested('variantA.triggers.multi', Array.from(cur));
                      }} />
                      <input className="input" type="number" value={(modal.item as any)?.variantA?.triggers?.scrollPercent??0} onChange={(e)=> setNested('variantA.triggers.scrollPercent', Number(e.target.value))} placeholder="%" />
                    </div>
                  </label>
                  <label style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={((modal.item as any)?.variantA?.triggers?.multi||[]).includes('exit')} onChange={(e)=>{
                      const cur = new Set<string>(((modal.item as any)?.variantA?.triggers?.multi)||[]);
                      e.target.checked? cur.add('exit') : cur.delete('exit');
                      setNested('variantA.triggers.multi', Array.from(cur));
                    }} /> نية الخروج
                  </label>
                  <label style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={((modal.item as any)?.variantA?.triggers?.multi||[]).includes('add_to_cart')} onChange={(e)=>{
                      const cur = new Set<string>(((modal.item as any)?.variantA?.triggers?.multi)||[]);
                      e.target.checked? cur.add('add_to_cart') : cur.delete('add_to_cart');
                      setNested('variantA.triggers.multi', Array.from(cur));
                    }} /> بعد إضافة للعربة
                  </label>
                  <label style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={((modal.item as any)?.variantA?.triggers?.multi||[]).includes('post_purchase')} onChange={(e)=>{
                      const cur = new Set<string>(((modal.item as any)?.variantA?.triggers?.multi)||[]);
                      e.target.checked? cur.add('post_purchase') : cur.delete('post_purchase');
                      setNested('variantA.triggers.multi', Array.from(cur));
                    }} /> بعد شراء
                  </label>
                </div>
              )}

              {modal.step===4 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12, marginTop:12 }}>
                  <label>الشريحة
                    <select className="input" value={modal.item.targeting?.audience||'all'} onChange={(e)=> setNested('targeting.audience', e.target.value)}>
                      <option value="all">كل الزوار</option>
                      <option value="guest">زائر</option>
                      <option value="logged_in">مستخدم مسجل</option>
                      <option value="vip">VIP</option>
                    </select>
                    <div className="muted">يمكن تخصيص VIP لاحقًا بخلفية خادمية.</div>
                  </label>
                  <label>الموقع
                    <select className="input" value={(modal.item.targeting?.sites||[])[0]||''} onChange={(e)=> setNested('targeting.sites', e.target.value? [e.target.value] : [])}>
                      <option value="">كلاهما</option>
                      <option value="web">ويب</option>
                      <option value="mweb">موبايل</option>
                    </select>
                  </label>
                  <label>الأجهزة
                    <select className="input" value={(modal.item.targeting?.devices||[])[0]||''} onChange={(e)=> setNested('targeting.devices', e.target.value? [e.target.value] : [])}>
                      <option value="">كل الأجهزة</option>
                      <option value="mobile">جوال</option>
                      <option value="desktop">سطح المكتب</option>
                    </select>
                  </label>
                  <label>الدول (رموز مفصولة بفواصل)
                    <input className="input" value={(modal.item.targeting?.geoCountries||[]).join(',')} onChange={(e)=> setNested('targeting.geoCountries', e.target.value.split(',').map(s=> s.trim()).filter(Boolean))} />
                  </label>
                  <label>اللغات (مفصولة بفواصل)
                    <input className="input" value={(modal.item.targeting?.languages||[]).join(',')} onChange={(e)=> setNested('targeting.languages', e.target.value.split(',').map(s=> s.trim()).filter(Boolean))} />
                  </label>
                  <label>UTM Campaign
                    <input className="input" placeholder="utm_campaign contains" value={(modal.item.targeting?.utmCampaign||'')} onChange={(e)=> setNested('targeting.utmCampaign', e.target.value)} />
                  </label>
                  <label style={{ gridColumn:'1 / -1' }}>المسارات المسموحة (بادئة مطابقة، سطر لكل مسار)
                    <textarea className="input" value={(modal.item.targeting?.includePaths||[]).join('\n')} onChange={(e)=> setNested('targeting.includePaths', e.target.value.split('\n').map(s=> s.trim()).filter(Boolean))} />
                  </label>
                  <label style={{ gridColumn:'1 / -1' }}>المسارات المستبعدة (سطر لكل مسار)
                    <textarea className="input" value={(modal.item.targeting?.excludePaths||[]).join('\n')} onChange={(e)=> setNested('targeting.excludePaths', e.target.value.split('\n').map(s=> s.trim()).filter(Boolean))} />
                  </label>
                  <label style={{ gridColumn:'1 / -1' }}>مصدر الزيارة (contains، سطر لكل مصدر)
                    <textarea className="input" value={(modal.item.targeting?.sources||[]).join('\n')} onChange={(e)=> setNested('targeting.sources', e.target.value.split('\n').map(s=> s.trim()).filter(Boolean))} />
                  </label>
                </div>
              )}

              {modal.step===5 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:12, marginTop:12 }}>
                  <div style={{ gridColumn:'1 / -1' }}>تكرار الظهور</div>
                  <label>النمط
                    <select className="input" value={modal.item.frequency?.cap||'session'} onChange={(e)=> setNested('frequency.cap', e.target.value)}>
                      <option value="session">جلسة واحدة</option>
                      <option value="daily">يوميًا</option>
                      <option value="weekly">7 أيام</option>
                      <option value="custom">مخصص</option>
                    </select>
                  </label>
                  <label>أيام (للمخصص)
                    <input className="input" type="number" value={modal.item.frequency?.days??0} onChange={(e)=> setNested('frequency.days', Number(e.target.value))} />
                  </label>
                  <label style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={!!modal.item.frequency?.dontShowAgain} onChange={(e)=> setNested('frequency.dontShowAgain', e.target.checked)} /> عدم الإظهار مرة أخرى
                  </label>
                </div>
              )}

              {modal.step===6 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12, marginTop:12 }}>
                  <label>وزن النسخة A
                    <input className="input" type="number" value={modal.item.abWeights?.A??100} onChange={(e)=>{
                      const a = Math.min(100, Math.max(0, Number(e.target.value)));
                      setNested('abWeights.A', a);
                      setNested('abWeights.B', 100 - a);
                    }} />
                  </label>
                  <label>وزن النسخة B
                    <input className="input" type="number" value={modal.item.abWeights?.B??0} onChange={(e)=>{
                      const b = Math.min(100, Math.max(0, Number(e.target.value)));
                      setNested('abWeights.B', b);
                      setNested('abWeights.A', 100 - b);
                    }} />
                  </label>
                  <div style={{ gridColumn:'1 / -1' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, alignItems:'center' }}>
                      <div>
                        <div className="muted" style={{ marginBottom:6 }}>توزيع المشاهدات</div>
                        <input type="range" min={0} max={100} value={modal.item.abWeights?.A??100} onChange={(e)=>{
                          const a = Number(e.target.value);
                          setNested('abWeights.A', a);
                          setNested('abWeights.B', 100 - a);
                        }} style={{ width:'100%' }} />
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <div>A: {(modal.item.abWeights?.A??100)}%</div>
                        <div>B: {(modal.item.abWeights?.B??0)}%</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ gridColumn:'1 / -1' }}>
                    <button className="btn btn-sm btn-outline" type="button" onClick={()=>{
                      setNested('variantB', (modal.item as any)?.variantB || JSON.parse(JSON.stringify((modal.item as any)?.variantA||null)));
                    }}>إنشاء نسخة B من نسخة A</button>
                  </div>
                </div>
              )}

              {modal.step===7 && (
                <div style={{ marginTop:12, display:'grid', gap:12 }}>
                  <div className="panel">
                    <div style={{ fontWeight:700, marginBottom:6 }}>مراجعة قبل النشر</div>
                    <div className="muted">تأكد من صحة الاستهداف والفترة. يمكنك التشغيل أو الجدولة.</div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="btn btn-outline" onClick={()=>{
                      const err = validateStep(0) || validateStep(1) || validateStep(2);
                      if (err) { setModal(m=> ({ ...m, error: err })); return; }
                      save();
                    }} disabled={modal.saving}>{modal.saving? 'حفظ...' : 'حفظ'}</button>
                    <button className="btn" onClick={async()=>{
                      const err = validateStep(0) || validateStep(1) || validateStep(2);
                      if (err) { setModal(m=> ({ ...m, error: err })); return; }
                      setPublishConfirmOpen(true);
                    }} disabled={modal.saving}>نشر</button>
                  </div>
                </div>
              )}

              <div style={{ display:'flex', justifyContent:'space-between', marginTop:16 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <button className="btn btn-outline btn-sm" onClick={()=> setModal(m=> ({ ...m, step: Math.max(0, m.step-1) }))} disabled={modal.step<=0}>السابق</button>
                  <button className="btn btn-sm" onClick={()=>{
                    const err = validateStep(modal.step);
                    if (err) { setModal(m=> ({ ...m, error: err })); return; }
                    setModal(m=> ({ ...m, step: Math.min(7, m.step+1), error:'' }));
                  }} disabled={modal.step>=7}>التالي</button>
                  <small style={{ opacity:.7, marginInlineStart:8 }}>الخطوة {modal.step+1} من 8</small>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-outline" onClick={closeModal} disabled={modal.saving}>إلغاء</button>
                  <button className="btn" onClick={()=>{
                    const err = validateStep(modal.step);
                    if (err) { setModal(m=> ({ ...m, error: err })); return; }
                    save();
                  }} disabled={modal.saving}>{modal.saving? 'حفظ...' : 'حفظ'}</button>
                </div>
              </div>
            </div>

            <div style={{ borderInlineStart:'1px solid #e5e7eb', padding:12, background:'var(--bg2,#fafafa)', display:'grid', gridTemplateRows:'auto 1fr auto', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontWeight:700 }}>معاينة حية</div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className={`btn btn-sm ${modal.previewDevice==='mobile'? '' : 'btn-outline'}`} onClick={()=> setModal(m=> ({ ...m, previewDevice:'mobile' }))}>موبايل</button>
                  <button className={`btn btn-sm ${modal.previewDevice==='desktop'? '' : 'btn-outline'}`} onClick={()=> setModal(m=> ({ ...m, previewDevice:'desktop' }))}>ويب</button>
                </div>
              </div>
              <div style={{ display:'grid', placeItems:'center', overflow:'auto' }}>
                <div style={{ width: modal.previewDevice==='mobile'? 360: 720, transform:'scale(1)', transformOrigin:'top center' }}>
                  <AdminPromoPreview campaign={modal.item as any} />
                </div>
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'space-between', alignItems:'center' }}>
                <small className="muted">التغييرات تظهر هنا فورًا.</small>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-outline btn-sm" onClick={()=>{
                    const id=(modal.item as any)?.id||'';
                    if (!id) return;
                    const url=new URL(window.location.origin);
                    url.hostname = url.hostname.replace(/^admin\./,'m.');
                    url.pathname='/';
                    url.searchParams.set('previewCampaignId', id);
                    window.open(url.toString(),'_blank');
                  }} disabled={!modal.item?.id}>معاينة على الموبايل</button>
                  <button className="btn btn-outline btn-sm" onClick={()=>{
                    const id=(modal.item as any)?.id||'';
                    if (!id) return;
                    const url=new URL(window.location.origin.replace('admin.','www.'));
                    url.pathname='/';
                    url.searchParams.set('previewCampaignId', id);
                    url.searchParams.set('site','web');
                    window.open(url.toString(),'_blank');
                  }} disabled={!modal.item?.id}>معاينة على الويب</button>
                </div>
              </div>
              <div style={{ borderTop:'1px dashed #e5e7eb', paddingTop:8 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontWeight:700 }}>وضع الاختبار (Sandbox)</div>
                  <button className={`btn btn-sm ${sandboxRunning? 'btn-outline':''}`} onClick={async()=>{
                    if (sandboxRunning) return;
                    try{
                      setSandboxRunning(true);
                      const id = (modal.item as any)?.id || 'sandbox-'+Math.random().toString(36).slice(2);
                      const variantKey = 'A';
                      const send = async(type:string, meta?:any)=>{
                        try{
                          await fetch('/api/promotions/events', { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ type, campaignId: id, variantKey, meta: meta||{} }) });
                          setSandboxLogs(l=> [{ t:new Date().toLocaleTimeString(), type, meta }, ...l].slice(0,50));
                        }catch{}
                      };
                      await send('impression');
                      await send('view');
                      await send('click', { href:'/coupons' });
                      await send('coupon_collected', { code: ((modal.item as any)?.variantA?.content?.couponCode)||'TEST10' });
                      await new Promise(r=> setTimeout(r, 300));
                      await send('conversion', { amount: 99.9 });
                    }finally{
                      setSandboxRunning(false);
                    }
                  }}>{sandboxRunning? 'جارٍ الاختبار...' : 'تشغيل الاختبار'}</button>
                </div>
                <div style={{ maxHeight:140, overflow:'auto', marginTop:8, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:8 }}>
                  {sandboxLogs.length===0 && (<div className="muted">لا توجد سجلات بعد.</div>)}
                  {sandboxLogs.map((l, i)=> (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px dashed #eee', padding:'4px 0' }}>
                      <div>{l.t}</div>
                      <div style={{ fontWeight:600 }}>{l.type}</div>
                      <div style={{ maxWidth:180, textAlign:'end', opacity:.7, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.meta? JSON.stringify(l.meta) : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {mediaOpen && (
            <MediaPicker apiBase={apiBase} value={modal.item?.variantA?.content?.media?.src||''} onChange={(url)=> setNested('variantA.content.media.src', url)} onClose={()=> setMediaOpen(false)} />
          )}
          {publishConfirmOpen && (
            <PublishConfirmModal
              item={modal.item as any}
              onClose={()=> setPublishConfirmOpen(false)}
              onPublish={async(mode:'immediate'|'schedule')=>{
                if (mode==='immediate'){ set('status','LIVE'); }
                if (mode==='schedule'){ set('status','LIVE'); }
                await save();
                setPublishConfirmOpen(false);
              }}
              onSmokeTest={async()=>{
                if (!(modal.item as any)?.id) return;
                const id = (modal.item as any).id;
                const siteTargets = Array.isArray((modal.item as any)?.targeting?.sites)? (modal.item as any).targeting.sites : [];
                const sites = siteTargets.length? siteTargets : ['mweb','web'];
                const results: Array<{ site:string; ok:boolean; status:number }> = [];
                for (const s of sites){
                  try{
                    const url = new URL(window.location.origin.replace('admin.','www.'));
                    url.pathname='/api/popups';
                    url.searchParams.set('previewCampaignId', id);
                    url.searchParams.set('site', s==='web'? 'web':'mweb');
                    const r = await fetch(url.toString(), { credentials:'include', cache:'no-store' });
                    results.push({ site: s, ok: r.ok, status: r.status });
                  }catch{
                    results.push({ site: s, ok:false, status:0 });
                  }
                }
                alert(results.map(x=> `${x.site}: ${x.ok? 'OK' : 'Failed'} (${x.status})`).join('\n'));
              }}
            />
          )}
          {couponPickerOpen && (
            <CouponPicker
              coupons={coupons}
              selected={((modal.item as any)?.variantA?.content?.coupons)||[]}
              onClose={()=> setCouponPickerOpen(false)}
              onApply={(list)=> { setNested('variantA.content.coupons', list); if (!((modal.item as any).variantA.content.couponCode)) setNested('variantA.content.couponCode', list[0]||''); setCouponPickerOpen(false); }}
            />
          )}
          {linkPickerOpen.open && (
            <LinkPicker
              onClose={()=> setLinkPickerOpen({ open:false, index:null })}
              onPick={(href)=>{
                if (linkPickerOpen.index==null) return;
                const arr = [ ...(((modal.item as any)?.variantA?.content?.ctas)||[]) ];
                arr[linkPickerOpen.index] = { ...(arr[linkPickerOpen.index]||{}), href };
                setNested('variantA.content.ctas', arr);
                setLinkPickerOpen({ open:false, index:null });
              }}
            />
          )}
        </div>
      )}
    </main>
  );
}


function AdminPromoPreview({ campaign }: { campaign: any }){
  const v = campaign?.variantA||campaign?.variant||{};
  const content = v?.content||{};
  const design = v?.design||{};
  const maxW = Number(design?.maxWidth||480);
  const radius = Number(design?.radius||12);
  const bg = design?.colors?.background || '#fff';
  const color = design?.colors?.text || '#111827';
  const shadow = design?.shadow||'lg';
  const primary = design?.colors?.primary || '#0B5FFF';
  const style: React.CSSProperties = {
    width:'100%',
    maxWidth: maxW,
    borderRadius: radius,
    background: bg,
    color,
    boxShadow: shadow==='none'? 'none' : shadow==='sm'? '0 4px 10px rgba(0,0,0,.1)' : shadow==='md'? '0 8px 20px rgba(0,0,0,.15)' : '0 12px 28px rgba(0,0,0,.2)',
    padding: 16,
    margin: 8
  };
  const medias: string[] = Array.isArray(content?.gallery)? content.gallery : (content?.media?.src? [content.media.src] : []);
  const ctas: any[] = Array.isArray(content?.ctas)? content.ctas : [];
  const coupons: string[] = Array.isArray(content?.coupons)? content.coupons : (content?.couponCode? [content.couponCode]: []);
  return (
    <div role="dialog" aria-modal="true" aria-label={campaign?.name||'Promo'} style={style}>
      {!!medias.length && (
        <div style={{ width:'100%', overflow:'hidden', borderRadius:12, marginBottom:8 }}>
          <img src={medias[0]} alt="" style={{ width:'100%', display:'block' }} />
        </div>
      )}
      {!!content?.title && (<h3 style={{ margin:'8px 0', fontWeight:800, fontSize:18 }}>{content.title}</h3>)}
      {!!content?.subtitle && (<p style={{ margin:'4px 0', color:'#4b5563' }}>{content.subtitle}</p>)}
      {!!content?.descriptionHtml && (<div dangerouslySetInnerHTML={{ __html: content.descriptionHtml }} style={{ color:'#374151', lineHeight:1.6 }} />)}
      {!!coupons.length && (
        <div style={{ display:'grid', gap:8, marginTop:8 }}>
          {coupons.map((code)=> (
            <article key={code} style={{ display:'flex', alignItems:'stretch', gap:12, background:'#fff6f4', border:'1px solid #f3d2c8', borderRadius:14, padding:12 }}>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ fontWeight:800, fontSize:16 }}>{code}</div>
                <div style={{ fontSize:12, color:'#8a8a8a' }}>كوبون خصم</div>
                <div style={{ fontSize:12, color:'#8a8a8a' }}>ينتهي قريباً</div>
              </div>
              <div style={{ width:1, position:'relative' }}>
                <div style={{ position:'absolute', inset:0, borderLeft:'1px dashed rgba(200,120,100,0.4)' }} />
              </div>
              <div style={{ width:110, minWidth:96, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
                <div style={{ fontSize:28, fontWeight:800, color:'#ff5a3c', lineHeight:1 }}>%</div>
                <div style={{ fontSize:12, color:'#666', textAlign:'center' }}>خصم</div>
              </div>
            </article>
          ))}
        </div>
      )}
      {!!ctas.length && (
        <div style={{ marginTop:12 }}>
          {ctas.map((b, i)=> (
            <a
              key={i}
              className="btn btn-cta"
              href={b.href||'#'}
              style={{ display:'block', width:'100%', textAlign:'center', background:primary, color:'#fff', borderRadius:10, padding:'12px 16px', textDecoration:'none', marginTop: i===0? 0 : 8 }}
            >
              {b.label||'CTA'}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function CouponPicker({ coupons, selected, onClose, onApply }:{ coupons: Array<{code:string}>; selected: string[]; onClose: ()=>void; onApply: (codes:string[])=>void }){
  const [picked, setPicked] = React.useState<string[]>(selected||[]);
  function toggle(code:string){ setPicked(prev=> prev.includes(code)? prev.filter(c=> c!==code) : [...prev, code]); }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'grid', placeItems:'center', zIndex:1100 }} onClick={onClose}>
      <div style={{ background:'#fff', color:'#111', width:'min(720px, 96vw)', maxHeight:'84vh', overflow:'auto', borderRadius:12, padding:16 }} onClick={(e)=> e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ margin:0 }}>اختيار كوبونات</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>إغلاق</button>
        </div>
        <div className="muted" style={{ marginTop:6 }}>اختر واحدًا أو أكثر. يمكنك ترتيبها لاحقًا بالسحب.</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:12, marginTop:12 }}>
          {coupons.map(c=> (
            <label key={c.code} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10, display:'grid', gap:8, cursor:'pointer', background: picked.includes(c.code)? '#ecfeff':'#fff' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontWeight:700 }}>{c.code}</div>
                <input type="checkbox" checked={picked.includes(c.code)} onChange={()=> toggle(c.code)} />
              </div>
              <div style={{ height:48, background:'#f3f4f6', borderRadius:8 }} />
              <div className="muted" style={{ fontSize:12 }}>بطاقة بصريّة</div>
            </label>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
          <button className="btn btn-outline" onClick={onClose}>إلغاء</button>
          <button className="btn" onClick={()=> onApply(picked)}>تطبيق</button>
        </div>
      </div>
    </div>
  );
}

function LinkPicker({ onClose, onPick }:{ onClose: ()=>void; onPick:(href:string)=>void }){
  const [type, setType] = React.useState<'product'|'category'|'internal'|'external'|'coubonati'>('internal');
  const [value, setValue] = React.useState('');
  function build(): string {
    if (type==='product') return `/product/${value}`;
    if (type==='category') return `/category/${value}`;
    if (type==='external') return value;
    if (type==='coubonati') return `/coupons`;
    return value.startsWith('/')? value : `/${value}`;
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'grid', placeItems:'center', zIndex:1100 }} onClick={onClose}>
      <div style={{ background:'#fff', color:'#111', width:'min(520px, 92vw)', borderRadius:12, padding:16 }} onClick={(e)=> e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ margin:0 }}>اختيار رابط</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>إغلاق</button>
        </div>
        <div style={{ display:'grid', gap:10, marginTop:12 }}>
          <label>النوع
            <select className="input" value={type} onChange={(e)=> setType(e.target.value as any)}>
              <option value="product">منتج</option>
              <option value="category">فئة</option>
              <option value="internal">صفحة داخلية</option>
              <option value="external">رابط خارجي</option>
              <option value="coubonati">صفحة كوبوناتي</option>
            </select>
          </label>
          {(type==='product' || type==='category') && (
            <label>{type==='product'? 'معرّف/Slug المنتج':'Slug الفئة'}
              <input className="input" value={value} onChange={(e)=> setValue(e.target.value)} placeholder={type==='product'? 'product-slug' : 'category-slug'} />
            </label>
          )}
          {(type==='internal') && (
            <label>المسار الداخلي
              <input className="input" value={value} onChange={(e)=> setValue(e.target.value)} placeholder="/about" />
            </label>
          )}
          {(type==='external') && (
            <label>الرابط الخارجي
              <input className="input" value={value} onChange={(e)=> setValue(e.target.value)} placeholder="https://..." />
            </label>
          )}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
          <button className="btn btn-outline" onClick={onClose}>إلغاء</button>
          <button className="btn" onClick={()=> onPick(build())}>اختيار</button>
        </div>
      </div>
    </div>
  );
}

function PublishConfirmModal({ item, onClose, onPublish, onSmokeTest }:{ item:any; onClose: ()=>void; onPublish:(mode:'immediate'|'schedule')=>void; onSmokeTest:()=>Promise<void> }){
  const targeting = item?.targeting||{};
  const schedule = item?.schedule||{};
  const audMap: Record<string,string> = { all:'كل الزوار', guest:'زائر', logged_in:'مسجل', vip:'VIP' };
  const audience = audMap[String(targeting?.audience||'all')]||String(targeting?.audience||'all');
  const sites = (Array.isArray(targeting?.sites)&&targeting.sites.length? targeting.sites.join(', ') : 'web + mweb');
  const devices = (Array.isArray(targeting?.devices)&&targeting.devices.length? targeting.devices.join(', ') : 'جميع الأجهزة');
  const period = (schedule?.start||'—') + (schedule?.end? ` → ${schedule.end}` : '');
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'grid', placeItems:'center', zIndex:1200 }} onClick={onClose}>
      <div style={{ background:'#fff', color:'#111', width:'min(680px, 96vw)', borderRadius:12, padding:16 }} onClick={(e)=> e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ margin:0 }}>تأكيد النشر</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>إغلاق</button>
        </div>
        <div style={{ display:'grid', gap:10, marginTop:12 }}>
          <div className="muted">راجع تأثير الحملة قبل النشر.</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><div className="muted">الجمهور</div><div>{audience}</div></div>
            <div><div className="muted">الفترة</div><div>{period||'—'}</div></div>
            <div><div className="muted">المواقع</div><div>{sites}</div></div>
            <div><div className="muted">الأجهزة</div><div>{devices}</div></div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn" onClick={()=> onPublish('immediate')}>نشر الآن</button>
              <button className="btn btn-outline" onClick={()=> onPublish('schedule')}>جدولة النشر</button>
            </div>
            <button className="btn btn-sm btn-outline" onClick={()=> onSmokeTest()}>تشغيل فحص الدخان (Smoke Test)</button>
          </div>
        </div>
      </div>
    </div>
  );
}

