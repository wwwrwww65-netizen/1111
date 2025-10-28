"use client";
import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export const dynamic = 'force-dynamic';

type Version = { id:string; version:number; title?:string; notes?:string; createdAt:string };

function useApiBase(){ return React.useMemo(()=> (typeof window!=='undefined' ? '' : ''), []); }

export default function TabPageBuilder(): JSX.Element {
  const params = useParams() as { id: string };
  const { id } = params;
  const apiBase = useApiBase();
  const [page, setPage] = React.useState<any>(null);
  const [versions, setVersions] = React.useState<Version[]>([]);
  const [content, setContent] = React.useState<any>({ sections: [] });
  const [title, setTitle] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [device, setDevice] = React.useState<'MOBILE'|'DESKTOP'>('MOBILE');
  const [published, setPublished] = React.useState<any>(null);
  const [selectedIdx, setSelectedIdx] = React.useState<number>(-1);
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);
  const [stats, setStats] = React.useState<{ series:any[]; totals:{ impressions:number; clicks:number; ctr:number } }|null>(null);
  const [scheduleAt, setScheduleAt] = React.useState<string>('');

  React.useEffect(()=>{
    fetch(`${apiBase}/api/admin/tabs/pages/${id}/versions`, { credentials:'include' })
      .then(r=> r.ok? r.json(): r.json().then(j=> Promise.reject(j)))
      .then(j=> setVersions(j.versions||[]));
  },[apiBase,id]);

  React.useEffect(()=>{
    // Try fetch published by slug for preview (requires page info; fallback none)
    fetch(`${apiBase}/api/admin/tabs/pages/${id}`, { credentials:'include' })
      .then(r=> r.ok? r.json(): r.json().then(j=> Promise.reject(j)))
      .then(async j=>{
        const p = j.page; setPage(p||null);
        if (p?.slug){
          const pub = await fetch(`${apiBase}/api/tabs/${encodeURIComponent(p.slug)}`, { credentials:'include' }).then(r=> r.ok? r.json(): null).catch(()=> null);
          if (pub) setPublished(pub);
        }
      }).catch(()=>{});
    // Stats
    fetch(`${apiBase}/api/admin/tabs/pages/${id}/stats?since=30d`, { credentials:'include' })
      .then(r=> r.ok? r.json(): null).then(j=> j && setStats(j)).catch(()=>{});
  },[apiBase,id]);

  function addSection(type:string){
    setContent((c:any)=> ({ ...c, sections: [...(Array.isArray(c.sections)? c.sections:[]), { id: (globalThis as any).crypto?.randomUUID?.() || String(Date.now()), type, config:{} }] }));
  }

  function moveSection(idx:number, dir:-1|1){
    setContent((c:any)=>{
      const arr = Array.isArray(c.sections)? [...c.sections]:[];
      const ni = idx+dir; if (ni<0 || ni>=arr.length) return c;
      const tmp = arr[idx]; arr[idx] = arr[ni]; arr[ni] = tmp;
      return { ...c, sections: arr };
    })
  }

  function removeSection(idx:number){
    setContent((c:any)=>{
      const arr = Array.isArray(c.sections)? [...c.sections]:[];
      arr.splice(idx,1);
      return { ...c, sections: arr };
    })
  }

  async function saveDraft(){
    setSaving(true);
    try{
      const r = await fetch(`${apiBase}/api/admin/tabs/pages/${id}/versions`, { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ title, notes, content }) });
      if (!r.ok) throw new Error('save_failed');
      const j = await r.json();
      setVersions((v)=> [j.version, ...v]);
      setTitle(''); setNotes('');
    } finally { setSaving(false); }
  }

  async function publish(version:number){
    await fetch(`${apiBase}/api/admin/tabs/pages/${id}/publish`, { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ version }) });
  }

  async function rollback(version:number){
    await fetch(`${apiBase}/api/admin/tabs/pages/${id}/rollback`, { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ version }) });
  }

  async function schedule(){
    const payload:any = scheduleAt ? { at: scheduleAt } : { pause: true };
    await fetch(`${apiBase}/api/admin/tabs/pages/${id}/schedule`, { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
  }

  async function flushCache(){
    await fetch(`${apiBase}/api/admin/tabs/pages/${id}/flush-cache`, { method:'POST', credentials:'include' });
  }

  return (
    <div className="container centered">
      <div className="panel">
        <div className="toolbar">
          <div>
            <h1 className="h1">مصمم تبويبات الصفحة</h1>
            <div className="muted">ID: {id} {page?.slug? `(/${page.slug})`: ''}</div>
          </div>
          <Link href="/design/tabs" className="btn btn-outline btn-md">رجوع للقائمة</Link>
        </div>
      </div>
      <div className="grid cols-2">
        <div className="panel">
          <div className="toolbar">
            <h2 className="h2" style={{margin:0}}>المحتوى</h2>
            <select value={device} onChange={e=> setDevice(e.target.value as any)} className="select" style={{minWidth:140}}>
              <option value="MOBILE">Mobile</option>
              <option value="DESKTOP">Desktop</option>
            </select>
          </div>
          <div className="toolbar">
            <button onClick={()=> addSection('hero')} className="btn btn-outline btn-sm">Hero Banner</button>
            <button onClick={()=> addSection('promoTiles')} className="btn btn-outline btn-sm">Promo Tiles</button>
            <button onClick={()=> addSection('productCarousel')} className="btn btn-outline btn-sm">Product Carousel</button>
            <button onClick={()=> addSection('categories')} className="btn btn-outline btn-sm">Categories</button>
            <button onClick={()=> addSection('brands')} className="btn btn-outline btn-sm">Brands</button>
            <button onClick={()=> addSection('masonryForYou')} className="btn btn-outline btn-sm">Masonry For You</button>
          </div>
          <div style={{display:'grid', gap:12}}>
            {(Array.isArray(content.sections)? content.sections:[]).map((s:any, i:number)=> (
              <div
                key={s.id||i}
                className="card"
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer', outline: selectedIdx===i? '2px solid #2563eb' : 'none'}}
                draggable
                onClick={()=> setSelectedIdx(i)}
                onDragStart={(e)=>{ setDragIdx(i); e.dataTransfer.setData('text/plain', String(i)); }}
                onDragOver={(e)=> e.preventDefault()}
                onDrop={(e)=>{
                  e.preventDefault(); const from = dragIdx ?? Number(e.dataTransfer.getData('text/plain')||-1); const to = i; if (!isFinite(from) || from===to) return;
                  setContent((c:any)=>{ const arr = Array.isArray(c.sections)? [...c.sections]:[]; const [m] = arr.splice(from,1); arr.splice(to,0,m); return { ...c, sections: arr }; }); setDragIdx(null);
                }}
              >
                <div style={{fontWeight:600}}>{s.type}</div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <button onClick={()=> moveSection(i,-1)} className="btn btn-outline btn-sm">↑</button>
                  <button onClick={()=> moveSection(i, 1)} className="btn btn-outline btn-sm">↓</button>
                  <button onClick={()=> removeSection(i)} className="btn danger btn-sm">حذف</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <details>
              <summary className="muted" style={{cursor:'pointer'}}>عرض JSON</summary>
              <pre style={{fontSize:12, background:'rgba(255,255,255,0.03)', padding:12, borderRadius:8, overflow:'auto'}} dir="ltr">{JSON.stringify(content, null, 2)}</pre>
            </details>
          </div>
          <div className="toolbar mt-2">
            <input value={title} onChange={e=> setTitle(e.target.value)} placeholder="عنوان الإصدار" className="input" />
            <input value={notes} onChange={e=> setNotes(e.target.value)} placeholder="ملاحظات" className="input" />
            <button disabled={saving} onClick={saveDraft} className="btn btn-md" style={{whiteSpace:'nowrap'}}>حفظ كإصدار</button>
          </div>
        </div>
        <div className="panel" style={{display:'grid', gap:16}}>
          {/* Inspector */}
          <div>
            <h2 className="h3" style={{marginBottom:8}}>المحرر</h2>
            {selectedIdx>=0 && (content.sections?.[selectedIdx]) ? (
              <SectionInspector section={content.sections[selectedIdx]} onChange={(upd)=>{
                setContent((c:any)=>{ const arr = Array.isArray(c.sections)? [...c.sections]:[]; arr[selectedIdx] = { ...arr[selectedIdx], ...upd }; return { ...c, sections: arr }; });
              }} />
            ) : (
              <div className="muted">اختر قسماً لتحريره</div>
            )}
          </div>

          {/* Versions */}
          <div>
            <h2 className="h3" style={{marginBottom:8}}>الإصدارات</h2>
            <div style={{display:'grid', gap:8}}>
              {versions.map(v=> (
                <div key={v.id} className="card" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontWeight:600}}>Version {v.version}</div>
                    <div className="muted" style={{fontSize:12}}>{v.title||'-'}</div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=> publish(v.version)} className="btn btn-outline btn-sm">نشر</button>
                    <button onClick={()=> rollback(v.version)} className="btn btn-outline btn-sm">استرجاع</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Publish/Schedule */}
          <div>
            <h2 className="h3" style={{marginBottom:8}}>النشر والجدولة</h2>
            <div className="toolbar">
              <input type="datetime-local" value={scheduleAt} onChange={e=> setScheduleAt(e.target.value)} className="input" />
              <button onClick={schedule} className="btn btn-outline btn-sm">حفظ الجدولة/إيقاف</button>
              <button onClick={flushCache} className="btn btn-outline btn-sm">تفريغ الكاش</button>
            </div>
          </div>

          {/* Stats */}
          <div>
            <h2 className="h3" style={{marginBottom:8}}>الإحصاءات (30 يوم)</h2>
            {stats? (
              <div>
                <div className="muted" style={{marginBottom:8,fontSize:12}}>Impressions: <b>{stats.totals.impressions}</b> • Clicks: <b>{stats.totals.clicks}</b> • CTR: <b>{(stats.totals.ctr*100).toFixed(2)}%</b></div>
                <div className="table-wrapper" style={{maxHeight:200, overflow:'auto'}}>
                  <table className="table">
                    <thead><tr><th>التاريخ</th><th>الظهور</th><th>النقرات</th></tr></thead>
                    <tbody>
                      {stats.series.map((r:any,i:number)=> (
                        <tr key={i}><td>{String(r.date).slice(0,10)}</td><td>{r.impressions}</td><td>{r.clicks}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : <div className="muted">—</div>}
          </div>

          {/* Published preview */}
          <div>
            <h3 className="h3" style={{marginBottom:8}}>المعاينة (المنشور)</h3>
            {published? (
              <pre style={{fontSize:12, background:'rgba(255,255,255,0.03)', padding:12, borderRadius:8, overflow:'auto'}} dir="ltr">{JSON.stringify(published, null, 2)}</pre>
            ) : (
              <div className="muted">لا يوجد محتوى منشور بعد</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionInspector({ section, onChange }:{ section:any; onChange:(upd:any)=>void }): JSX.Element {
  const t = String(section?.type||'');
  if (t==='hero') {
    return (
      <div style={{display:'grid',gap:12}}>
        <input className="input" placeholder="صورة (URL)" value={section.config?.image||''} onChange={e=> onChange({ config: { ...section.config, image: e.target.value } })} />
        <input className="input" placeholder="عنوان" value={section.config?.title||''} onChange={e=> onChange({ config: { ...section.config, title: e.target.value } })} />
        <input className="input" placeholder="وصف" value={section.config?.subtitle||''} onChange={e=> onChange({ config: { ...section.config, subtitle: e.target.value } })} />
        <div className="form-grid">
          <input className="input" placeholder="CTA نص" value={section.config?.ctaText||''} onChange={e=> onChange({ config: { ...section.config, ctaText: e.target.value } })} />
          <input className="input" placeholder="CTA رابط" value={section.config?.ctaHref||''} onChange={e=> onChange({ config: { ...section.config, ctaHref: e.target.value } })} />
        </div>
      </div>
    );
  }
  if (t==='promoTiles') {
    const tiles = Array.isArray(section.config?.tiles)? section.config.tiles : [];
    return (
      <div style={{display:'grid',gap:12}}>
        <button className="btn btn-outline btn-sm" onClick={()=> onChange({ config: { ...section.config, tiles: [...tiles, { image:'', title:'' }] } })}>إضافة بلاطة</button>
        <div style={{display:'grid',gap:12,maxHeight:240,overflow:'auto'}}>
          {tiles.map((tile:any, idx:number)=> (
            <div key={idx} className="card" style={{display:'grid',gap:8}}>
              <input className="input" placeholder={`صورة #${idx+1}`} value={tile.image||''} onChange={e=>{ const arr=[...tiles]; arr[idx]={ ...arr[idx], image:e.target.value }; onChange({ config:{ ...section.config, tiles: arr } }) }} />
              <input className="input" placeholder={`عنوان #${idx+1}`} value={tile.title||''} onChange={e=>{ const arr=[...tiles]; arr[idx]={ ...arr[idx], title:e.target.value }; onChange({ config:{ ...section.config, tiles: arr } }) }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (t==='productCarousel') {
    return (
      <div style={{display:'grid',gap:12}}>
        <input className="input" placeholder="عنوان القسم" value={section.config?.title||''} onChange={e=> onChange({ config: { ...section.config, title: e.target.value } })} />
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <label className="muted" style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12}}><input type="checkbox" checked={!!section.config?.autoScroll} onChange={e=> onChange({ config: { ...section.config, autoScroll: e.target.checked } })} />Auto scroll</label>
          <label className="muted" style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12}}><input type="checkbox" checked={!!section.config?.showPrice} onChange={e=> onChange({ config: { ...section.config, showPrice: e.target.checked } })} />Show price</label>
        </div>
        <textarea className="input" rows={4} placeholder="قواعد الفلترة (JSON)" value={JSON.stringify(section.config?.filter||{},null,0)} onChange={e=> { try{ onChange({ config: { ...section.config, filter: JSON.parse(e.target.value||'{}') } }) }catch{} }} />
      </div>
    );
  }
  if (t==='categories' || t==='brands') {
    const key = t==='categories'? 'categories' : 'brands';
    const list = Array.isArray(section.config?.[key])? section.config[key] : [];
    return (
      <div style={{display:'grid',gap:12}}>
        <button className="btn btn-outline btn-sm" onClick={()=> onChange({ config: { ...section.config, [key]: [...list, { name:'', image:'' }] } })}>إضافة عنصر</button>
        <div style={{display:'grid',gap:12,maxHeight:240,overflow:'auto'}}>
          {list.map((it:any, idx:number)=> (
            <div key={idx} className="card" style={{display:'grid',gap:8}}>
              <input className="input" placeholder="الاسم" value={it.name||''} onChange={e=>{ const arr=[...list]; arr[idx]={ ...arr[idx], name:e.target.value }; onChange({ config:{ ...section.config, [key]: arr } }) }} />
              <input className="input" placeholder="الصورة" value={it.image||''} onChange={e=>{ const arr=[...list]; arr[idx]={ ...arr[idx], image:e.target.value }; onChange({ config:{ ...section.config, [key]: arr } }) }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (t==='masonryForYou') {
    return (
      <div style={{display:'grid',gap:12}}>
        <label className="form-label">عدد الأعمدة</label>
        <input type="number" className="input" value={Number(section.config?.columns||2)} onChange={e=> onChange({ config: { ...section.config, columns: Number(e.target.value||2) } })} />
        <textarea className="input" rows={4} placeholder="قواعد التوصيات (JSON)" value={JSON.stringify(section.config?.recommend||{},null,0)} onChange={e=> { try{ onChange({ config: { ...section.config, recommend: JSON.parse(e.target.value||'{}') } }) }catch{} }} />
      </div>
    );
  }
  return <div className="muted">لا يوجد محرر لهذا النوع</div>;
}
