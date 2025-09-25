"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { resolveApiBase } from '../../../lib/apiBase';
import { ActionBarMobile, FormGrid } from '../../../components/Mobile';

type Category = { id:string; name:string };
type MediaItem = { name:string; dataUrl:string };
type Variant = { id:string; color?:string; size?:string; price?:number; stock?:number };

export default function MobileProductDetail(): JSX.Element {
  const params = useParams();
  const id = String(params?.id || '');
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [images, setImages] = React.useState<MediaItem[]>([]);
  const [variants, setVariants] = React.useState<Variant[]>([]);

  React.useEffect(()=>{ let alive=true; (async()=>{
    try{
      const r = await fetch(`${resolveApiBase()}/api/admin/products/${id}`, { headers:{ 'accept':'application/json' }, credentials:'include' });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const j = await r.json();
      if(alive) {
        setData(j);
        try{ setVariants(Array.isArray(j?.variants)? j.variants.map((v:any)=> ({ id: v.id||`${v.color||''}:${v.size||''}`, color:v.color, size:v.size, price:v.price, stock:v.stock })):[]); }catch{ setVariants([]); }
      }
    }catch{ if(alive) setErr('تعذر الجلب'); }
    finally{ if(alive) setLoading(false); }
  })(); return ()=>{ alive=false; }; }, [id]);

  React.useEffect(()=>{ (async()=>{ try{ const j = await (await fetch(`${resolveApiBase()}/api/admin/categories`, { headers:{ 'accept':'application/json' }, credentials:'include' })).json(); setCategories(j.categories||[]);}catch{ setCategories([]);} })(); }, []);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>){
    const files = Array.from(e.target.files||[]).slice(0, 12);
    if (!files.length) return;
    Promise.all(files.map(f=> new Promise<MediaItem>((resolve)=>{
      const r = new FileReader(); r.onload = ()=> resolve({ name: f.name, dataUrl: String(r.result||'') }); r.readAsDataURL(f);
    }))).then(list=> setImages(prev=> [...prev, ...list]));
    e.currentTarget.value = '';
  }

  async function save(){
    if(!data) return;
    setSaving(true); setErr(null);
    try{
      const payload:any = { name: data.name, price: data.price, description: data.description, status: data.status, categoryId: data.categoryId, sku: data.sku, barcode: data.barcode, brand: data.brand, tags: data.tags, seoTitle: data.seoTitle, seoDescription: data.seoDescription, seoKeywords: data.seoKeywords, weight: data.weight, width: data.width, height: data.height, depth: data.depth, attributes: data.attributes };
      if (images.length){ payload.media = images.map(m=> ({ name:m.name, dataUrl:m.dataUrl })); }
      if (variants.length){ payload.variants = variants.map(v=> ({ id:v.id, color:v.color, size:v.size, price:v.price, stock:v.stock })); }
      const r = await fetch(`${resolveApiBase()}/api/admin/products/${id}`, { method:'PATCH', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify(payload) });
      if(!r.ok) throw new Error('failed');
    }catch{ setErr('تعذر الحفظ'); }
    finally{ setSaving(false); }
  }

  return (
    <div className="grid" style={{ gap:12 }}>
      <button className="icon-btn" onClick={()=> history.length>1 ? history.back() : location.assign('/mobile/products')}>رجوع</button>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {err && <div className="panel" style={{ color:'var(--err)' }}>{err}</div>}
      {!loading && !err && data && (
        <>
          <div className="panel">
            <div style={{ fontWeight:800, marginBottom:8 }}>تعديل منتج</div>
            <FormGrid>
              <label>
                <div style={{ marginBottom:6 }}>الاسم</div>
                <input className="input" value={data.name||''} onChange={e=> setData((d:any)=> ({...d, name:e.target.value}))} />
              </label>
              <label>
                <div style={{ marginBottom:6 }}>الحالة</div>
                <select className="select" value={data.status||'ACTIVE'} onChange={e=> setData((d:any)=> ({...d, status:e.target.value}))}>
                  <option value="ACTIVE">مفعل</option>
                  <option value="DRAFT">مسودة</option>
                  <option value="ARCHIVED">مؤرشف</option>
                </select>
              </label>
              <label style={{ gridColumn:'1 / -1' }}>
                <div style={{ marginBottom:6 }}>الوصف</div>
                <textarea className="input" rows={4} value={data.description||''} onChange={e=> setData((d:any)=> ({...d, description:e.target.value}))} />
              </label>
              <label>
                <div style={{ marginBottom:6 }}>السعر</div>
                <input className="input" value={data.price||''} onChange={e=> setData((d:any)=> ({...d, price:e.target.value}))} />
              </label>
              <label>
                <div style={{ marginBottom:6 }}>الفئة</div>
                <select className="select" value={data.categoryId||''} onChange={e=> setData((d:any)=> ({...d, categoryId:e.target.value}))}>
                  <option value="">—</option>
                  {categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            </FormGrid>
          </div>

          <div className="panel">
            <div style={{ fontWeight:800, marginBottom:8 }}>الصور</div>
            <input className="input" type="file" accept="image/*" multiple onChange={onFiles} />
            {(Array.isArray(data.images) && data.images.length>0) && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:12 }}>
                {data.images.map((m:any,idx:number)=> (
                  <div key={idx} style={{ border:'1px solid var(--muted)', borderRadius:8, overflow:'hidden' }}>
                    <img src={m.url||m} alt="" style={{ width:'100%', height:96, objectFit:'cover' }} />
                  </div>
                ))}
              </div>
            )}
            {images.length>0 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:12 }}>
                {images.map((m,idx)=> (
                  <div key={idx} style={{ border:'1px solid var(--muted)', borderRadius:8, overflow:'hidden' }}>
                    <img src={m.dataUrl} alt="" style={{ width:'100%', height:96, objectFit:'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <div style={{ fontWeight:800, marginBottom:8 }}>المتغيرات</div>
            {variants.length===0 && <div style={{ color:'var(--sub)' }}>لا توجد متغيرات</div>}
            {variants.length>0 && (
              <div style={{ display:'grid', gap:8 }}>
                {variants.map((v, i)=> (
                  <div key={v.id} className="panel" style={{ border:'1px solid var(--muted)', padding:12 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      <div style={{ color:'var(--sub)' }}>لون: {v.color||'—'}</div>
                      <div style={{ color:'var(--sub)' }}>مقاس: {v.size||'—'}</div>
                      <label>
                        <div style={{ marginBottom:6 }}>سعر</div>
                        <input className="input" value={String(v.price ?? '')} onChange={e=> setVariants(list=> list.map((x,idx)=> idx===i? { ...x, price: Number(e.target.value)||0 }: x))} />
                      </label>
                      <label>
                        <div style={{ marginBottom:6 }}>المخزون</div>
                        <input className="input" value={String(v.stock ?? 0)} onChange={e=> setVariants(list=> list.map((x,idx)=> idx===i? { ...x, stock: Number(e.target.value)||0 }: x))} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      <ActionBarMobile>
        <button className="btn btn-outline" onClick={()=> history.length>1 ? history.back() : location.assign('/mobile/products')}>إلغاء</button>
        <button className="btn" disabled={saving} onClick={save}>حفظ</button>
      </ActionBarMobile>
    </div>
  );
}

