import fetch from 'node-fetch'

describe('Analyze Arabic descriptions (smoke)', () => {
  const API = process.env.API_BASE || 'http://localhost:4000';
  it('returns partial success and fields for varied Arabic sample', async () => {
    const text = `طقم نسائي 3 قطع حرير تركي مزين بكريستال
    مقاسات L و XL يلبس من وزن 40 الى 70
    السعر للشمال 3500`;
    const r = await fetch(`${API}/api/admin/products/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, images: [] }),
    });
    const j = await r.json();
    expect(r.ok).toBeTruthy();
    expect(j.ok).toBeTruthy();
    expect(j.analyzed?.name?.value).toBeTruthy();
    const low = j.analyzed?.price_range?.value?.low;
    expect(typeof low === 'number' && low >= 80).toBeTruthy();
  });
});

