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
    setContent((c:any)=> ({ ...c, sections: [...(Array.isArray(c.sections)? c.sections:[]), { id: crypto.randomUUID?.() || String(Date.now()), type, config:{} }] }));
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
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Tab Page Builder</h1>
          <div className="text-gray-500 text-sm">ID: {id} {page?.slug? `(/${page.slug})`: ''}</div>
        </div>
        <Link href="/design/tabs" className="text-sm text-blue-600">رجوع للقائمة</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">المحتوى</h2>
            <select value={device} onChange={e=> setDevice(e.target.value as any)} className="border px-2 py-1 rounded text-sm">
              <option value="MOBILE">Mobile</option>
              <option value="DESKTOP">Desktop</option>
            </select>
          </div>
          <div className="flex gap-2 mb-3">
            <button onClick={()=> addSection('hero')} className="px-2 py-1 border rounded text-sm">Hero Banner</button>
            <button onClick={()=> addSection('promoTiles')} className="px-2 py-1 border rounded text-sm">Promo Tiles</button>
            <button onClick={()=> addSection('productCarousel')} className="px-2 py-1 border rounded text-sm">Product Carousel</button>
            <button onClick={()=> addSection('categories')} className="px-2 py-1 border rounded text-sm">Categories</button>
            <button onClick={()=> addSection('brands')} className="px-2 py-1 border rounded text-sm">Brands</button>
            <button onClick={()=> addSection('masonryForYou')} className="px-2 py-1 border rounded text-sm">Masonry For You</button>
          </div>
          <div className="space-y-2">
            {(Array.isArray(content.sections)? content.sections:[]).map((s:any, i:number)=> (
              <div
                key={s.id||i}
                className={`border rounded p-2 flex items-center justify-between ${selectedIdx===i? 'ring-2 ring-blue-500':''}`}
                draggable
                onClick={()=> setSelectedIdx(i)}
                onDragStart={(e)=>{ setDragIdx(i); e.dataTransfer.setData('text/plain', String(i)); }}
                onDragOver={(e)=> e.preventDefault()}
                onDrop={(e)=>{
                  e.preventDefault(); const from = dragIdx ?? Number(e.dataTransfer.getData('text/plain')||-1); const to = i; if (!isFinite(from) || from===to) return;
                  setContent((c:any)=>{ const arr = Array.isArray(c.sections)? [...c.sections]:[]; const [m] = arr.splice(from,1); arr.splice(to,0,m); return { ...c, sections: arr }; }); setDragIdx(null);
                }}
              >
                <div className="text-sm font-semibold cursor-grab">{s.type}</div>
                <div className="flex items-center gap-2">
                  <button onClick={()=> moveSection(i,-1)} className="px-2 py-1 border rounded text-xs">↑</button>
                  <button onClick={()=> moveSection(i, 1)} className="px-2 py-1 border rounded text-xs">↓</button>
                  <button onClick={()=> removeSection(i)} className="px-2 py-1 border rounded text-xs text-red-600">حذف</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <details>
              <summary className="cursor-pointer text-xs text-gray-600">عرض JSON</summary>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto" dir="ltr">{JSON.stringify(content, null, 2)}</pre>
            </details>
          </div>
          <div className="mt-3 flex gap-2">
            <input value={title} onChange={e=> setTitle(e.target.value)} placeholder="عنوان الإصدار" className="border px-2 py-1 rounded text-sm flex-1" />
            <input value={notes} onChange={e=> setNotes(e.target.value)} placeholder="ملاحظات" className="border px-2 py-1 rounded text-sm flex-1" />
            <button disabled={saving} onClick={saveDraft} className="px-3 py-1.5 rounded bg-black text-white text-sm disabled:opacity-50">حفظ كإصدار</button>
          </div>
        </div>
        <div className="border rounded p-3 space-y-4">
          {/* Inspector */}
          <div>
            <h2 className="font-semibold mb-2">المحرر</h2>
            {selectedIdx>=0 && (content.sections?.[selectedIdx]) ? (
              <SectionInspector section={content.sections[selectedIdx]} onChange={(upd)=>{
                setContent((c:any)=>{ const arr = Array.isArray(c.sections)? [...c.sections]:[]; arr[selectedIdx] = { ...arr[selectedIdx], ...upd }; return { ...c, sections: arr }; });
              }} />
            ) : (
              <div className="text-xs text-gray-500">اختر قسماً لتحريره</div>
            )}
          </div>

          {/* Versions */}
          <div>
            <h2 className="font-semibold mb-2">الإصدارات</h2>
          <ul className="space-y-2">
            {versions.map(v=> (
              <li key={v.id} className="border rounded p-2 flex items-center justify-between">
                <div>
                  <div className="font-semibold">Version {v.version}</div>
                  <div className="text-xs text-gray-500">{v.title||'-'}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=> publish(v.version)} className="px-2 py-1 border rounded text-sm">نشر</button>
                  <button onClick={()=> rollback(v.version)} className="px-2 py-1 border rounded text-sm">استرجاع</button>
                </div>
              </li>
            ))}
          </ul>
          </div>

          {/* Publish/Schedule */}
          <div>
            <h2 className="font-semibold mb-2">النشر والجدولة</h2>
            <div className="flex items-center gap-2">
              <input type="datetime-local" value={scheduleAt} onChange={e=> setScheduleAt(e.target.value)} className="border px-2 py-1 rounded text-sm" />
              <button onClick={schedule} className="px-2 py-1 border rounded text-sm">حفظ الجدولة/إيقاف</button>
              <button onClick={flushCache} className="px-2 py-1 border rounded text-sm">Flush cache</button>
            </div>
          </div>

          {/* Stats */}
          <div>
            <h2 className="font-semibold mb-2">الإحصاءات (30 يوم)</h2>
            {stats? (
              <div className="text-xs">
                <div className="mb-1">Impressions: <b>{stats.totals.impressions}</b> • Clicks: <b>{stats.totals.clicks}</b> • CTR: <b>{(stats.totals.ctr*100).toFixed(2)}%</b></div>
                <div className="max-h-40 overflow-auto border rounded">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-gray-50"><th className="p-1 text-right">Date</th><th className="p-1 text-right">Impr</th><th className="p-1 text-right">Clk</th></tr></thead>
                    <tbody>
                      {stats.series.map((r:any,i:number)=> (
                        <tr key={i}><td className="p-1 border">{String(r.date).slice(0,10)}</td><td className="p-1 border">{r.impressions}</td><td className="p-1 border">{r.clicks}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : <div className="text-xs text-gray-500">—</div>}
          </div>

          {/* Published preview */}
          <div>
            <h3 className="font-semibold mb-1">المعاينة (المنشور)</h3>
            {published? (
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto" dir="ltr">{JSON.stringify(published, null, 2)}</pre>
            ) : (
              <div className="text-xs text-gray-500">لا يوجد محتوى منشور بعد</div>
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
      <div className="space-y-2">
        <input className="border px-2 py-1 rounded text-sm w-full" placeholder="صورة (URL)" value={section.config?.image||''} onChange={e=> onChange({ config: { ...section.config, image: e.target.value } })} />
        <input className="border px-2 py-1 rounded text-sm w-full" placeholder="عنوان" value={section.config?.title||''} onChange={e=> onChange({ config: { ...section.config, title: e.target.value } })} />
        <input className="border px-2 py-1 rounded text-sm w-full" placeholder="وصف" value={section.config?.subtitle||''} onChange={e=> onChange({ config: { ...section.config, subtitle: e.target.value } })} />
        <div className="flex gap-2">
          <input className="border px-2 py-1 rounded text-sm flex-1" placeholder="CTA نص" value={section.config?.ctaText||''} onChange={e=> onChange({ config: { ...section.config, ctaText: e.target.value } })} />
          <input className="border px-2 py-1 rounded text-sm flex-1" placeholder="CTA رابط" value={section.config?.ctaHref||''} onChange={e=> onChange({ config: { ...section.config, ctaHref: e.target.value } })} />
        </div>
      </div>
    );
  }
  if (t==='promoTiles') {
    const tiles = Array.isArray(section.config?.tiles)? section.config.tiles : [];
    return (
      <div className="space-y-2">
        <button className="px-2 py-1 border rounded text-xs" onClick={()=> onChange({ config: { ...section.config, tiles: [...tiles, { image:'', title:'' }] } })}>إضافة بلاطة</button>
        <div className="space-y-2 max-h-48 overflow-auto">
          {tiles.map((tile:any, idx:number)=> (
            <div key={idx} className="border rounded p-2 space-y-1">
              <input className="border px-2 py-1 rounded text-sm w-full" placeholder={`صورة #${idx+1}`} value={tile.image||''} onChange={e=>{ const arr=[...tiles]; arr[idx]={ ...arr[idx], image:e.target.value }; onChange({ config:{ ...section.config, tiles: arr } }) }} />
              <input className="border px-2 py-1 rounded text-sm w-full" placeholder={`عنوان #${idx+1}`} value={tile.title||''} onChange={e=>{ const arr=[...tiles]; arr[idx]={ ...arr[idx], title:e.target.value }; onChange({ config:{ ...section.config, tiles: arr } }) }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (t==='productCarousel') {
    return (
      <div className="space-y-2">
        <input className="border px-2 py-1 rounded text-sm w-full" placeholder="عنوان القسم" value={section.config?.title||''} onChange={e=> onChange({ config: { ...section.config, title: e.target.value } })} />
        <div className="flex gap-2">
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={!!section.config?.autoScroll} onChange={e=> onChange({ config: { ...section.config, autoScroll: e.target.checked } })} />Auto scroll</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={!!section.config?.showPrice} onChange={e=> onChange({ config: { ...section.config, showPrice: e.target.checked } })} />Show price</label>
        </div>
        <textarea className="border px-2 py-1 rounded text-sm w-full" rows={4} placeholder="قواعد الفلترة (JSON)" value={JSON.stringify(section.config?.filter||{},null,0)} onChange={e=> { try{ onChange({ config: { ...section.config, filter: JSON.parse(e.target.value||'{}') } }) }catch{} }} />
      </div>
    );
  }
  if (t==='categories' || t==='brands') {
    const key = t==='categories'? 'categories' : 'brands';
    const list = Array.isArray(section.config?.[key])? section.config[key] : [];
    return (
      <div className="space-y-2">
        <button className="px-2 py-1 border rounded text-xs" onClick={()=> onChange({ config: { ...section.config, [key]: [...list, { name:'', image:'' }] } })}>إضافة عنصر</button>
        <div className="space-y-2 max-h-48 overflow-auto">
          {list.map((it:any, idx:number)=> (
            <div key={idx} className="border rounded p-2 space-y-1">
              <input className="border px-2 py-1 rounded text-sm w-full" placeholder="الاسم" value={it.name||''} onChange={e=>{ const arr=[...list]; arr[idx]={ ...arr[idx], name:e.target.value }; onChange({ config:{ ...section.config, [key]: arr } }) }} />
              <input className="border px-2 py-1 rounded text-sm w-full" placeholder="الصورة" value={it.image||''} onChange={e=>{ const arr=[...list]; arr[idx]={ ...arr[idx], image:e.target.value }; onChange({ config:{ ...section.config, [key]: arr } }) }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (t==='masonryForYou') {
    return (
      <div className="space-y-2">
        <label className="text-xs">عدد الأعمدة</label>
        <input type="number" className="border px-2 py-1 rounded text-sm w-full" value={Number(section.config?.columns||2)} onChange={e=> onChange({ config: { ...section.config, columns: Number(e.target.value||2) } })} />
        <textarea className="border px-2 py-1 rounded text-sm w-full" rows={4} placeholder="قواعد التوصيات (JSON)" value={JSON.stringify(section.config?.recommend||{},null,0)} onChange={e=> { try{ onChange({ config: { ...section.config, recommend: JSON.parse(e.target.value||'{}') } }) }catch{} }} />
      </div>
    );
  }
  return <div className="text-xs text-gray-500">لا يوجد محرر لهذا النوع</div>;
}


