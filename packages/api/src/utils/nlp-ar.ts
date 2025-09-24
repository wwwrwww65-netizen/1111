/* Arabic NLP helpers: normalization, extraction for product parsing */
export function stripHtml(input: string): string {
  return String(input || '').replace(/<[^>]*>/g, ' ');
}

export function arabicIndicToLatinDigits(input: string): string {
  return String(input || '')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
}

export function stripEmojis(input: string): string {
  return String(input || '').replace(/[\u{1F300}-\u{1FAFF}\u{1F900}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{FE0F}]/gu, ' ');
}

export function normalizeWhitespace(input: string): string {
  return String(input || '').replace(/[\t\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

export function normalizeArabic(input: string): string {
  return String(input || '')
    .replace(/[\u064B-\u065F]/g, '') // diacritics
    .replace(/\u0640/g, '') // tatweel
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

export function cleanMarketingNoise(input: string): string {
  const noise = [
    'لايفوتك','العرض محدود','جديد اليوم','حاجة فخمة','شغل خارجي','تميز','تخفيض','خصم','عرض','افضل','الأفضل','حصري','مجاني','شحن مجاني',
    'free','sale','offer','best','amazing','awesome','premium','original','new','🔥','👇','💎','🤩','👌','🥰','🤤','🤑','✨','-'
  ];
  let s = String(input || '');
  for (const w of noise) s = s.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
  return s;
}

export function baseClean(input: string): string {
  return normalizeWhitespace(cleanMarketingNoise(stripEmojis(arabicIndicToLatinDigits(stripHtml(input)))));
}

const COLOR_LEXICON = [
  'احمر','ازرق','اخضر','اسود','ابيض','اصفر','بني','بيج','رمادي','وردي','بنفسجي','كحلي','سماوي','فيروزي','عنابي','ذهبي','فضي',
  'red','blue','green','black','white','yellow','brown','beige','gray','pink','purple','navy','sky','turquoise','maroon','gold','silver'
];

export function extractColors(text: string): string[] {
  const res = new Set<string>();
  const s = text.toLowerCase();
  for (const c of COLOR_LEXICON) {
    const rx = new RegExp(`(?:^|\n|\b)${c}(?:\b|\s|,|\.|$)`, 'gi');
    if (rx.test(s)) res.add(c);
  }
  // Special phrase "لونين/2 الوان" ⇒ unknown but plural
  if (/\b(لونين|2\s*الوان|لونان)\b/i.test(text)) res.add('لونين');
  return Array.from(res);
}

export function extractSizes(text: string): string[] {
  const sizes = new Set<string>();
  const s = text;
  const en = s.match(/\b(XXL|XL|L|M|S|XS|XXS|\d{2})\b/gi) || [];
  en.forEach((v) => sizes.add(v.toUpperCase()));
  const freeRange = s.match(/من\s*وزن\s*(\d{2,3})\s*(?:حتى|الى|إلى)\s*وزن\s*(\d{2,3})/i);
  if (freeRange) sizes.add(`فري سايز (${freeRange[1]}–${freeRange[2]} كجم)`);
  if (/فري\s*سايز/i.test(s)) sizes.add('فري سايز');
  return Array.from(sizes);
}

export function detectCurrencyToken(text: string): string | null {
  const m = text.match(/(﷼|ر\.س|ريال|sar|aed|usd|\$|egp|kwd|qr)/i);
  return m ? m[1] : null;
}

export function extractPrices(text: string): { sale?: number; cost?: number } {
  // Supports thousand separators and decimals: 1,299.50 or 1299 or 1\u00A0299
  const num = '[0-9]{1,3}(?:[\u202F\u00A0\s,][0-9]{3})*(?:[\.,][0-9]{1,2})?|[0-9]+(?:[\.,][0-9]{1,2})?';
  const token = '(?:﷼|ريال|sar|aed|usd|rs|qr|egp|kwd)?';
  const saleRx = new RegExp(`(?:سعر\\s*البيع|sale|price)[^\n]*?(${num})\s*${token}`, 'i');
  const northRx = new RegExp(`(?:للشمال|السعر\\s*للشمال)[^\n]*?(${num})\s*${token}`, 'i');
  const southRx = new RegExp(`(?:جنوبي|الجنوب|عمله\\s*جنوبي)[^\n]*?(${num})\s*${token}`, 'i');
  const oldRx = new RegExp(`(?:قديم|القديم)[^\n]*?(${num})\s*${token}`, 'i');
  const clean = text.replace(/[\u202F\u00A0]/g, ' ');
  const toNum = (v?: string) => v ? Number(String(v).replace(/[\s,]/g, '').replace(',', '.')) : undefined;
  const sale = toNum(clean.match(saleRx)?.[1]);
  const north = toNum(clean.match(northRx)?.[1]);
  const south = toNum(clean.match(southRx)?.[1]);
  const old = toNum(clean.match(oldRx)?.[1]);
  // Prefer old > north > south > sale for purchase/cost
  const cost = old ?? north ?? south ?? undefined;
  return { sale, cost };
}

export function extractStock(text: string): number | undefined {
  const m = text.match(/(?:المخزون|الكمية|متوفر\s*ب?كمية|stock|qty)[^\n]*?(\d{1,6})/i);
  return m ? Number(m[1]) : undefined;
}

export function extractKeywords(text: string): string[] {
  const stop = new Set(['و','في','من','على','الى','إلى','عن','هو','هي','هذا','هذه','ذلك','تلك','مع','او','أو']);
  const norm = normalizeArabic(text.toLowerCase()).replace(/[^\p{Script=Arabic}a-z\s]/gu, ' ');
  const words = norm.split(/\s+/).filter(Boolean);
  const freq = new Map<string, number>();
  for (const w of words) {
    if (w.length < 3 || stop.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);
}

export function composeSeoName(clean: string, fallback: string): string {
  const typeMatch = clean.match(/(فنيله|فنيلة|فنائل|جاكيت|معطف|فستان|قميص|بلوزه|بلوزة|سويتر|بلوفر|هودي|hoodie|sweater|jacket|coat|dress|shirt|blouse)/i);
  const normalizedType = typeMatch ? (/فنائل/i.test(typeMatch[1]) ? 'فنيلة' : typeMatch[1]) : '';
  const gender = clean.match(/(نسائي|رجالي|اطفالي|بناتي|ولادي|women|men|kids)/i)?.[1] || '';
  const mat = clean.match(/(صوف|قطن|جلد|لينن|قماش|denim|leather|cotton|wool)/i)?.[1] || '';
  const feat = /كم\s*كامل/i.test(clean) ? 'كم كامل' : '';
  const parts = [normalizedType && gender ? `${normalizedType} ${gender}` : (normalizedType || gender), mat || feat].filter(Boolean);
  const base = parts.join(' ').trim();
  const name = base || fallback || clean.slice(0, 60);
  return name.length > 90 ? name.slice(0, 90) : name;
}

export function parseProductText(raw: string) {
  const cleaned = baseClean(raw);
  const colors = extractColors(cleaned);
  const sizes = extractSizes(cleaned);
  const { sale, cost } = extractPrices(cleaned);
  const stock = extractStock(cleaned);
  const currency = detectCurrencyToken(raw || '') || (/ريال|﷼/i.test(raw || '') ? 'ريال' : null);
  const name = composeSeoName(cleaned, '');
  const shortDesc = cleaned.slice(0, 160);
  const longDesc = cleaned.length < 80 ? cleaned : cleaned.slice(0, 300);
  const keywords = extractKeywords(cleaned);
  const confidence = {
    name: name ? 0.9 : 0.5,
    shortDesc: shortDesc ? 0.8 : 0.2,
    longDesc: longDesc ? 0.8 : 0.2,
    salePrice: sale !== undefined ? 0.75 : 0.2,
    purchasePrice: cost !== undefined ? 0.75 : 0.2,
    sizes: sizes.length ? 0.7 : 0.2,
    colors: colors.length ? 0.7 : 0.2,
    stock: stock !== undefined ? 0.6 : 0.2,
    keywords: keywords.length ? 0.6 : 0.2,
  } as const;
  const notes = /لونين|2\s*الوان/i.test(raw) ? 'ذُكر وجود لونين؛ يُفضّل تسمية الألوان وربط الصور بها.' : null;
  return {
    name,
    shortDesc,
    longDesc,
    purchasePrice: cost ?? null,
    salePrice: sale ?? null,
    stock: stock ?? null,
    sizes,
    colors,
    keywords,
    currency,
    clean_text: cleaned,
    confidence,
    notes,
  };
}

