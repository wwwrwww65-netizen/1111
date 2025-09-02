"use client";
import { trpc } from "../../providers";
import React from "react";

export default function AdminProductCreate(): JSX.Element {
  const apiBase = React.useMemo(()=>{
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('onrender.com')) return 'https://jeeeyai.onrender.com';
    return 'http://localhost:4000';
  }, []);
  const [paste, setPaste] = React.useState('');
  const [genImages, setGenImages] = React.useState<File[]>([]);
  const [review, setReview] = React.useState<any|null>(null);
  const [busy, setBusy] = React.useState(false);
  async function handleParse(){
    try {
      setBusy(true);
      const body: any = { text: paste, images: [] };
      const res = await fetch(`${apiBase}/api/admin/products/parse`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(body) });
      const j = await res.json();
      setReview(j.extracted||j);
    } finally { setBusy(false); }
  }
  const q: any = trpc as any;
  const createProduct = q.admin.createProduct.useMutation();
  const createVariants = typeof q.admin.createProductVariants?.useMutation === 'function'
    ? q.admin.createProductVariants.useMutation()
    : undefined as any;

  const [type, setType] = React.useState<'simple'|'variable'>('simple');
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [sku, setSku] = React.useState('');
  const [supplier, setSupplier] = React.useState('');
  const [brand, setBrand] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const cats = q.admin.getCategories.useQuery();
  const [sizes, setSizes] = React.useState('');
  const [colors, setColors] = React.useState('');
  const [purchasePrice, setPurchasePrice] = React.useState<number | ''>('');
  const [salePrice, setSalePrice] = React.useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = React.useState<number | ''>('');
  const [images, setImages] = React.useState<string>('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [dragOver, setDragOver] = React.useState<boolean>(false);
  const [variantMatrix, setVariantMatrix] = React.useState<'sizes_x_colors'|'colors_x_sizes'>('sizes_x_colors');
  const [variantRows, setVariantRows] = React.useState<Array<{ name: string; value: string; price?: number; purchasePrice?: number; stockQuantity: number; sku?: string }>>([]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const baseImages: string[] = (images || '').split(',').map(s => s.trim()).filter(Boolean);
    const productPayload: any = {
      name,
      description,
      price: Number(salePrice || 0),
      images: baseImages,
      categoryId,
      stockQuantity: Number(stockQuantity || 0),
      sku: sku || undefined,
      brand: brand || undefined,
      tags: [supplier ? `supplier:${supplier}` : '', purchasePrice!=='' ? `purchase:${purchasePrice}` : ''].filter(Boolean),
      isActive: true,
    };
    const res = await createProduct.mutateAsync(productPayload);
    const productId = res?.product?.id;
    if (type === 'variable' && productId && createVariants?.mutateAsync) {
      let variants = variantRows;
      if (!variants?.length) {
        const sizeList = (sizes || '').split(',').map(s => s.trim()).filter(Boolean);
        const colorList = (colors || '').split(',').map(c => c.trim()).filter(Boolean);
        const rows: typeof variantRows = [];
        if (sizeList.length && colorList.length) {
          if (variantMatrix === 'sizes_x_colors') {
            for (const s of sizeList) for (const c of colorList) rows.push({ name: s, value: c, price: Number(salePrice||0), purchasePrice: purchasePrice===''? undefined : Number(purchasePrice||0), stockQuantity: Number(stockQuantity||0) });
          } else {
            for (const c of colorList) for (const s of sizeList) rows.push({ name: c, value: s, price: Number(salePrice||0), purchasePrice: purchasePrice===''? undefined : Number(purchasePrice||0), stockQuantity: Number(stockQuantity||0) });
          }
        } else {
          for (const s of sizeList) rows.push({ name: s, value: s, price: Number(salePrice||0), purchasePrice: purchasePrice===''? undefined : Number(purchasePrice||0), stockQuantity: Number(stockQuantity||0) });
          for (const c of colorList) rows.push({ name: c, value: c, price: Number(salePrice||0), purchasePrice: purchasePrice===''? undefined : Number(purchasePrice||0), stockQuantity: Number(stockQuantity||0) });
        }
        variants = rows;
      }
      if (variants.length) {
        await createVariants.mutateAsync({ productId, variants });
      }
    }
    alert('تم إنشاء المنتج بنجاح');
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>إنشاء منتج</h1>
      <section style={{ border:'1px solid #1c2333', borderRadius:12, padding:16, background:'#0f1420', marginBottom:16 }}>
        <h2 style={{ margin:0, marginBottom:8 }}>Paste & Generate</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12 }}>
          <textarea value={paste} onChange={(e)=>setPaste(e.target.value)} placeholder="الصق مواصفات المنتج (AR/EN)" rows={6} style={{ width:'100%', padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button type="button" onClick={handleParse} disabled={busy} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>{busy? 'جار التحليل...' : 'تحليل معاينة'}</button>
            <button type="button" onClick={handleParse} disabled={busy} style={{ padding:'8px 12px', background:'#800020', color:'#fff', borderRadius:8 }}>توليد</button>
          </div>
          {review && (
            <div style={{ border:'1px solid #1c2333', borderRadius:8, padding:12, background:'#0b0e14' }}>
              <h3 style={{ marginTop:0 }}>Review</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <label>الاسم<input defaultValue={review.name||''} onChange={(e)=> review.name = e.target.value } style={{ width:'100%', padding:8, borderRadius:8, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
                <label>سعر البيع<input type="number" defaultValue={review.salePrice||''} onChange={(e)=> review.salePrice = Number(e.target.value)} style={{ width:'100%', padding:8, borderRadius:8, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
                <label style={{ gridColumn:'1 / -1' }}>وصف قصير<textarea defaultValue={review.shortDesc||''} onChange={(e)=> review.shortDesc = e.target.value } rows={3} style={{ width:'100%', padding:8, borderRadius:8, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
                <label style={{ gridColumn:'1 / -1' }}>وصف طويل<textarea defaultValue={review.longDesc||''} onChange={(e)=> review.longDesc = e.target.value } rows={4} style={{ width:'100%', padding:8, borderRadius:8, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
              </div>
            </div>
          )}
        </div>
      </section>
      <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, alignItems:'start' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>نوع المنتج
            <select value={type} onChange={(e) => setType(e.target.value as any)} style={{ width: '100%', padding: 10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
              <option value="simple">منتج بسيط</option>
              <option value="variable">منتج متعدد (مقاسات/ألوان)</option>
            </select>
          </label>
          <label>SKU
            <input value={sku} onChange={(e) => setSku(e.target.value)} style={{ width: '100%', padding: 10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          </label>
          <label style={{ gridColumn:'1 / -1' }}>اسم المنتج
            <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          </label>
          <label style={{ gridColumn:'1 / -1' }}>الوصف
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} style={{ width: '100%', padding: 10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          </label>
          <label>اسم المورد
            <input value={supplier} onChange={(e) => setSupplier(e.target.value)} style={{ width: '100%', padding: 10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          </label>
          <label>العلامة التجارية
            <input value={brand} onChange={(e) => setBrand(e.target.value)} style={{ width: '100%', padding: 10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          </label>
          <label>التصنيف
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
              <option value="">اختر تصنيفاً</option>
              {(cats.data?.categories ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>المخزون
            <input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: 10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          </label>
          <label>سعر الشراء
            <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: 10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          </label>
          <label>سعر البيع
            <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))} required style={{ width: '100%', padding: 10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          </label>
          {type === 'variable' && (
            <>
              <label>المقاسات (افصل بينها بفاصلة)
                <input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="S,M,L,XL" style={{ width: '100%', padding: 10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
              </label>
              <label>الألوان (افصل بينها بفاصلة)
                <input value={colors} onChange={(e) => setColors(e.target.value)} placeholder="أحمر,أزرق,أسود" style={{ width: '100%', padding: 10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
              </label>
            </>
          )}
        </div>

        <div style={{ display:'grid', gap:12 }}>
          <label>الصور (روابط مفصولة بفواصل)
            <input value={images} onChange={(e) => setImages(e.target.value)} placeholder="https://...jpg, https://...png" style={{ width: '100%', padding: 10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const dropped = Array.from(e.dataTransfer.files || []);
              if (dropped.length) setFiles((prev) => [...prev, ...dropped]);
            }}
            style={{
              border: `2px dashed ${dragOver ? '#60a5fa' : '#1c2333'}`,
              borderRadius: 12,
              padding: 16,
              background: '#0b0e14',
              color:'#94a3b8',
              textAlign:'center'
            }}
          >
            اسحب وأفلت الصور هنا أو
            <br />
            <label style={{ display:'inline-block', marginTop: 8, padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8, cursor:'pointer' }}>
              اختر من جهازك
              <input type="file" accept="image/*" multiple style={{ display:'none' }} onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                if (selected.length) setFiles((prev) => [...prev, ...selected]);
              }} />
            </label>
            <div style={{ fontSize:12, marginTop:8 }}>يدعم السحب والإفلات والاختيار من المعرض</div>
          </div>
          {files.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
              {files.map((f, idx) => (
                <div key={idx} style={{ position:'relative', border:'1px solid #1c2333', borderRadius:8, overflow:'hidden' }}>
                  <img src={URL.createObjectURL(f)} alt={f.name} style={{ width:'100%', height:120, objectFit:'cover' }} />
                  <div style={{ position:'absolute', right:6, top:6 }}>
                    <button type="button" onClick={() => setFiles((prev) => prev.filter((_, i) => i!==idx))} style={{ background:'#111', color:'#fff', borderRadius:6, padding:'2px 6px', fontSize:12 }}>إزالة</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {files.length > 0 && (
            <button type="button" onClick={() => {
              const fileNames = files.map(f => f.name);
              const current = (images || '').split(',').map(s=>s.trim()).filter(Boolean);
              const next = Array.from(new Set([...current, ...fileNames]));
              setImages(next.join(', '));
            }} style={{ padding:'8px 12px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>إضافة الملفات إلى قائمة الصور</button>
          )}
          {type === 'variable' && (
            <div style={{ borderTop:'1px solid #1c2333', paddingTop:12 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
                <span style={{ color:'#94a3b8' }}>إنشاء التباينات:</span>
                <select value={variantMatrix} onChange={(e)=>setVariantMatrix(e.target.value as any)} style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
                  <option value="sizes_x_colors">لكل مقاس كل الألوان</option>
                  <option value="colors_x_sizes">لكل لون كل المقاسات</option>
                </select>
                <button type="button" onClick={() => {
                  const sizeList = (sizes || '').split(',').map(s => s.trim()).filter(Boolean);
                  const colorList = (colors || '').split(',').map(c => c.trim()).filter(Boolean);
                  const rows: typeof variantRows = [];
                  if (sizeList.length && colorList.length) {
                    if (variantMatrix === 'sizes_x_colors') {
                      for (const s of sizeList) for (const c of colorList) rows.push({ name: s, value: c, price: Number(salePrice||0), purchasePrice: purchasePrice===''? undefined : Number(purchasePrice||0), stockQuantity: Number(stockQuantity||0) });
                    } else {
                      for (const c of colorList) for (const s of sizeList) rows.push({ name: c, value: s, price: Number(salePrice||0), purchasePrice: purchasePrice===''? undefined : Number(purchasePrice||0), stockQuantity: Number(stockQuantity||0) });
                    }
                  }
                  setVariantRows(rows);
                }} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>توليد التباينات</button>
              </div>
              {variantRows.length > 0 && (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>المجموعة</th>
                        <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>القيمة</th>
                        <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>سعر الشراء</th>
                        <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>سعر البيع</th>
                        <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>المخزون</th>
                        <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>SKU</th>
                        <th style={{ borderBottom:'1px solid #1c2333' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {variantRows.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{row.name}</td>
                          <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{row.value}</td>
                          <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                            <input type="number" value={row.purchasePrice ?? ''} onChange={(e)=>{
                              const val = e.target.value === '' ? undefined : Number(e.target.value);
                              setVariantRows(prev => prev.map((r,i)=> i===idx ? { ...r, purchasePrice: val } : r));
                            }} style={{ width:'100%', padding:8, borderRadius:6, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                          </td>
                          <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                            <input type="number" value={row.price ?? ''} onChange={(e)=>{
                              const val = e.target.value === '' ? undefined : Number(e.target.value);
                              setVariantRows(prev => prev.map((r,i)=> i===idx ? { ...r, price: val } : r));
                            }} style={{ width:'100%', padding:8, borderRadius:6, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                          </td>
                          <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                            <input type="number" value={row.stockQuantity} onChange={(e)=>{
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              setVariantRows(prev => prev.map((r,i)=> i===idx ? { ...r, stockQuantity: val } : r));
                            }} style={{ width:'100%', padding:8, borderRadius:6, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                          </td>
                          <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                            <input value={row.sku ?? ''} onChange={(e)=>{
                              const val = e.target.value || undefined;
                              setVariantRows(prev => prev.map((r,i)=> i===idx ? { ...r, sku: val } : r));
                            }} style={{ width:'100%', padding:8, borderRadius:6, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
                          </td>
                          <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                            <button type="button" onClick={()=> setVariantRows(prev => prev.filter((_,i)=> i!==idx))} style={{ padding:'6px 10px', background:'#7c2d12', color:'#fff', borderRadius:6 }}>حذف</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="submit" style={{ padding: '10px 18px', background: '#7c2d12', color: '#fff', borderRadius: 8 }}>حفظ المنتج</button>
        </div>
      </form>
    </main>
  );
}

