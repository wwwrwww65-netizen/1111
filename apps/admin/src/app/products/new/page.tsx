"use client";
import { useRouter } from "next/navigation";
import React from "react";

function useApiBase(){
  return React.useMemo(()=> (process.env.NEXT_PUBLIC_API_BASE_URL as string) || (typeof window!=="undefined" ? window.location.origin.replace('jeeey-manger','jeeeyai') : 'http://localhost:4000'), []);
}
function useAuthHeaders(){
  return React.useCallback(() => {
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
  }, []);
}

export default function AdminProductCreate(): JSX.Element {
  const router = useRouter();
  const apiBase = useApiBase();
  const authHeaders = useAuthHeaders();
  const [paste, setPaste] = React.useState('');
  const [review, setReview] = React.useState<any|null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [toast, setToast] = React.useState<{ type:'ok'|'err'; text:string }|null>(null);
  const showToast = (text:string, type:'ok'|'err'='ok')=>{ setToast({ type, text }); setTimeout(()=> setToast(null), 2200); };
  const [activeMobileTab, setActiveMobileTab] = React.useState<'compose'|'review'>('compose');

  const stopwords = React.useMemo(()=> new Set<string>([
    'مجاني','عرض','تخفيض','مميز','حصري','اصلي','اصلية','ضمان','شحن','سريع','رائع','جديد','new','sale','offer','best','free','original','premium','amazing','awesome','great'
  ]), []);

  function cleanText(raw: string): string {
    const noHtml = (raw||'').replace(/<[^>]*>/g, ' ');
    const noEmoji = noHtml.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/gu, '');
    const noMarketing = noEmoji.replace(/(?:عرض|تخفيض|خصم|افضل|الأفضل|best|amazing|great|awesome|premium|original|حصري|شحن\s*مجاني)/gi, ' ');
    return noMarketing.replace(/\s+/g,' ').trim();
  }

  const KNOWN_COLORS: Array<{name:string;hex:string}> = React.useMemo(()=>[
    {name:'Black',hex:'#000000'},{name:'White',hex:'#FFFFFF'},{name:'Red',hex:'#FF0000'},{name:'Blue',hex:'#0000FF'},{name:'Green',hex:'#008000'},{name:'Yellow',hex:'#FFFF00'},{name:'Brown',hex:'#8B4513'},{name:'Beige',hex:'#F5F5DC'},{name:'Gray',hex:'#808080'},{name:'Pink',hex:'#FFC0CB'},{name:'Purple',hex:'#800080'},
    {name:'أسود',hex:'#000000'},{name:'أبيض',hex:'#FFFFFF'},{name:'أحمر',hex:'#FF0000'},{name:'أزرق',hex:'#0000FF'},{name:'أخضر',hex:'#008000'},{name:'أصفر',hex:'#FFFF00'},{name:'بني',hex:'#8B4513'},{name:'بيج',hex:'#F5F5DC'},{name:'رمادي',hex:'#808080'},{name:'وردي',hex:'#FFC0CB'},{name:'بنفسجي',hex:'#800080'}
  ],[]);

  function hexToRgb(hex: string): {r:number;g:number;b:number} {
    const h = hex.replace('#','');
    const r = parseInt(h.substring(0,2),16);
    const g = parseInt(h.substring(2,4),16);
    const b = parseInt(h.substring(4,6),16);
    return { r,g,b };
  }
  function rgbDistance(a:{r:number;g:number;b:number}, b:{r:number;g:number;b:number}): number {
    const dr = a.r-b.r, dg = a.g-b.g, db = a.b-b.b; return Math.sqrt(dr*dr+dg*dg+db*db);
  }

  async function getImageDominant(file: File): Promise<{url:string;hex:string}> {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject)=>{ const i = new Image(); i.onload=()=>resolve(i); i.onerror=reject; i.src=url; });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { url, hex: '#cccccc' };
    const w = 64, h = 64; canvas.width = w; canvas.height = h; ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0,0,w,h).data;
    let r=0,g=0,b=0,count=0; for (let i=0;i<data.length;i+=4) { r+=data[i]; g+=data[i+1]; b+=data[i+2]; count++; }
    r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count);
    const hex = '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
    return { url, hex };
  }

  function nearestColorName(hex: string): {name:string;hex:string} {
    const target = hexToRgb(hex);
    let best = KNOWN_COLORS[0]; let bestD = Number.POSITIVE_INFINITY;
    for (const c of KNOWN_COLORS) { const d = rgbDistance(target, hexToRgb(c.hex)); if (d<bestD) { bestD=d; best=c; } }
    return best;
  }

  function extractKeywords(t: string): string[] {
    const words = t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(Boolean);
    const freq = new Map<string,number>();
    for (const w of words) {
      if (w.length<3) continue; if (stopwords.has(w)) continue;
      freq.set(w, (freq.get(w)||0)+1);
    }
    const sorted = Array.from(freq.entries()).sort((a,b)=> b[1]-a[1]).map(([w])=>w);
    return sorted.slice(0,10);
  }

  function extractFromText(raw: string): any {
    const clean = cleanText(raw);
    const nameMatch = clean.match(/(?:اسم\s*المنتج|product\s*name|name|اسم)[:\s]+(.{5,80})/i);
    const currency = '(?:ر?ي?ال|sar|aed|usd|rs|qr|egp|kwd)?';
    const priceMatch = clean.match(new RegExp(`(?:سعر\s*البيع|price|سعر)[^\n]*?([0-9]+(?:[\.,][0-9]{1,2})?)\s*${currency}`,'i'));
    const costMatch = clean.match(new RegExp(`(?:سعر\s*الشراء|التكلفة|cost)[^\n]*?([0-9]+(?:[\.,][0-9]{1,2})?)\s*${currency}`,'i'));
    const stockMatch = clean.match(/(?:المخزون|الكمية|stock|qty)[^\n]*?(\d{1,5})/i);
    const sizesList = Array.from(new Set((clean.match(/\b(XXL|XL|L|M|S|XS|\d{2})\b/gi) || []).map(s=>s.toUpperCase())));
    const colorNames = ['أحمر','أزرق','أخضر','أسود','أبيض','أصفر','بني','بيج','رمادي','وردي','بنفسجي','Red','Blue','Green','Black','White','Yellow','Brown','Beige','Gray','Pink','Purple'];
    const colorsList = Array.from(new Set((clean.match(new RegExp(`\\b(${colorNames.join('|')})\\b`,'gi'))||[])));
    const shortDesc = clean.slice(0, 160);
    const longDesc = clean.length<80 ? clean : clean.slice(0, 300);
    const keywords = extractKeywords(clean);
    const sale = priceMatch ? Number(String(priceMatch[1]).replace(',','.')) : undefined;
    const cost = costMatch ? Number(String(costMatch[1]).replace(',','.')) : undefined;
    const stock = stockMatch ? Number(stockMatch[1]) : undefined;
    const confidence = {
      name: nameMatch? 0.9 : (clean.length>20? 0.5 : 0.2),
      shortDesc: shortDesc? 0.8 : 0.2,
      longDesc: longDesc? 0.8 : 0.2,
      salePrice: sale!==undefined ? 0.8 : 0.2,
      purchasePrice: cost!==undefined ? 0.7 : 0.2,
      sizes: sizesList.length? 0.7 : 0.2,
      colors: colorsList.length? 0.7 : 0.2,
      stock: stock!==undefined ? 0.6 : 0.2,
      keywords: keywords.length? 0.6 : 0.2,
    };
    return {
      name: (nameMatch?.[1]||'').trim(),
      shortDesc,
      longDesc,
      salePrice: sale,
      purchasePrice: cost,
      sizes: sizesList,
      colors: colorsList,
      stock,
      keywords,
      confidence
    };
  }

  async function handleAnalyze(filesForPalette: File[]): Promise<void> {
    setError('');
    try {
      setBusy(true);
      const extracted = extractFromText(paste);
      const palettes: Array<{url:string;hex:string;name:string}> = [];
      for (const f of filesForPalette.slice(0,8)) {
        const p = await getImageDominant(f);
        const near = nearestColorName(p.hex);
        palettes.push({ url: p.url, hex: p.hex, name: near.name });
        setReview((prev:any)=> ({ ...(prev||extracted), palettes: [...palettes] }));
      }
      const mapping: Record<string, string|undefined> = {};
      for (const c of extracted.colors as string[]) {
        const candidates = palettes.map(pl=>({ url: pl.url, score: pl.name.toLowerCase().includes(c.toLowerCase()) ? 0 : 1 }));
        candidates.sort((a,b)=> a.score-b.score);
        mapping[c] = candidates.length && candidates[0].score===0 ? candidates[0].url : undefined;
      }
      setReview({ ...extracted, palettes, mapping });
      setActiveMobileTab('review');
      showToast('تم التحليل بنجاح', 'ok');
    } catch (e:any) {
      setError('فشل التحليل. حاول مجدداً.');
      showToast('فشل التحليل', 'err');
    } finally { setBusy(false); }
  }

  const [type, setType] = React.useState<'simple'|'variable'>('simple');
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [sku, setSku] = React.useState('');
  const [supplier, setSupplier] = React.useState('');
  const [brand, setBrand] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [vendorId, setVendorId] = React.useState('');
  const [categoryOptions, setCategoryOptions] = React.useState<Array<{id:string;name:string}>>([]);
  const [vendorOptions, setVendorOptions] = React.useState<Array<{id:string;name:string;vendorCode?:string}>>([]);
  const [brandOptions, setBrandOptions] = React.useState<Array<{id:string;name:string}>>([]);
  const [colorOptions, setColorOptions] = React.useState<Array<{id:string;name:string;hex:string}>>([]);
  const [sizeTypeOptions, setSizeTypeOptions] = React.useState<Array<{id:string;name:string}>>([]);
  const [sizeOptions, setSizeOptions] = React.useState<Array<{id:string;name:string}>>([]);
  const [selectedColors, setSelectedColors] = React.useState<string[]>([]);
  const [sizeTypeId, setSizeTypeId] = React.useState<string>('');
  const [sizes, setSizes] = React.useState('');
  const [colors, setColors] = React.useState('');
  const [purchasePrice, setPurchasePrice] = React.useState<number | ''>('');
  const [salePrice, setSalePrice] = React.useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = React.useState<number | ''>('');
  const [images, setImages] = React.useState<string>('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState<number[]>([]);
  const [dragOver, setDragOver] = React.useState<boolean>(false);
  const [variantMatrix, setVariantMatrix] = React.useState<'sizes_x_colors'|'colors_x_sizes'>('sizes_x_colors');
  const [variantRows, setVariantRows] = React.useState<Array<{ name: string; value: string; price?: number; purchasePrice?: number; stockQuantity: number; sku?: string }>>([]);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [autoFilled, setAutoFilled] = React.useState(false);

  React.useEffect(()=>{
    (async ()=>{
      try {
        const [cats, vends, brands, colors, types] = await Promise.all([
          fetch(`${apiBase}/api/admin/categories`, { credentials:'include', headers: { ...authHeaders() } }).then(r=>r.json()).catch(()=>({categories:[]})),
          fetch(`${apiBase}/api/admin/vendors/list`, { credentials:'include', headers: { ...authHeaders() } }).then(r=>r.json()).catch(()=>({vendors:[]})),
          fetch(`${apiBase}/api/admin/attributes/brands`, { credentials:'include', headers: { ...authHeaders() } }).then(r=>r.json()).catch(()=>({brands:[]})),
          fetch(`${apiBase}/api/admin/attributes/colors`, { credentials:'include', headers: { ...authHeaders() } }).then(r=>r.json()).catch(()=>({colors:[]})),
          fetch(`${apiBase}/api/admin/attributes/size-types`, { credentials:'include', headers: { ...authHeaders() } }).then(r=>r.json()).catch(()=>({types:[]})),
        ]);
        setCategoryOptions(cats.categories||[]);
        setVendorOptions(vends.vendors||[]);
        setBrandOptions(brands.brands||[]);
        setColorOptions(colors.colors||[]);
        setSizeTypeOptions(types.types||[]);
      } catch {}
    })();
  }, [apiBase]);
  React.useEffect(()=>{
    (async ()=>{
      if (!sizeTypeId) { setSizeOptions([]); return; }
      try{
        const r = await fetch(`${apiBase}/api/admin/attributes/size-types/${sizeTypeId}/sizes`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' });
        const j = await r.json();
        setSizeOptions(j.sizes||[]);
      } catch{}
    })();
  }, [sizeTypeId, apiBase]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const baseImages: string[] = (images || '').split(',').map(s => s.trim()).filter(Boolean);
    const productPayload: any = {
      name,
      description,
      price: Number(salePrice || 0),
      images: baseImages,
      categoryId,
      vendorId: vendorId || null,
      stockQuantity: Number(stockQuantity || 0),
      sku: sku || undefined,
      brand: brand || undefined,
      tags: [supplier ? `supplier:${supplier}` : '', purchasePrice!=='' ? `purchase:${purchasePrice}` : ''].filter(Boolean),
      isActive: true,
    };
    const res = await fetch(`${apiBase}/api/admin/products`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify(productPayload) });
    if (!res.ok) { alert('فشل إنشاء المنتج'); return; }
    const j = await res.json();
    const productId = j?.product?.id;
    if (type === 'variable' && productId) {
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
        // Future: POST variants in bulk when endpoint is ready
      }
    }
    alert('تم إنشاء المنتج بنجاح');
    router.push('/products');
  }

  return (
    <div className="container">
    <main className="panel">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
        <h1 style={{ margin:0 }}>إنشاء منتج</h1>
        <a href="/products" className="btn btn-outline">رجوع</a>
      </div>

      <section className="panel" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <h2 style={{ margin:0 }}>Paste & Generate</h2>
          <div className="toolbar" style={{ gap:8 }}>
            <button type="button" onClick={()=>handleAnalyze(files)} disabled={busy} className="btn btn-outline">{busy? 'جارِ التحليل...' : 'تحليل / معاينة'}</button>
            <button type="button" onClick={()=>{
              if (!review) return;
              const limitedName = String(review.name||'').slice(0,60);
              setName(limitedName);
              setDescription([review.shortDesc, review.longDesc].filter(Boolean).join('\n\n'));
              if (review.purchasePrice!==undefined) setPurchasePrice(review.purchasePrice); if (review.salePrice!==undefined) setSalePrice(review.salePrice);
              if (review.stock!==undefined) setStockQuantity(review.stock);
              if (Array.isArray(review.colors) && review.colors.length) setSelectedColors(review.colors);
              if (Array.isArray(review.sizes) && review.sizes.length) setSizes((review.sizes as string[]).join(', '));
              if ((review.colors?.length || 0) > 0 || (review.sizes?.length || 0) > 0) setType('variable');
              const sList: string[] = Array.isArray(review.sizes)? review.sizes : [];
              const cList: string[] = Array.isArray(review.colors)? review.colors : [];
              const rows: typeof variantRows = [];
              const baseSale = review.salePrice!==undefined ? Number(review.salePrice) : Number(salePrice||0);
              const baseCost = review.purchasePrice!==undefined ? Number(review.purchasePrice) : (purchasePrice===''? undefined : Number(purchasePrice||0));
              if (sList.length && cList.length) {
                for (const sz of sList) {
                  for (const col of cList) {
                    const phSku = `${limitedName.replace(/\s+/g,'-').toUpperCase().slice(0,12)}-${sz}-${col}`;
                    rows.push({ name: sz, value: col, price: baseSale, purchasePrice: baseCost, stockQuantity: Number(review.stock||stockQuantity||0), sku: phSku });
                  }
                }
              } else if (sList.length) {
                for (const sz of sList) {
                  const phSku = `${limitedName.replace(/\s+/g,'-').toUpperCase().slice(0,12)}-${sz}`;
                  rows.push({ name: sz, value: sz, price: baseSale, purchasePrice: baseCost, stockQuantity: Number(review.stock||stockQuantity||0), sku: phSku });
                }
              } else if (cList.length) {
                for (const col of cList) {
                  const phSku = `${limitedName.replace(/\s+/g,'-').toUpperCase().slice(0,12)}-${col}`;
                  rows.push({ name: col, value: col, price: baseSale, purchasePrice: baseCost, stockQuantity: Number(review.stock||stockQuantity||0), sku: phSku });
                }
              }
              setVariantRows(rows);
            }} disabled={busy || !review} className="btn">توليد</button>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:12 }}>
          <div style={{ display:'grid', gap:12 }}>
            <textarea value={paste} onChange={(e)=>setPaste(e.target.value)} placeholder="الصق مواصفات المنتج (AR/EN)" rows={8} className="input" />
            {error && <span style={{ color:'#ef4444' }}>{error}</span>}
            {review && (
              <div className="panel" style={{ padding:12 }}>
                <h3 style={{ marginTop:0 }}>Review</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <label>الاسم (ثقة {Math.round((review.confidence?.name||0)*100)}%)<input value={review.name||''} onChange={(e)=> setReview((r:any)=> ({...r, name:e.target.value}))} className="input" /></label>
                  <label>سعر البيع (ثقة {Math.round((review.confidence?.salePrice||0)*100)}%)<input type="number" value={review.salePrice??''} onChange={(e)=> setReview((r:any)=> ({...r, salePrice: e.target.value===''? undefined : Number(e.target.value)}))} className="input" /></label>
                  <label>سعر الشراء (ثقة {Math.round((review.confidence?.purchasePrice||0)*100)}%)<input type="number" value={review.purchasePrice??''} onChange={(e)=> setReview((r:any)=> ({...r, purchasePrice: e.target.value===''? undefined : Number(e.target.value)}))} className="input" /></label>
                  <label>المخزون (ثقة {Math.round((review.confidence?.stock||0)*100)}%)<input type="number" value={review.stock??''} onChange={(e)=> setReview((r:any)=> ({...r, stock: e.target.value===''? undefined : Number(e.target.value)}))} className="input" /></label>
                  <label style={{ gridColumn:'1 / -1' }}>وصف قصير (ثقة {Math.round((review.confidence?.shortDesc||0)*100)}%)<textarea value={review.shortDesc||''} onChange={(e)=> setReview((r:any)=> ({...r, shortDesc:e.target.value}))} rows={3} className="input" /></label>
                  <label style={{ gridColumn:'1 / -1' }}>وصف طويل (ثقة {Math.round((review.confidence?.longDesc||0)*100)}%)<textarea value={review.longDesc||''} onChange={(e)=> setReview((r:any)=> ({...r, longDesc:e.target.value}))} rows={4} className="input" /></label>
                  <div style={{ gridColumn:'1 / -1', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>
                      <div style={{ marginBottom:6, color:'#9ca3af' }}>المقاسات (ثقة {Math.round((review.confidence?.sizes||0)*100)}%)</div>
                      <input value={(review.sizes||[]).join(', ')} onChange={(e)=> setReview((r:any)=> ({...r, sizes: e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean)}))} className="input" />
                    </div>
                    <div>
                      <div style={{ marginBottom:6, color:'#9ca3af' }}>الألوان (ثقة {Math.round((review.confidence?.colors||0)*100)}%)</div>
                      <input value={(review.colors||[]).join(', ')} onChange={(e)=> setReview((r:any)=> ({...r, colors: e.target.value.split(',').map((c:string)=>c.trim()).filter(Boolean)}))} className="input" />
                    </div>
                  </div>
                  <div style={{ gridColumn:'1 / -1' }}>
                    <div style={{ marginBottom:6, color:'#9ca3af' }}>كلمات مفتاحية (SEO)</div>
                    <input value={(review.keywords||[]).join(', ')} onChange={(e)=> setReview((r:any)=> ({...r, keywords: e.target.value.split(',').map((k:string)=>k.trim()).filter(Boolean)}))} className="input" />
                  </div>
                </div>
                <div style={{ marginTop:12, borderTop:'1px solid #1c2333', paddingTop:12 }}>
                  <div style={{ marginBottom:8, color:'#9ca3af' }}>Images → Colors mapping</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
                        {(review.palettes||[]).map((p:any, idx:number)=> (
                          <div key={idx} className="panel" style={{ padding:0 }}>
                            <img src={p.url} alt={String(idx)} style={{ width:'100%', height:100, objectFit:'cover', borderTopLeftRadius:8, borderTopRightRadius:8 }} />
                            <div style={{ padding:6, display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ width:14, height:14, borderRadius:999, background:p.hex, border:'1px solid #111' }} />
                              <span style={{ fontSize:12 }}>{p.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ display:'grid', gap:8 }}>
                        {(review.colors||[]).map((c:string, i:number)=> (
                          <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, alignItems:'center' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ width:14, height:14, borderRadius:999, background:(KNOWN_COLORS.find(k=>k.name.toLowerCase()===c.toLowerCase())?.hex||'#666'), border:'1px solid #111' }} />
                              <span>{c}</span>
                            </div>
                            <select value={review.mapping?.[c]||''} onChange={(e)=> setReview((r:any)=> ({...r, mapping: { ...(r.mapping||{}), [c]: e.target.value || undefined }}))} className="select">
                              <option value="">(بدون صورة)</option>
                              {(review.palettes||[]).map((p:any, idx:number)=> (<option key={idx} value={p.url}>صورة {idx+1}</option>))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const dropped = Array.from(e.dataTransfer.files || []);
                if (dropped.length) setFiles((prev) => [...prev, ...dropped]);
              }}
              className="dropzone"
              style={{ border: `2px dashed ${dragOver ? '#60a5fa' : 'var(--muted)'}` }}
            >
              اسحب وأفلت الصور هنا أو
              <br />
              <label className="btn btn-outline" style={{ marginTop: 8, cursor:'pointer' }}>
                اختر من جهازك
                <input type="file" accept="image/*" multiple style={{ display:'none' }} onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  if (selected.length) setFiles((prev) => [...prev, ...selected]);
                }} />
              </label>
              <div style={{ fontSize:12, marginTop:8 }}>يدعم السحب والإفلات والاختيار من المعرض</div>
            </div>
            {files.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8, marginTop:10 }}>
                {files.map((f, idx) => (
                  <div key={idx} className="panel" style={{ padding:0 }}>
                    <img src={URL.createObjectURL(f)} alt={f.name} style={{ width:'100%', height:120, objectFit:'cover', borderTopLeftRadius:8, borderTopRightRadius:8 }} />
                    <div style={{ padding:8, textAlign:'right' }}>
                      <button type="button" onClick={() => setFiles((prev) => prev.filter((_, i) => i!==idx))} className="icon-btn">إزالة</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, alignItems:'start' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>نوع المنتج
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="select">
              <option value="simple">منتج بسيط</option>
              <option value="variable">منتج متعدد (مقاسات/ألوان)</option>
            </select>
          </label>
          <label>SKU
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="سيتم توليده حسب المورّد" className="input" />
              <button type="button" onClick={async ()=>{
                if (!vendorId) return;
                try { const r = await fetch(`${apiBase}/api/admin/vendors/${vendorId}/next-sku`, { credentials:'include', headers: { ...authHeaders() } }); const j = await r.json(); if (r.ok && j?.sku) setSku(j.sku); } catch {}
              }} className="btn btn-outline">توليد تلقائي</button>
            </div>
          </label>
          <label style={{ gridColumn:'1 / -1' }}>اسم المنتج
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
          </label>
          <label style={{ gridColumn:'1 / -1' }}>الوصف
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input" />
          </label>
          <label>المورّد
            <select value={vendorId} onChange={async (e) => {
              const v = e.target.value; setVendorId(v);
              if (v) {
                try{ const r = await fetch(`${apiBase}/api/admin/vendors/${v}/next-sku`, { credentials:'include', headers: { ...authHeaders() } }); const j = await r.json(); if (r.ok && j?.sku) setSku(j.sku); } catch {}
              }
            }} className="select">
              <option value="">(بدون)</option>
              {vendorOptions.map((v)=> (<option key={v.id} value={v.id}>{v.name}</option>))}
            </select>
          </label>
          <label>العلامة التجارية
            <select value={brand} onChange={(e)=> setBrand(e.target.value)} className="select">
              <option value="">(اختياري)</option>
              {brandOptions.map(b=> (<option key={b.id} value={b.name}>{b.name}</option>))}
            </select>
          </label>
          <label>التصنيف
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="select">
              <option value="">اختر تصنيفاً</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>المخزون
            <input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))} className="input" />
          </label>
          <label>سعر الشراء
            <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))} className="input" />
          </label>
          <label>سعر البيع
            <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))} required className="input" />
          </label>
          {type === 'variable' && (
            <>
              <div style={{ gridColumn:'1 / -1', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="panel" style={{ padding:10 }}>
                  <div style={{ marginBottom:8, color:'#9ca3af' }}>نوع المقاس</div>
                  <select value={sizeTypeId} onChange={(e)=>{ setSizeTypeId(e.target.value); setSizes(''); }} className="select">
                    <option value="">اختر نوعًا</option>
                    {sizeTypeOptions.map((t)=> (<option key={t.id} value={t.id}>{t.name}</option>))}
                  </select>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
                    {sizeOptions.map((s)=> (
                      <button type="button" key={s.id} onClick={()=> setSizes(prev=>{
                        const list = prev.split(',').map(x=>x.trim()).filter(Boolean);
                        return list.includes(s.name) ? list.filter(x=>x!==s.name).join(', ') : [...list, s.name].join(', ');
                      })} className="chip">{s.name}</button>
                    ))}
                  </div>
                </div>
                <div className="panel" style={{ padding:10 }}>
                  <div style={{ marginBottom:8, color:'#9ca3af' }}>الألوان</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {colorOptions.map((c)=> (
                      <button type="button" key={c.id} title={c.name} onClick={()=> setSelectedColors(prev=> prev.includes(c.name) ? prev.filter(x=>x!==c.name) : [...prev, c.name])} className="chip">
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
            <input value={images} onChange={(e) => setImages(e.target.value)} placeholder="https://...jpg, https://...png" className="input" />
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
            className="dropzone"
            style={{ border: `2px dashed ${dragOver ? '#60a5fa' : 'var(--muted)'}` }}
          >
            اسحب وأفلت الصور هنا أو
            <br />
            <label className="btn btn-outline" style={{ marginTop: 8, cursor:'pointer' }}>
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
                <div key={idx} className="panel" style={{ padding:0 }}>
                  <img src={URL.createObjectURL(f)} alt={f.name} style={{ width:'100%', height:120, objectFit:'cover', borderTopLeftRadius:8, borderTopRightRadius:8 }} />
                  <div style={{ padding:8, textAlign:'right' }}>
                    <button type="button" onClick={() => setFiles((prev) => prev.filter((_, i) => i!==idx))} className="icon-btn">إزالة</button>
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
            }} className="btn btn-outline">إضافة الملفات إلى قائمة الصور</button>
          )}

          {type === 'variable' && (
            <div className="panel" style={{ paddingTop:12 }}>
              <div className="toolbar" style={{ gap:8 }}>
                <span style={{ color:'var(--sub)' }}>إنشاء التباينات:</span>
                <select value={variantMatrix} onChange={(e)=>setVariantMatrix(e.target.value as any)} className="select">
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
                }} className="btn btn-outline">توليد التباينات</button>
              </div>
              {variantRows.length > 0 && (
                <div style={{ overflowX:'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>المجموعة</th>
                        <th>القيمة</th>
                        <th>سعر الشراء</th>
                        <th>سعر البيع</th>
                        <th>المخزون</th>
                        <th>SKU</th>
                        <th>صورة</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {variantRows.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.name}</td>
                          <td>{row.value}</td>
                          <td>
                            <input type="number" value={row.purchasePrice ?? ''} onChange={(e)=>{
                              const val = e.target.value === '' ? undefined : Number(e.target.value);
                              setVariantRows(prev => prev.map((r,i)=> i===idx ? { ...r, purchasePrice: val } : r));
                            }} className="input" />
                          </td>
                          <td>
                            <input type="number" value={row.price ?? ''} onChange={(e)=>{
                              const val = e.target.value === '' ? undefined : Number(e.target.value);
                              setVariantRows(prev => prev.map((r,i)=> i===idx ? { ...r, price: val } : r));
                            }} className="input" />
                          </td>
                          <td>
                            <input type="number" value={row.stockQuantity} onChange={(e)=>{
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              setVariantRows(prev => prev.map((r,i)=> i===idx ? { ...r, stockQuantity: val } : r));
                            }} className="input" />
                          </td>
                          <td>
                            <input value={row.sku ?? ''} onChange={(e)=>{
                              const val = e.target.value || undefined;
                              setVariantRows(prev => prev.map((r,i)=> i===idx ? { ...r, sku: val } : r));
                            }} className="input" />
                          </td>
                          <td>
                            <select value={(()=>{ const mapped = (review?.mapping||{})[row.value]; return mapped || ''; })()} onChange={(e)=>{
                              const url = e.target.value || undefined;
                              setReview((r:any)=> ({...r, mapping: { ...(r?.mapping||{}), [row.value]: url }}));
                            }} className="select">
                              <option value="">(بدون)</option>
                              {(review?.palettes||[]).map((p:any, i:number)=> (<option key={i} value={p.url}>صورة {i+1}</option>))}
                            </select>
                          </td>
                          <td>
                            <button type="button" onClick={()=> setVariantRows(prev => prev.filter((_,i)=> i!==idx))} className="icon-btn">حذف</button>
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
          <button type="submit" className="btn">حفظ المنتج</button>
        </div>
      </form>
      {toast && (<div className={`toast ${toast.type==='ok'?'ok':'err'}`}>{toast.text}</div>)}
    </main>
    </div>
  );
}

