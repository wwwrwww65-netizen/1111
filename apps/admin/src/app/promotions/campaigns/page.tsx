"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";

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
  const [activeOnly, setActiveOnly] = React.useState(true);
  const [modal, setModal] = React.useState<{ open:boolean; item: Partial<Campaign>|null; tab: 'basic'|'content'|'design'|'triggers'|'targeting'|'frequency'|'ab'; saving:boolean }>(
    { open:false, item:null, tab:'basic', saving:false }
  );

  async function load(){
    setLoading(true);
    const res = await fetch(`${apiBase}/api/admin/promotions/campaigns`, { credentials:'include', headers: { ...authHeaders() } });
    const j = await res.json();
    let list: Campaign[] = Array.isArray(j?.campaigns) ? j.campaigns : [];
    if (activeOnly) list = list.filter(r=> r.status==='LIVE' || r.status==='PAUSED');
    if (q.trim()) list = list.filter(r=> r.name?.toLowerCase().includes(q.trim().toLowerCase()));
    setRows(list);
    setLoading(false);
  }
  React.useEffect(()=>{ load(); }, [apiBase]);

  function newItem(): Partial<Campaign> {
    return {
      name: '', status: 'DRAFT', priority: 0,
      schedule: { start: '', end: '' },
      targeting: { audience:'all', includePaths:[], excludePaths:[], languages:[], sources:[], slug:'' },
      frequency: { cap: 'session', days: 0 },
      variantA: { type:'coupon', content: { title:'', subtitle:'', description:'', media:{ type:'image', src:'' }, couponCode:'', points:0, ctas:[] }, design:{ theme:'default', colors:{ primary:'#0B5FFF', background:'#ffffff', text:'#111827' }, size:'md', radius:12, maxWidth:480, shadow:'lg', textAlign:'start' }, triggers:{ on:'first_visit', delaySeconds:0, scrollPercent:0, exitIntent:false, afterAddToCart:false, afterPurchase:false } },
      variantB: null,
      abWeights: { A: 100, B: 0 },
    } as any;
  }

  function openCreate(){ setModal({ open:true, item: newItem(), tab:'basic', saving:false }); }
  function openEdit(row: Campaign){ setModal({ open:true, item: JSON.parse(JSON.stringify(row)), tab:'basic', saving:false }); }
  function closeModal(){ if (modal.saving) return; setModal({ open:false, item:null, tab:'basic', saving:false }); }

  async function save(){
    if (!modal.item) return;
    setModal(m=> ({ ...m, saving:true }));
    const body = { ...modal.item } as any;
    // normalize weight numbers
    body.abWeights = { A: Number(body?.abWeights?.A||0), B: Number(body?.abWeights?.B||0) };
    const isNew = !body.id;
    const url = isNew ? `${apiBase}/api/admin/promotions/campaigns` : `${apiBase}/api/admin/promotions/campaigns/${encodeURIComponent(body.id)}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, { method, credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify(body) });
    if (res.ok){ closeModal(); await load(); }
    setModal(m=> ({ ...m, saving:false }));
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

  return (
    <main>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom: 16 }}>
        <h1 style={{ margin:0 }}>الحملات الترويجية (Popups/Modals)</h1>
        <button className="btn" onClick={openCreate}>إنشاء حملة</button>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
        <input value={q} onChange={(e)=> setQ(e.target.value)} placeholder="بحث بالاسم" className="input" style={{ minWidth:220 }} />
        <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
          <input type="checkbox" checked={activeOnly} onChange={(e)=> setActiveOnly(e.target.checked)} /> نشط/مؤقت فقط
        </label>
        <button onClick={load} className="btn">تحديث</button>
      </div>
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
                <button className="btn btn-sm" onClick={()=> openEdit(r)}>تعديل</button>
                <button className="btn btn-sm btn-outline" style={{ marginInlineStart:8 }} onClick={()=> remove(r.id)}>حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal.open && modal.item && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'grid', placeItems:'center', zIndex:1000 }} onClick={closeModal}>
          <div style={{ background:'var(--panel,#fff)', color:'var(--fg,#111)', width:'min(960px, 96vw)', maxHeight:'90vh', overflow:'auto', borderRadius:12, padding:16 }} onClick={(e)=> e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
              <h2 style={{ margin:0 }}>{modal.item.id? 'تعديل حملة':'إنشاء حملة'}</h2>
              <button className="btn btn-outline btn-sm" onClick={closeModal} aria-label="إغلاق">إغلاق</button>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              {(['basic','content','design','triggers','targeting','frequency','ab'] as const).map(t=> (
                <button key={t} className={`btn btn-sm ${modal.tab===t? '':'btn-outline'}`} onClick={()=> setModal(m=> ({ ...m, tab:t }))}>{
                  t==='basic'? 'الأساسيات': t==='content'? 'المحتوى': t==='design'? 'التصميم': t==='triggers'? 'المحفزات': t==='targeting'? 'الاستهداف': t==='frequency'? 'التكرار': 'A/B'
                }</button>
              ))}
            </div>

            {modal.tab==='basic' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12, marginTop:12 }}>
                <label>اسم الحملة<input className="input" value={modal.item.name||''} onChange={(e)=> set('name', e.target.value)} /></label>
                <label>الحالة<select className="input" value={modal.item.status||'DRAFT'} onChange={(e)=> set('status', e.target.value as any)}>
                  <option value="DRAFT">مسودة</option><option value="LIVE">نشطة</option><option value="PAUSED">موقوفة</option><option value="ENDED">منتهية</option>
                </select></label>
                <label>الأولوية<input className="input" type="number" value={modal.item.priority??0} onChange={(e)=> set('priority', Number(e.target.value))} /></label>
                <label>المعرف (slug)<input className="input" value={modal.item.targeting?.slug||''} onChange={(e)=> setNested('targeting.slug', e.target.value)} placeholder="promo-winter" /></label>
                <label>بداية الحملة<input className="input" type="datetime-local" value={modal.item.schedule?.start||''} onChange={(e)=> setNested('schedule.start', e.target.value)} /></label>
                <label>نهاية الحملة<input className="input" type="datetime-local" value={modal.item.schedule?.end||''} onChange={(e)=> setNested('schedule.end', e.target.value)} /></label>
              </div>
            )}

            {modal.tab==='content' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12, marginTop:12 }}>
                <label>نوع النافذة<select className="input" value={modal.item.variantA?.type||'coupon'} onChange={(e)=> setNested('variantA.type', e.target.value)}>
                  <option value="coupon">كوبون</option>
                  <option value="subscribe">اشتراك</option>
                  <option value="points">نقاط</option>
                  <option value="rich">محتوى غني</option>
                  <option value="form">نموذج</option>
                </select></label>
                <label>العنوان<input className="input" value={modal.item.variantA?.content?.title||''} onChange={(e)=> setNested('variantA.content.title', e.target.value)} /></label>
                <label>نص قصير<input className="input" value={modal.item.variantA?.content?.subtitle||''} onChange={(e)=> setNested('variantA.content.subtitle', e.target.value)} /></label>
                <label>الوصف<textarea className="input" value={modal.item.variantA?.content?.description||''} onChange={(e)=> setNested('variantA.content.description', e.target.value)} /></label>
                <label>صورة/فيديو URL<input className="input" value={modal.item.variantA?.content?.media?.src||''} onChange={(e)=> setNested('variantA.content.media.src', e.target.value)} placeholder="https://..." /></label>
                <label>نوع الوسائط<select className="input" value={modal.item.variantA?.content?.media?.type||'image'} onChange={(e)=> setNested('variantA.content.media.type', e.target.value)}>
                  <option value="image">صورة</option><option value="video">فيديو</option>
                </select></label>
                <label>كود الكوبون<input className="input" value={modal.item.variantA?.content?.couponCode||''} onChange={(e)=> setNested('variantA.content.couponCode', e.target.value)} /></label>
                <label>النقاط<input className="input" type="number" value={modal.item.variantA?.content?.points||0} onChange={(e)=> setNested('variantA.content.points', Number(e.target.value))} /></label>
                <label>أزرار CTA (سطر لكل زر: Label|href)<textarea className="input" value={(modal.item.variantA?.content?.ctas||[]).map((c:any)=> `${c.label||''}|${c.href||''}`).join('\n')} onChange={(e)=> setNested('variantA.content.ctas', e.target.value.split('\n').map(l=>{ const [label,href] = l.split('|'); return { label: (label||'').trim(), href: (href||'').trim() }; }))} /></label>
              </div>
            )}

            {modal.tab==='design' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:12, marginTop:12 }}>
                <label>القالب<select className="input" value={modal.item.variantA?.design?.theme||'default'} onChange={(e)=> setNested('variantA.design.theme', e.target.value)}>
                  <option value="default">افتراضي</option>
                  <option value="hero">بطولي</option>
                  <option value="card">بطاقة</option>
                </select></label>
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
              </div>
            )}

            {modal.tab==='triggers' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:12, marginTop:12 }}>
                <label>المحفّز<select className="input" value={modal.item.variantA?.triggers?.on||'first_visit'} onChange={(e)=> setNested('variantA.triggers.on', e.target.value)}>
                  <option value="first_visit">زيارة أولى</option>
                  <option value="time">بعد X ثانية</option>
                  <option value="scroll">بعد نسبة تمرير</option>
                  <option value="exit">نية الخروج</option>
                  <option value="add_to_cart">بعد إضافة للعربة</option>
                  <option value="post_purchase">بعد شراء</option>
                </select></label>
                <label>تأخير (ثواني)<input className="input" type="number" value={modal.item.variantA?.triggers?.delaySeconds??0} onChange={(e)=> setNested('variantA.triggers.delaySeconds', Number(e.target.value))} /></label>
                <label>نسبة التمرير %<input className="input" type="number" value={modal.item.variantA?.triggers?.scrollPercent??0} onChange={(e)=> setNested('variantA.triggers.scrollPercent', Number(e.target.value))} /></label>
                <label>نية الخروج<input type="checkbox" checked={!!modal.item.variantA?.triggers?.exitIntent} onChange={(e)=> setNested('variantA.triggers.exitIntent', e.target.checked)} /></label>
                <label>بعد إضافة للعربة<input type="checkbox" checked={!!modal.item.variantA?.triggers?.afterAddToCart} onChange={(e)=> setNested('variantA.triggers.afterAddToCart', e.target.checked)} /></label>
                <label>بعد شراء<input type="checkbox" checked={!!modal.item.variantA?.triggers?.afterPurchase} onChange={(e)=> setNested('variantA.triggers.afterPurchase', e.target.checked)} /></label>
              </div>
            )}

            {modal.tab==='targeting' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12, marginTop:12 }}>
                <label>الجمهور<select className="input" value={modal.item.targeting?.audience||'all'} onChange={(e)=> setNested('targeting.audience', e.target.value)}>
                  <option value="all">كل الزوار</option>
                  <option value="guest">زائر</option>
                  <option value="logged_in">مستخدم مسجل</option>
                </select></label>
                <label>اللغة (قائمة مفصولة بفواصل)<input className="input" value={(modal.item.targeting?.languages||[]).join(',')} onChange={(e)=> setNested('targeting.languages', e.target.value.split(',').map(s=> s.trim()).filter(Boolean))} /></label>
                <label>المسارات المسموحة (سطر لكل مسار، بادئة مطابقة)<textarea className="input" value={(modal.item.targeting?.includePaths||[]).join('\n')} onChange={(e)=> setNested('targeting.includePaths', e.target.value.split('\n').map(s=> s.trim()).filter(Boolean))} /></label>
                <label>المسارات المستبعدة (سطر لكل مسار)<textarea className="input" value={(modal.item.targeting?.excludePaths||[]).join('\n')} onChange={(e)=> setNested('targeting.excludePaths', e.target.value.split('\n').map(s=> s.trim()).filter(Boolean))} /></label>
                <label>مصدر الزيارة (Contains match, سطر لكل مصدر)<textarea className="input" value={(modal.item.targeting?.sources||[]).join('\n')} onChange={(e)=> setNested('targeting.sources', e.target.value.split('\n').map(s=> s.trim()).filter(Boolean))} /></label>
              </div>
            )}

            {modal.tab==='frequency' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:12, marginTop:12 }}>
                <label>التكرار<select className="input" value={modal.item.frequency?.cap||'session'} onChange={(e)=> setNested('frequency.cap', e.target.value)}>
                  <option value="session">جلسة واحدة</option>
                  <option value="daily">يوميًا</option>
                  <option value="weekly">أسبوعيًا</option>
                  <option value="custom">مخصص</option>
                </select></label>
                <label>أيام (للمخصص)<input className="input" type="number" value={modal.item.frequency?.days??0} onChange={(e)=> setNested('frequency.days', Number(e.target.value))} /></label>
                <label>عدم الإظهار مرة أخرى<input type="checkbox" checked={!!modal.item.frequency?.dontShowAgain} onChange={(e)=> setNested('frequency.dontShowAgain', e.target.checked)} /></label>
              </div>
            )}

            {modal.tab==='ab' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12, marginTop:12 }}>
                <label>وزن النسخة A<input className="input" type="number" value={modal.item.abWeights?.A??100} onChange={(e)=> setNested('abWeights.A', Number(e.target.value))} /></label>
                <label>وزن النسخة B<input className="input" type="number" value={modal.item.abWeights?.B??0} onChange={(e)=> setNested('abWeights.B', Number(e.target.value))} /></label>
                <label>Variant B (JSON اختياري)<textarea className="input" placeholder='{"type":"coupon",...}' value={JSON.stringify(modal.item.variantB??null)} onChange={(e)=> {
                  try{ const v = JSON.parse(e.target.value||'null'); setNested('variantB', v); }catch{}
                }} /></label>
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:16 }}>
              <small style={{ opacity:.7 }}>تلميح: يمكنك تعديل JSON الكامل للنسخة A من خلال أدوات المطور إذا لزم.</small>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-outline" onClick={closeModal} disabled={modal.saving}>إلغاء</button>
                <button className="btn" onClick={save} disabled={modal.saving}>{modal.saving? 'حفظ...' : 'حفظ'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


