"use client";
import { useRouter } from "next/navigation";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";

function useApiBase(){
  return React.useMemo(()=> resolveApiBase(), []);
}
function useAuthHeaders(){
  return React.useCallback(() => {
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
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
  const [deepseekOn, setDeepseekOn] = React.useState<boolean>(true);
  React.useEffect(()=>{ try{ const v = localStorage.getItem('aiDeepseekOn'); if (v!==null) setDeepseekOn(v==='1'); } catch {} },[]);
  React.useEffect(()=>{ try{ localStorage.setItem('aiDeepseekOn', deepseekOn? '1':'0'); } catch {} },[deepseekOn]);
  const [lastMeta, setLastMeta] = React.useState<any>(null);

  function SourceBadge({ src }: { src?: string }){
    const s = String(src||'rules').toLowerCase();
    const isAi = s === 'ai';
    return (
      <span style={{ marginInlineStart:8, fontSize:11, padding:'2px 6px', borderRadius:999, border:'1px solid var(--muted2)', color: isAi? '#22c55e':'#9ca3af' }}>{isAi? 'AI':'Rules'}</span>
    );
  }
  
  function Section({ title, subtitle, toolbar, children }:{ title:string; subtitle?:string; toolbar?:React.ReactNode; children:React.ReactNode }){
    return (
      <section className="panel" style={{ marginBottom:16, padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <h2 style={{ margin:0, fontSize:16 }}>{title}</h2>
            {subtitle && <div style={{ color:'var(--sub)', fontSize:12, marginTop:4 }}>{subtitle}</div>}
          </div>
          {toolbar && <div className="toolbar" style={{ gap:8 }}>{toolbar}</div>}
        </div>
        <div style={{ display:'grid', gap:12 }}>
          {children}
        </div>
      </section>
    );
  }

  const stopwords = React.useMemo(()=> new Set<string>([
    // Arabic marketing/noise
    'لايفوتك','العرض','محدود','جديد','جديدة','جديده','فقط','دلع','واناقة','واناقه','انيق','انيقه','أنيف','انيقة','اناقه','تشكيله','تشكيلة','عرض','عروض','خصم','تخفيض','مميز','حصري','اصلي','اصلية','ضمان','شحن','مجاني','سريع','متوفر','متوووفر','متاح','هديه','هدية',
    // Numeric/labels
    'السعر','للشمال','الشمال','جنوبي','الجنوب','عمله','عملة','فقط','فوق','تحت','اليوم','الآن',
    // English marketing
    'new','sale','offer','best','free','original','premium','amazing','awesome','great'
  ]), []);

  function cleanText(raw: string): string {
    let s = String(raw||'');
    // Remove HTML
    s = s.replace(/<[^>]*>/g, ' ');
    // Convert Arabic-Indic digits to Latin
    s = s.replace(/[\u0660-\u0669]/g, (d)=> String(d.charCodeAt(0) - 0x0660));
    s = s.replace(/[\u06F0-\u06F9]/g, (d)=> String(d.charCodeAt(0) - 0x06F0));
    // Remove emojis and pictographs blocks + variation selectors
    s = s.replace(/[\u{1F300}-\u{1FAFF}\u{1F900}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{FE0F}]/gu, ' ');
    // Remove common marketing noise phrases (AR/EN)
    const noise = [
      'لايفوتك','العرض محدود','جديد اليوم','حاجة فخمة','شغل خارجي','تميز','تخفيض','خصم','عرض','افضل','الأفضل','حصري','مجاني','شحن مجاني',
      'free','sale','offer','best','amazing','awesome','premium','original','new','🔥','👇','💎','🤩','👌'
    ];
    for (const w of noise) s = s.replace(new RegExp(w, 'gi'), ' ');
    // Normalize whitespace and punctuation
    s = s.replace(/[\t\r\n]+/g, ' ');
    s = s.replace(/\s{2,}/g, ' ');
    return s.trim();
  }

  function toLatinDigitsStr(input: string): string {
    return String(input||'')
      .replace(/[\u0660-\u0669]/g, (d)=> String((d.charCodeAt(0) - 0x0660)))
      .replace(/[\u06F0-\u06F9]/g, (d)=> String((d.charCodeAt(0) - 0x06F0)));
  }

  function detectCurrency(raw: string): string | undefined {
    const m = raw.match(/(﷼|ر\.س|SAR|ريال|درهم|AED|USD|\$|ج\.م|EGP|KWD|QR)/i);
    return m ? m[1] : undefined;
  }

  function makeSeoName(clean: string, fallback: string): string {
    const model = clean.match(/موديل\s*([A-Za-z0-9_-]{2,})/i)?.[1];
    const typeMatch = clean.match(/(فنيلة|فنائل|جاكيت|معطف|فستان|قميص|بنطال|بلوزة|حذاء|شنطة|بلوفر|سويتر|تي\s*شيرت|hoodie|jacket|coat|dress|shirt|pants|blouse|shoes|bag)/i);
    const type = (typeMatch?.[1]||'').replace(/فنائل/i,'فنيلة');
    const genderRaw = clean.match(/(نسائي|نسائية|رجالي|رجالية|اطفالي|بناتي|ولادي|women|men|kids)/i)?.[1] || '';
    const gender = /نسائي/i.test(genderRaw) ? 'نسائية' : (/رجالي/i.test(genderRaw) ? 'رجالي' : genderRaw);
    const material = clean.match(/(صوف|قطن|جلد|لينن|قماش|denim|leather|cotton|wool)/i)?.[1] || '';
    const feature = /كم\s*كامل/i.test(clean) ? 'كم كامل' : '';
    const parts = [type && gender ? `${type} ${gender}` : (type||gender), material || feature, model? `موديل ${model}`: ''].filter(Boolean);
    const base = parts.join(' ').trim();
    const name = base || fallback || clean.slice(0, 60);
    return name.length>90 ? name.slice(0,90) : name;
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

  function extractKeywords(t: string, productName: string): string[] {
    const stopWords = new Set(['تول','شفاف','ربطة','أكمام','فقط','عمله','بلصدر']);
    const words = String(t||'').split(/\s+/).filter(w => w.length>2 && !stopWords.has(w));
    const filtered = words.filter(w => !String(productName||'').includes(w));
    return Array.from(new Set(filtered)).slice(0,6);
  }

  function extractFromText(raw: string): any {
    const clean = cleanText(raw);
    const nameMatch = clean.match(/(?:اسم\s*المنتج|product\s*name|name|اسم)[:\s]+(.{5,120})/i);
    const currencyToken = '(?:﷼|ريال|sar|aed|usd|rs|qr|egp|kwd|درهم|دولار)';
    const priceMatch = clean.match(new RegExp(`(?:سعر\\s*البيع|price|سعر)[^\n]*?([0-9]+(?:[\.,][0-9]{1,2})?)\\s*${currencyToken}?`,'i'));
    const costOldMatch = clean.match(new RegExp(`(?:القديم|قديم)[^\n]*?([0-9]+(?:[\.,][0-9]{1,2})?)\\s*${currencyToken}?`,'i'));
    // Region-based prices (الشمال/جنوبي)
    const northMatch = clean.match(new RegExp(`(?:السعر\s*للشمال|للشمال|الشمال)[^\n]*?([0-9]+(?:[\.,][0-9]{1,2})?)\\s*${currencyToken}?`,'i'));
    const southMatch = clean.match(new RegExp(`(?:السعر\s*عملة\s*جنوبي|جنوبي|الجنوب)[^\n]*?([0-9]+(?:[\.,][0-9]{1,2})?)\\s*${currencyToken}?`,'i'));
    const stockMatch = clean.match(/(?:المخزون|الكمية|متوفر\s*ب?كمية|stock|qty)[^\n]*?(\d{1,5})/i);
    const sizesListEn = Array.from(new Set((clean.match(/\b(XXL|XL|L|M|S|XS|\d{2})\b/gi) || []).map(s=>s.toUpperCase())));
    // Free size with weight range (e.g., من وزن40 حتى وزن 60)
    const freeRange = clean.match(/من\s*وزن\s*(\d{2,3})\s*(?:حتى|الى|إلى)\s*وزن\s*(\d{2,3})/i);
    const freeSize = clean.match(/فري\s*سايز/i);
    const sizesList = freeRange ? [ `فري سايز (${freeRange[1]}–${freeRange[2]} كجم)` ] : (freeSize ? ['فري سايز'] : sizesListEn);
    const colorNames = ['أحمر','أزرق','أخضر','أسود','أبيض','أصفر','بني','بيج','رمادي','وردي','بنفسجي','كحلي','رمادي فاتح','رمادي غامق','أزرق كحلي','كحلي غامق','أزرق فاتح','Red','Blue','Green','Black','White','Yellow','Brown','Beige','Gray','Pink','Purple','Navy','Light Gray','Dark Gray'];
    const colorsList = Array.from(new Set((clean.match(new RegExp(`\\b(${colorNames.join('|')})\\b`,'gi'))||[])));
    const shortDesc = clean.slice(0, 160);
    const longDesc = clean.length<80 ? clean : clean.slice(0, 300);
    const keywords = extractKeywords(clean);
    const sale = priceMatch ? Number(String(priceMatch[1]).replace(',','.')) : undefined;
    // Choose cost preference: قديم > الشمال > الجنوب > الشراء/التكلفة > السعر العام
    const candidates: Array<{v:number; tag:number}> = [];
    // priority weight: old=1, north=2, south=3, sale=4
    if (costOldMatch) candidates.push({ v: Number(String(costOldMatch[1]).replace(',','.')), tag: 1 });
    if (northMatch) candidates.push({ v: Number(String(northMatch[1]).replace(',','.')), tag: 2 });
    if (southMatch) candidates.push({ v: Number(String(southMatch[1]).replace(',','.')), tag: 3 });
    if (sale!==undefined) candidates.push({ v: sale, tag: 4 });
    candidates.sort((a,b)=> a.tag-b.tag);
    const cost = candidates.length ? candidates[0].v : undefined;
    const stock = stockMatch ? Number(stockMatch[1]) : undefined;
    const currencyFound = detectCurrency(raw||'') || (/ريال|﷼/i.test(raw||'')? 'ريال' : undefined);
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
    // Build professional description (without prices)
    const typeMatch = clean.match(/(فنيلة|فنائل|جاكيت|معطف|فستان|قميص|بلوزة|سويتر|بلوفر|hoodie|sweater|jacket|coat|dress|shirt|blouse)/i);
    const matMatch = clean.match(/(صوف|قطن|جلد|لينن|قماش|denim|leather|cotton|wool)/i);
    const feat = [/كم\s*كامل/i.test(clean)? 'كم كامل' : '', /زرارات\s*أنيقة|زرارات\s*انيقه/i.test(clean)? 'زرارات أنيقة' : ''].filter(Boolean).join('، ');
    const gender = clean.match(/(نسائي|رجالي)/i)?.[1] || '';
    const normalizedType = typeMatch ? (/فنائل/i.test(typeMatch[1]) ? 'فنيلة' : typeMatch[1]) : '';
    const descParts = [
      normalizedType ? `${normalizedType} ${gender}`.trim() : '',
      matMatch ? `من ${matMatch[1]}` : '',
      feat,
      /خارجي/i.test(clean)? 'تصميم خارجي' : ''
    ].filter(Boolean);
    let composedDesc = (descParts.join('، ') + '، مناسبة للاستخدام اليومي وتمنح مظهراً متناسقاً.').replace(/^،\s*/,'').trim();
    composedDesc = composedDesc.replace(/\b(850|3000)\b/g,'').trim();
    return {
      name: (nameMatch?.[1]||'').trim(),
      shortDesc,
      longDesc: composedDesc || longDesc,
      salePrice: undefined,
      purchasePrice: cost,
      sizes: sizesList,
      colors: colorsList.length? colorsList : (/\b(?:لونين|2\s*الوان|لونان)\b/i.test(raw)? [ 'غير محدد (ذُكر "لونين")' ] : []),
      stock,
      keywords,
      currency: currencyFound,
      hasOldPrice: Boolean(costOldMatch),
      cleanText: clean,
      confidence
    };
  }

  function buildSchemaOutput(extracted: any, palettes: Array<{url:string;hex:string;name:string}>, mapping: Record<string,string|undefined>): any {
    const clean_text = extracted.cleanText || '';
    const product_name_seo = makeSeoName(clean_text, extracted.name||'');
    const description = (extracted.longDesc || extracted.shortDesc || clean_text).trim();
    const colors: Array<{color_name:string; source:'text'|'image'|'inferred'; confidence_pct:number}> = [];
    for (const c of (extracted.colors||[])) {
      colors.push({ color_name: c, source: 'text', confidence_pct: 70 });
    }
    // Additional inferred from palette labels if not already present
    for (const p of palettes||[]) {
      const name = p.name;
      if (!colors.some(x=> (x.color_name||'').toLowerCase()===name.toLowerCase())) {
        colors.push({ color_name: name, source: 'image', confidence_pct: 60 });
      }
    }
    const sizes: string[] = Array.isArray(extracted.sizes)? extracted.sizes : [];
    const cost_price = extracted.purchasePrice!==undefined
      ? { amount: Number(extracted.purchasePrice||0), currency: extracted.currency||'SAR', source: extracted.hasOldPrice? "text (كلمة 'قديم')" : 'text' }
      : null;
    const stock_quantity = extracted.stock!==undefined ? Number(extracted.stock) : null;
    // images
    const images = (palettes||[]).map((p, idx) => {
      const image_id = (()=>{ try{ const u = new URL(p.url); const seg = u.pathname.split('/').filter(Boolean).pop()||`img${idx+1}.jpg`; return seg; } catch { return `img${idx+1}.jpg`; }})();
      let linked: string|null = null; let conf = 50;
      for (const [col, url] of Object.entries(mapping||{})) {
        if (url === p.url) { linked = col; conf = 80; break; }
      }
      return { image_id, linked_color: linked, confidence_pct: conf };
    });
    // variants (color x size) with sku=null and stock=null per requirement
    const colorList: string[] = Array.from(new Set(colors.map(c=>c.color_name))).filter(Boolean);
    const sizeList: string[] = Array.isArray(sizes)? sizes : [];
    const variants: Array<{color:string|null; size:string|null; sku:null; stock:null}> = [];
    if (colorList.length && sizeList.length) {
      for (const c of colorList) for (const s of sizeList) variants.push({ color: c, size: s, sku: null, stock: null });
    } else if (sizeList.length) {
      for (const s of sizeList) variants.push({ color: null, size: s, sku: null, stock: null });
    } else if (colorList.length) {
      for (const c of colorList) variants.push({ color: c, size: null, sku: null, stock: null });
    } else {
      // no variants
    }
    const notes = /لونين/i.test(clean_text) ? 'يذكر النص "لونين"؛ يلزم إرفاق صور لاستخراج أسماء الألوان وربط الصور بها.' : null;
    return {
      clean_text,
      product_name_seo,
      description,
      colors: colors.length? colors : null,
      sizes: sizes.length? sizes : null,
      cost_price,
      stock_quantity,
      images: images.length? images : null,
      variants: variants.length? variants : null,
      notes
    };
  }

  async function handleAnalyze(filesForPalette: File[], forceDeepseek = false): Promise<void> {
    setError('');
    try {
      setBusy(true);
      // Server-side analyze (Node-only pipeline: text+image)
      const b64Images: string[] = [];
      for (const f of filesForPalette.slice(0,6)) { b64Images.push(await fileToBase64(f)); }
      let analyzed: any = {};
      try{
        const resp = await fetch(`${apiBase}/api/admin/products/analyze?forceDeepseek=${forceDeepseek? '1':'0'}`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ text: paste, images: b64Images.map(d=> ({ dataUrl: d })) }) });
        if (resp.ok) {
          const aj = await resp.json();
          analyzed = aj?.analyzed || {};
          setLastMeta(aj?.meta||null);
          if (aj?.meta?.deepseekUsed) { showToast('تم استخدام DeepSeek لتحسين النتائج', 'ok'); }
          else if (aj?.meta?.deepseekAttempted) { showToast(`تمت محاولة DeepSeek${aj?.meta?.reason? ' ('+aj.meta.reason+')':''}`, 'ok'); }
          if (Array.isArray(aj?.warnings) && aj.warnings.length) {
            showToast(`تحليل جزئي: ${aj.warnings.join(', ')}`, 'warn');
          }
          if (aj?.ok === false && Array.isArray(aj?.errors) && aj.errors.length) {
            showToast(`فشل التحليل: ${aj.errors.join(', ')}`, 'err');
          }
          let low = Number(analyzed?.price_range?.value?.low);
          if (!(Number.isFinite(low) && low >= 50)) {
            const m = toLatinDigitsStr(paste).match(/(?:السعر\s*للشمال|السعرللشمال|للشمال|الشمال)[^\n\r]*?(\d+[\.,٬٫]?\d*)/i);
            if (m) {
              const v = Number(String(m[1]).replace(/[٬٫,]/g,'.'));
              if (Number.isFinite(v) && v >= 50) low = v;
            }
          }
          if (Number.isFinite(low) && low >= 50) setPurchasePrice(low);
          // Auto-apply safe fields: name and purchase price only
          const autoName = analyzed?.name?.value ? String(analyzed.name.value).slice(0,60) : '';
          if (autoName) setName(autoName);
        } else { throw new Error('analyze_failed'); }
      } catch {
        // Fallback to legacy parse endpoint
        try{
          const r = await fetch(`${apiBase}/api/admin/products/parse`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ text: paste }) });
          const j = await r.json();
          if (r.ok && j?.extracted) {
            analyzed = {
              name: { value: j.extracted.name },
              description: { value: j.extracted.shortDesc || j.extracted.longDesc },
              sizes: { value: j.extracted.sizes||[] },
              colors: { value: j.extracted.colors||[] },
              price_range: { value: { low: j.extracted.purchasePrice ?? j.extracted.salePrice ?? 0, high: j.extracted.salePrice ?? j.extracted.purchasePrice ?? 0 } },
              tags: { value: j.extracted.keywords||[] }
            } as any;
            const low = Number(j.extracted.purchasePrice ?? j.extracted.salePrice);
            if (Number.isFinite(low) && low >= 50) setPurchasePrice(low);
          } else { analyzed = {}; }
        } catch { analyzed = {}; }
      }
      const extracted:any = {
        name: analyzed?.name?.value || '',
        shortDesc: analyzed?.description?.value || '',
        longDesc: analyzed?.description?.value || '',
        sizes: analyzed?.sizes?.value || [],
        colors: analyzed?.colors?.value || [],
        keywords: analyzed?.tags?.value || [],
        purchasePrice: (analyzed?.price_range?.value?.low ?? undefined),
        sources: {
          name: analyzed?.name?.source || 'rules',
          description: analyzed?.description?.source || 'rules',
          sizes: analyzed?.sizes?.source || 'rules',
          colors: analyzed?.colors?.source || 'rules',
          price_range: analyzed?.price_range?.source || 'rules',
          tags: analyzed?.tags?.source || 'rules'
        },
        reasons: {
          name: analyzed?.name?.reason,
          description: analyzed?.description?.reason,
          sizes: analyzed?.sizes?.reason,
          colors: analyzed?.colors?.reason,
          price: analyzed?.price_range?.reason,
          tags: analyzed?.tags?.reason,
        }
      };
      const confidence:any = {
        name: Number(analyzed?.name?.confidence ?? 0.8),
        shortDesc: Number(analyzed?.description?.confidence ?? 0.85),
        longDesc: Number(analyzed?.description?.confidence ?? 0.85),
        sizes: Number(analyzed?.sizes?.confidence ?? 0.7),
        colors: Number(analyzed?.colors?.confidence ?? 0.6),
        purchasePrice: Number(analyzed?.price_range?.confidence ?? 0.6),
        stock: 0,
        keywords: 0.5,
      };
      const palettes: Array<{url:string;hex:string;name:string}> = [];
      const allUrls = allProductImageUrls();
      // Recompute quick palette client-side for mapping visual review
      for (const url of allUrls.slice(0,6)) {
        const p = await getImageDominant(url);
        const near = nearestColorName(p.hex);
        palettes.push({ url: p.url, hex: p.hex, name: near.name });
        setReview((prev:any)=> ({ ...(prev||extracted), palettes: [...palettes] }));
      }
      const mapping: Record<string, string|undefined> = {};
      for (const c of extracted.colors as string[]) {
        const candidates = palettes.map(pl=>({ url: pl.url, score: pl.name.toLowerCase().includes(String(c).toLowerCase()) ? 0 : 1 }));
        candidates.sort((a,b)=> a.score-b.score);
        mapping[String(c)] = candidates.length && candidates[0].score===0 ? candidates[0].url : undefined;
      }
      const schema = buildSchemaOutput(extracted, palettes, mapping);
      const reviewObj = {
        name: String(schema.product_name_seo||extracted.name||'').trim(),
        shortDesc: String(schema.description||extracted.shortDesc||'').slice(0,160),
        longDesc: String(schema.description||extracted.longDesc||''),
                purchasePrice: (()=>{ const v = schema.cost_price?.amount!==undefined ? Number(schema.cost_price.amount) : (extracted.purchasePrice!==undefined? Number(extracted.purchasePrice): undefined); return (v!==undefined && v<50) ? undefined : v; })(),
        stock: schema.stock_quantity!==undefined && schema.stock_quantity!==null ? Number(schema.stock_quantity) : (extracted.stock!==undefined? Number(extracted.stock): undefined),
        sizes: Array.isArray(schema.sizes)? schema.sizes : (Array.isArray(extracted.sizes)? extracted.sizes: []),
        colors: Array.isArray(schema.colors)? schema.colors.map((c:any)=> c?.color_name).filter(Boolean) : (Array.isArray(extracted.colors)? extracted.colors: []),
        keywords: extracted.keywords||[],
        palettes,
        mapping,
        confidence,
        sources: extracted.sources,
        reasons: extracted.reasons || {},
        sources: extracted.sources
      } as any;
      setReview(reviewObj);
      if (reviewObj && typeof reviewObj.purchasePrice === 'number' && reviewObj.purchasePrice >= 0) {
        setPurchasePrice(reviewObj.purchasePrice);
      }
      setActiveMobileTab('review');
      showToast('تم التحليل بنجاح', 'ok');
    } catch (e:any) {
      setError('فشل التحليل. حاول مجدداً.');
      showToast('فشل التحليل', 'err');
    } finally { setBusy(false); }
  }

  async function handleDeepseekOnlyPreview(filesForPalette: File[]): Promise<void> {
    setError('');
    try {
      setBusy(true);
      const b64Images: string[] = [];
      for (const f of filesForPalette.slice(0,6)) { b64Images.push(await fileToBase64(f)); }
      const resp = await fetch(`${apiBase}/api/admin/products/analyze?forceDeepseek=1&deepseekOnly=1`, {
        method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include',
        body: JSON.stringify({ text: paste, images: b64Images.map(d=> ({ dataUrl: d })) })
      });
      const aj = await resp.json().catch(()=>({}));
      if (!resp.ok) { setError('فشل تحليل DeepSeek'); showToast('فشل تحليل DeepSeek', 'err'); return; }
      const analyzed = aj?.analyzed || {};
      const reviewObj:any = {
        name: String(analyzed?.name?.value||'').slice(0,60),
        shortDesc: String(analyzed?.description?.value||'').slice(0,160),
        longDesc: String(analyzed?.description?.value||''),
        purchasePrice: (analyzed?.price_range?.value?.low ?? undefined),
        sizes: analyzed?.sizes?.value || [],
        colors: analyzed?.colors?.value || [],
        keywords: analyzed?.tags?.value || [],
        confidence: {
          name: Number(analyzed?.name?.confidence ?? 0.85),
          shortDesc: Number(analyzed?.description?.confidence ?? 0.85),
          longDesc: Number(analyzed?.description?.confidence ?? 0.85),
          sizes: Number(analyzed?.sizes?.confidence ?? 0.7),
          colors: Number(analyzed?.colors?.confidence ?? 0.6),
          purchasePrice: Number(analyzed?.price_range?.confidence ?? 0.6)
        },
        sources: { name: 'ai', description: 'ai', sizes: 'ai', colors: 'ai', price_range: 'ai', tags:'ai' }
      };
      setReview(reviewObj);
      showToast('تم تحليل DeepSeek (معاينة)', 'ok');
      setActiveMobileTab('review');
    } catch {
      setError('فشل تحليل DeepSeek');
      showToast('فشل تحليل DeepSeek', 'err');
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
  const [selectedColors, setSelectedColors] = React.useState<string[]>([]);
  const [colorCards, setColorCards] = React.useState<Array<{ key:string; color?: string; selectedImageIdxs: number[]; primaryImageIdx?: number }>>([]);
  const [primaryColorCardKey, setPrimaryColorCardKey] = React.useState<string | undefined>(undefined);
  const [primaryColorName, setPrimaryColorName] = React.useState<string | undefined>(undefined);
  const [primaryImageUrl, setPrimaryImageUrl] = React.useState<string | undefined>(undefined);
  const [selectedSizeTypes, setSelectedSizeTypes] = React.useState<Array<{ id:string; name:string; sizes:Array<{id:string;name:string}>; selectedSizes:string[] }>>([]);
  const [colors, setColors] = React.useState('');
  const [purchasePrice, setPurchasePrice] = React.useState<number | ''>('');
  const [salePrice, setSalePrice] = React.useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = React.useState<number | ''>('');
  const [images, setImages] = React.useState<string>('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState<number[]>([]);
  const [dragOver, setDragOver] = React.useState<boolean>(false);
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
  async function loadSizesForType(typeId: string): Promise<Array<{id:string;name:string}>> {
    try{
      const r = await fetch(`${apiBase}/api/admin/attributes/size-types/${typeId}/sizes`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' });
      const j = await r.json();
      return j.sizes || [];
    } catch { return []; }
  }
  function getTypeNameById(id: string): string {
    return sizeTypeOptions.find(t=>t.id===id)?.name || id;
  }
  async function addSizeType(typeId: string) {
    if (!typeId) return;
    const exists = selectedSizeTypes.some(t=>t.id===typeId);
    if (exists) return;
    const sizes = await loadSizesForType(typeId);
    setSelectedSizeTypes(prev => [...prev, { id: typeId, name: getTypeNameById(typeId), sizes, selectedSizes: [] }]);
  }
  function toggleSizeForType(typeId: string, sizeName: string) {
    setSelectedSizeTypes(prev => prev.map(t => {
      if (t.id !== typeId) return t;
      const have = t.selectedSizes.includes(sizeName);
      return { ...t, selectedSizes: have ? t.selectedSizes.filter(s=>s!==sizeName) : [...t.selectedSizes, sizeName] };
    }));
  }
  function aggregatedSizeList(): string[] {
    return Array.from(new Set(selectedSizeTypes.flatMap(t=>t.selectedSizes)));
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // result is a data URL: data:<mime>;base64,<data>
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function allProductImageUrls(): string[] {
    const urlFiles = files.map(f => URL.createObjectURL(f));
    const urlStrings = (images || '').split(',').map(s => s.trim()).filter(Boolean);
    return [...urlStrings, ...urlFiles];
  }

  React.useEffect(()=>{
    const unique = Array.from(new Set(colorCards.map(c => (c.color||'')).filter(Boolean)));
    setSelectedColors(unique as string[]);
  }, [colorCards]);

  function generateVariantRows(): Array<{ name: string; value: string; price?: number; purchasePrice?: number; stockQuantity: number; sku?: string }> {
    const priceValue = Number(salePrice || 0);
    const purchaseValue = purchasePrice === '' ? undefined : Number(purchasePrice || 0);
    const stockValue = Number(stockQuantity || 0);
    const activeSizeTypes = selectedSizeTypes.filter(t => t.selectedSizes?.length);
    const colorList = selectedColors;
    const rows: Array<{ name: string; value: string; price?: number; purchasePrice?: number; stockQuantity: number; sku?: string }> = [];

    if (activeSizeTypes.length >= 2 && colorList.length) {
      const [t1, t2] = activeSizeTypes;
      for (const s1 of t1.selectedSizes) {
        for (const s2 of t2.selectedSizes) {
          for (const c of colorList) {
            const isPrimary = primaryColorName && c===primaryColorName;
            rows.push({ name: `${t1.name}: ${s1} - ${t2.name}: ${s2}`, value: c, price: priceValue, purchasePrice: purchaseValue, stockQuantity: stockValue, sku: undefined });
          }
        }
      }
      return rows;
    }

    if (activeSizeTypes.length >= 2) {
      const [t1, t2] = activeSizeTypes;
      for (const s1 of t1.selectedSizes) {
        for (const s2 of t2.selectedSizes) {
          rows.push({ name: `${t1.name}: ${s1}`, value: `${t2.name}: ${s2}`, price: priceValue, purchasePrice: purchaseValue, stockQuantity: stockValue });
        }
      }
      return rows;
    }

    if (activeSizeTypes.length === 1 && colorList.length) {
      const [t1] = activeSizeTypes;
      for (const s1 of t1.selectedSizes) {
        for (const c of colorList) {
          const isPrimary = primaryColorName && c===primaryColorName;
          rows.push({ name: `${t1.name}: ${s1}`, value: c, price: priceValue, purchasePrice: purchaseValue, stockQuantity: stockValue, sku: undefined });
        }
      }
      return rows;
    }

    if (activeSizeTypes.length === 1) {
      const [t1] = activeSizeTypes;
      for (const s1 of t1.selectedSizes) {
        rows.push({ name: `${t1.name}: ${s1}`, value: `${t1.name}: ${s1}`, price: priceValue, purchasePrice: purchaseValue, stockQuantity: stockValue });
      }
      return rows;
    }

    if (colorList.length) {
      for (const c of colorList) {
        rows.push({ name: c, value: c, price: priceValue, purchasePrice: purchaseValue, stockQuantity: stockValue, sku: undefined });
      }
      return rows;
    }

    return rows;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !categoryId || salePrice === '' || salePrice === undefined) {
      setError('يرجى تعبئة الاسم، التصنيف، وسعر البيع');
      showToast('أكمل الحقول المطلوبة', 'err');
      return;
    }
    setBusy(true);
    const existingImageUrls: string[] = (images || '').split(',').map(s => s.trim()).filter(Boolean);
    let uploadedOrBase64: string[] = [];
    try {
      if (files.length > 0) {
        const base64List = await Promise.all(files.map(f => fileToBase64(f)));
        const results = await Promise.all(base64List.map(async (b64, idx) => {
          try {
            const r = await fetch(`${apiBase}/api/admin/media`, {
              method: 'POST',
              headers: { 'content-type': 'application/json', ...authHeaders() },
              credentials: 'include',
              body: JSON.stringify({ base64: b64, type: files[idx]?.type, alt: name || files[idx]?.name })
            });
            const j = await r.json();
            if (r.ok && j?.asset?.url) return j.asset.url as string;
            // fallback: keep base64 data URL if media upload isn't configured
            return b64;
          } catch {
            return b64;
          }
        }));
        uploadedOrBase64 = results.filter((u): u is string => Boolean(u));
      }
    } catch {}
    const baseImages: string[] = [...existingImageUrls, ...uploadedOrBase64];
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
    let res: Response;
    try {
      res = await fetch(`${apiBase}/api/admin/products`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify(productPayload) });
    } catch (err) {
      setBusy(false);
      showToast('تعذر الاتصال بالخادم', 'err');
      return;
    }
    if (!res.ok) {
      let msg = 'فشل إنشاء المنتج';
      try {
        const j = await res.json();
        if (j?.error) msg = String(j.error);
        if ((j?.message||'').toLowerCase().includes('unique') || (j?.error||'').toLowerCase().includes('unique')) msg = 'SKU مكرر أو بيانات غير صالحة';
        if (res.status === 403) msg = 'لا تملك صلاحية إنشاء المنتجات، يرجى تسجيل الدخول';
      } catch {}
      setBusy(false);
      showToast(msg, 'err');
      return;
    }
    const j = await res.json();
    const productId = j?.product?.id;
    if (type === 'variable' && productId) {
      let variants = variantRows;
      if (!variants?.length) variants = generateVariantRows();
      if (variants.length) {
        // Future: POST variants in bulk when endpoint is ready
      }
    }
    if (uploadedOrBase64.length) {
      setImages(baseImages.join(', '));
      setFiles([]);
    }
    setBusy(false);
    showToast('تم إنشاء المنتج بنجاح', 'ok');
    router.push('/products');
  }

  return (
    <div className="container">
    <main className="panel" style={{ padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
        <h1 style={{ margin:0 }}>إنشاء منتج</h1>
        <a href="/products" className="btn btn-outline">رجوع</a>
      </div>

      <Section
        title="Paste & Generate"
        subtitle="الصق مواصفات المنتج وسيتم تحليلها واقتراح الحقول تلقائياً."
        toolbar={<>
          <label style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={deepseekOn} onChange={(e)=> setDeepseekOn(e.target.checked)} />
            <span>DeepSeek</span>
          </label>
          <button type="button" onClick={()=>handleAnalyze(files, deepseekOn)} disabled={busy} className="btn btn-outline">{busy? 'جارِ التحليل...' : 'تحليل / معاينة'}</button>
          <button type="button" onClick={()=>handleAnalyze(files, true)} disabled={busy} className="btn" title="تشغيل DeepSeek بالقوة">{busy? '...' : 'DeepSeek'}</button>
          <button type="button" onClick={()=>handleDeepseekOnlyPreview(files)} disabled={busy} className="btn btn-outline" title="تحليل عبر DeepSeek فقط (معاينة)">{busy? '...' : 'تحليل عبر DeepSeek (معاينة)'}</button>
          <button type="button" onClick={()=>{
              if (!review) return;
              const limitedName = String(review.name||'').slice(0,60);
              setName(limitedName);
              setDescription([review.shortDesc, review.longDesc].filter(Boolean).join('\n\n'));
              if (review.purchasePrice!==undefined) setPurchasePrice(review.purchasePrice); if (review.salePrice!==undefined) setSalePrice(review.salePrice);
              if (review.stock!==undefined) setStockQuantity(review.stock);
              if (Array.isArray(review.colors) && review.colors.length) setSelectedColors(review.colors);
              if ((review.colors?.length || 0) > 0 || (review.sizes?.length || 0) > 0) setType('variable');
              const sList: string[] = Array.isArray(review.sizes)? review.sizes : [];
              const cList: string[] = Array.isArray(review.colors)? review.colors : [];
              const rows: typeof variantRows = [];
              const baseSale = undefined;
              const baseCost = review.purchasePrice!==undefined ? Number(review.purchasePrice) : (purchasePrice===''? undefined : Number(purchasePrice||0));
              if (sList.length && cList.length) {
                for (const sz of sList) {
                  for (const col of cList) {
                    const phSku = `${limitedName.replace(/\s+/g,'-').toUpperCase().slice(0,12)}-${sz}-${col}`;
                    rows.push({ name: sz, value: col, price: baseSale as any, purchasePrice: baseCost, stockQuantity: Number(review.stock||stockQuantity||0), sku: undefined });
                  }
                }
              } else if (sList.length) {
                for (const sz of sList) {
                  const phSku = `${limitedName.replace(/\s+/g,'-').toUpperCase().slice(0,12)}-${sz}`;
                  rows.push({ name: sz, value: sz, price: baseSale as any, purchasePrice: baseCost, stockQuantity: Number(review.stock||stockQuantity||0), sku: undefined });
                }
              } else if (cList.length) {
                for (const col of cList) {
                  const phSku = `${limitedName.replace(/\s+/g,'-').toUpperCase().slice(0,12)}-${col}`;
                  rows.push({ name: col, value: col, price: baseSale as any, purchasePrice: baseCost, stockQuantity: Number(review.stock||stockQuantity||0), sku: undefined });
                }
              }
              setVariantRows(rows);
            }} disabled={busy || !review} className="btn">توليد</button>
        </>}
      >
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16 }}>
          <div style={{ display:'grid', gap:12 }}>
            <textarea value={paste} onChange={(e)=>setPaste(e.target.value)} placeholder="الصق مواصفات المنتج (AR/EN)" rows={6} className="input" style={{ borderRadius:12 }} />
            {error && <span style={{ color:'#ef4444' }}>{error}</span>}
            {review && (
              <div className="panel" style={{ padding:12 }}>
                <h3 style={{ marginTop:0 }}>Review</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <label>الاسم (ثقة {Math.round((review.confidence?.name||0)*100)}%) <SourceBadge src={review.sources?.name} />
                    <input value={review.name||''} onChange={(e)=> setReview((r:any)=> ({...r, name:e.target.value}))} className="input" />
                    {!review.name && review?.reasons?.name && <div style={{ fontSize:12, color:'#ef4444' }}>{review.reasons.name}</div>}
                  </label>
                  <label>سعر الشراء/التكلفة (ثقة {Math.round((review.confidence?.purchasePrice||0)*100)}%) <SourceBadge src={review.sources?.price_range} /><input type="number" value={review.purchasePrice??''} onChange={(e)=> setReview((r:any)=> ({...r, purchasePrice: e.target.value===''? undefined : Number(e.target.value)}))} className="input" /></label>
                  <label>المخزون (ثقة {Math.round((review.confidence?.stock||0)*100)}%)<input type="number" value={review.stock??''} onChange={(e)=> setReview((r:any)=> ({...r, stock: e.target.value===''? undefined : Number(e.target.value)}))} className="input" /></label>
                  <label style={{ gridColumn:'1 / -1' }}>وصف قصير (ثقة {Math.round((review.confidence?.shortDesc||0)*100)}%) <SourceBadge src={review.sources?.description} />
                    <textarea value={review.shortDesc||''} onChange={(e)=> setReview((r:any)=> ({...r, shortDesc:e.target.value}))} rows={3} className="input" />
                    {!review.shortDesc && review?.reasons?.description && <div style={{ fontSize:12, color:'#ef4444' }}>{review.reasons.description}</div>}
                  </label>
                  <label style={{ gridColumn:'1 / -1' }}>وصف طويل (ثقة {Math.round((review.confidence?.longDesc||0)*100)}%) <SourceBadge src={review.sources?.description} /><textarea value={review.longDesc||''} onChange={(e)=> setReview((r:any)=> ({...r, longDesc:e.target.value}))} rows={4} className="input" /></label>
                  <div style={{ gridColumn:'1 / -1', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>
                      <div style={{ marginBottom:6, color:'#9ca3af' }}>المقاسات (ثقة {Math.round((review.confidence?.sizes||0)*100)}%) <SourceBadge src={review.sources?.sizes} /></div>
                      <input value={(review.sizes||[]).join(', ')} onChange={(e)=> setReview((r:any)=> ({...r, sizes: e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean)}))} className="input" />
                      {(!review.sizes || review.sizes.length===0) && review?.reasons?.sizes && <div style={{ fontSize:12, color:'#ef4444' }}>{review.reasons.sizes}</div>}
                    </div>
                    <div>
                      <div style={{ marginBottom:6, color:'#9ca3af' }}>الألوان (ثقة {Math.round((review.confidence?.colors||0)*100)}%) <SourceBadge src={review.sources?.colors} /></div>
                      <input value={(review.colors||[]).join(', ')} onChange={(e)=> setReview((r:any)=> ({...r, colors: e.target.value.split(',').map((c:string)=>c.trim()).filter(Boolean)}))} className="input" />
                      {(!review.colors || review.colors.length===0) && review?.reasons?.colors && <div style={{ fontSize:12, color:'#ef4444' }}>{review.reasons.colors}</div>}
                    </div>
                  </div>
                  <div style={{ gridColumn:'1 / -1' }}>
                    <div style={{ marginBottom:6, color:'#9ca3af' }}>كلمات مفتاحية (SEO) <SourceBadge src={review.sources?.tags} /></div>
                    <input value={(review.keywords||[]).join(', ')} onChange={(e)=> setReview((r:any)=> ({...r, keywords: e.target.value.split(',').map((k:string)=>k.trim()).filter(Boolean)}))} className="input" />
                    {(!review.keywords || review.keywords.length===0) && review?.reasons?.tags && <div style={{ fontSize:12, color:'#ef4444' }}>{review.reasons.tags}</div>}
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
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12, marginTop:10 }}>
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
      </Section>

      <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20, alignItems:'start' }}>
        {/* Left main column span 8 */}
        <div style={{ gridColumn: 'span 8', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
              <div style={{ gridColumn:'1 / -1', display:'grid', gridTemplateColumns:'1fr', gap:12 }}>
                <div className="panel" style={{ padding:10 }}>
                  <div style={{ marginBottom:8, color:'#9ca3af' }}>إضافة نوع مقاس</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <select defaultValue="" onChange={(e)=> { addSizeType(e.target.value); e.currentTarget.value=''; }} className="select">
                      <option value="">اختر نوعًا</option>
                      {sizeTypeOptions.map((t)=> (<option key={t.id} value={t.id}>{t.name}</option>))}
                    </select>
                  </div>
                  <div style={{ display:'grid', gap:10, marginTop:10 }}>
                    {selectedSizeTypes.map((t)=>(
                      <div key={t.id} className="panel" style={{ padding:10 }}>
                        <div style={{ marginBottom:6, fontWeight:600 }}>{t.name}</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                          {t.sizes.map(s=> (
                            <label key={s.id} style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                              <input type="checkbox" checked={t.selectedSizes.includes(s.name)} onChange={()=> toggleSizeForType(t.id, s.name)} />
                              <span>{s.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="panel" style={{ padding:10 }}>
                  <div style={{ marginBottom:8, color:'#9ca3af', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>الألوان</span>
                    <button type="button" className="btn btn-outline" onClick={()=>{
                      const key = String(Date.now())+'-'+Math.random().toString(36).slice(2);
                      setColorCards(prev => [...prev, { key, selectedImageIdxs: [] }]);
                    }}>إضافة لون</button>
                  </div>
                  <div style={{ display:'grid', gap:10 }}>
                    {colorCards.map((card, idx) => (
                      <div key={card.key} className="panel" style={{ padding:10 }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <select value={card.color||''} onChange={(e)=>{
                              const val = e.target.value || undefined;
                              setColorCards(prev => prev.map((c,i)=> i===idx ? { ...c, color: val } : c));
                            }} className="select" style={{ minWidth:220 }}>
                              <option value="">اختر لونًا</option>
                              {colorOptions.map(opt => (<option key={opt.id} value={opt.name}>{opt.name}</option>))}
                            </select>
                            {(() => { const opt = colorOptions.find(o=>o.name===card.color); return opt ? (<span style={{ width:14, height:14, borderRadius:999, background:opt.hex, border:'1px solid #111827' }} />) : null; })()}
                          </div>
                          <label style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                            <input type="radio" name="primary-color" checked={primaryColorCardKey===card.key} onChange={()=>{
                              setPrimaryColorCardKey(card.key);
                              setPrimaryColorName(card.color);
                              const urls = allProductImageUrls();
                              const url = (card.primaryImageIdx!==undefined) ? urls[card.primaryImageIdx] : undefined;
                              setPrimaryImageUrl(url);
                              const colorName = card.color;
                              if (colorName && url) setReview((r:any)=> ({ ...(r||{}), mapping: { ...((r||{}).mapping||{}), [colorName]: url } }));
                            }} />
                            <span>اللون الرئيسي للمنتج</span>
                          </label>
                        </div>
                        <div style={{ marginTop:10 }}>
                          <div style={{ marginBottom:6, color:'#9ca3af' }}>اختر صور هذا اللون</div>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
                            {allProductImageUrls().map((u, imgIdx) => (
                              <div key={imgIdx} className="panel" style={{ padding:0 }}>
                                <img src={u} alt={String(imgIdx)} style={{ width:'100%', height:90, objectFit:'cover', borderTopLeftRadius:8, borderTopRightRadius:8 }} />
                                <div style={{ padding:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                  <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                                    <input type="checkbox" checked={card.selectedImageIdxs.includes(imgIdx)} onChange={()=>{
                                      setColorCards(prev => prev.map((c,i)=>{
                                        if (i!==idx) return c;
                                        const have = c.selectedImageIdxs.includes(imgIdx);
                                        const sel = have ? c.selectedImageIdxs.filter(x=>x!==imgIdx) : [...c.selectedImageIdxs, imgIdx];
                                        let primaryImageIdx = c.primaryImageIdx;
                                        if (primaryImageIdx!==undefined && !sel.includes(primaryImageIdx)) primaryImageIdx = undefined;
                                        return { ...c, selectedImageIdxs: sel, primaryImageIdx };
                                      }));
                                    }} />
                                    <span style={{ fontSize:12 }}>اختيار</span>
                                  </label>
                                  <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                                    <input type="radio" name={`primary-image-${card.key}`} checked={card.primaryImageIdx===imgIdx} onChange={()=>{
                                      setColorCards(prev => prev.map((c,i)=> i===idx ? { ...c, primaryImageIdx: imgIdx } : c));
                                      if (primaryColorCardKey===card.key) {
                                        setPrimaryImageUrl(u);
                                        const colorName = card.color;
                                        if (colorName) setReview((r:any)=> ({ ...(r||{}), mapping: { ...((r||{}).mapping||{}), [colorName]: u } }));
                                      }
                                    }} />
                                    <span style={{ fontSize:12 }}>صورة اللون الرئيسية</span>
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginTop:10, display:'flex', justifyContent:'flex-end' }}>
                          <button type="button" className="icon-btn" onClick={()=> setColorCards(prev => prev.filter((_,i)=> i!==idx))}>إزالة اللون</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="panel" style={{ paddingTop:12 }}>
                <div className="toolbar" style={{ gap:8 }}>
                  <button type="button" onClick={() => {
                    setVariantRows(generateVariantRows());
                  }} className="btn btn-outline">توليد التباينات المتعددة</button>
                </div>
                {variantRows.length > 0 ? (
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
                ) : (
                  <div style={{ marginTop:8, color:'var(--sub)' }}>اختر مقاسات وألوان ثم اضغط "توليد التباينات".</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right column: summary + media */}
        <div style={{ gridColumn: 'span 4', display:'grid', gap:12, alignSelf:'start' }}>
          <div className="panel" style={{ position:'sticky', top:16, padding:12 }}>
            <div style={{ display:'grid', gap:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div style={{ color:'var(--sub)' }}>المعاينة</div>
                <span className="badge">{type==='variable' ? 'متعدد' : 'بسيط'}</span>
              </div>
              <div style={{ fontWeight:700 }}>{name || '— بدون اسم —'}</div>
              <div style={{ color:'var(--sub)', fontSize:12 }}>{categoryOptions.find(c=>c.id===categoryId)?.name || 'بدون تصنيف'}</div>
              <div style={{ display:'flex', gap:12, marginTop:6 }}>
                <div><div style={{ color:'var(--sub)', fontSize:12 }}>سعر البيع</div><div>{salePrice || '—'}</div></div>
                <div><div style={{ color:'var(--sub)', fontSize:12 }}>المخزون</div><div>{stockQuantity || 0}</div></div>
                <div><div style={{ color:'var(--sub)', fontSize:12 }}>الصور</div><div>{(images||'').split(',').filter(Boolean).length + files.length}</div></div>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button type="submit" className="btn" disabled={!name || !categoryId || salePrice==='' || salePrice===undefined}>حفظ المنتج</button>
                <a href="/products" className="btn btn-outline">رجوع</a>
              </div>
            </div>
          </div>
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
                  <img src={URL.createObjectURL(f)} alt={f.name} style={{ width:'100%', height:220, objectFit:'cover', borderTopLeftRadius:8, borderTopRightRadius:8 }} />
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

          {/* removed duplicate side variants panel */}
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

