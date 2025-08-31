"use client";
import { trpc } from "../providers";
import React from "react";

export default function AdminProducts(): JSX.Element {
  const q: any = trpc as any;
  const { data, isLoading, error } = q.admin.getProducts.useQuery({ page: 1, limit: 20 }, {
    retry: 0,
  });
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
  const [sizes, setSizes] = React.useState(''); // comma-separated
  const [colors, setColors] = React.useState(''); // comma-separated
  const [purchasePrice, setPurchasePrice] = React.useState<number | ''>('');
  const [salePrice, setSalePrice] = React.useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = React.useState<number | ''>('');
  const [images, setImages] = React.useState<string>(''); // comma-separated URLs
  const [files, setFiles] = React.useState<File[]>([]);
  const [dragOver, setDragOver] = React.useState<boolean>(false);

  React.useEffect(() => {
    const message = (error as any)?.message || '';
    if (message && (/No token provided/i.test(message) || /UNAUTHORIZED/i.test(message) || /Not authenticated/i.test(message))) {
      window.location.href = '/login';
    }
  }, [error]);

  if (isLoading) return <main style={{ padding: 24 }}>Loading products...</main>;
  if (error) return (
    <main style={{ padding: 24 }}>
      <div style={{color:'tomato', marginBottom: 12}}>Error: {(error as any).message}</div>
      <a href="/login" style={{color:'#60a5fa', textDecoration:'underline'}}>تسجيل الدخول للوحة التحكم</a>
    </main>
  );

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
      // Store supplier and purchasePrice inside tags for now until dedicated fields added
      tags: [supplier ? `supplier:${supplier}` : '', purchasePrice!=='' ? `purchase:${purchasePrice}` : ''].filter(Boolean),
      isActive: true,
    };
    const res = await createProduct.mutateAsync(productPayload);
    const productId = res?.product?.id;
    if (type === 'variable' && productId && createVariants?.mutateAsync) {
      // create variants from sizes x colors
      const sizeList = (sizes || '').split(',').map(s => s.trim()).filter(Boolean);
      const colorList = (colors || '').split(',').map(c => c.trim()).filter(Boolean);
      const variants: any[] = [];
      if (sizeList.length && colorList.length) {
        for (const s of sizeList) {
          for (const c of colorList) {
            variants.push({ name: s, value: c, price: Number(salePrice || 0), stockQuantity: Number(stockQuantity || 0) });
          }
        }
      } else {
        for (const s of sizeList) variants.push({ name: s, value: s, price: Number(salePrice || 0), stockQuantity: Number(stockQuantity || 0) });
        for (const c of colorList) variants.push({ name: c, value: c, price: Number(salePrice || 0), stockQuantity: Number(stockQuantity || 0) });
      }
      if (variants.length) {
        await createVariants.mutateAsync({ productId, variants });
      }
    }
    alert('تم إنشاء المنتج بنجاح');
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>إدارة المنتجات</h1>

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
                // Placeholder: integrate upload API to get URLs. For now, append names to images field.
                const current = (images || '').split(',').map(s=>s.trim()).filter(Boolean);
                const next = Array.from(new Set([...current, ...fileNames]));
                setImages(next.join(', '));
              }} style={{ padding:'8px 12px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>إضافة الملفات إلى قائمة الصور</button>
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
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>الاسم</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>السعر</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>التصنيف</th>
          </tr>
        </thead>
        <tbody>
          {(data?.products ?? []).map((p: any) => (
            <tr key={p.id}>
              <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{p.name}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>${p.price}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{p.category?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}