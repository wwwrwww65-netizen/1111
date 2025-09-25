"use client";
import React from 'react';
import { resolveApiBase } from '../../../lib/apiBase';

type DeliveryItem = { id:string; status:string; orderId?:string };

export default function MobileDelivery(): JSX.Element {
  const [items, setItems] = React.useState<DeliveryItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [assignOrder, setAssignOrder] = React.useState('');
  const [assignDriver, setAssignDriver] = React.useState('');
  const [proofOrder, setProofOrder] = React.useState('');
  const [statusOrder, setStatusOrder] = React.useState('');
  const [newStatus, setNewStatus] = React.useState('OUT_FOR_DELIVERY');

  React.useEffect(()=>{ (async()=>{
    setLoading(true); setErr(null);
    try{
      const url = `${resolveApiBase()}/api/admin/logistics/delivery/list`;
      const j = await (await fetch(url, { headers:{ 'accept':'application/json' }, credentials:'include' })).json();
      setItems(j.items || []);
    }catch{ setErr('تعذر الجلب'); }
    finally{ setLoading(false); }
  })(); }, []);

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel" style={{ fontWeight:700 }}>التوصيل</div>
      <div className="panel">
        <div style={{ fontWeight:700, marginBottom:8 }}>إجراءات سريعة</div>
        <div className="grid" style={{ gridTemplateColumns:'1fr', gap:8 }}>
          <div style={{ display:'grid', gap:6 }}>
            <div style={{ fontWeight:700, fontSize:12, color:'var(--sub)' }}>إسناد سائق</div>
            <input className="input" placeholder="رقم الطلب" value={assignOrder} onChange={e=> setAssignOrder(e.target.value)} />
            <input className="input" placeholder="معرّف السائق" value={assignDriver} onChange={e=> setAssignDriver(e.target.value)} />
            <button className="btn" onClick={async()=>{
              if(!assignOrder || !assignDriver) return;
              const r = await fetch(`${resolveApiBase()}/api/admin/logistics/delivery/assign`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderId: assignOrder, driverId: assignDriver }) });
              if(r.ok){ setAssignOrder(''); setAssignDriver(''); (async()=>{ try{ const j = await (await fetch(`${resolveApiBase()}/api/admin/logistics/delivery/list`, { credentials:'include' })).json(); setItems(j.items||[]);}catch{}})(); }
            }}>إسناد</button>
          </div>
          <div style={{ display:'grid', gap:6 }}>
            <div style={{ fontWeight:700, fontSize:12, color:'var(--sub)' }}>تحديث الحالة</div>
            <input className="input" placeholder="رقم/معرّف التسليم" value={statusOrder} onChange={e=> setStatusOrder(e.target.value)} />
            <select className="select" value={newStatus} onChange={e=> setNewStatus(e.target.value)}>
              <option value="OUT_FOR_DELIVERY">خارج للتسليم</option>
              <option value="DELIVERED">تم التسليم</option>
              <option value="FAILED">فشل التسليم</option>
            </select>
            <button className="btn btn-outline" onClick={async()=>{
              if(!statusOrder) return;
              await fetch(`${resolveApiBase()}/api/admin/status/change`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ entity:'delivery', id: statusOrder, action: newStatus }) });
              setStatusOrder('');
            }}>تحديث</button>
          </div>
          <div style={{ display:'grid', gap:6 }}>
            <div style={{ fontWeight:700, fontSize:12, color:'var(--sub)' }}>إثبات التسليم</div>
            <input className="input" placeholder="رقم الطلب" value={proofOrder} onChange={e=> setProofOrder(e.target.value)} />
            <button className="btn" onClick={async()=>{
              if(!proofOrder) return;
              const r = await fetch(`${resolveApiBase()}/api/admin/logistics/delivery/proof`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderId: proofOrder }) });
              if(r.ok){ setProofOrder(''); }
            }}>حفظ إثبات (بدون مرفق)</button>
          </div>
        </div>
      </div>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {err && <div className="panel" style={{ color:'var(--err)' }}>{err}</div>}
      {!loading && !err && items.length===0 && <div className="panel" style={{ color:'var(--sub)' }}>لا توجد عناصر</div>}
      {!loading && !err && items.map((it)=> (
        <div key={it.id} className="panel" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:700 }}>{it.id}</div>
          <div className="badge" style={{ background:'#101828', border:'1px solid #233046', padding:'4px 8px', borderRadius:8 }}>{it.status}</div>
        </div>
      ))}
    </div>
  );
}

