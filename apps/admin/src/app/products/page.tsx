"use client";
import { trpc } from "../providers";
import React from "react";

export default function AdminProducts(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [total, setTotal] = React.useState(0);
  const q = trpc;
  const apiBase = React.useMemo(()=>{
    return (process.env.NEXT_PUBLIC_API_BASE_URL as string) || (typeof window !== 'undefined' ? (window.location.origin.replace('jeeey-manger','jeeeyai')) : 'http://localhost:4000');
  }, []);
  const authHeaders = React.useCallback(() => {
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
  }, []);
  async function load(){
    const url = new URL(`${apiBase}/api/admin/products`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));
    if (search) url.searchParams.set('search', search);
    if (status) url.searchParams.set('status', status);
    if (categoryId) url.searchParams.set('categoryId', categoryId);
    const j = await (await fetch(url.toString(), { credentials:'include', cache:'no-store', headers: { ...authHeaders() } })).json();
    setRows(j.products||[]); setTotal(j.pagination?.total||0);
  }
  React.useEffect(()=>{ load(); }, [page, status, categoryId]);
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
  const [formCategoryId, setFormCategoryId] = React.useState('');
  const cats = q.admin.getCategories.useQuery();
  const [sizes, setSizes] = React.useState(''); // comma-separated
  const [colors, setColors] = React.useState(''); // comma-separated
  const [purchasePrice, setPurchasePrice] = React.useState<number | ''>('');
  const [salePrice, setSalePrice] = React.useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = React.useState<number | ''>('');
  const [images, setImages] = React.useState<string>(''); // comma-separated URLs
  const [files, setFiles] = React.useState<File[]>([]);
  const [dragOver, setDragOver] = React.useState<boolean>(false);
  const [variantMatrix, setVariantMatrix] = React.useState<'sizes_x_colors'|'colors_x_sizes'>('sizes_x_colors');
  const [variantRows, setVariantRows] = React.useState<Array<{ name: string; value: string; price?: number; purchasePrice?: number; stockQuantity: number; sku?: string }>>([]);
  const [colorOptions, setColorOptions] = React.useState<Array<{id:string;name:string;hex:string}>>([]);
  const [brandOptions, setBrandOptions] = React.useState<Array<{id:string;name:string}>>([]);
  const [sizeTypeOptions, setSizeTypeOptions] = React.useState<Array<{id:string;name:string}>>([]);
  const [sizeOptions, setSizeOptions] = React.useState<Array<{id:string;name:string}>>([]);
  const [selectedColors, setSelectedColors] = React.useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = React.useState<string[]>([]);
  const [sizeTypeId, setSizeTypeId] = React.useState<string>('');

  React.useEffect(()=>{
    // Load attributes lists
    (async ()=>{
      try {
        const [colorsRes, brandsRes, typesRes] = await Promise.all([
          fetch(`${apiBase}/api/admin/attributes/colors`, { credentials:'include', headers: { ...authHeaders() } }),
          fetch(`${apiBase}/api/admin/attributes/brands`, { credentials:'include', headers: { ...authHeaders() } }),
          fetch(`${apiBase}/api/admin/attributes/size-types`, { credentials:'include', headers: { ...authHeaders() } }),
        ]);
        const [cj, bj, tj] = await Promise.all([colorsRes.json(), brandsRes.json(), typesRes.json()]);
        setColorOptions(cj.colors || []);
        setBrandOptions(bj.brands || []);
        setSizeTypeOptions(tj.types || []);
      } catch {}
    })();
  }, [apiBase]);

  React.useEffect(()=>{
    // When size type changes, load sizes of type
    (async ()=>{
      if (!sizeTypeId) { setSizeOptions([]); return; }
      try {
        const res = await fetch(`${apiBase}/api/admin/attributes/size-types/${sizeTypeId}/sizes`, { credentials:'include', headers: { ...authHeaders() } });
        const j = await res.json();
        setSizeOptions(j.sizes || []);
      } catch {}
    })();
  }, [sizeTypeId, apiBase]);

  React.useEffect(()=>{ setColors(selectedColors.join(', ')); }, [selectedColors]);
  React.useEffect(()=>{ setSizes(selectedSizes.join(', ')); }, [selectedSizes]);

  React.useEffect(() => {
    const message = (createProduct as any)?.error?.message || '';
    if (message && (/No token provided/i.test(message) || /UNAUTHORIZED/i.test(message) || /Not authenticated/i.test(message))) {
      window.location.href = '/login';
    }
  }, [createProduct.error]);

  const totalPages = Math.max(1, Math.ceil(total/limit));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const baseImages: string[] = (images || '').split(',').map(s => s.trim()).filter(Boolean);
    const productPayload: any = {
      name,
      description,
      price: Number(salePrice || 0),
      images: baseImages,
      categoryId: formCategoryId,
      stockQuantity: Number(stockQuantity || 0),
      sku: sku || undefined,
      brand: brand || undefined,
      // Store supplier and purchasePrice inside tags for now until dedicated fields added
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
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16 }}>
        <h1>إدارة المنتجات</h1>
        <a href="/products/new" style={{ padding:'8px 12px', background:'#800020', color:'#fff', borderRadius:8, textDecoration:'none' }}>Add Product</a>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالاسم/sku" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={()=>{ setPage(1); load(); }} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>بحث</button>
        <select value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1); }} style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
          <option value="">الكل</option>
          <option value="active">نشط</option>
          <option value="archived">مؤرشف</option>
        </select>
      </div>

      <section style={{ marginBottom: 32, border: '1px solid #1c2333', padding: 16, borderRadius: 12, background:'#0f1420' }}>
        <h2 style={{ marginBottom: 16 }}>إنشاء منتج</h2>
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
              <select value={brand} onChange={(e) => setBrand(e.target.value)} style={{ width: '100%', padding: 10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
                <option value="">اختر علامة</option>
                {brandOptions.map((b)=> (<option key={b.id} value={b.name}>{b.name}</option>))}
              </select>
            </label>
            <label>التصنيف
              <select value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
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
                <div style={{ gridColumn:'1 / -1', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div style={{ border:'1px solid #1c2333', borderRadius:10, padding:10 }}>
                    <div style={{ marginBottom:8, color:'#9ca3af' }}>نوع المقاس</div>
                    <select value={sizeTypeId} onChange={(e)=>{ setSizeTypeId(e.target.value); setSelectedSizes([]); }} style={{ width:'100%', padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
                      <option value="">اختر نوعًا</option>
                      {sizeTypeOptions.map((t)=> (<option key={t.id} value={t.id}>{t.name}</option>))}
                    </select>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
                      {sizeOptions.map((s)=> (
                        <button type="button" key={s.id} onClick={()=> setSelectedSizes(prev=> prev.includes(s.name) ? prev.filter(x=>x!==s.name) : [...prev, s.name])} style={{ padding:'6px 10px', borderRadius:999, background: selectedSizes.includes(s.name) ? '#800020' : '#111827', color:'#e5e7eb', border:'1px solid #1c2333' }}>{s.name}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ border:'1px solid #1c2333', borderRadius:10, padding:10 }}>
                    <div style={{ marginBottom:8, color:'#9ca3af' }}>الألوان</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {colorOptions.map((c)=> (
                        <button type="button" key={c.id} title={c.name} onClick={()=> setSelectedColors(prev=> prev.includes(c.name) ? prev.filter(x=>x!==c.name) : [...prev, c.name])} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:999, background: selectedColors.includes(c.name) ? '#111827' : 'transparent', border:'1px solid #1c2333', color:'#e2e8f0' }}>
                          <span style={{ width:14, height:14, borderRadius:999, background:c.hex, border:'1px solid #111827' }} />
                          <span style={{ fontSize:12 }}>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
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
                // Placeholder: integrate upload API to get URLs. For now, append names to images field.
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
      </section>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "right", borderBottom: "1px solid #1c2333", padding:8 }}></th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #1c2333", padding:8 }}>ID</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #1c2333", padding:8 }}>صورة</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #1c2333", padding:8 }}>الاسم</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #1c2333", padding:8 }}>SKU/التباينات</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #1c2333", padding:8 }}>سعر البيع</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #1c2333", padding:8 }}>إجمالي المخزون</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #1c2333", padding:8 }}>الحالة</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #1c2333", padding:8 }}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p: any) => {
            const totalStock = (p.variants||[]).reduce((acc:number,v:any)=> acc + (v.stockQuantity||0), 0) + (p.stockQuantity||0);
            return (
              <tr key={p.id}>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}><input type="checkbox" checked={!!selected[p.id]} onChange={()=> setSelected(s=> ({...s, [p.id]: !s[p.id]}))} /></td>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{p.id.slice(0,6)}</td>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{p.images?.[0] ? <img src={p.images[0]} alt={p.name} style={{ width:40, height:40, objectFit:'cover', borderRadius:6 }} /> : '-'}</td>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{p.name}</td>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{p.sku || (p.variants?.length ? `${p.variants.length} variants` : '-')}</td>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{p.price}</td>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{totalStock}</td>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{p.isActive ? 'active' : 'archived'}</td>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                  <a href={`/products/${p.id}`} style={{ padding:'6px 10px', background:'#374151', color:'#e5e7eb', borderRadius:6, textDecoration:'none', marginInlineEnd:6 }}>View</a>
                  <a href={`/products/new?id=${p.id}`} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:6, textDecoration:'none', marginInlineEnd:6 }}>Edit</a>
                  <button onClick={async ()=>{ await fetch(`${apiBase}/api/admin/products/${p.id}`, { method:'DELETE', credentials:'include' }); await load(); }} style={{ padding:'6px 10px', background:'#7c2d12', color:'#fff', borderRadius:6 }}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
        <div>
          <button onClick={async ()=>{ const ids = Object.keys(selected).filter(k=>selected[k]); if (!ids.length) return; await fetch(`${apiBase}/api/admin/products/bulk`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ ids, action: 'archive' }) }); setSelected({}); await load(); }} style={{ padding:'8px 12px', background:'#374151', color:'#e5e7eb', borderRadius:8, marginInlineEnd:6 }}>Archive selected</button>
          <button onClick={async ()=>{ const ids = Object.keys(selected).filter(k=>selected[k]); if (!ids.length) return; await fetch(`${apiBase}/api/admin/products/bulk`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ ids, action: 'delete' }) }); setSelected({}); await load(); }} style={{ padding:'8px 12px', background:'#7c2d12', color:'#fff', borderRadius:8 }}>Delete selected</button>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1,p-1))} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:6 }}>السابق</button>
          <span style={{ color:'#9ca3af' }}>{page} / {totalPages}</span>
          <button disabled={page>=totalPages} onClick={()=> setPage(p=> Math.min(totalPages,p+1))} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:6 }}>التالي</button>
        </div>
      </div>
    </main>
  );
}