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

