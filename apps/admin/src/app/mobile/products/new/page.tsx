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
  const [sku, setSku] = React.useState('');
  const [barcode, setBarcode] = React.useState('');
  const [brand, setBrand] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [seoTitle, setSeoTitle] = React.useState('');
  const [seoDescription, setSeoDescription] = React.useState('');
  const [seoKeywords, setSeoKeywords] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [width, setWidth] = React.useState('');
  const [height, setHeight] = React.useState('');
  const [depth, setDepth] = React.useState('');
  const [attributes, setAttributes] = React.useState<Array<{ key:string; value:string }>>([]);
  const [categoryId, setCategoryId] = React.useState('');
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [images, setImages] = React.useState<MediaItem[]>([]);
  const [colors, setColors] = React.useState<string>('');
  const [sizes, setSizes] = React.useState<string>('');
  const [variants, setVariants] = React.useState<Variant[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [ok, setOk] = React.useState('');
  const [pasteText, setPasteText] = React.useState('');

  React.useEffect(()=>{ (async()=>{
    try{
      const j = await (await fetch(`${resolveApiBase()}/api/admin/categories`, { headers:{ 'accept':'application/json' }, credentials:'include' })).json();
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

  async function analyzePaste(){
    if (!pasteText.trim()) return;
    try{
      const r = await fetch(`${resolveApiBase()}/api/admin/products/parse`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ text: pasteText }) });
      const j = await r.json();
      if (j?.name) setName(j.name);
      if (j?.description) setDescription(j.description);
      if (Array.isArray(j?.colors)) setColors(j.colors.join(', '));
      if (Array.isArray(j?.sizes)) setSizes(j.sizes.join(', '));
      if (Array.isArray(j?.prices) && j.prices[0]) setPrice(String(j.prices[0]));
      if (j?.brand) setBrand(j.brand);
      if (Array.isArray(j?.keywords)) setTags(j.keywords.join(', '));
    }catch{}
  }

  async function save(){
    if (!name.trim()) { setErr('ادخل الاسم'); return; }
    if (!price.trim()) { setErr('ادخل السعر'); return; }
    setErr(''); setOk(''); setSaving(true);
    try{
      const payload = {
        product: {
          name,
          description,
          status,
          categoryId: categoryId||undefined,
          price: Number(price)||0,
          sku: sku||undefined,
          barcode: barcode||undefined,
          brand: brand||undefined,
          tags: tags ? tags.split(',').map(t=> t.trim()).filter(Boolean) : undefined,
          seoTitle: seoTitle||undefined,
          seoDescription: seoDescription||undefined,
          seoKeywords: seoKeywords||undefined,
          weight: weight? Number(weight): undefined,
          width: width? Number(width): undefined,
          height: height? Number(height): undefined,
          depth: depth? Number(depth): undefined,
          attributes: attributes && attributes.length? attributes : undefined
        },
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
      setSku(''); setBarcode(''); setBrand(''); setTags(''); setSeoTitle(''); setSeoDescription(''); setSeoKeywords(''); setWeight(''); setWidth(''); setHeight(''); setDepth(''); setAttributes([]);
    }catch{ setErr('تعذر الحفظ'); }
    finally{ setSaving(false); }
  }

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:800, marginBottom:8 }}>لصق وتحليل</div>
        <textarea className="input" rows={4} value={pasteText} onChange={e=> setPasteText(e.target.value)} placeholder="الصق وصف المنتج هنا" />
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
          <button className="btn btn-outline" onClick={analyzePaste}>تحليل</button>
        </div>
      </div>

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
          <label>
            <div style={{ marginBottom:6 }}>SKU</div>
            <input className="input" value={sku} onChange={e=> setSku(e.target.value)} placeholder="SKU" />
          </label>
          <label>
            <div style={{ marginBottom:6 }}>Barcode</div>
            <input className="input" value={barcode} onChange={e=> setBarcode(e.target.value)} placeholder="EAN/UPC" />
          </label>
          <label>
            <div style={{ marginBottom:6 }}>العلامة التجارية</div>
            <input className="input" value={brand} onChange={e=> setBrand(e.target.value)} placeholder="Brand" />
          </label>
          <label>
            <div style={{ marginBottom:6 }}>وسوم</div>
            <input className="input" value={tags} onChange={e=> setTags(e.target.value)} placeholder="افصل بفواصل" />
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
        <div style={{ fontWeight:800, marginBottom:8 }}>المقاييس (الوزن/الأبعاد)</div>
        <FormGrid>
          <label>
            <div style={{ marginBottom:6 }}>الوزن (كجم)</div>
            <input className="input" value={weight} onChange={e=> setWeight(e.target.value)} inputMode="decimal" />
          </label>
          <label>
            <div style={{ marginBottom:6 }}>العرض (سم)</div>
            <input className="input" value={width} onChange={e=> setWidth(e.target.value)} inputMode="decimal" />
          </label>
          <label>
            <div style={{ marginBottom:6 }}>الارتفاع (سم)</div>
            <input className="input" value={height} onChange={e=> setHeight(e.target.value)} inputMode="decimal" />
          </label>
          <label>
            <div style={{ marginBottom:6 }}>العمق (سم)</div>
            <input className="input" value={depth} onChange={e=> setDepth(e.target.value)} inputMode="decimal" />
          </label>
        </FormGrid>
      </div>

      <div className="panel">
        <div style={{ fontWeight:800, marginBottom:8 }}>SEO</div>
        <FormGrid>
          <label>
            <div style={{ marginBottom:6 }}>العنوان (SEO)</div>
            <input className="input" value={seoTitle} onChange={e=> setSeoTitle(e.target.value)} />
          </label>
          <label>
            <div style={{ marginBottom:6 }}>الوصف (SEO)</div>
            <input className="input" value={seoDescription} onChange={e=> setSeoDescription(e.target.value)} />
          </label>
          <label style={{ gridColumn:'1 / -1' }}>
            <div style={{ marginBottom:6 }}>الكلمات المفتاحية</div>
            <input className="input" value={seoKeywords} onChange={e=> setSeoKeywords(e.target.value)} placeholder="افصل بفواصل" />
          </label>
        </FormGrid>
      </div>

      <div className="panel">
        <div style={{ fontWeight:800, marginBottom:8 }}>سمات إضافية</div>
        <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {attributes.map((a,idx)=> (
            <React.Fragment key={idx}>
              <input className="input" value={a.key} onChange={e=> setAttributes(list=> list.map((x,i)=> i===idx? { ...x, key:e.target.value }: x))} placeholder="Key" />
              <div style={{ display:'flex', gap:8 }}>
                <input className="input" value={a.value} onChange={e=> setAttributes(list=> list.map((x,i)=> i===idx? { ...x, value:e.target.value }: x))} placeholder="Value" />
                <button className="btn btn-outline" onClick={()=> setAttributes(list=> list.filter((_,i)=> i!==idx))}>حذف</button>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
          <button className="btn btn-outline" onClick={()=> setAttributes(list=> [...list, { key:'', value:'' }])}>إضافة سمة</button>
        </div>
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

