"use client";
import { useRouter, useSearchParams } from "next/navigation";
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
  const search = useSearchParams();
  const apiBase = useApiBase();
  const authHeaders = useAuthHeaders();
  const [paste, setPaste] = React.useState('');
  const [review, setReview] = React.useState<any|null>(null);
  const [loadingExisting, setLoadingExisting] = React.useState<boolean>(false);
  const [dsHint, setDsHint] = React.useState<any|null>(null);
  const [dsHintKey, setDsHintKey] = React.useState<string>('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [toast, setToast] = React.useState<{ type:'ok'|'err'; text:string }|null>(null);
  const showToast = (text:string, type:'ok'|'err'='ok')=>{ setToast({ type, text }); setTimeout(()=> setToast(null), 2200); };
  // Preview tab removed: fill fields directly
  const [activeMobileTab, setActiveMobileTab] = React.useState<'compose'|'review'>('compose');
  const [deepseekOn, setDeepseekOn] = React.useState<boolean>(true);
  React.useEffect(()=>{ try{ const v = localStorage.getItem('aiDeepseekOn'); if (v!==null) setDeepseekOn(v==='1'); } catch {} },[]);
  React.useEffect(()=>{ try{ localStorage.setItem('aiDeepseekOn', deepseekOn? '1':'0'); } catch {} },[deepseekOn]);
  const [lastMeta, setLastMeta] = React.useState<any>(null);
  const [useOpenRouter, setUseOpenRouter] = React.useState<boolean>(false);
  // default to published when creating via form, allow draft toggle later if needed
  const [draft, setDraft] = React.useState<boolean>(false);
  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDescription, setSeoDescription] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  // Becomes true after any successful analysis (rules/AI preview or full analyze)
  const [analysisDone, setAnalysisDone] = React.useState<boolean>(false);
  const longDescRef = React.useRef<HTMLTextAreaElement|null>(null);
  React.useEffect(()=>{ const el=longDescRef.current; if (!el) return; el.style.height='auto'; el.style.height = el.scrollHeight + 'px'; }, [review?.longDesc]);
  React.useEffect(()=>{ try{ const v = localStorage.getItem('aiOpenRouterOn'); if (v!==null) setUseOpenRouter(v==='1'); } catch {} },[]);
  React.useEffect(()=>{ try{ localStorage.setItem('aiOpenRouterOn', useOpenRouter? '1':'0'); } catch {} },[useOpenRouter]);
  // Load existing product when id is provided in query (?id=...)
  React.useEffect(()=>{
    const id = search?.get('id');
    if (!id) return;
    (async ()=>{
      try {
        setLoadingExisting(true);
        // Use admin REST (proxied) to fetch full product for edit
        const r = await fetch(`/api/admin/products/${id}`, { credentials:'include' });
        const j = await r.json().catch(()=>({}));
        const p = j?.product || j;
        if (p && p.id) {
          // Prefill primary fields for editing
          setName(String(p.name||''));
          setDescription(String(p.description||''));
          setCategoryId(String(p.categoryId||''));
          setVendorId(String(p.vendorId||''));
          setSku(String(p.sku||''));
          if (typeof p.price === 'number') setSalePrice(p.price);
          if (typeof p.stockQuantity === 'number') setStockQuantity(p.stockQuantity);
          setBrand(String(p.brand||''));
          setImages(Array.isArray(p.images) ? p.images.join(', ') : '');
          setSeoTitle(String(p.seoTitle||''));
          setSeoDescription(String(p.seoDescription||''));
          setDraft(!Boolean(p.isActive));
          if (Array.isArray(p.variants) && p.variants.length) {
            setType('variable');
            try {
              const rows = (p.variants||[]).map((v:any)=> ({
                name: (v.color && v.size) ? 'لون/مقاس' : (v.color ? 'لون' : (v.size ? 'مقاس' : 'متغير')),
                value: [v.color, v.size].filter(Boolean).join(' / '),
                price: typeof v.price==='number' ? v.price : undefined,
                purchasePrice: typeof v.purchasePrice==='number' ? v.purchasePrice : undefined,
                stockQuantity: typeof v.stock==='number' ? v.stock : (typeof v.stockQuantity==='number' ? v.stockQuantity : 0),
                sku: v.sku || undefined,
              }));
              setVariantRows(rows);
              const colorNames = Array.from(new Set((p.variants||[]).map((x:any)=> x.color).filter(Boolean)));
              if (colorNames.length) setSelectedColors(colorNames as string[]);
            } catch {}
          }
          // Keep review in sync for any dependent UI
          setReview({
            name: p.name,
            description: p.description,
            price: p.price,
            images: Array.isArray(p.images)? p.images : [],
            categoryId: p.categoryId,
            vendorId: p.vendorId || '',
            stockQuantity: p.stockQuantity,
            sku: p.sku || '',
            brand: p.brand || '',
            tags: Array.isArray(p.tags)? p.tags : [],
            variants: Array.isArray(p.variants)? p.variants : [],
            isActive: !!p.isActive,
          });
        }
      } finally { setLoadingExisting(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function SourceBadge({ src }: { src?: string }){
    const s = String(src||'rules').toLowerCase();
    const isAi = s === 'ai';
    return (
      <span style={{ marginInlineStart:8, fontSize:11, padding:'2px 6px', borderRadius:999, border:'1px solid var(--muted2)', color: isAi? '#22c55e':'#9ca3af' }}>{isAi? 'AI':'Rules'}</span>
    );
  }

  function keyForText(s: string): string {
    try {
      const norm = String(s||'').toLowerCase().replace(/\s+/g,' ').slice(0, 256);
      return `ds_hint:${norm}`;
    } catch {
      return 'ds_hint:';
    }
  }

  function escapeHtml(text: string): string {
    return String(text||'').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch] as string));
  }
  function detailsToHtmlTable(rows: Array<{ label: string; value: string }>|undefined|null): string {
    if (!Array.isArray(rows) || rows.length===0) return '';
    const body = rows.map(r=> `<tr><td>${escapeHtml(r.label)}</td><td>${escapeHtml(r.value)}</td></tr>`).join('');
    return `<table><thead><tr><th>البند</th><th>القيمة</th></tr></thead><tbody>${body}</tbody></table>`;
  }

  function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }){
    const editorRef = React.useRef<HTMLDivElement|null>(null);
    const lastHtmlRef = React.useRef<string>('');
    React.useEffect(()=>{
      const el = editorRef.current; if (!el) return;
      if (lastHtmlRef.current !== value && el.innerHTML !== value){
        el.innerHTML = value || '';
        lastHtmlRef.current = value || '';
      }
    }, [value]);
    function focusEditor(){ try{ editorRef.current?.focus(); } catch {}
    }
    function exec(cmd: string, arg?: string){
      focusEditor();
      try { document.execCommand(cmd, false, arg); } catch {}
      try { const el = editorRef.current; if (el) onChange(el.innerHTML); } catch {}
    }
    function insertTable(rows = 2, cols = 2){
      const cells = new Array(cols).fill('<td> </td>').join('');
      const body = new Array(rows).fill(`<tr>${cells}</tr>`).join('');
      const html = `<table><tbody>${body}</tbody></table>`;
      exec('insertHTML', html);
    }
    return (
      <div className="panel" style={{ padding: 8 }}>
        <div className="toolbar" style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
          <button type="button" className="btn btn-outline" onClick={()=> exec('bold')}>B</button>
          <button type="button" className="btn btn-outline" onClick={()=> exec('italic')}>I</button>
          <button type="button" className="btn btn-outline" onClick={()=> exec('underline')}>U</button>
          <button type="button" className="btn btn-outline" onClick={()=> exec('insertUnorderedList')}>• قائمة</button>
          <button type="button" className="btn btn-outline" onClick={()=> exec('insertOrderedList')}>1. قائمة</button>
          <button type="button" className="btn btn-outline" onClick={()=> insertTable(2,2)}>إدراج جدول 2×2</button>
          <button type="button" className="btn btn-outline" onClick={()=> exec('removeFormat')}>إزالة التنسيق</button>
        </div>
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          onInput={(e)=> onChange((e.currentTarget as HTMLDivElement).innerHTML)}
          className="input"
          style={{ minHeight: 160, padding: 10, overflowY:'auto' }}
        />
      </div>
    );
  }

  React.useEffect(()=>{
    try{
      const k = keyForText(paste);
      const raw = localStorage.getItem(k);
      if (raw) { setDsHint(JSON.parse(raw)); setDsHintKey(k); }
      else { setDsHint(null); setDsHintKey(k); }
    } catch { setDsHint(null); }
  }, [paste]);
  React.useEffect(()=>{
    try{
      const rows = (review as any)?.strictDetails as Array<{label:string; value:string}> | undefined;
      if (Array.isArray(rows) && rows.length>0) {
        const html = detailsToHtmlTable(rows);
        if (html && html.length) setDescription(html);
      }
    } catch {}
  }, [review?.strictDetails]);
  
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

  function cleanTextStrict(raw: string): string {
    // Start from existing cleaner
    let s = cleanText(raw);
    // Remove broader promotional phrases aggressively
    const promo = [
      'احجز', 'احجزي', 'احجزي الآن', 'لا تفوت', 'لا تفوتي', 'لايفوتك', 'العرض', 'عرض خاص', 'عرض اليوم', 'محدود الكمية',
      'حصري', 'مضمون', 'أفضل', 'الأفضل', 'سارع', 'سارعي', 'تخفيض', 'خصم', 'هدية', 'مجاني', 'شحن مجاني',
      'تواصل', 'واتس', 'whatsapp', 'link in bio', 'promo', 'discount', 'best price', 'offer', 'sale', 'free shipping',
      'معكم بكل جديد', 'معكم بكل جدي', 'نقدم لكم', 'لمسة فريدة', 'لمسه فريده', 'الكل يعرض'
    ];
    for (const w of promo) s = s.replace(new RegExp(w, 'gi'), ' ');
    s = s.replace(/\s{2,}/g, ' ').trim();
    return s;
  }

  function generateStrictName(clean: string): string {
    // Reuse makeSeoName baseline then enforce 8–12 words, avoid marketing
    const base = makeSeoName(clean, '')
      .replace(/\b(?:حصري|مجاني|عرض|خصم|أفضل|الأفضل)\b/gi, '')
      .replace(/\s{2,}/g, ' ').trim();
    const words = base.split(/\s+/).filter(Boolean);
    // Backfill from clean text tokens (avoid filler like "أساسي")
    const tokens = Array.from(new Set(
      clean
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopwords.has(w as any) && !/^[0-9]+$/.test(w))
    ));
    const primary = new Set(words.map(w=>w.toLowerCase()));
    for (const t of tokens) {
      if (words.length >= 12) break;
      if (!primary.has(t.toLowerCase())) words.push(t);
    }
    // Keep natural full name when available elsewhere; do not hard truncate here
    if (words.length > 24) words.splice(24);
    // Ensure minimum 8 tokens if possible by backfilling from tokens
    if (words.length < 8) {
      for (const t of tokens) {
        if (words.length >= 8) break;
        if (!primary.has(t.toLowerCase())) words.push(t);
      }
    }
    return words.join(' ');
  }

  function extractOldNorthPriceStrict(clean: string): number | undefined {
    // Prefer mentions tagged قديم/الشمال؛ ignore سعودي/جنوبي/قعيطي/جديد
    const toAsciiDigits = (s:string)=> s.replace(/[\u0660-\u0669]/g, (d)=> String((d as any).charCodeAt(0)-0x0660));
    const parseLocalizedNumber = (raw:string): number|undefined => {
      const s0 = toAsciiDigits(String(raw||'')).trim();
      // Remove spaces
      const s = s0.replace(/\s+/g,'');
      // If contains only digits and separators [, .] treat last separator as decimal when there are 3+ digits after
      // For our domain we assume comma/dot used as thousands most of the time; "3,900" => 3900
      const digits = s.replace(/[,\.]/g,'');
      const n = Number(digits);
      return Number.isFinite(n)? n : undefined;
    };
    const ignoreCtx = /(سعودي|جنوبي|جديد|قعيطي)/i;
    const matches = Array.from(clean.matchAll(/(?:(?:قديم|للشمال|الشمال)[^\d]{0,12})(\d+[\.,]??\d*)/gi));
    for (const m of matches) {
      const before = clean.slice(Math.max(0, (m.index||0)-20), (m.index||0)+m[0].length+10);
      if (!ignoreCtx.test(before)) {
        const v = parseLocalizedNumber(String(m[1]));
        if (v!=null) return v;
      }
    }
    return undefined;
  }

  function buildStrictDetailsTable(clean: string, raw?: string): Array<{label:string; value:string}> {
    const rows: Array<{label:string; value:string}> = [];
    const rowMap = new Map<string,string>();
    const append = (label:string, value?:string|number|null)=>{
      const v = (value==null)? '' : String(value).trim();
      if (!v) return;
      const cur = rowMap.get(label);
      if (!cur) { rowMap.set(label, v); return; }
      if (!cur.split(/\s*،\s*/).includes(v)) rowMap.set(label, `${cur}، ${v}`);
    };
    const add = (label:string, value?:string|number|null)=> append(label, value);
    const type = clean.match(/(فنيلة|جاكيت|معطف|فستان|قميص|بنطال|بلوزة|سويتر|hoodie|sweater|jacket|coat|dress|shirt|pants|blouse)/i)?.[1];
    const gender = clean.match(/(نسائي|رجالي)/i)?.[1];
    const mat = clean.match(/(صوف|قطن|جلد|لينن|قماش|denim|leather|cotton|wool)/i)?.[1];
    const weight = clean.match(/وزن\s*(\d{2,3})(?:\s*[-–—\s]\s*(\d{2,3}))?\s*ك?جم?/i);
    const sizeFree = /فري\s*سايز/i.test(clean);
    const toAsciiDigits = (s:string)=> s.replace(/[\u0660-\u0669]/g, (d)=> String((d as any).charCodeAt(0)-0x0660));
    const normalizeXL = (tok:string): string => {
      const t = String(tok||'').toUpperCase().trim();
      // Map repeated X patterns to 2XL/3XL/4XL...
      const m = t.match(/^(X{2,})L$/); // XX...XL
      if (m) { const count = m[1].length; return `${count}XL`; }
      return t;
    };
    const sizesList = Array.from(new Set((clean.match(/\b(XXXXXL|XXXXL|XXXL|XXL|XL|L|M|S|XS|\d{2})\b/gi)||[]))).map(s=> normalizeXL(toAsciiDigits(s)));
    add('النوع', type);
    add('الفئة', gender);
    add('الخامة', mat);
    if (sizeFree) {
      add('المقاس', 'فري سايز');
    } else if (sizesList.length) {
      add('المقاسات', sizesList.join('، '));
    }
    if (weight) {
      const w = weight[2] ? `${weight[1]}–${weight[2]} كجم` : `${weight[1]} كجم`;
      add('الوزن', w);
    }
    const colorNames = ['أحمر','أزرق','أخضر','أسود','أبيض','أصفر','بني','بيج','رمادي','رمادي فاتح','رمادي غامق','وردي','بنفسجي','برتقالي','تركواز','تركوازي','سماوي','زيتي','عنابي','خمري','نبيتي','عسلي','كريمي','موف','كحلي','دم\\s*غزال'];
    const colors = Array.from(new Set((clean.match(new RegExp(`\\b(${colorNames.join('|')})\\b`,'gi'))||[])));
    if (colors.length) add('الألوان', colors.join('، '));
    const stock = clean.match(/(?:المخزون|الكمية|متوفر\s*ب?كمية|stock|qty)[^\n]*?(\d{1,5})/i)?.[1];
    add('المخزون', stock);

    // Dynamic attributes
    const fit = clean.match(/\b(واسع|فضفاض|ضيق|سكيني|عادي|منتظم)\b/i)?.[1];
    add('القَصّة', fit);
    const season = Array.from(new Set((clean.match(/\b(صيفي|شتوي|ربيعي|خريفي)\b/gi)||[]))); if (season.length) add('الموسم', season.join('، '));
    const style = Array.from(new Set((clean.match(/\b(كاجوال|رسمي|رياضي|سادة|مطبوعة|مخططة|مشجر|مزخرف|دانتيل|جبير)\b/gi)||[]))); if (style.length) add('النمط', style.join('، '));
    const neckline = clean.match(/(?:ياق(?:ة|ه)|رقب(?:ة|ه))\s*(دائرية|مستديرة|مربعة|V|في|مرتفعة|عالية|قميص)/i)?.[1]; add('الياقة', neckline);
    const sleeves = clean.match(/(?:بدون\s*أكمام|كم\s*(?:طويل|قصير|نصف|كامل))/i)?.[0]; add('الأكمام', sleeves);
    const lengthType = clean.match(/(?:طول\s*)?(قصير|متوسط|طويل)\s*(?:الطول)?/i)?.[1]; add('الطول', lengthType);
    const thickness = clean.match(/\b(خفيف(?:ة)?|متوسط(?:ة)?|سميك(?:ة)?)\b/i)?.[1]; add('السماكة', thickness);
    const elasticity = clean.match(/\b(مرن|مطاطي|غير\s*مرن|بدون\s*مرونة)\b/i)?.[1]; add('المرونة', elasticity);
    const lining = clean.match(/\b(مبطن|بدون\s*بطانة)\b/i)?.[1]; add('البطانة', lining);
    const madeIn = clean.match(/(?:صنع\s*في|made\s*in)\s*([\p{L}\s]+)/i)?.[1]; add('بلد الصنع', madeIn);
    // Care instructions snippets
    const care = Array.from(new Set((clean.match(/(غسل\s*(?:يدوي|آلي)|درجة\s*حرارة\s*\d+\s*°?C|لا\s*تُ?بيض|تجفيف\s*ظل)/gi)||[]))); if (care.length) add('العناية', care.join('، '));
    const model = clean.match(/(?:موديل|كود|رمز)\s*[:\-]?\s*([A-Za-z0-9\- _]{2,})/i)?.[1]; add('الموديل', model);
    // Measurements (cm)
    const meas = Array.from(clean.matchAll(/(الصدر|الكتف|الخصر|الورك|الطول)\s*[:\-]?\s*(\d{2,3})\s*سم/gi));
    if (meas.length) {
      const str = meas.map(m=> `${m[1]}: ${m[2]} سم`).join('، ');
      add('المقاسات (سم)', str);
    }
    const closure = Array.from(new Set((clean.match(/\b(سحاب|سوستة|زر(?:ار)?|أزرار|رباط)\b/gi)||[]))); if (closure.length) add('الإغلاق', closure.join('، '));
    const occasion = Array.from(new Set((clean.match(/\b(يومي|حفلات|عمل|رسمي|كاجوال|رياضة|زفاف|سهرة)\b/gi)||[]))); if (occasion.length) add('المناسبة', occasion.join('، '));
    const brand = clean.match(/(?:ماركة|علامة\s*تجارية)\s*[:\-]?\s*([\p{L}\s0-9]{2,})/i)?.[1]; add('العلامة التجارية', brand);
    // Package contents
    const contents = clean.match(/(?:يحتوي|المحتويات|العبوة)\s*[:\-]?\s*([^\n\.\!]+)/i)?.[1]; add('محتويات العبوة', contents);
    // Single weight if not range
    const weightSingle = clean.match(/الوزن\s*[:\-]?\s*(\d{2,3})\s*ك?جم?/i)?.[1]; if (!weight && weightSingle) add('الوزن', `${weightSingle} كجم`);
    // Generic label:value pairs from raw text
    try {
      const text = String(raw||'');
      const pairRe = /(?:^|[\n\.;،])\s*([\p{L}\p{N}\s]{2,20}?)\s*[:：]\s*([^\n\.;]+)/gmu;
      let m: RegExpExecArray | null;
      while ((m = pairRe.exec(text))) {
        const label = m[1].replace(/\s{2,}/g,' ').trim();
        const value = m[2].replace(/\s{2,}/g,' ').trim();
        if (!label || !value) continue;
        // Skip forbidden labels
        if (/\b(السعر|السعر\s*للشمال|سعر\s*البيع|الشحن|التوصيل|العرض|خصم)\b/i.test(label)) continue;
        if (/\b(السعر|الشحن|التوصيل|عرض\s*خاص|خصم)\b/i.test(value)) continue;
        append(label, value);
      }
    } catch {}

    // Bullet points / descriptive fragments => "ميزات إضافية"
    try {
      const text = String(raw||'');
      const bullets = text.split(/\s*•\s*/).map(s=> s.trim()).filter(Boolean);
      const extra: string[] = [];
      for (const b of bullets) {
        if (!b) continue;
        if (/^(السعر|الشحن|التوصيل|عرض|خصم)/i.test(b)) continue;
        if (/\b(ريال|SAR|السعر|جديد|جنوب|قعيطي)\b/i.test(b)) continue;
        if (b.length < 3) continue;
        extra.push(b.replace(/\s{2,}/g,' '));
      }
      if (extra.length) append('ميزات إضافية', Array.from(new Set(extra)).join(' — '));
    } catch {}

    // Verb phrases like "مزود بـ"، "يحتوي على"، "مع"، "إضافة" => ميزات إضافية
    try {
      const text = String(raw||'');
      const featMatches = Array.from(text.matchAll(/(?:مزود\s*ب|مزودة\s*ب|مزودة\s*بـ|مزود\s*بـ|يحتوي\s*على|وبـ|وب|اضاف(?:ة|ه)|إضافة)\s*([^\.;\n،،]+)/gi));
      const feats = featMatches.map(m=> m[1]?.trim()).filter(Boolean);
      if (feats.length) append('ميزات إضافية', Array.from(new Set(feats)).join(' — '));
    } catch {}

    // Pieces parsing: "ثلاث قطع" + تفاصيل القطع
    try {
      const text = String(raw||'');
      if (/(\b3\b|٣|ثلاث(?:ه|ة)?)\s*قطع/i.test(text)) append('عدد القطع', '3');
      const parts: string[] = [];
      const inner = text.match(/القطع(?:ه|ة)\s*الداخل(?:ي|يه)\s*([^\n]+)/i)?.[1] || text.match(/الداخل(?:ي|يه)\s*([^\n]+)/i)?.[1];
      if (inner) { parts.push(inner.trim().replace(/\s{2,}/g,' ')); }
      const outer = text.match(/القطع(?:ه|ة)\s*الخارجي(?:ه)?\s*([^\n]+)/i)?.[1] || text.match(/الخارجي(?:ه)?\s*([^\n]+)/i)?.[1];
      if (outer) { parts.push(outer.trim().replace(/\s{2,}/g,' ')); }
      const third = text.match(/القطع(?:ه|ة)\s*الثالث(?:ه|ة)\s*([^\n]+)/i)?.[1];
      if (third) { parts.push(third.trim().replace(/\s{2,}/g,' ')); }
      if (parts.length) append('محتويات العبوة', Array.from(new Set(parts)).join('، '));
    } catch {}

    // Weight range phrasing like: "تلبس من 45 الى وزن 90"
    try {
      const text = String(raw||'');
      const wr = text.match(/(?:تلبس|يلبس)\s*من\s*(\d{2,3})\s*(?:الى|إلى)\s*(?:وزن\s*)?(\d{2,3})/i);
      if (wr) append('الوزن', `${wr[1]}–${wr[2]} كجم`);
    } catch {}

    // Finalize rows from map
    for (const [label,value] of rowMap.entries()) rows.push({ label, value });
    return rows;
  }

  function sanitizeColorsStrict(clean: string, provided?: string[]): string[] {
    const colorTokens = [
      // Arabic
      'أحمر','أزرق','أخضر','أسود','أبيض','أصفر','برتقالي','بني','بيج','رمادي','رمادي فاتح','رمادي غامق','وردي','بنفسجي','تركواز','تركوازي','سماوي','زيتي','عنابي','خمري','نبيتي','عسلي','كريمي','موف','كحلي','ذهبي','فضي','نحاسي','فيروزي','تركويز','تركواز','كستنائي','بيج فاتح','بيج غامق',
      // English
      'red','blue','green','black','white','yellow','orange','brown','beige','gray','grey','pink','purple','turquoise','navy','cyan','maroon','olive','teal','indigo','gold','silver','copper'
    ];
    const re = new RegExp(`(?:^|\\s)(${colorTokens.join('|')})(?=\\s|$)`, 'gi');
    const outSet = new Set<string>();
    const pushMatch = (text: string) => {
      for (const m of text.matchAll(re)) {
        const raw = m[1] || '';
        const norm = raw.replace(/\s+/g, ' ').trim();
        if (norm) outSet.add(norm);
      }
    };
    pushMatch(clean);
    if (Array.isArray(provided)) {
      pushMatch(provided.join(' '));
    }
    return Array.from(outSet);
  }

  function sanitizeSizesStrict(clean: string, provided?: string[], raw?: string): string[] {
    // If Free Size is mentioned, return exactly ['فري سايز']
    if (/فري\s*سايز/i.test(clean) || /مقاس\s*واحد/i.test(String(raw||''))) return ['فري سايز'];
    const outSet = new Set<string>();
    // Letters first
    const letterRe = /\b(XXL|XL|L|M|S|XS)\b/gi;
    for (const m of clean.matchAll(letterRe)) outSet.add(String(m[1]).toUpperCase());
    if (Array.isArray(provided)) {
      for (const s of provided) for (const m of String(s).matchAll(letterRe)) outSet.add(String(m[1]).toUpperCase());
    }
    // Numeric sizes only when clearly sizes (preceded by مقاس/within range) and NOT weight context
    const rawText = String(raw||'');
    const weightNums = new Set<string>();
    for (const m of rawText.matchAll(/(?:وزن|تلبس)\s*(?:من\s*)?(\d{2,3})(?:\s*(?:الى|إلى|-)|\s*(?:الى|إلى)?\s*وزن\s*)(\d{2,3})?/gi)) {
      weightNums.add(String(m[1]));
      if (m[2]) weightNums.add(String(m[2]));
    }
    const numericCandidates: string[] = [];
    for (const m of rawText.matchAll(/(?:مقاس(?:اته)?\s*[:：]?)?\s*(\d{2})\s*(?:الى|إلى|to|[-–—])\s*(\d{2})/gi)) {
      const a = Number(m[1]), b = Number(m[2]);
      if (a>=20 && a<=60 && b>=20 && b<=60) for (let v=Math.min(a,b); v<=Math.max(a,b); v++) numericCandidates.push(String(v));
    }
    for (const m of rawText.matchAll(/مقاس(?:اته)?\s*[:：]?\s*((?:\d{2})(?:\s*[،,\-]\s*\d{2})+)/gi)) {
      const parts = m[1].split(/[،,\-\s]+/).map(s=>s.trim()).filter(Boolean);
      for (const p of parts) if (/^\d{2}$/.test(p)) numericCandidates.push(p);
    }
    for (const n of numericCandidates) if (!weightNums.has(n)) outSet.add(n);
    return Array.from(outSet);
  }

  function extractMeasurementGroups(clean: string, raw?: string): Array<{ label: string; values: string[] }>{
    const groups: Array<{ label: string; values: string[] }> = [];
    const add = (label: string, values: string[])=>(()=>{
      const vals = Array.from(new Set(values.map(v=> String(v).trim()).filter(Boolean)));
      if (!vals.length) return; if (!groups.some(g=> g.label===label)) groups.push({ label, values: vals });
    })();
    const text = String(raw||clean||'');
    const splitVals = (s: string): string[] => s
      .replace(/\s*(?:الى|إلى|to)\s*/gi,'-')
      .split(/[،,;\s]+|-/g)
      .map(x=> x.trim())
      .filter(Boolean);
    // Explicit phrases: مقاس طول / مقاس عرض
    const mLen = Array.from(text.matchAll(/مقاس\s*(?:ال)?طول\s*[:：]?\s*([^\n\.،]+)/gi)).map(m=> splitVals(m[1]||'' )).flat();
    if (mLen.length) groups.push({ label: 'مقاس الطول', values: mLen });
    const mWid = Array.from(text.matchAll(/مقاس\s*(?:ال)?عرض\s*[:：]?\s*([^\n\.،]+)/gi)).map(m=> splitVals(m[1]||'' )).flat();
    if (mWid.length) groups.push({ label: 'مقاس العرض', values: mWid });
    // Standalone طول/عرض with cm
    const lenCm = Array.from(text.matchAll(/طول\s*[:：]?\s*(\d{2,3})\s*(?:سم|cm)?/gi)).map(m=> `${m[1]} سم`);
    if (lenCm.length) groups.push({ label: 'الطول (سم)', values: lenCm });
    const widCm = Array.from(text.matchAll(/عرض\s*[:：]?\s*(\d{2,3})\s*(?:سم|cm)?/gi)).map(m=> `${m[1]} سم`);
    if (widCm.length) groups.push({ label: 'العرض (سم)', values: widCm });
    // Meter based
    const lenM = Array.from(text.matchAll(/طول\s*[:：]?\s*(\d+(?:[\.,]\d+)?)\s*م(?:تر)?/gi)).map(m=> `${m[1].replace(',','.') } م`);
    if (lenM.length) groups.push({ label: 'الطول (م)', values: lenM });
    const widM = Array.from(text.matchAll(/عرض\s*[:：]?\s*(\d+(?:[\.,]\d+)?)\s*م(?:تر)?/gi)).map(m=> `${m[1].replace(',','.') } م`);
    if (widM.length) groups.push({ label: 'العرض (م)', values: widM });
    // Generic measurement table already handled elsewhere (الصدر/الكتف/...)
    return groups;
  }

  function generateSeoKeywordsStrict(clean: string): string[] {
    const words = clean
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w=> w.length>2 && !stopwords.has(w as any));
    const uniq = Array.from(new Set(words));
    return uniq.slice(0, 12);
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
    const typeMatch = clean.match(/(جلابية|جلابيه|قفطان|فنيلة|فنائل|جاكيت|معطف|فستان|قميص|بنطال|بلوزة|حذاء|شنطة|بلوفر|سويتر|تي\s*شيرت|hoodie|jacket|coat|dress|shirt|pants|blouse|shoes|bag)/i);
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

  async function getImageDominant(fileOrUrl: File | string): Promise<{url:string;hex:string}> {
    const isUrl = typeof fileOrUrl === 'string';
    const url = isUrl ? String(fileOrUrl) : URL.createObjectURL(fileOrUrl as File);
    const img = await new Promise<HTMLImageElement>((resolve, reject)=>{ const i = new Image(); i.crossOrigin='anonymous'; i.onload=()=>resolve(i); i.onerror=reject; i.src=url; });
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

  function dedupePalettes(list: Array<{ url: string; hex: string; name: string }>): Array<{ url: string; hex: string; name: string }>{
    const seen = new Set<string>();
    const out: Array<{ url: string; hex: string; name: string }> = [];
    for (const p of list) {
      const key = String(p.url||'').trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(p);
    }
    return out;
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
        const strictMode = !!(deepseekOn || forceDeepseek);
        const strictText = strictMode ? cleanTextStrict(paste) : paste;
        const disableDeepseek = (!deepseekOn && !forceDeepseek) ? '&disableDeepseek=1' : '';
        const resp = await fetch(`${apiBase}/api/admin/products/analyze?forceDeepseek=${forceDeepseek? '1':'0'}${strictMode?'&strict=1':''}${disableDeepseek}`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ text: strictText, images: b64Images.map(d=> ({ dataUrl: d })) }) });
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
          const autoName = analyzed?.name?.value ? String(analyzed.name.value).trim() : '';
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
      const strictClean0 = (deepseekOn || forceDeepseek) ? cleanTextStrict(paste) : cleanText(paste);
      const extracted:any = {
        name: analyzed?.name?.value || '',
        shortDesc: analyzed?.description?.value || '',
        longDesc: analyzed?.description?.value || '',
        sizes: sanitizeSizesStrict(strictClean0, analyzed?.sizes?.value || [], paste),
        colors: sanitizeColorsStrict(strictClean0, analyzed?.colors?.value || []),
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
      let palettes: Array<{url:string;hex:string;name:string}> = [];
      const allUrls = allProductImageUrls();
      // Recompute quick palette client-side for mapping visual review
      // Include newly uploaded files too
      const localFiles = Array.isArray(files)? files.slice(0,6 - Math.min(allUrls.length,6)) : [];
      for (const f of localFiles) {
        const p = await getImageDominant(f);
        const near = nearestColorName(p.hex);
        palettes.push({ url: p.url, hex: p.hex, name: near.name });
      }
      for (const url of allUrls.slice(0, 6 - palettes.length)) {
        const p = await getImageDominant(url);
        const near = nearestColorName(p.hex);
        palettes.push({ url: p.url, hex: p.hex, name: near.name });
        palettes = dedupePalettes(palettes);
        setReview((prev:any)=> ({ ...(prev||extracted), palettes: [...palettes] }));
      }
      const mapping: Record<string, string|undefined> = {};
      for (const c of extracted.colors as string[]) {
        const candidates = palettes.map(pl=>({ url: pl.url, score: pl.name.toLowerCase().includes(String(c).toLowerCase()) ? 0 : 1 }));
        candidates.sort((a,b)=> a.score-b.score);
        mapping[String(c)] = candidates.length && candidates[0].score===0 ? candidates[0].url : undefined;
      }
      const schema = buildSchemaOutput(extracted, palettes, mapping);
      let reviewObj:any = {
        name: String(schema.product_name_seo||extracted.name||'').trim(),
        shortDesc: String(schema.description||extracted.shortDesc||'').slice(0,160),
        longDesc: String(schema.description||extracted.longDesc||''),
                purchasePrice: (()=>{ const v = schema.cost_price?.amount!==undefined ? Number(schema.cost_price.amount) : (extracted.purchasePrice!==undefined? Number(extracted.purchasePrice): undefined); return (v!==undefined && v<50) ? undefined : v; })(),
        stock: schema.stock_quantity!==undefined && schema.stock_quantity!==null ? Number(schema.stock_quantity) : (extracted.stock!==undefined? Number(extracted.stock): undefined),
        sizes: sanitizeSizesStrict(strictClean0, Array.isArray(schema.sizes)? schema.sizes : (Array.isArray(extracted.sizes)? extracted.sizes: []), paste),
        colors: sanitizeColorsStrict(strictClean0, Array.isArray(schema.colors)? schema.colors.map((c:any)=> c?.color_name).filter(Boolean) : (Array.isArray(extracted.colors)? extracted.colors: [])),
        keywords: extracted.keywords||[],
        palettes,
        mapping,
        confidence,
        sources: extracted.sources,
        reasons: extracted.reasons || {},
        sources: extracted.sources
      } as any;

      // Apply strict mode post-processing when DeepSeek enabled
      if (deepseekOn || forceDeepseek) {
        const strictClean = cleanTextStrict(paste);
        const sName = generateStrictName(strictClean);
        const sPrice = extractOldNorthPriceStrict(strictClean);
        const sDetails = buildStrictDetailsTable(strictClean, paste);
        const sKeywords = generateSeoKeywordsStrict(strictClean);
        reviewObj.name = sName;
        if (typeof sPrice === 'number') reviewObj.purchasePrice = sPrice;
        // Merge strict details into longDesc and text-area auto expands
        const tableInline = sDetails.filter(r=> r.value && String(r.value).trim().length>0)
          .map(r=> `${r.label}: ${r.value}`).join('\n');
        reviewObj.strictDetails = sDetails.filter(r=> r.value && String(r.value).trim().length>0);
        const baseLong = String(reviewObj.longDesc||'').trim();
        reviewObj.longDesc = baseLong ? (baseLong + '\n' + tableInline) : tableInline;
        if (Array.isArray(sKeywords) && sKeywords.length>=8) reviewObj.keywords = sKeywords;
      }

      // Detect measurement groups (e.g., length/width) for preview fields (not part of table)
      try{
        const mg = extractMeasurementGroups(cleanTextStrict(paste), paste);
        if (mg.length) (reviewObj as any).sizeGroups = mg;
      } catch {}

      // Learn from last DeepSeek-only preview ONLY when DeepSeek checkbox is enabled
      if (deepseekOn || forceDeepseek) {
        try{
          const k = keyForText(paste);
          if (dsHint && dsHintKey === k) {
            const wc = (s:string)=> String(s||'').trim().split(/\s+/).filter(Boolean).length;
            if ((!reviewObj.name || wc(reviewObj.name) < 6) && dsHint.name) reviewObj.name = String(dsHint.name);
            if (reviewObj.purchasePrice === undefined && typeof dsHint.purchasePrice === 'number') reviewObj.purchasePrice = Number(dsHint.purchasePrice);
            if ((!Array.isArray(reviewObj.sizes) || reviewObj.sizes.length===0) && Array.isArray(dsHint.sizes) && dsHint.sizes.length) reviewObj.sizes = dsHint.sizes;
            if ((!Array.isArray(reviewObj.colors) || reviewObj.colors.length===0) && Array.isArray(dsHint.colors) && dsHint.colors.length) reviewObj.colors = dsHint.colors;
            if ((!Array.isArray(reviewObj.keywords) || reviewObj.keywords.length<8) && Array.isArray(dsHint.keywords) && dsHint.keywords.length) reviewObj.keywords = dsHint.keywords;
            if (!Array.isArray(reviewObj.strictDetails) && Array.isArray(dsHint.strictDetails) && dsHint.strictDetails.length) reviewObj.strictDetails = dsHint.strictDetails;
          }
        } catch {}
      }
      setReview(reviewObj);
      setAnalysisDone(true);
      if (reviewObj && typeof reviewObj.purchasePrice === 'number' && reviewObj.purchasePrice >= 0) {
        setPurchasePrice(reviewObj.purchasePrice);
      }
      // Direct-fill: write results into original fields instead of preview
      try {
        const fullNameAnalyze = String(reviewObj.name||'').trim();
        if (fullNameAnalyze) setName(fullNameAnalyze);
        if (reviewObj.longDesc) setDescription(String(reviewObj.longDesc||''));
        if (typeof reviewObj.purchasePrice === 'number') setPurchasePrice(reviewObj.purchasePrice);
        if (typeof reviewObj.stock === 'number') setStockQuantity(reviewObj.stock);
        if (Array.isArray(reviewObj.colors) && reviewObj.colors.length) setSelectedColors(reviewObj.colors);
        const sList: string[] = Array.isArray(reviewObj.sizes)? reviewObj.sizes : [];
        const cList: string[] = Array.isArray(reviewObj.colors)? reviewObj.colors : [];
        if ((cList.length || sList.length)) setType('variable');
        // Apply into pickers (size type + colors), but DO NOT auto-generate variant rows
        await applyAnalyzedSizesColors(sList, cList);
        // Merge palette images into images field
        try{
          const palettes = (reviewObj as any).palettes || [];
          const urls = (palettes||[]).map((p:any)=> p?.url).filter((u:string)=> !!u);
          const cur = (images||'').split(',').map(s=>s.trim()).filter(Boolean);
          const merged = Array.from(new Set([...cur, ...urls]));
          if (merged.length) setImages(merged.join(', '));
        }catch{}
        // Do not generate variant rows automatically; user will click "توليد التباينات المتعددة" بعد اختيار المقاسات والألوان
      } catch {}
      setActiveMobileTab('compose');
      setAnalysisDone(true);
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
      // Relax strictness for colors when using DeepSeek preview so colors get populated
      // Keep deepseekOnly=1 but remove strict=1 to allow general color phrases and broader extraction
      const resp = await fetch(`${apiBase}/api/admin/products/analyze?forceDeepseek=1&deepseekOnly=1`, {
        method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include',
        body: JSON.stringify({ text: paste, images: b64Images.map(d=> ({ dataUrl: d })) })
      });
      const aj = await resp.json().catch(()=>({}));
      if (!resp.ok) { setError('فشل تحليل DeepSeek'); showToast('فشل تحليل DeepSeek', 'err'); return; }
      // Guard: if DeepSeek غير متاح أو لم يرجع أي حقول مفيدة، لا نعدّل المعاينة الحالية
      if (Array.isArray(aj?.warnings) && aj.warnings.includes('deepseek_unavailable')) {
        setError('DeepSeek غير متاح حالياً، حاول لاحقاً');
        showToast('DeepSeek غير متاح حالياً', 'err');
        return;
      }
      const analyzed = aj?.analyzed || {};
      const hasUseful = !!(analyzed?.name?.value || analyzed?.description?.value || (analyzed?.colors?.value||[]).length || (analyzed?.sizes?.value||[]).length || (analyzed?.tags?.value||[]).length || typeof analyzed?.price?.value === 'number' || analyzed?.price_range?.value);
      if (!hasUseful) {
        setError('لم يتم استخراج أي حقول من DeepSeek');
        showToast('تعذر استخراج الحقول من DeepSeek', 'err');
        return;
      }
      let reviewObj:any = {
        name: String(analyzed?.name?.value||''),
        longDesc: String(analyzed?.description?.value||''),
        purchasePrice: (analyzed?.price_range?.value?.low ?? analyzed?.price?.value ?? undefined),
        sizes: analyzed?.sizes?.value || [],
        colors: analyzed?.colors?.value || [],
        keywords: analyzed?.tags?.value || [],
        stock: (analyzed?.stock?.value ?? undefined),
        strictDetails: Array.isArray((analyzed as any)?.description_table?.value)
          ? (analyzed as any).description_table.value.map((r:any)=> ({ label: r.label || r.key, value: r.value }))
          : undefined,
        confidence: {
          name: Number(analyzed?.name?.confidence ?? 0.85),
          longDesc: Number(analyzed?.description?.confidence ?? 0.85),
          sizes: Number(analyzed?.sizes?.confidence ?? 0.7),
          colors: Number(analyzed?.colors?.confidence ?? 0.6),
          purchasePrice: Number(analyzed?.price_range?.confidence ?? 0.6),
          stock: Number(analyzed?.stock?.confidence ?? 0.5)
        },
        sources: { name: 'ai', description: 'ai', sizes: 'ai', colors: 'ai', price_range: 'ai', tags:'ai', stock:'ai' }
      };

      // DeepSeek-only: no local rule fallbacks; rely solely on DeepSeek output
      // Local image analysis: palettes + color-name mapping
      try {
        const urls = allProductImageUrls();
        let palettes: Array<{url:string;hex:string;name:string}> = [];
        for (const u of urls.slice(0,6)) {
          const p = await getImageDominant(u);
          const near = nearestColorName(p.hex);
          palettes.push({ url: p.url, hex: p.hex, name: near.name });
        }
        palettes = dedupePalettes(palettes);
        (reviewObj as any).palettes = palettes;
        const mapping: Record<string,string|undefined> = {};
        for (const c of (reviewObj.colors as string[]||[])) {
          const candidates = palettes.map(pl=>({ url: pl.url, score: pl.name.toLowerCase().includes(String(c).toLowerCase()) ? 0 : 1 }));
          candidates.sort((a,b)=> a.score-b.score);
          mapping[String(c)] = candidates.length && candidates[0].score===0 ? candidates[0].url : undefined;
        }
        (reviewObj as any).mapping = mapping;
        // If DeepSeek returned no colors OR only general color phrases, fallback to palette-derived names
        const generalColorsRe = /\b(?:(\d+)\s*(?:ألوان|الوان)|أرب(?:ع|عة)\s*(?:ألوان|الوان)|اربعه\s*(?:ألوان|الوان)|ألوان\s*متعدد(?:ة|ه)|ألوان\s*متنوع(?:ة|ه)|عدة\s*(?:ألوان|الوان))\b/i
        const noColors = !Array.isArray(reviewObj.colors) || reviewObj.colors.length === 0
        const generalOnly = Array.isArray(reviewObj.colors) && reviewObj.colors.length>0 && reviewObj.colors.every((c:string)=> generalColorsRe.test(String(c)))
        if (noColors || generalOnly) {
          const fromPalettes = Array.from(new Set(palettes.map(pl => pl.name))).slice(0, 3)
          if (fromPalettes.length) reviewObj.colors = fromPalettes
        }
      } catch {}
      // Direct fill
      setReview(reviewObj);
      setAnalysisDone(true);
      try{ const k = keyForText(paste); localStorage.setItem(k, JSON.stringify(reviewObj)); setDsHint(reviewObj); setDsHintKey(k); } catch {}
      try{
      // Name: use full DeepSeek-generated name (no truncation); if partial, backfill from clean text
      const dsName = String(reviewObj.name||'').trim();
      if (dsName) {
        const clean = cleanTextStrict(paste);
        const backfilled = dsName.length < 60 ? `${dsName} ${clean.slice(0, 120-dsName.length)}`.trim() : dsName;
        setName(backfilled.replace(/\s{2,}/g,' ').trim());
      }
      // Description: prefer strictDetails table (vertical label/value). If missing, build from strict clean text.
      try {
        let html = detailsToHtmlTable((reviewObj as any).strictDetails as any);
        if (!html || !html.length) {
          const sDetails = buildStrictDetailsTable(cleanTextStrict(paste), paste);
          html = detailsToHtmlTable(sDetails);
        }
        if (html && html.length) setDescription(html);
        else if (reviewObj.longDesc) setDescription(String(reviewObj.longDesc||''));
      } catch { if (reviewObj.longDesc) setDescription(String(reviewObj.longDesc||'')); }
        if (typeof reviewObj.purchasePrice === 'number') setPurchasePrice(reviewObj.purchasePrice);
        if (typeof reviewObj.stock === 'number') setStockQuantity(reviewObj.stock);
        if (Array.isArray(reviewObj.colors) && reviewObj.colors.length) setSelectedColors(reviewObj.colors);
        const sList: string[] = Array.isArray(reviewObj.sizes)? reviewObj.sizes : [];
        const cList: string[] = Array.isArray(reviewObj.colors)? reviewObj.colors : [];
        if ((cList.length || sList.length)) setType('variable');
        await applyAnalyzedSizesColors(sList, cList);
        const palettes = dedupePalettes(((reviewObj as any).palettes || []));
        const urls = palettes.map((p:any)=> p?.url).filter((u:string)=> !!u);
        const cur = (images||'').split(',').map(s=>s.trim()).filter(Boolean);
        const merged = Array.from(new Set([...cur, ...urls]));
        if (merged.length) setImages(merged.join(', '));
        // Do not auto-generate variant rows
      } catch {}
      setAnalysisDone(true);
      showToast('تم تحليل DeepSeek وتعبئة الحقول', 'ok');
      setActiveMobileTab('compose');
    } catch {
      setError('فشل تحليل DeepSeek');
      showToast('فشل تحليل DeepSeek', 'err');
    } finally { setBusy(false); }
  }

  async function handleRulesStrictPreview(filesForPalette: File[]): Promise<void> {
    setError('');
    try {
      setBusy(true);
      const b64Images: string[] = [];
      for (const f of filesForPalette.slice(0,6)) { b64Images.push(await fileToBase64(f)); }
      const resp = await fetch(`${apiBase}/api/admin/products/analyze?rulesStrict=1`, {
        method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include',
        body: JSON.stringify({ text: paste, images: b64Images.map(d=> ({ dataUrl: d })) })
      });
      const aj = await resp.json().catch(()=>({}));
      if (!resp.ok) { setError('فشل التحليل الصارم'); showToast('فشل التحليل الصارم', 'err'); return; }
      const analyzed = aj?.analyzed || {};
      const sanitize = (s:string)=> String(s||'')
        .replace(/[\u{1F300}-\u{1FAFF}\u{1F900}-\u{1F9FF}\u200D\uFE0F]/gu,' ')
        .replace(/[\uFFFD]/g,' ')
        .replace(/\s{2,}/g,' ').trim();
      const reviewObj:any = {
        name: sanitize(String(analyzed?.name?.value||'')),
        longDesc: sanitize(String((analyzed?.description_table?.value||[]).map((r:any)=> `${r.label}: ${r.value}`).join('\n')||'')),
        purchasePrice: (analyzed?.price_range?.value?.low ?? undefined),
        sizes: analyzed?.sizes?.value || [],
        sizes2: (analyzed as any)?.sizes2?.value || [],
        colors: analyzed?.colors?.value || [],
        keywords: analyzed?.tags?.value || [],
        sources: {
          name: 'rules', description: 'rules', sizes: 'rules', sizes2: 'rules', colors: 'rules', price_range: 'rules', tags:'rules'
        },
        confidence: {
          name: Number(analyzed?.name?.confidence ?? 0.9),
          longDesc: Number(analyzed?.description_table?.confidence ?? 0.9),
          sizes: Number(analyzed?.sizes?.confidence ?? 0.7),
          sizes2: 0.6,
          colors: Number(analyzed?.colors?.confidence ?? 0.7),
          purchasePrice: Number(analyzed?.price_range?.confidence ?? 0.75)
        }
      };
      try {
        const urls = allProductImageUrls();
        let palettes: Array<{url:string;hex:string;name:string}> = [];
        for (const u of urls.slice(0,6)) { const p = await getImageDominant(u); const near = nearestColorName(p.hex); palettes.push({ url: p.url, hex: p.hex, name: near.name }); }
        palettes = dedupePalettes(palettes);
        (reviewObj as any).palettes = palettes;
        const mapping: Record<string,string|undefined> = {};
        for (const c of (reviewObj.colors as string[]||[])) { const candidates = palettes.map(pl=>({ url: pl.url, score: pl.name.toLowerCase().includes(String(c).toLowerCase()) ? 0 : 1 })); candidates.sort((a,b)=> a.score-b.score); mapping[String(c)] = candidates.length && candidates[0].score===0 ? candidates[0].url : undefined; }
        (reviewObj as any).mapping = mapping;
      } catch {}
      setReview(reviewObj);
      setAnalysisDone(true);
      try{
        const fullNameRules = String(reviewObj.name||'').trim();
        if (fullNameRules) setName(fullNameRules);
        if (reviewObj.longDesc) setDescription(String(reviewObj.longDesc||''));
        if (typeof reviewObj.purchasePrice === 'number') setPurchasePrice(reviewObj.purchasePrice);
        if (Array.isArray(reviewObj.colors) && reviewObj.colors.length) setSelectedColors(reviewObj.colors);
        const sList: string[] = Array.isArray(reviewObj.sizes)? reviewObj.sizes : [];
        const cList: string[] = Array.isArray(reviewObj.colors)? reviewObj.colors : [];
        if ((cList.length || sList.length)) setType('variable');
        await applyAnalyzedSizesColors(sList, cList);
        const palettes = dedupePalettes(((reviewObj as any).palettes || []));
        const urls = palettes.map((p:any)=> p?.url).filter((u:string)=> !!u);
        const cur = (images||'').split(',').map(s=>s.trim()).filter(Boolean);
        const merged = Array.from(new Set([...cur, ...urls]));
        if (merged.length) setImages(merged.join(', '));
      } catch {}
      setAnalysisDone(true);
      showToast('تم التحليل الصارم وتعبئة الحقول', 'ok');
      setActiveMobileTab('compose');
    } catch {
      setError('فشل التحليل الصارم');
      showToast('فشل التحليل الصارم', 'err');
    } finally { setBusy(false); }
  }

  async function handleOpenRouterOnlyPreview(filesForPalette: File[]): Promise<void> {
    setError('');
    try {
      setBusy(true);
      const b64Images: string[] = [];
      for (const f of filesForPalette.slice(0,6)) { b64Images.push(await fileToBase64(f)); }
      const resp = await fetch(`${apiBase}/api/admin/products/analyze?openrouterOnly=1`, {
        method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include',
        body: JSON.stringify({ text: paste, images: b64Images.map(d=> ({ dataUrl: d })) })
      });
      const aj = await resp.json().catch(()=>({}));
      if (!resp.ok) { setError('فشل تحليل OpenRouter'); showToast('فشل تحليل OpenRouter', 'err'); return; }
      if (Array.isArray(aj?.warnings) && aj.warnings.includes('openrouter_unavailable')) {
        setError('OpenRouter غير متاح حالياً، حاول لاحقاً');
        showToast('OpenRouter غير متاح حالياً', 'err');
        return;
      }
      const analyzed = aj?.analyzed || {};
      const hasUseful = !!(analyzed?.name?.value || analyzed?.description?.value || (analyzed?.colors?.value||[]).length || (analyzed?.sizes?.value||[]).length || (analyzed?.tags?.value||[]).length || typeof analyzed?.price?.value === 'number' || analyzed?.price_range?.value);
      if (!hasUseful) {
        setError('لم يتم استخراج أي حقول من OpenRouter');
        showToast('تعذر استخراج الحقول من OpenRouter', 'err');
        return;
      }
      const reviewObj:any = {
        name: String(analyzed?.name?.value||'').trim(),
        longDesc: String(analyzed?.description?.value||''),
        purchasePrice: (analyzed?.price_range?.value?.low ?? analyzed?.price?.value ?? undefined),
        sizes: analyzed?.sizes?.value || [],
        colors: analyzed?.colors?.value || [],
        keywords: analyzed?.tags?.value || [],
        stock: (analyzed?.stock?.value ?? undefined),
        confidence: {
          name: Number(analyzed?.name?.confidence ?? 0.85),
          longDesc: Number(analyzed?.description?.confidence ?? 0.85),
          sizes: Number(analyzed?.sizes?.confidence ?? 0.7),
          colors: Number(analyzed?.colors?.confidence ?? 0.6),
          purchasePrice: Number(analyzed?.price_range?.confidence ?? 0.6),
          stock: Number(analyzed?.stock?.confidence ?? 0.5)
        },
        sources: { name: 'ai', description: 'ai', sizes: 'ai', colors: 'ai', price_range: 'ai', tags:'ai', stock:'ai' }
      };
      try {
        const urls = allProductImageUrls();
        let palettes: Array<{url:string;hex:string;name:string}> = [];
        for (const u of urls.slice(0,6)) { const p = await getImageDominant(u); const near = nearestColorName(p.hex); palettes.push({ url: p.url, hex: p.hex, name: near.name }); }
        palettes = dedupePalettes(palettes);
        (reviewObj as any).palettes = palettes;
        const mapping: Record<string,string|undefined> = {};
        for (const c of (reviewObj.colors as string[]||[])) { const candidates = palettes.map(pl=>({ url: pl.url, score: pl.name.toLowerCase().includes(String(c).toLowerCase()) ? 0 : 1 })); candidates.sort((a,b)=> a.score-b.score); mapping[String(c)] = candidates.length && candidates[0].score===0 ? candidates[0].url : undefined; }
        (reviewObj as any).mapping = mapping;
      } catch {}
      setReview(reviewObj);
      setAnalysisDone(true);
      try{
        const fullNameOR = String(reviewObj.name||'').trim();
        if (fullNameOR) setName(fullNameOR);
        if (reviewObj.longDesc) setDescription(String(reviewObj.longDesc||''));
        if (typeof reviewObj.purchasePrice === 'number') setPurchasePrice(reviewObj.purchasePrice);
        if (Array.isArray(reviewObj.colors) && reviewObj.colors.length) setSelectedColors(reviewObj.colors);
        const sList: string[] = Array.isArray(reviewObj.sizes)? reviewObj.sizes : [];
        const cList: string[] = Array.isArray(reviewObj.colors)? reviewObj.colors : [];
        if ((cList.length || sList.length)) setType('variable');
        await applyAnalyzedSizesColors(sList, cList);
        const palettes = dedupePalettes(((reviewObj as any).palettes || []));
        const urls = palettes.map((p:any)=> p?.url).filter((u:string)=> !!u);
        const cur = (images||'').split(',').map(s=>s.trim()).filter(Boolean);
        const merged = Array.from(new Set([...cur, ...urls]));
        if (merged.length) setImages(merged.join(', '));
        // do not generate variant rows automatically here
      } catch {}
      setAnalysisDone(true);
      showToast('تم تحليل OpenRouter وتعبئة الحقول', 'ok');
      setActiveMobileTab('compose');
    } catch {
      setError('فشل تحليل OpenRouter');
      showToast('فشل تحليل OpenRouter', 'err');
    } finally { setBusy(false); }
  }

  async function handleGptOnlyPreview(_filesForPalette: File[]): Promise<void> {
    try{
      setBusy(true); setError('');
      const resp = await fetch(`${apiBase}/api/admin/products/analyze?gptOnly=1`, {
        method: 'POST', headers: { 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ text: paste })
      });
      const aj = await resp.json().catch(()=>({}));
      if (!resp.ok) { setError('فشل تحليل GPT'); showToast('فشل تحليل GPT', 'err'); return; }
      if (Array.isArray(aj?.warnings) && aj.warnings.includes('gpt_unavailable')) {
        setError('GPT غير متاح حالياً، حاول لاحقاً');
        showToast('GPT غير متاح حالياً', 'err');
        return;
      }
      const analyzed = aj?.analyzed || {};
      const hasUseful = !!(analyzed?.name?.value || analyzed?.description?.value || (analyzed?.colors?.value||[]).length || (analyzed?.sizes?.value||[]).length || (analyzed?.tags?.value||[]).length || typeof analyzed?.price?.value === 'number' || analyzed?.price_range?.value);
      if (!hasUseful) { setError('لم يتم استخراج أي حقول من GPT'); showToast('تعذر استخراج الحقول من GPT', 'err'); return; }
      const reviewObj:any = {
        name: String(analyzed?.name?.value||'').trim(),
        longDesc: String(analyzed?.description?.value||''),
        purchasePrice: (analyzed?.price_range?.value?.low ?? analyzed?.price?.value ?? undefined),
        sizes: analyzed?.sizes?.value || [],
        colors: analyzed?.colors?.value || [],
        keywords: analyzed?.tags?.value || [],
        stock: (analyzed?.stock?.value ?? undefined),
        confidence: {
          name: Number(analyzed?.name?.confidence ?? 0.85),
          longDesc: Number(analyzed?.description?.confidence ?? 0.85),
          sizes: Number(analyzed?.sizes?.confidence ?? 0.7),
          colors: Number(analyzed?.colors?.confidence ?? 0.6),
          purchasePrice: Number(analyzed?.price_range?.confidence ?? 0.6),
          stock: Number(analyzed?.stock?.confidence ?? 0.5)
        },
        sources: { name: 'ai', description: 'ai', sizes: 'ai', colors: 'ai', price_range: 'ai', tags:'ai', stock:'ai' }
      };
      try {
        const urls = allProductImageUrls();
        const palettes: Array<{url:string;hex:string;name:string}> = [];
        for (const u of urls.slice(0,6)) { const p = await getImageDominant(u); const near = nearestColorName(p.hex); palettes.push({ url: p.url, hex: p.hex, name: near.name }); }
        (reviewObj as any).palettes = palettes;
        const mapping: Record<string,string|undefined> = {};
        for (const c of (reviewObj.colors as string[]||[])) { const candidates = palettes.map(pl=>({ url: pl.url, score: pl.name.toLowerCase().includes(String(c).toLowerCase()) ? 0 : 1 })); candidates.sort((a,b)=> a.score-b.score); mapping[String(c)] = candidates.length && candidates[0].score===0 ? candidates[0].url : undefined; }
        (reviewObj as any).mapping = mapping;
      } catch {}
      setReview(reviewObj);
      setAnalysisDone(true);
      try{
        const fullNameGPT = String(reviewObj.name||'').trim();
        if (fullNameGPT) setName(fullNameGPT);
        if (reviewObj.longDesc) setDescription(String(reviewObj.longDesc||''));
        if (typeof reviewObj.purchasePrice === 'number') setPurchasePrice(reviewObj.purchasePrice);
        if (Array.isArray(reviewObj.colors) && reviewObj.colors.length) setSelectedColors(reviewObj.colors);
        const sList: string[] = Array.isArray(reviewObj.sizes)? reviewObj.sizes : [];
        const cList: string[] = Array.isArray(reviewObj.colors)? reviewObj.colors : [];
        if ((cList.length || sList.length)) setType('variable');
        const palettes = dedupePalettes(((reviewObj as any).palettes || []));
        const urls = palettes.map((p:any)=> p?.url).filter((u:string)=> !!u);
        const cur = (images||'').split(',').map(s=>s.trim()).filter(Boolean);
        const merged = Array.from(new Set([...cur, ...urls]));
        if (merged.length) setImages(merged.join(', '));
        const rows: typeof variantRows = [] as any;
        const baseCost = reviewObj.purchasePrice!==undefined ? Number(reviewObj.purchasePrice) : (purchasePrice===''? undefined : Number(purchasePrice||0));
        if (sList.length && cList.length) { for (const sz of sList) for (const col of cList) rows.push({ name:'متغير', value:`${sz} / ${col}`, purchasePrice: baseCost, stockQuantity: Number(stockQuantity||0), size: sz, color: col, option_values:[{name:'size',value:sz},{name:'color',value:col}] }); }
        else if (sList.length) { for (const sz of sList) rows.push({ name:'مقاس', value:sz, purchasePrice: baseCost, stockQuantity: Number(stockQuantity||0), size: sz, option_values:[{name:'size',value:sz}] }); }
        else if (cList.length) { for (const col of cList) rows.push({ name:'لون', value:col, purchasePrice: baseCost, stockQuantity: Number(stockQuantity||0), color: col, option_values:[{name:'color',value:col}] }); }
        if (rows.length) setVariantRows(rows as any);
      } catch {}
      setAnalysisDone(true);
      showToast('تم تحليل GPT وتعبئة الحقول', 'ok');
      setActiveMobileTab('compose');
    } catch { setError('فشل تحليل GPT'); showToast('فشل تحليل GPT', 'err'); }
    finally { setBusy(false); }
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
  const [showImagesInput, setShowImagesInput] = React.useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = React.useState<number[]>([]);
  const [dragOver, setDragOver] = React.useState<boolean>(false);
  const [variantRows, setVariantRows] = React.useState<Array<{
    name: string;
    value: string;
    price?: number;
    purchasePrice?: number;
    stockQuantity: number;
    sku?: string;
    size?: string;
    color?: string;
    option_values?: Array<{ name: string; value: string; label?: string }>;
  }>>([]);
  // Derive size-type labels present in variant rows (e.g., "مقاس بالطول", "مقاس بالعرض")
  const sizeTypeLabels = React.useMemo((): string[] => {
    const labels: string[] = [];
    for (const r of variantRows) {
      const comp = String(r.size||'');
      if (!comp) continue;
      const parts = comp.split('|').map(t=> t.trim()).filter(Boolean);
      for (const p of parts) {
        const idx = p.indexOf(':');
        if (idx>0) {
          const label = p.slice(0, idx).trim();
          if (label && !labels.includes(label)) labels.push(label);
        }
      }
    }
    return labels;
  }, [variantRows]);
  const parseCompositeSizes = React.useCallback((s?: string): Record<string,string> => {
    const out: Record<string,string> = {};
    const raw = String(s||'');
    if (!raw) return out;
    for (const part of raw.split('|')) {
      const t = String(part||'').trim();
      if (!t) continue;
      const idx = t.indexOf(':');
      if (idx>0) {
        const label = t.slice(0, idx).trim();
        const val = t.slice(idx+1).trim();
        if (label) out[label] = val;
      }
    }
    return out;
  }, []);
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

  // Auto-apply analyzed sizes/colors to pickers without generating variants
  async function applyAnalyzedSizesColors(sizesIn: string[], colorsIn: string[]): Promise<void> {
    try {
      const targetSizes = Array.from(new Set((sizesIn||[]).map(s=>String(s||'').trim()).filter(Boolean)));
      const targetColors = Array.from(new Set((colorsIn||[]).map(c=>String(c||'').trim()).filter(Boolean)));
      // Ensure we have latest palettes/colors list before matching
      try {
        if (!Array.isArray(colorOptions) || colorOptions.length === 0) {
          const r = await fetch(`${apiBase}/api/admin/attributes/colors`, { credentials:'include', headers:{ ...authHeaders() } });
          const j = await r.json().catch(()=>({}));
          setColorOptions(j.colors||[]);
        }
      } catch {}

      // Choose ALL matching size types when two groups are present (letters & numbers)
      if (targetSizes.length && Array.isArray(sizeTypeOptions) && sizeTypeOptions.length) {
        const picks: Array<{ id:string; name:string; sizes:Array<{id:string;name:string}>; selectedSizes:string[] }> = [];
        const lower = targetSizes.map(s=> String(s).toLowerCase());
        for (const t of sizeTypeOptions) {
          const sizes = await loadSizesForType(t.id);
          const matched = sizes.filter(s=> lower.includes(String(s.name||'').toLowerCase())).map(s=> s.name);
          if (matched.length) picks.push({ id: t.id, name: t.name, sizes, selectedSizes: matched });
        }
        if (picks.length) setSelectedSizeTypes(picks);
      }

      // Helper: guess hex for common Arabic/English color names
      const guessHex = (name: string): string => {
        const t = String(name||'').toLowerCase();
        const map: Record<string,string> = {
          'أسود':'#000000','اسود':'#000000','black':'#000000',
          'أبيض':'#ffffff','ابيض':'#ffffff','white':'#ffffff',
          'أحمر':'#ff0000','احمر':'#ff0000','red':'#ff0000',
          'أزرق':'#0000ff','ازرق':'#0000ff','blue':'#0000ff',
          'أخضر':'#008000','اخضر':'#008000','green':'#008000',
          'أصفر':'#ffff00','اصفر':'#ffff00','yellow':'#ffff00',
          'وردي':'#ffc0cb','زهري':'#ffc0cb','pink':'#ffc0cb',
          'بنفسجي':'#8a2be2','purple':'#800080','violet':'#8a2be2',
          'برتقالي':'#ffa500','orange':'#ffa500',
          'بني':'#8b4513','brown':'#8b4513',
          'رمادي':'#808080','gray':'#808080','grey':'#808080',
          'كحلي':'#000080','navy':'#000080',
          'بيج':'#f5f5dc','beige':'#f5f5dc',
          'ذهبي':'#ffd700','gold':'#ffd700',
          'فضي':'#c0c0c0','silver':'#c0c0c0'
        };
        return map[t] || '#666666';
      };

        // Map colors to known options and add color cards (split combined like "أسود وأبيض" إلى لونين)
      if (targetColors.length) {
        const mappedCards: Array<{ key:string; color?: string; selectedImageIdxs: number[]; primaryImageIdx?: number }> = [];
        const toCreate: string[] = []
          const splitCombined = (c:string): string[] => {
            const s = String(c||'');
            // split on common separators and "و"
            return s.split(/\s*(?:,|،|\+|\/|\-|\sو\s)\s*/).map(x=>x.trim()).filter(Boolean);
          };
          for (const rawC of targetColors) {
            const parts = splitCombined(rawC);
            const list = parts.length? parts : [rawC];
            for (const c of list) {
              const match = colorOptions.find(o=> String(o.name||'').toLowerCase() === String(c).toLowerCase());
          if (match) {
            mappedCards.push({ key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, color: match.name, selectedImageIdxs: [] });
          } else {
                toCreate.push(c)
              }
          }
        }
        // Create missing colors
        for (const raw of toCreate){
          try{
            const name = String(raw).slice(0,40)
            const hex = guessHex(name)
            const rc = await fetch(`${apiBase}/api/admin/attributes/colors`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json', ...authHeaders() }, body: JSON.stringify({ name, hex }) })
            const cj = await rc.json().catch(()=>({}))
            if (rc.ok && cj?.color?.name){
              mappedCards.push({ key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, color: cj.color.name, selectedImageIdxs: [] })
            } else {
              // Fallback: ensure UI select contains this color temporarily
              setColorOptions(prev => {
                const exists = (prev||[]).some(o=> String(o.name||'').toLowerCase()===name.toLowerCase());
                return exists ? prev : [...(prev||[]), { id: `tmp:${name}`, name, hex } as any];
              });
              mappedCards.push({ key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, color: name, selectedImageIdxs: [] })
            }
          } catch {}
        }
        // refresh colors
        try{ const r=await fetch(`${apiBase}/api/admin/attributes/colors`, { credentials:'include', headers:{ ...authHeaders() } }); const j=await r.json(); setColorOptions(j.colors||[]); } catch {}
        if (mappedCards.length) {
          setColorCards(mappedCards);
          // Also ensure selectedColors reflect target colors immediately
          setSelectedColors(Array.from(new Set(mappedCards.map(c=>c.color).filter(Boolean))) as string[])
        } else if (targetColors.length) {
          // Last-resort fallback: reflect target colors in selection
          setSelectedColors(targetColors)
        }
      }
    } catch {}
  }

  async function fileToBase64(file: File): Promise<string> {
    // Compress to WebP with max dimension for optimal upload; fallback to original if failure
    try {
      const dataUrl = await compressToDataUrl(file, 1600, 0.82);
      return dataUrl;
    } catch {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result||''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }

  async function compressToDataUrl(file: File, maxDim: number, quality: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          try {
            const w = img.width; const h = img.height;
            let targetW = w; let targetH = h;
            if (w > h && w > maxDim) { targetW = maxDim; targetH = Math.round(h * (maxDim / w)); }
            else if (h >= w && h > maxDim) { targetH = maxDim; targetW = Math.round(w * (maxDim / h)); }
            const canvas = document.createElement('canvas');
            canvas.width = targetW; canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            if (!ctx) { URL.revokeObjectURL(url); return reject(new Error('no_ctx')); }
            ctx.drawImage(img, 0, 0, targetW, targetH);
            const mime = 'image/webp';
            canvas.toBlob((blob)=>{
              try {
                URL.revokeObjectURL(url);
                if (!blob) return reject(new Error('no_blob'));
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result||''));
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              } catch (e) { reject(e as any); }
            }, mime, quality);
          } catch (e) {
            URL.revokeObjectURL(url);
            reject(e as any);
          }
        };
        img.onerror = (e)=> { URL.revokeObjectURL(url); reject(new Error('img_error')); };
        img.src = url;
      } catch (e) { reject(e as any); }
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

  function generateVariantRows(): Array<{ name: string; value: string; price?: number; purchasePrice?: number; stockQuantity: number; sku?: string; size?: string; color?: string; option_values?: Array<{ name: string; value: string; label?: string }> }> {
    const priceValue = Number(salePrice || 0);
    const purchaseValue = purchasePrice === '' ? undefined : Number(purchasePrice || 0);
    const stockValue = Number(stockQuantity || 0);
    // Resolve sizes for each selected size-type: if none explicitly selected, use ALL sizes under that type
    const resolvedSizeTypes = selectedSizeTypes
      .map(t => {
        const explicit = Array.isArray(t.selectedSizes) ? t.selectedSizes.filter(Boolean) : [] as string[];
        const all = Array.isArray(t.sizes) ? t.sizes.map(s => String((s as any)?.name || '').trim()).filter(Boolean) : [] as string[];
        const effective = explicit.length ? explicit : all;
        return { ...t, effectiveSizes: Array.from(new Set(effective)) };
      })
      .filter(t => t.effectiveSizes.length);
    const activeSizeTypes = resolvedSizeTypes;
    const colorList = selectedColors;
    const rows: Array<{ name: string; value: string; price?: number; purchasePrice?: number; stockQuantity: number; sku?: string; size?: string; color?: string; option_values?: Array<{ name: string; value: string; label?: string }> }> = [];
    const makeSku = (parts: string[]): string => {
      const base = (sku || name || 'PRD').toUpperCase().replace(/[^A-Z0-9]+/g,'').slice(0,8) || 'PRD';
      const tail = parts.map(p=> String(p||'').toUpperCase().replace(/\s+/g,'').replace(/[^A-Z0-9]+/g,'').slice(0,6)).filter(Boolean).join('-');
      return [base, tail].filter(Boolean).join('-');
    };

    if (activeSizeTypes.length >= 2 && colorList.length) {
      const [t1, t2] = activeSizeTypes;
      for (const s1 of t1.effectiveSizes) {
        for (const s2 of t2.effectiveSizes) {
          for (const c of colorList) {
            rows.push({
              name: `${t1.name}: ${s1} • ${t2.name}: ${s2} • اللون: ${c}`,
              value: `${t1.name}: ${s1} • ${t2.name}: ${s2} • اللون: ${c}`,
              price: priceValue,
              purchasePrice: purchaseValue,
              stockQuantity: stockValue,
              sku: makeSku([s1, s2, c]),
              size: `${t1.name}:${s1}|${t2.name}:${s2}`,
              color: c,
              option_values: [
                { name: 'size', value: `${t1.name}:${s1}` },
                { name: 'size', value: `${t2.name}:${s2}` },
                { name: 'color', value: c },
              ],
            });
          }
        }
      }
      return rows;
    }

    if (activeSizeTypes.length >= 2) {
      const [t1, t2] = activeSizeTypes;
      for (const s1 of t1.effectiveSizes) {
        for (const s2 of t2.effectiveSizes) {
          rows.push({
            name: `${t1.name}: ${s1} • ${t2.name}: ${s2}`,
            value: `${t1.name}: ${s1} • ${t2.name}: ${s2}`,
            price: priceValue,
            purchasePrice: purchaseValue,
            stockQuantity: stockValue,
            sku: makeSku([s1, s2]),
            size: `${t1.name}:${s1}|${t2.name}:${s2}`,
            option_values: [
              { name: 'size', value: `${t1.name}:${s1}` },
              { name: 'size', value: `${t2.name}:${s2}` },
            ],
          });
        }
      }
      return rows;
    }

    if (activeSizeTypes.length === 1 && colorList.length) {
      const [t1] = activeSizeTypes;
      for (const s1 of t1.effectiveSizes) {
        for (const c of colorList) {
          rows.push({
            name: `${t1.name}: ${s1} • اللون: ${c}`,
            value: `${t1.name}: ${s1} • اللون: ${c}`,
            price: priceValue,
            purchasePrice: purchaseValue,
            stockQuantity: stockValue,
            sku: makeSku([s1, c]),
            size: `${t1.name}:${s1}`,
            color: c,
            option_values: [
              { name: 'size', value: `${t1.name}:${s1}` },
              { name: 'color', value: c },
            ],
          });
        }
      }
      return rows;
    }

    if (activeSizeTypes.length === 1) {
      const [t1] = activeSizeTypes;
      for (const s1 of t1.effectiveSizes) {
        rows.push({
          name: `${t1.name}: ${s1}`,
          value: `${t1.name}: ${s1}`,
          price: priceValue,
          purchasePrice: purchaseValue,
          stockQuantity: stockValue,
          sku: makeSku([s1]),
          size: `${t1.name}:${s1}`,
          option_values: [{ name: 'size', value: `${t1.name}:${s1}` }],
        });
      }
      return rows;
    }

    if (colorList.length) {
      for (const c of colorList) {
        rows.push({
          name: `اللون: ${c}`,
          value: `اللون: ${c}`,
          price: priceValue,
          purchasePrice: purchaseValue,
          stockQuantity: stockValue,
          sku: makeSku([c]),
          color: c,
          option_values: [{ name: 'color', value: c }],
        });
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
    // Guard: ensure description table (strictDetails) is embedded if available
    try {
      const rows = (review as any)?.strictDetails as Array<{label:string; value:string}> | undefined;
      const html = detailsToHtmlTable(rows);
      if (html && html.length && (!description || description.indexOf('<table') === -1)) {
        setDescription(html);
      }
    } catch {}
    setBusy(true);
    const existingImageUrls: string[] = (images || '').split(',').map(s => s.trim()).filter(Boolean).filter(u => !u.startsWith('blob:'));
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
    const baseImages: string[] = Array.from(new Set([...existingImageUrls, ...uploadedOrBase64]));
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
      isActive: !draft,
      seoTitle: seoTitle||undefined,
      seoDescription: seoDescription||undefined,
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
      // Auto-generate variants if user forgot to click "توليد التباينات المتعددة"
      let variants = variantRows;
      if (!variants || variants.length === 0) {
        try { variants = generateVariantRows(); } catch { variants = [] as any; }
      }
      if (variants && variants.length) {
        // Normalize variants to include explicit size/color/option_values for reliable extraction downstream
        const normalized = variants.map(v => {
          const sizeToken = v.size ? String(v.size) : undefined;
          const colorToken = v.color ? String(v.color) : undefined;
          const ov = Array.isArray(v.option_values) ? v.option_values : [];
          const withSize = sizeToken ? ov.filter(o=>o.name!=='size').concat(
            sizeToken.includes('|')
              ? sizeToken.split('|').map(part => {
                  const [k,val] = part.split(':',2); return { name:'size', value: val? `${k}:${val}` : String(part) };
                })
              : [{ name:'size', value:String(sizeToken) }]
          ) : ov;
          const withBoth = colorToken ? withSize.filter(o=>o.name!=='color').concat([{ name:'color', value:String(colorToken) }]) : withSize;
          return { ...v, size: sizeToken, color: colorToken, option_values: withBoth };
        });
        try {
          await fetch(`${apiBase}/api/admin/products/${productId}/variants`, {
            method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include',
            body: JSON.stringify({ variants: normalized })
          });
        } catch {}
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
          <button type="button" onClick={()=>handleAnalyze(files, deepseekOn)} disabled={busy} className="btn">{busy? 'جارِ التحليل...' : 'حلّل واملأ الحقول'}</button>
          <button type="button" onClick={()=>handleAnalyze(files, true)} disabled={busy} className="btn" title="تشغيل DeepSeek بالقوة">{busy? '...' : 'حلّل واملأ الحقول (DeepSeek)'}</button>
          <button type="button" onClick={()=>handleDeepseekOnlyPreview(files)} disabled={busy} className="btn btn-outline" title="تحليل عبر DeepSeek محلياً (بدون رفع)">{busy? '...' : 'تحليل عبر DeepSeek (محلي)'} </button>
          <button type="submit" disabled={busy} className="btn btn-outline">إنشاء المنتج</button>
        </>}
      >
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 360px', gap:16 }}>
          <div style={{ display:'grid', gap:12 }}>
            <textarea value={paste} onChange={(e)=>setPaste(e.target.value)} placeholder="الصق مواصفات المنتج (AR/EN)" rows={10} className="input" style={{ borderRadius:12, whiteSpace:'pre-wrap', wordBreak:'break-word' }} />
            {error && <span style={{ color:'#ef4444' }}>{error}</span>}
            {/* إخفاء واجهة المعاينة (مُعطل بالكامل) */}
            {false && (
              <div className="panel" style={{ padding:12 }}>
                <h3 style={{ marginTop:0 }}>Review</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <label>الاسم (ثقة {Math.round((review.confidence?.name||0)*100)}%) <SourceBadge src={review.sources?.name} />
                    <input value={review.name||''} onChange={(e)=> setReview((r:any)=> ({...r, name:e.target.value}))} className="input" />
                    {!review.name && review?.reasons?.name && <div style={{ fontSize:12, color:'#ef4444' }}>{review.reasons.name}</div>}
                  </label>
                  <label>سعر الشراء/التكلفة (ثقة {Math.round((review.confidence?.purchasePrice||0)*100)}%) <SourceBadge src={review.sources?.price_range} /><input type="number" value={review.purchasePrice??''} onChange={(e)=> setReview((r:any)=> ({...r, purchasePrice: e.target.value===''? undefined : Number(e.target.value)}))} className="input" /></label>
                  <label>المخزون (ثقة {Math.round((review.confidence?.stock||0)*100)}%)<input type="number" value={review.stock??''} onChange={(e)=> setReview((r:any)=> ({...r, stock: e.target.value===''? undefined : Number(e.target.value)}))} className="input" /></label>
                  
                  <label style={{ gridColumn:'1 / -1' }}>وصف طويل (ثقة {Math.round((review.confidence?.longDesc||0)*100)}%) <SourceBadge src={review.sources?.description} /><textarea ref={longDescRef} value={review.longDesc||''} onChange={(e)=> setReview((r:any)=> ({...r, longDesc:e.target.value}))} rows={4} className="input" /></label>
                  {Array.isArray(review.strictDetails) && review.strictDetails.length>0 && (
                    <div style={{ gridColumn:'1 / -1' }}>
                      <div style={{ marginBottom:6, color:'#9ca3af' }}>جدول تفاصيل المنتج (صارم)</div>
                      <div style={{ overflowX:'auto' }}>
                        <table className="table" role="table" aria-label="جدول تفاصيل المنتج">
                          <thead>
                            <tr>
                              <th>البند</th>
                              <th>القيمة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {review.strictDetails.map((r:any, idx:number)=> (
                              <tr key={idx}>
                                <td>{r.label}</td>
                                <td>{r.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div style={{ gridColumn:'1 / -1', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>
                      <div style={{ marginBottom:6, color:'#9ca3af' }}>المقاسات (ثقة {Math.round((review.confidence?.sizes||0)*100)}%) <SourceBadge src={review.sources?.sizes} /></div>
                      <input value={(review.sizes||[]).join(', ')} onChange={(e)=> setReview((r:any)=> ({...r, sizes: sanitizeSizesStrict(cleanTextStrict(paste), e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean), paste) }))} className="input" />
                      {(!review.sizes || review.sizes.length===0) && review?.reasons?.sizes && <div style={{ fontSize:12, color:'#ef4444' }}>{review.reasons.sizes}</div>}
                    </div>
                    <div>
                      <div style={{ marginBottom:6, color:'#9ca3af' }}>الألوان (ثقة {Math.round((review.confidence?.colors||0)*100)}%) <SourceBadge src={review.sources?.colors} /></div>
                      <input value={(review.colors||[]).join(', ')} onChange={(e)=> setReview((r:any)=> ({...r, colors: sanitizeColorsStrict(cleanTextStrict(paste), e.target.value.split(',').map((c:string)=>c.trim()).filter(Boolean)) }))} className="input" />
                      {(!review.colors || review.colors.length===0) && review?.reasons?.colors && <div style={{ fontSize:12, color:'#ef4444' }}>{review.reasons.colors}</div>}
                    </div>
                    {(() => {
                      const groups = Array.isArray((review as any).sizeGroups) ? (review as any).sizeGroups as Array<{label:string;values:string[]}> : [];
                      const g0 = groups[0] || { label: 'مقاس إضافي 1', values: [] };
                      const g1 = groups[1] || { label: 'مقاس إضافي 2', values: [] };
                      return (
                        <>
                          <div style={{ gridColumn: '1/2' }}>
                            <div style={{ marginBottom:6, color:'#9ca3af' }}>{g0.label}</div>
                            <input value={(g0.values||[]).join(', ')} onChange={(e)=> setReview((r:any)=>{
                              const arr = Array.isArray(r.sizeGroups)? [...r.sizeGroups] : [];
                              const vals = e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean);
                              const label = (arr[0]?.label) || g0.label;
                              arr[0] = { label, values: vals };
                              return { ...r, sizeGroups: arr };
                            })} className="input" />
                          </div>
                          <div style={{ gridColumn: '2/3' }}>
                            <div style={{ marginBottom:6, color:'#9ca3af' }}>{g1.label}</div>
                            <input value={(g1.values||[]).join(', ')} onChange={(e)=> setReview((r:any)=>{
                              const arr = Array.isArray(r.sizeGroups)? [...r.sizeGroups] : [];
                              const vals = e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean);
                              const label = (arr[1]?.label) || g1.label;
                              arr[1] = { label, values: vals };
                              return { ...r, sizeGroups: arr };
                            })} className="input" />
                          </div>
                        </>
                      );
                    })()}
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
            <RichTextEditor value={description} onChange={setDescription} />
            <small style={{ color:'var(--sub)' }}>يعرض المحرر التنسيق مباشرة (جداول، قوائم، نص منسّق). سيتم حفظ HTML كما هو.</small>
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
                  <button type="button" onClick={() => { setVariantRows(generateVariantRows()); }} className="btn btn-outline">توليد التباينات المتعددة</button>
                </div>
                {variantRows.length > 0 ? (
                  <div style={{ overflowX:'auto' }}>
            <table className="table" style={{ width:'100%' }}>
                      <thead>
                <tr>
                  {sizeTypeLabels.map(lbl=> (<th key={lbl}>{lbl}</th>))}
                  <th>اللون</th>
                  <th>سعر الشراء</th>
                  <th>سعر البيع</th>
                  <th>المخزون</th>
                  <th>SKU</th>
                  <th>صورة</th>
                  <th>المجموعة (قراءة فقط)</th>
                  <th></th>
                </tr>
                      </thead>
                      <tbody>
                        {variantRows.map((row, idx) => {
                          const parts = parseCompositeSizes(row.size);
                          return (
                          <tr key={idx}>
                            {sizeTypeLabels.map((lbl)=> (<td key={lbl}><input value={parts[lbl]||''} onChange={(e)=>{
                              const next = { ...parts, [lbl]: e.target.value };
                              const comp = Object.entries(next).filter(([k,v])=> (k&&v)).map(([k,v])=> `${k}:${v}`).join('|');
                              setVariantRows(prev=> prev.map((r,i)=> i===idx? { ...r, size: comp, option_values: [ ...(r.option_values||[]).filter(o=> o.name!=='size'), ...(comp? [{ name:'size', value: comp }]:[]) ] }: r));
                            }} className="input" />
                            </td>))}
                            <td><input value={row.color||''} onChange={(e)=> setVariantRows(prev=> prev.map((r,i)=> i===idx? { ...r, color: (e.target.value||undefined), option_values: [ ...(r.option_values||[]).filter(o=> o.name!=='color'), ...(e.target.value? [{ name:'color', value: e.target.value }]:[]) ] }: r))} className="input" /></td>
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
                              <select value={(()=>{ const key = (row.color || row.value || '').toString(); const mapped = (review?.mapping||{})[key]; return mapped || ''; })()} onChange={(e)=>{
                                const url = e.target.value || undefined;
                                const key = (row.color || row.value || '').toString();
                                setReview((r:any)=> ({...r, mapping: { ...(r?.mapping||{}), [key]: url }}));
                              }} className="select">
                                <option value="">(بدون)</option>
                                {(review?.palettes||[]).map((p:any, i:number)=> (<option key={i} value={p.url}>صورة {i+1}</option>))}
                              </select>
                            </td>
                            <td style={{ minWidth:280, color:'#6b7280' }}>{[...sizeTypeLabels.map(lbl=> parts[lbl]||'—'), (row.color||'—')].join(' • ')}</td>
                            <td>
                              <button type="button" onClick={()=> setVariantRows(prev => prev.filter((_,i)=> i!==idx))} className="icon-btn">حذف</button>
                            </td>
                          </tr>
                        )})}
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

        {/* Right column product images panel removed as requested */}

        {/* Moved preview + SEO + draft to bottom for unobstructed view */}
        <div className="panel" style={{ gridColumn:'1 / -1', marginTop: 8, padding:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ color:'var(--sub)' }}>المعاينة</div>
            <span className="badge">{type==='variable' ? 'متعدد' : 'بسيط'}</span>
          </div>
          <div style={{ fontWeight:700, marginTop:6 }}>{name || '— بدون اسم —'}</div>
          <div style={{ color:'var(--sub)', fontSize:12 }}>{categoryOptions.find(c=>c.id===categoryId)?.name || 'بدون تصنيف'}</div>
          <div className="panel" style={{ padding:10, marginTop:8 }}>
            <div style={{ marginBottom:6, color:'#9ca3af' }}>SEO</div>
            <div className="grid" style={{ gridTemplateColumns:'1fr', gap:8 }}>
              <input className="input" placeholder="SEO Title" value={seoTitle} onChange={(e)=> setSeoTitle(e.target.value)} />
              <input className="input" placeholder="SEO Description" value={seoDescription} onChange={(e)=> setSeoDescription(e.target.value)} />
            </div>
          </div>
          <div style={{ display:'flex', gap:12, marginTop:6 }}>
            <div><div style={{ color:'var(--sub)', fontSize:12 }}>سعر البيع</div><div>{salePrice || '—'}</div></div>
            <div><div style={{ color:'var(--sub)', fontSize:12 }}>المخزون</div><div>{stockQuantity || 0}</div></div>
            <div><div style={{ color:'var(--sub)', fontSize:12 }}>الصور</div><div>{(images||'').split(',').filter(Boolean).length + files.length}</div></div>
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}><input type="checkbox" checked={draft} onChange={(e)=> setDraft(e.target.checked)} /> حفظ كمسودّة (غير نشط)</label>
          <div style={{ display:'flex', gap:8, marginTop:8, justifyContent:'flex-end' }}>
            <button type="submit" className="btn">حفظ المنتج</button>
            <a href="/products" className="btn btn-outline">رجوع</a>
          </div>
        </div>
      </form>
      {toast && (<div className={`toast ${toast.type==='ok'?'ok':'err'}`}>{toast.text}</div>)}
    </main>
    </div>
  );
}

