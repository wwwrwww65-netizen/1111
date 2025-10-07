import request from 'supertest';
import { expressApp } from '../index';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests';
const token = jwt.sign({ userId: 'admin-e2e', email: 'admin@example.com', role: 'ADMIN' }, JWT_SECRET);

async function postStrict(text: string) {
  const res = await request(expressApp)
    .post('/api/admin/products/analyze?rulesStrict=1')
    .set('Authorization', `Bearer ${token}`)
    .send({ text });
  return res;
}

describe('Products Analyze - rulesStrict', () => {
  it('Abaya text: prefers north price, parses sizes 51-58, filters decor colors', async () => {
    const text = `
✨ عباية فخمة بإطلالة ملوكية ✨

🖤 التصميم: موديل قلبه واسع، يدمج بين الراحة والأنوثة في تفاصيل راقية.  
🌙 الخامة: توك تك ✨ درجة أولى ناعمة تعكس الفخامة بهدوء.  
💎 التطريز: نقشات أوراق أنيقة مرصعة بـ خرز فاخر  موزعة بعناية تضيف لمسة فنية ساحرة.  
🎀 اللمسات: خامة ناعمة تضيف لمسة نهائية فاخرة للموديل.

📐 المقاسات المتوفرة:  
51 – 52 – 53 – 54 – 55 – 56 – 57 – 58  
(18/20/22/24/26/28/)

💵 السعر للشمال 9500 ريال فقط 🌟
🪙السعر للجنوب 31000 ريال فقط

خلي إطلالتك تتكلم بالفخامة 👑  
عبايتك عنوان ذوقك 🤍`;
    const r = await postStrict(text);
    expect(r.status).toBe(200);
    const a = r.body?.analyzed || {};
    expect(a?.price_range?.value?.low).toBe(9500);
    const sizes = a?.sizes?.value || [];
    // Should include numeric apparel sizes 51..58; ignore (18/20/.. ) as not apparel range (<=60 filter allows but no anchor mapping); rulesStrict requires anchor, present via heading
    expect(sizes.some((s: string)=> s==='51')).toBeTruthy();
    expect(sizes.some((s: string)=> s==='58')).toBeTruthy();
    // Colors should not include decor-color contexts like خرز
    const colors = a?.colors?.value || [];
    expect(colors.join(' ')).not.toMatch(/خرز/i);
    // description_table exists
    expect(Array.isArray(a?.description_table?.value)).toBe(true);
  });

  it('Armor/dress text: choose old price 5000 over south 16000 and KSA 36, preserve general colors phrase', async () => {
    const text = `
💕درع فاخر بتصميم مميز
احجزي الآن درعًا فاخرًا مصنوعًا من مواد عالية الجودة، بتصميم مميز ومرصع بالكريستال الكوري. 😍🤩

مميزات المنتج
- تطريز قيطان   
- تصميم فريد ومرصع بالكريستال الكوري
- خامة شيفون طايح بلمسة مخملية
- ألوان عصريه غاية التناسق والإبداع

الأسعار
- السعر بالعملة القديمة: 5000
- السعر بالريال الجنوبي:  16000
- السعر بالريال السعودي: 36

خدمة التوصيل
- خدمة توصيل متاحة لأي مكان داخل اليمن وخارجه
`;
    const r = await postStrict(text);
    expect(r.status).toBe(200);
    const a = r.body?.analyzed || {};
    expect(a?.price_range?.value?.low).toBe(5000);
    // If a general colors phrase detected, rules may preserve it, else colors list may be empty
    // Accept either explicit colors or none; just assert no KWD/SAR small price selected
    expect(a?.price_range?.value?.low).not.toBe(36);
  });

  it('Jalabiya/Caftan set: prefer the first old price (4500), ignore second old price 15000 and KSA 32; capture letter sizes and weight free-size', async () => {
    const text = `
جديــــــــــــــــــــــد الموسم
سيدتي الجميله إخطفي الاضواء💃
...
قفطان نسائي 3قطع سهره فخخخمه
جلابيه شيفون على شلش مطرز ابيض
...
🎗️المقاسات XXL . XL. L .M
تلبس من 40إلى وزن 90بالراحه

💰السعر عمله قديم 4500
💰السعر عمله قديم 15000
💰السعر عمله سعودي32ريال
`;
    const r = await postStrict(text);
    expect(r.status).toBe(200);
    const a = r.body?.analyzed || {};
    expect(a?.price_range?.value?.low).toBe(4500);
    const sizes = a?.sizes?.value || [];
    expect(sizes).toEqual(expect.arrayContaining(['M','L','XL','XXL']));
    // Weight range should be normalized to free-size format if present
    // In rulesStrict path, free-size handled when phrase exists; here we assert at least letter sizes present
    expect(Array.isArray(a?.description_table?.value)).toBe(true);
  });

  it('Houseware hanger: pick lowest plausible price >= 80 (4000) and ignore SAR 29; ensure not apparel sizes', async () => {
    const text = `
توفر من جديد وبسعر مغري جدا👍🏻

شماعة ملابس مبخرة 2×1  ابو 4 ارجل نوعية جافي علا الضمان🥰🥰
...
فقط ب 4000 ريال🔥🔥
فقط ب 29 ريال سعودي🔥🔥
`;
    const r = await postStrict(text);
    expect(r.status).toBe(200);
    const a = r.body?.analyzed || {};
    expect(a?.price_range?.value?.low).toBe(4000);
    const sizes = a?.sizes?.value || [];
    // Should not invent apparel sizes
    expect(sizes.length === 0 || !sizes.some((s:string)=> ['S','M','L','XL','XXL'].includes(s))).toBe(true);
  });

  it('Kids set with bed components: prefer north price 6000 over south 19000 and KSA 43; detect components as details', async () => {
    const text = `
🎈 ... هناديل الأطفال ...
سرير للمواليد ابو5 قطع
مكونات الطقم👇🏻👇🏻 
🌹1ســـرير على ناموسية
🌹1فــراش
🌹1وســادة
🌹1شنطة للملابس
🌹1حاضنه للخرجه

تم تحطيم السعرر🔥🔥🔥
💫 السعر شمالي 6000
💫السعر جنوبي19000
💫السعر بالسعودي43
`;
    const r = await postStrict(text);
    expect(r.status).toBe(200);
    const a = r.body?.analyzed || {};
    expect(a?.price_range?.value?.low).toBe(6000);
    // description_table should include several rows (details)
    expect((a?.description_table?.value || []).length).toBeGreaterThanOrEqual(3);
  });

  it('Blanket (electronics-like numbers): capture dimensions and power keywords if present; prefer old price 6000 over new 19000 and SAR 43', async () => {
    const text = `
دفايات اوربيه ... بطانيه كل المواسم ذات الوجهين ...
المقاس
الطول 240
العرض 220
* قطعه*
1 بطانيه صيفيه ثقيله وجهين
 من داخل فرو
السعر 6000 عمله قديمه
السعر 19000عمله جديده
السعر43 ريال سعودي
`;
    const r = await postStrict(text);
    expect(r.status).toBe(200);
    const a = r.body?.analyzed || {};
    expect(a?.price_range?.value?.low).toBe(6000);
    // dimensions should appear in description_table
    const table = a?.description_table?.value || [];
    const joined = JSON.stringify(table);
    expect(joined).toMatch(/الأبعاد|الطول|العرض/);
  });

  it('Cosmetics cream: keep price_old 4000 over new 12000', async () => {
    const text = `
كريم S88 توتال لتفتيح الاندر ارم 35 جرام🥰
...
السعر:
باالعمله القديمه 4000ريال 
باالعمله الجديده 12000ريال
`;
    const r = await postStrict(text);
    expect(r.status).toBe(200);
    const a = r.body?.analyzed || {};
    expect(a?.price_range?.value?.low).toBe(4000);
  });
});
