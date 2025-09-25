"use client";
import React from 'react';
import { resolveApiBase } from '../../../lib/apiBase';
import { ActionBarMobile, FormGrid } from '../../../components/Mobile';

export default function MobileNewProduct(): JSX.Element {
  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [ok, setOk] = React.useState('');

  async function save(){
    if (!name.trim()) { setErr('ادخل الاسم'); return; }
    setErr(''); setOk(''); setSaving(true);
    try{
      const res = await fetch(`${resolveApiBase()}/api/admin/products`, {
        method:'POST', headers:{ 'content-type':'application/json' },
        credentials:'include', body: JSON.stringify({ name, price: Number(price)||0 })
      });
      if(!res.ok) throw new Error('failed');
      setOk('تم الحفظ'); setName(''); setPrice('');
    }catch{ setErr('تعذر الحفظ'); }
    finally{ setSaving(false); }
  }

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:800, marginBottom:8 }}>منتج جديد (هاتف)</div>
        {err && <div style={{ color:'var(--err)', marginBottom:8 }}>{err}</div>}
        {ok && <div style={{ color:'var(--ok)', marginBottom:8 }}>{ok}</div>}
        <FormGrid>
          <label>
            <div style={{ marginBottom:6 }}>الاسم</div>
            <input className="input" value={name} onChange={e=> setName(e.target.value)} placeholder="اسم المنتج" />
          </label>
          <label>
            <div style={{ marginBottom:6 }}>السعر</div>
            <input className="input" value={price} onChange={e=> setPrice(e.target.value)} placeholder="0" inputMode="decimal" />
          </label>
        </FormGrid>
      </div>
      <ActionBarMobile>
        <button className="btn btn-outline" onClick={()=> history.length>1 ? history.back() : location.assign('/mobile')}>إلغاء</button>
        <button className="btn" disabled={saving} onClick={save}>حفظ</button>
      </ActionBarMobile>
    </div>
  );
}

