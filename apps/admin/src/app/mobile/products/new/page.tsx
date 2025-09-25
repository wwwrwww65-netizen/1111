"use client";
import React from 'react';
import { resolveApiBase } from '../../../lib/apiBase';
import { ActionBarMobile, FormGrid } from '../../../components/Mobile';

type Category = { id:string; name:string };
type MediaItem = { name:string; dataUrl:string };
type Variant = { id:string; color?:string; size?:string; price?:number; stock?:number };

export default function MobileNewProduct(): JSX.Element {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState<'ACTIVE'|'DRAFT'|'ARCHIVED'>('ACTIVE');
  const [price, setPrice] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [images, setImages] = React.useState<MediaItem[]>([]);
  const [colors, setColors] = React.useState<string>('');
  const [sizes, setSizes] = React.useState<string>('');
  const [variants, setVariants] = React.useState<Variant[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [ok, setOk] = React.useState('');

  React.useEffect(()=>{ (async()=>{
    try{
      const j = await (await fetch(`${resolveApiBase()}/api/admin/categories`, { headers:{ 'accept':'application/json' } })).json();
      setCategories(j.categories||[]);
    }catch{ setCategories([]); }
  })(); },[]);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>){
    const files = Array.from(e.target.files||[]).slice(0, 12);
    if (!files.length) return;
    Promise.all(files.map(f=> new Promise<MediaItem>((resolve)=>{
      const r = new FileReader(); r.onload = ()=> resolve({ name: f.name, dataUrl: String(r.result||'') }); r.readAsDataURL(f);
    }))).then(list=> setImages(prev=> [...prev, ...list]));
    e.currentTarget.value = '';
  }

  function generateVariants(){
    const c = colors.split(',').map(s=> s.trim()).filter(Boolean);
    const s = sizes.split(',').map(v=> v.trim()).filter(Boolean);
    const list: Variant[] = [];
    if (c.length && s.length){
      for (const color of c){ for (const size of s){ list.push({ id:`${color}:${size}`, color, size, price: Number(price)||0, stock: 0 }); } }
    } else if (c.length){
      for (const color of c){ list.push({ id:`${color}`, color, price: Number(price)||0, stock: 0 }); }
    } else if (s.length){
      for (const size of s){ list.push({ id:`${size}`, size, price: Number(price)||0, stock: 0 }); }
    }
    setVariants(list);
  }

  async function save(){
    if (!name.trim()) { setErr('ادخل الاسم'); return; }
    if (!price.trim()) { setErr('ادخل السعر'); return; }
    setErr(''); setOk(''); setSaving(true);
    try{
      const payload = {
        product: { name, description, status, categoryId: categoryId||undefined, price: Number(price)||0 },
        variants: variants.map(v=> ({ color: v.color, size: v.size, price: v.price, stock: v.stock })),
        media: images.map(m=> ({ name: m.name, dataUrl: m.dataUrl }))
      };
      const res = await fetch(`${resolveApiBase()}/api/admin/products/generate`, {
        method:'POST', headers:{ 'content-type':'application/json' },
        credentials:'include', body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error('failed');
      setOk('تم إنشاء المنتج');
      setName(''); setDescription(''); setStatus('ACTIVE'); setPrice(''); setCategoryId(''); setImages([]); setColors(''); setSizes(''); setVariants([]);
    }catch{ setErr('تعذر الحفظ'); }
    finally{ setSaving(false); }
  }

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:800, marginBottom:8 }}>منتج جديد (هاتف)</div>
        {err && <div style={{ color:'var(--err)', marginBottom:8 }}>{err}</div>}
        {ok && <div style={{ color:'var(--ok)', marginBottom:8 }}>{ok}</div>}
        <FormGrid>
          <label>
            <div style={{ marginBottom:6 }}>الاسم</div>
            <input className="input" value={name} onChange={e=> setName(e.target.value)} placeholder="اسم المنتج" />
          </label>
          <label>
            <div style={{ marginBottom:6 }}>الحالة</div>
            <select className="select" value={status} onChange={e=> setStatus(e.target.value as any)}>
              <option value="ACTIVE">مفعل</option>
              <option value="DRAFT">مسودة</option>
              <option value="ARCHIVED">مؤرشف</option>
            </select>
          </label>
          <label style={{ gridColumn:'1 / -1' }}>
            <div style={{ marginBottom:6 }}>الوصف</div>
            <textarea className="input" rows={4} value={description} onChange={e=> setDescription(e.target.value)} placeholder="وصف قصير" />
          </label>
          <label>
            <div style={{ marginBottom:6 }}>السعر الأساسي</div>
            <input className="input" value={price} onChange={e=> setPrice(e.target.value)} placeholder="0" inputMode="decimal" />
          </label>
          <label>
            <div style={{ marginBottom:6 }}>الفئة</div>
            <select className="select" value={categoryId} onChange={e=> setCategoryId(e.target.value)}>
              <option value="">—</option>
              {categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </FormGrid>
      </div>

      <div className="panel">
        <div style={{ fontWeight:800, marginBottom:8 }}>الصور</div>
        <input className="input" type="file" accept="image/*" multiple onChange={onFiles} />
        {images.length>0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:12 }}>
            {images.map((m,idx)=> (
              <div key={idx} style={{ position:'relative', border:'1px solid var(--muted)', borderRadius:8, overflow:'hidden' }}>
                <img src={m.dataUrl} alt="" style={{ width:'100%', height:96, objectFit:'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <div style={{ fontWeight:800, marginBottom:8 }}>المتغيرات (ألوان/مقاسات)</div>
        <FormGrid>
          <label>
            <div style={{ marginBottom:6 }}>ألوان (افصل بفواصل ,)</div>
            <input className="input" value={colors} onChange={e=> setColors(e.target.value)} placeholder="أسود, أبيض, أحمر" />
          </label>
          <label>
            <div style={{ marginBottom:6 }}>مقاسات (افصل بفواصل ,)</div>
            <input className="input" value={sizes} onChange={e=> setSizes(e.target.value)} placeholder="S, M, L" />
          </label>
        </FormGrid>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
          <button className="btn btn-outline" onClick={generateVariants}>توليد المتغيرات</button>
        </div>
        {variants.length>0 && (
          <div style={{ display:'grid', gap:8, marginTop:12 }}>
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

      <ActionBarMobile>
        <button className="btn btn-outline" onClick={()=> history.length>1 ? history.back() : location.assign('/mobile')}>إلغاء</button>
        <button className="btn" disabled={saving} onClick={save}>حفظ</button>
      </ActionBarMobile>
    </div>
  );
}

