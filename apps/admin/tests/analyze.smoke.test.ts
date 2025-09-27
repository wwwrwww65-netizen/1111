/* eslint-disable */
/* global describe, it, expect */
declare const describe: any; declare const it: any; declare const expect: any;
import fetch from 'node-fetch'

describe('Analyze Arabic descriptions (smoke)', () => {
  const API = process.env.API_BASE || 'http://localhost:4000';
  it('returns partial success and fields for varied Arabic sample', async () => {
    const text = `*جديد* *طقم طقم نسائي قطعتين احلا ماركه راقي* *يتميز ثلاث قطع منفصله* *فستان نسائي طويل مورد كلوش امبريلا* *جاكت كم طويل حرير تركي مزين بي الامام بكرستال فضي وفتحه من الخلف زرار* *حزام خصر منفصل* *شكل جديد ومميز* *5اللوان تحححفه* *تشكيله الترند الجديد* *قماش الجاكت حرير تركي الأصلي قماش الفستان حرير باربي الأصلي* *مقاسات L_Xl يلبس *من وزن 40الى وزن 70* *السعر* *عمله قديم 3500* *عمله جديد 11000* *الكل يعرض متوفر بكميات*`;
    const r = await fetch(`${API}/api/admin/products/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, images: [] }),
    });
    const j: any = await r.json();
    expect(r.ok).toBeTruthy();
    expect(j.ok).toBeTruthy();
    expect(j.analyzed?.name?.value).toBeTruthy();
    // Prefer old 3500 for cost/low when present
    const low = j.analyzed?.price_range?.value?.low;
    expect(typeof low === 'number' && low === 3500).toBeTruthy();
    // Sizes should capture free-size by weight or L/XL token
    const sizes = j.analyzed?.sizes?.value || [];
    expect(Array.isArray(sizes)).toBeTruthy();
    expect(sizes.length).toBeGreaterThan(0);
  });
});

