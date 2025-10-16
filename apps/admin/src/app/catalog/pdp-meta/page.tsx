"use client";
import React from 'react';

type Meta = {
  badges?: Array<{ title: string; subtitle?: string; bgColor?: string }>;
  bestRank?: number | null;
  fitPercent?: number | null;
  fitText?: string | null;
  shippingDestinationOverride?: string | null;
  sellerBlurb?: string | null;
  model?: { size?: string; height?: number; bust?: number; waist?: number; hips?: number } | null;
};

export default function Page(): JSX.Element {
  const [productId, setProductId] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [meta, setMeta] = React.useState<Meta>({ badges: [] });
  const [message, setMessage] = React.useState<string>("");

  const load = async () => {
    setMessage(""); setLoading(true);
    try {
      const r = await fetch(`/api/admin/pdp/meta/${encodeURIComponent(productId)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'failed');
      setMeta(j?.meta || { badges: [] });
    } catch (e: any) {
      setMessage(e?.message || 'فشل الجلب');
    } finally { setLoading(false); }
  };

  const save = async () => {
    setMessage(""); setLoading(true);
    try {
      const r = await fetch(`/api/admin/pdp/meta/${encodeURIComponent(productId)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(meta) });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'failed');
      setMessage('تم الحفظ');
    } catch (e: any) {
      setMessage(e?.message || 'فشل الحفظ');
    } finally { setLoading(false); }
  };

  const updateBadge = (idx: number, key: keyof Meta["badges"][number], val: string) => {
    setMeta(m => {
      const list = Array.isArray(m.badges) ? [...m.badges] : [];
      list[idx] = { ...(list[idx] || { title: '' }), [key]: val } as any;
      return { ...m, badges: list };
    });
  };

  const addBadge = () => setMeta(m => ({ ...m, badges: [...(m.badges || []), { title: '' }] }));
  const delBadge = (idx: number) => setMeta(m => ({ ...m, badges: (m.badges || []).filter((_,i)=> i!==idx) }));

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>بيانات PDP (شارات/مقاس/عارضة)</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={productId} onChange={e=> setProductId(e.target.value)} placeholder="معرّف المنتج" style={{ padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
        <button onClick={load} disabled={!productId || loading} style={{ padding: '8px 12px', borderRadius: 8, background: '#111', color: '#fff' }}>جلب</button>
        <button onClick={save} disabled={!productId || loading} style={{ padding: '8px 12px', borderRadius: 8, background: '#8a1538', color: '#fff' }}>حفظ</button>
      </div>
      {message && <div style={{ marginBottom: 12, color: '#8a1538' }}>{message}</div>}

      <div style={{ display: 'grid', gap: 16 }}>
        <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 8 }}>الشارات</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {(meta.badges || []).map((b, i) => (
              <div key={i} style={{ display: 'grid', gap: 6, gridTemplateColumns: '1fr 1fr 1fr auto', alignItems: 'center' }}>
                <input value={b.title || ''} onChange={e=> updateBadge(i, 'title', e.target.value)} placeholder="العنوان" style={{ padding: 6, border:'1px solid #ddd', borderRadius: 8 }} />
                <input value={b.subtitle || ''} onChange={e=> updateBadge(i, 'subtitle', e.target.value)} placeholder="نص فرعي" style={{ padding: 6, border:'1px solid #ddd', borderRadius: 8 }} />
                <input value={b.bgColor || ''} onChange={e=> updateBadge(i, 'bgColor', e.target.value)} placeholder="#8a1538" style={{ padding: 6, border:'1px solid #ddd', borderRadius: 8 }} />
                <button onClick={()=> delBadge(i)} style={{ padding: '6px 10px', borderRadius: 8, border:'1px solid #ddd' }}>حذف</button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={addBadge} style={{ padding: '6px 10px', borderRadius: 8, border:'1px solid #ddd' }}>+ إضافة شارة</button>
          </div>
        </section>

        <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 8 }}>الأفضل مبيعاً والمقاس</h2>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
            <label>الترتيب الأفضل مبيعاً
              <input type="number" value={meta.bestRank ?? ''} onChange={e=> setMeta(m=> ({ ...m, bestRank: e.target.value? Number(e.target.value): null }))} style={{ padding: 6, border:'1px solid #ddd', borderRadius: 8, width: '100%' }} />
            </label>
            <label>نسبة الملاءمة %
              <input type="number" value={meta.fitPercent ?? ''} onChange={e=> setMeta(m=> ({ ...m, fitPercent: e.target.value? Number(e.target.value): null }))} style={{ padding: 6, border:'1px solid #ddd', borderRadius: 8, width: '100%' }} />
            </label>
            <label style={{ gridColumn: '1 / span 2' }}>نص الملاءمة
              <input value={meta.fitText || ''} onChange={e=> setMeta(m=> ({ ...m, fitText: e.target.value }))} style={{ padding: 6, border:'1px solid #ddd', borderRadius: 8, width: '100%' }} />
            </label>
            <label style={{ gridColumn: '1 / span 2' }}>الدولة الظاهرة في عنوان الشحن
              <input value={meta.shippingDestinationOverride || ''} onChange={e=> setMeta(m=> ({ ...m, shippingDestinationOverride: e.target.value }))} style={{ padding: 6, border:'1px solid #ddd', borderRadius: 8, width: '100%' }} />
            </label>
            <label style={{ gridColumn: '1 / span 2' }}>وصف قصير للبائع
              <input value={meta.sellerBlurb || ''} onChange={e=> setMeta(m=> ({ ...m, sellerBlurb: e.target.value }))} style={{ padding: 6, border:'1px solid #ddd', borderRadius: 8, width: '100%' }} />
            </label>
          </div>
        </section>

        <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 8 }}>بيانات العارضة</h2>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(5, 1fr)' }}>
            <input placeholder="المقاس (S/M/L)" value={meta.model?.size || ''} onChange={e=> setMeta(m=> ({ ...m, model: { ...(m.model||{}), size: e.target.value } }))} style={{ padding: 6, border:'1px solid #ddd', borderRadius: 8 }} />
            <input placeholder="الطول" type="number" value={meta.model?.height ?? ''} onChange={e=> setMeta(m=> ({ ...m, model: { ...(m.model||{}), height: e.target.value? Number(e.target.value): undefined } }))} style={{ padding: 6, border:'1px solid #ddd', borderRadius: 8 }} />
            <input placeholder="الصدر" type="number" value={meta.model?.bust ?? ''} onChange={e=> setMeta(m=> ({ ...m, model: { ...(m.model||{}), bust: e.target.value? Number(e.target.value): undefined } }))} style={{ padding: 6, border:'1px solid #ddd', borderRadius: 8 }} />
            <input placeholder="الخصر" type="number" value={meta.model?.waist ?? ''} onChange={e=> setMeta(m=> ({ ...m, model: { ...(m.model||{}), waist: e.target.value? Number(e.target.value): undefined } }))} style={{ padding: 6, border:'1px solid #ddd', borderRadius: 8 }} />
            <input placeholder="الورك" type="number" value={meta.model?.hips ?? ''} onChange={e=> setMeta(m=> ({ ...m, model: { ...(m.model||{}), hips: e.target.value? Number(e.target.value): undefined } }))} style={{ padding: 6, border:'1px solid #ddd', borderRadius: 8 }} />
          </div>
        </section>
      </div>
    </div>
  );
}


