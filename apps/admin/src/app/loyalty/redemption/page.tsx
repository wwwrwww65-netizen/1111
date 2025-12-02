"use client";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";

export default function RedemptionPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [config, setConfig] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);
  // picker state
  const [pickOpen, setPickOpen] = React.useState<{type?: 'products'|'categories'|'vendors'; open:boolean; mode?: 'include'|'exclude'}>({ open:false });
  const [search, setSearch] = React.useState('');
  const [options, setOptions] = React.useState<Array<{id:string;name:string}>>([]);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  React.useEffect(()=>{
    if (!pickOpen.open || !pickOpen.type) return;
    (async ()=>{
      try{
        if (pickOpen.type==='products'){
          const url = new URL(`${apiBase}/api/admin/products`); url.searchParams.set('limit','20'); url.searchParams.set('suggest','1');
          const j = await (await fetch(url, { credentials:'include' } as any)).json(); setOptions((j.products||[]).map((p:any)=> ({ id:p.id, name:p.name })));
        } else if (pickOpen.type==='categories'){
          const j = await (await fetch(`${apiBase}/api/admin/categories`, { credentials:'include' })).json(); setOptions((j.categories||[]).map((c:any)=> ({ id:c.id, name:c.name })));
        } else {
          const j = await (await fetch(`${apiBase}/api/admin/vendors/list`, { credentials:'include' })).json(); setOptions((j.vendors||[]).map((v:any)=> ({ id:v.id, name:v.name })));
        }
        setSelected({});
      }catch{ setOptions([]); }
    })();
  }, [pickOpen.open, pickOpen.type, apiBase]);
  async function load(){
    setBusy(true);
    try{ const j = await (await fetch(`${apiBase}/api/admin/points/redemption`, { credentials:'include' })).json(); setConfig(j.config||{}); }catch{ setConfig({}); }
    setBusy(false);
  }
  React.useEffect(()=>{ void load(); },[apiBase]);
  function addTier(){ setConfig((c:any)=> ({...c, tiers:[...(c?.tiers||[]), { points: 1000, percentOff: 10 }]})) }
  function removeTier(i: number){ setConfig((c:any)=> ({...c, tiers:(c?.tiers||[]).filter((_:any,idx:number)=> idx!==i)})) }
  async function save(){
    setBusy(true);
    const r = await fetch(`${apiBase}/api/admin/points/redemption`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify(config||{}) });
    setBusy(false);
    if (!r.ok) return alert('فشل الحفظ');
    alert('تم الحفظ');
  }
  if (!config) return <main><h1>الاستبدال</h1><div>جارٍ التحميل…</div></main>;
  return (
    <main>
      <h1 style={{ marginBottom: 12 }}>قواعد الاستبدال (Redemption)</h1>
      <div className="panel" style={{ display:'grid', gap:8 }}>
        <label><input type="checkbox" checked={config.enabled!==false} onChange={e=> setConfig((c:any)=> ({...c, enabled: e.target.checked}))} /> مفعّل</label>
        <label className="grid" style={{gap:4}}>
          <span>حد أدنى للطلب أثناء الاستبدال</span>
          <input className="input" type="number" step="0.01" value={config?.minOrderAmount??0} onChange={e=> setConfig((c:any)=> ({...c, minOrderAmount: Number(e.target.value||0)}))} />
        </label>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'8px 0'}}>
            <strong>المستويات</strong>
            <button className="btn btn-sm" onClick={addTier}>+ إضافة مستوى</button>
          </div>
          <table className="table">
            <thead><tr><th>نقاط</th><th>% خصم</th><th>خصم ثابت</th><th></th></tr></thead>
            <tbody>
              {(config?.tiers||[]).map((t:any, i:number)=> (
                <tr key={i}>
                  <td><input className="input" type="number" value={t.points||0} onChange={e=> setConfig((c:any)=> ({...c, tiers: c.tiers.map((x:any,idx:number)=> idx===i? {...x, points: Number(e.target.value||0)}: x)}))} /></td>
                  <td><input className="input" type="number" step="0.01" value={t.percentOff||''} onChange={e=> setConfig((c:any)=> ({...c, tiers: c.tiers.map((x:any,idx:number)=> idx===i? {...x, percentOff: e.target.value? Number(e.target.value): undefined}: x)}))} /></td>
                  <td><input className="input" type="number" step="0.01" value={t.amountOff||''} onChange={e=> setConfig((c:any)=> ({...c, tiers: c.tiers.map((x:any,idx:number)=> idx===i? {...x, amountOff: e.target.value? Number(e.target.value): undefined}: x)}))} /></td>
                  <td style={{textAlign:'right'}}><button className="btn btn-sm btn-outline" onClick={()=> removeTier(i)}>حذف</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* استثناء عناصر من الاستبدال */}
        <div className="panel" style={{ display:'grid', gap:8 }}>
          <strong>عناصر مستثناة من الاستبدال</strong>
          <div className="grid" style={{ gridTemplateColumns:'1fr auto', gap:8 }}>
            <div className="chips">{(config?.exclude?.products||[]).map((id:string)=> (<span key={id} className="chip">{id}</span>))}</div>
            <button className="btn btn-sm" onClick={()=> setPickOpen({ open:true, type:'products', mode:'exclude' })}>اختر منتجات</button>
          </div>
          <div className="grid" style={{ gridTemplateColumns:'1fr auto', gap:8 }}>
            <div className="chips">{(config?.exclude?.categories||[]).map((id:string)=> (<span key={id} className="chip">{id}</span>))}</div>
            <button className="btn btn-sm" onClick={()=> setPickOpen({ open:true, type:'categories', mode:'exclude' })}>اختر فئات</button>
          </div>
          <div className="grid" style={{ gridTemplateColumns:'1fr auto', gap:8 }}>
            <div className="chips">{(config?.exclude?.vendors||[]).map((id:string)=> (<span key={id} className="chip">{id}</span>))}</div>
            <button className="btn btn-sm" onClick={()=> setPickOpen({ open:true, type:'vendors', mode:'exclude' })}>اختر مورّدين</button>
          </div>
        </div>
        <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button className="btn" onClick={save} disabled={busy}>حفظ</button>
        </div>
      </div>

      {pickOpen.open && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ width:720 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 className="text-lg">{pickOpen.mode==='exclude'? 'استثناء' : 'تضمين'} — {pickOpen.type==='products'? 'منتجات' : pickOpen.type==='categories'? 'فئات' : 'مورّدين'}</h3>
              <button className="btn btn-outline" onClick={()=> setPickOpen({ open:false })}>إغلاق</button>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <input className="input" placeholder="بحث" value={search} onChange={e=> setSearch(e.target.value)} />
              <button className="btn btn-sm" onClick={async ()=>{
                try{
                  if (pickOpen.type==='products'){
                    const url = new URL(`${apiBase}/api/admin/products`); url.searchParams.set('search', search.trim()); url.searchParams.set('limit','20'); url.searchParams.set('suggest','1');
                    const j = await (await fetch(url, { credentials:'include' })).json(); setOptions((j.products||[]).map((p:any)=> ({ id:p.id, name:p.name, image: Array.isArray(p.images) && p.images[0]? p.images[0]: undefined })));
                  } else if (pickOpen.type==='categories'){
                    const j = await (await fetch(`${apiBase}/api/admin/categories`, { credentials:'include' })).json(); setOptions((j.categories||[]).filter((c:any)=> !search || String(c.name||'').includes(search)).map((c:any)=> ({ id:c.id, name:c.name })));
                  } else {
                    const j = await (await fetch(`${apiBase}/api/admin/vendors/list`, { credentials:'include' })).json(); setOptions((j.vendors||[]).filter((v:any)=> !search || String(v.name||'').includes(search)).map((v:any)=> ({ id:v.id, name:v.name })));
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
                setConfig((c:any)=>{
                  const next = { ...(c||{}), exclude: { ...(c?.exclude||{}) } } as any;
                  if (pickOpen.type==='products') next.exclude.products = Array.from(new Set([...(next.exclude.products||[]), ...ids]));
                  if (pickOpen.type==='categories') next.exclude.categories = Array.from(new Set([...(next.exclude.categories||[]), ...ids]));
                  if (pickOpen.type==='vendors') next.exclude.vendors = Array.from(new Set([...(next.exclude.vendors||[]), ...ids]));
                  return next;
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


