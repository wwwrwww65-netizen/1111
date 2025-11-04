"use client";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";

export default function CampaignsPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [rows, setRows] = React.useState<Array<any>>([]);
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState<any>({ name:'حملة', multiplier:1, enabled:true, startsAt:'', endsAt:'', includeProducts:[], includeCategories:[], includeVendors:[] });
  const [pickOpen, setPickOpen] = React.useState<{type?: 'products'|'categories'|'vendors'; open:boolean}>({ open:false });
  const [search, setSearch] = React.useState('');
  const [options, setOptions] = React.useState<Array<{id:string;name:string}>>([]);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  React.useEffect(()=>{
    if (!pickOpen.open || !pickOpen.type) return;
    (async ()=>{
      try{
        if (pickOpen.type==='products'){
          const url = new URL(`${apiBase}/api/admin/products`); url.searchParams.set('limit','20'); url.searchParams.set('suggest','1');
          const j = await (await fetch(url.toString(), { credentials:'include' })).json(); setOptions((j.products||[]).map((p:any)=> ({ id:p.id, name:p.name })));
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
    try{ const j = await (await fetch(`${apiBase}/api/admin/points/campaigns`, { credentials:'include' })).json(); setRows(j.campaigns||[]); }catch{ setRows([]); }
    setBusy(false);
  }
  React.useEffect(()=>{ void load(); },[apiBase]);

  async function save(){
    setBusy(true);
    const conditions: any = { include:{} };
    if ((form.includeProducts||[]).length) conditions.include.products = form.includeProducts;
    if ((form.includeCategories||[]).length) conditions.include.categories = form.includeCategories;
    if ((form.includeVendors||[]).length) conditions.include.vendors = form.includeVendors;
    const body: any = { name: form.name||'حملة', multiplier: Number(form.multiplier||1), enabled: !!form.enabled, conditions };
    if (form.startsAt) body.startsAt = form.startsAt;
    if (form.endsAt) body.endsAt = form.endsAt;
    const r = await fetch(`${apiBase}/api/admin/points/campaigns`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
    setBusy(false);
    if (!r.ok) { alert('فشل الحفظ'); return }
    setForm({ name:'حملة', multiplier:1, enabled:true, startsAt:'', endsAt:'', includeProducts:[], includeCategories:[], includeVendors:[] });
    await load();
  }

  async function del(id: string){
    if (!confirm('حذف الحملة؟')) return;
    const r = await fetch(`${apiBase}/api/admin/points/campaigns/delete`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({ id }) });
    if (!r.ok) { alert('تعذر الحذف'); return }
    await load();
  }

  return (
    <main>
      <h1 style={{marginBottom:12}}>حملات النقاط</h1>
      <div className="panel" style={{display:'grid', gap:8, gridTemplateColumns:'1fr 1fr'}}>
        <div className="grid" style={{gap:8}}>
          <input className="input" placeholder="اسم الحملة" value={form.name} onChange={e=> setForm((f:any)=> ({...f, name: e.target.value}))} />
          <input className="input" type="number" step="0.1" placeholder="المضاعف" value={form.multiplier} onChange={e=> setForm((f:any)=> ({...f, multiplier: e.target.value}))} />
          <label><input type="checkbox" checked={!!form.enabled} onChange={e=> setForm((f:any)=> ({...f, enabled: e.target.checked}))} /> مفعّل</label>
          <label>يبدأ <input className="input" type="datetime-local" value={form.startsAt} onChange={e=> setForm((f:any)=> ({...f, startsAt: e.target.value}))} /></label>
          <label>ينتهي <input className="input" type="datetime-local" value={form.endsAt} onChange={e=> setForm((f:any)=> ({...f, endsAt: e.target.value}))} /></label>
          <div className="grid" style={{ gridTemplateColumns:'1fr auto', gap:8 }}>
            <div className="chips">{(form.includeProducts||[]).map((id:string)=> (<span key={id} className="chip">{id}</span>))}</div>
            <button className="btn btn-sm" onClick={()=> setPickOpen({ open:true, type:'products' })}>اختر منتجات</button>
          </div>
          <div className="grid" style={{ gridTemplateColumns:'1fr auto', gap:8 }}>
            <div className="chips">{(form.includeCategories||[]).map((id:string)=> (<span key={id} className="chip">{id}</span>))}</div>
            <button className="btn btn-sm" onClick={()=> setPickOpen({ open:true, type:'categories' })}>اختر فئات</button>
          </div>
          <div className="grid" style={{ gridTemplateColumns:'1fr auto', gap:8 }}>
            <div className="chips">{(form.includeVendors||[]).map((id:string)=> (<span key={id} className="chip">{id}</span>))}</div>
            <button className="btn btn-sm" onClick={()=> setPickOpen({ open:true, type:'vendors' })}>اختر مورّدين</button>
          </div>
          <div style={{display:'flex', justifyContent:'flex-end'}}>
            <button className="btn" onClick={save} disabled={busy}>حفظ</button>
          </div>
        </div>
        <div>
          <table className="table">
            <thead><tr><th>اسم</th><th>المضاعف</th><th>المدى</th><th></th></tr></thead>
            <tbody>
              {rows.map((r:any)=> (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.multiplier}</td>
                  <td>{(r.startsAt? String(r.startsAt).slice(0,16):'-')} → {(r.endsAt? String(r.endsAt).slice(0,16):'-')}</td>
                  <td style={{textAlign:'right'}}><button className="btn btn-sm btn-outline" onClick={()=> del(r.id)}>حذف</button></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={4}>{busy? 'جارٍ التحميل…' : 'لا توجد حملات'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {pickOpen.open && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ width:720 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 className="text-lg">اختيار {pickOpen.type==='products'? 'منتجات' : pickOpen.type==='categories'? 'فئات' : 'مورّدين'}</h3>
              <button className="btn btn-outline" onClick={()=> setPickOpen({ open:false })}>إغلاق</button>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <input className="input" placeholder="بحث" value={search} onChange={e=> setSearch(e.target.value)} />
              <button className="btn btn-sm" onClick={async ()=>{
                try{
                  if (pickOpen.type==='products'){
                    const url = new URL(`${apiBase}/api/admin/products`); url.searchParams.set('search', search.trim()); url.searchParams.set('limit','20'); url.searchParams.set('suggest','1');
                    const j = await (await fetch(url.toString(), { credentials:'include' })).json(); setOptions((j.products||[]).map((p:any)=> ({ id:p.id, name:p.name, image: Array.isArray(p.images)&&p.images[0]? p.images[0]: undefined })));
                  } else if (pickOpen.type==='categories'){
                    const j = await (await fetch(`${apiBase}/api/admin/categories`, { credentials:'include' })).json(); setOptions((j.categories||[]).map((c:any)=> ({ id:c.id, name:c.name })));
                  } else {
                    const j = await (await fetch(`${apiBase}/api/admin/vendors/list`, { credentials:'include' })).json(); setOptions((j.vendors||[]).map((v:any)=> ({ id:v.id, name:v.name })));
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
                setForm((f:any)=>{
                  const next = { ...f } as any;
                  if (pickOpen.type==='products') next.includeProducts = Array.from(new Set([...(next.includeProducts||[]), ...ids]));
                  if (pickOpen.type==='categories') next.includeCategories = Array.from(new Set([...(next.includeCategories||[]), ...ids]));
                  if (pickOpen.type==='vendors') next.includeVendors = Array.from(new Set([...(next.includeVendors||[]), ...ids]));
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


