/* eslint-disable */
/* global describe, it, expect */
declare const describe: any; declare const it: any; declare const expect: any;
import { parseProductText } from '../nlp-ar'

describe('parseProductText (Arabic sample)', () => {
  const sample = `🤩جديديناءغيرر🔥🔥🔥\n\nدلع واناقة💃🏼\n\nفنائل  نسائي يتميز ب:\n\nتشكيله جديده 🥰\n     زرارات انيقه \n✨قماش صوف  🤤\n      كم كامل\n✨2الوان   \n\n✨خارجي \n\n✨المقاسات. \nمن وزن40 حتى وزن 60\n\n💱السعرللشمال 850/فقط🤑🤑\n💱السعر عمله جنوبي3000 /فقط🤑🤑\n\nمتوووفر بكمية كبيرة`;

  it('extracts key fields robustly', () => {
    const r = parseProductText(sample);
    expect(r).toBeTruthy();
    expect(Array.isArray(r.sizes)).toBe(true);
    const hasFreeSize = (r.sizes||[]).some(s=> /فري\s*سايز/i.test(String(s)));
    expect(hasFreeSize).toBe(true);
    expect(r.purchasePrice === 850 || r.purchasePrice === 3000).toBe(true);
    expect(Array.isArray(r.colors)).toBe(true);
    expect(r.keywords.length).toBeGreaterThanOrEqual(0);
  });
});

describe('parseProductText (Provided Arabic set sample)', () => {
  const sample2 = `*جديد* *طقم طقم نسائي قطعتين احلا ماركه راقي* *يتميز ثلاث قطع منفصله* *فستان نسائي طويل مورد كلوش امبريلا* *جاكت كم طويل حرير تركي مزين بي الامام بكرستال فضي وفتحه من الخلف زرار* *حزام خصر منفصل* *شكل جديد ومميز* *5اللوان تحححفه* *تشكيله الترند الجديد* *قماش الجاكت حرير تركي الأصلي قماش الفستان حرير باربي الأصلي* *مقاسات L_Xl يلبس *من وزن 40الى وزن 70* *السعر* *عمله قديم 3500* *عمله جديد 11000* *الكل يعرض متوفر بكميات*`;

  it('prefers old price for cost and detects sizes', () => {
    const r = parseProductText(sample2);
    expect(r).toBeTruthy();
    // cost should prefer 3500 (قديم)
    expect(r.purchasePrice).toBe(3500);
    // sizes should include either free-size by weight or L/XL token
    expect(Array.isArray(r.sizes)).toBe(true);
    expect((r.sizes||[]).length).toBeGreaterThan(0);
  });
});

