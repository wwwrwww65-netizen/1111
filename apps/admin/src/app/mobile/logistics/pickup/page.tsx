"use client";
import React from 'react';
import { resolveApiBase } from '../../../lib/apiBase';

type PickupItem = { id:string; vendorId?:string; status:string; eta?:string };

export default function MobilePickup(): JSX.Element {
  const [items, setItems] = React.useState<PickupItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [po, setPo] = React.useState('');
  const [driver, setDriver] = React.useState('');
  const [status, setStatus] = React.useState('ASSIGNED');

  React.useEffect(()=>{ (async()=>{
    setLoading(true); setErr(null);
    try{
      const url = `${resolveApiBase()}/api/admin/logistics/pickup/list`;
      const j = await (await fetch(url, { headers:{ 'accept':'application/json' }, credentials:'include' })).json();
      setItems(j.pickups || j.items || []);
    }catch{ setErr('تعذر الجلب'); }
    finally{ setLoading(false); }
  })(); }, []);

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel" style={{ fontWeight:700 }}>استلام من المورد</div>
      <div className="panel">
        <div style={{ fontWeight:700, marginBottom:8 }}>إجراءات سريعة</div>
        <div className="grid" style={{ gridTemplateColumns:'1fr', gap:8 }}>
          <div style={{ display:'grid', gap:6 }}>
            <div style={{ fontWeight:700, fontSize:12, color:'var(--sub)' }}>إسناد سائق</div>
            <input className="input" placeholder="PO/الطلب" value={po} onChange={e=> setPo(e.target.value)} />
            <input className="input" placeholder="معرّف السائق" value={driver} onChange={e=> setDriver(e.target.value)} />
            <button className="btn" onClick={async()=>{
              if(!po || !driver) return;
              await fetch(`${resolveApiBase()}/api/admin/status/change`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ entity:'pickup', id: po, action: 'assign', extra:{ driverId: driver } }) });
              setPo(''); setDriver('');
            }}>إسناد</button>
          </div>
          <div style={{ display:'grid', gap:6 }}>
            <div style={{ fontWeight:700, fontSize:12, color:'var(--sub)' }}>تغيير الحالة</div>
            <input className="input" placeholder="PO/الطلب" value={po} onChange={e=> setPo(e.target.value)} />
            <select className="select" value={status} onChange={e=> setStatus(e.target.value)}>
              <option value="ASSIGNED">تم الإسناد</option>
              <option value="IN_PROGRESS">قيد التنفيذ</option>
              <option value="PICKED">تم الالتقاط</option>
              <option value="CANCELLED">ألغيت</option>
            </select>
            <button className="btn btn-outline" onClick={async()=>{
              if(!po) return;
              await fetch(`${resolveApiBase()}/api/admin/status/change`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ entity:'pickup', id: po, action: status }) });
              setPo('');
            }}>تحديث</button>
          </div>
        </div>
      </div>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {err && <div className="panel" style={{ color:'var(--err)' }}>{err}</div>}
      {!loading && !err && items.length===0 && <div className="panel" style={{ color:'var(--sub)' }}>لا توجد مهام</div>}
      {!loading && !err && items.map((it)=> (
        <div key={it.id} className="panel" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:700 }}>{it.id}</div>
            <div style={{ color:'var(--sub)', fontSize:12 }}>المورد: {it.vendorId || '—'}</div>
          </div>
          <div style={{ textAlign:'end' }}>
            <div className="badge" style={{ background:'#101828', border:'1px solid #233046', padding:'4px 8px', borderRadius:8 }}>{it.status}</div>
            {it.eta && <div style={{ fontSize:12, color:'var(--sub)', marginTop:4 }}>ETA: {it.eta}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

