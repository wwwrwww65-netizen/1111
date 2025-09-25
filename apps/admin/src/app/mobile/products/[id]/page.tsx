"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { resolveApiBase } from '../../../lib/apiBase';
import { ActionBarMobile, FormGrid } from '../../../components/Mobile';

export default function MobileProductDetail(): JSX.Element {
  const params = useParams();
  const id = String(params?.id || '');
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(()=>{ let alive=true; (async()=>{
    try{
      const r = await fetch(`${resolveApiBase()}/api/admin/products/${id}`, { headers:{ 'accept':'application/json' } });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const j = await r.json();
      if(alive) setData(j);
    }catch{ if(alive) setErr('تعذر الجلب'); }
    finally{ if(alive) setLoading(false); }
  })(); return ()=>{ alive=false; }; }, [id]);

  async function save(){
    if(!data) return;
    setSaving(true); setErr(null);
    try{
      const r = await fetch(`${resolveApiBase()}/api/admin/products/${id}`, { method:'PATCH', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ name: data.name, price: data.price }) });
      if(!r.ok) throw new Error('failed');
    }catch{ setErr('تعذر الحفظ'); }
    finally{ setSaving(false); }
  }

  return (
    <div className="grid" style={{ gap:12 }}>
      <button className="icon-btn" onClick={()=> history.length>1 ? history.back() : location.assign('/mobile/products')}>رجوع</button>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {err && <div className="panel" style={{ color:'var(--err)' }}>{err}</div>}
      {!loading && !err && data && (
        <div className="panel">
          <div style={{ fontWeight:800, marginBottom:8 }}>تعديل منتج</div>
          <FormGrid>
            <label>
              <div style={{ marginBottom:6 }}>الاسم</div>
              <input className="input" value={data.name||''} onChange={e=> setData((d:any)=> ({...d, name:e.target.value}))} />
            </label>
            <label>
              <div style={{ marginBottom:6 }}>السعر</div>
              <input className="input" value={data.price||''} onChange={e=> setData((d:any)=> ({...d, price:e.target.value}))} />
            </label>
          </FormGrid>
        </div>
      )}
      <ActionBarMobile>
        <button className="btn btn-outline" onClick={()=> history.length>1 ? history.back() : location.assign('/mobile/products')}>إلغاء</button>
        <button className="btn" disabled={saving} onClick={save}>حفظ</button>
      </ActionBarMobile>
    </div>
  );
}

