"use client";
import React from 'react';
import { resolveApiBase } from '../../../lib/apiBase';

type WarehouseItem = { id:string; status:string; packageId?:string };

export default function MobileWarehouse(): JSX.Element {
  const [items, setItems] = React.useState<WarehouseItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [confirmShipment, setConfirmShipment] = React.useState('');
  const [sortPackage, setSortPackage] = React.useState('');
  const [assignReady, setAssignReady] = React.useState<{ pkg:string; driver:string }>({ pkg:'', driver:'' });

  React.useEffect(()=>{ (async()=>{
    setLoading(true); setErr(null);
    try{
      const url = `${resolveApiBase()}/api/admin/logistics/warehouse/list`;
      const j = await (await fetch(url, { headers:{ 'accept':'application/json' }, credentials:'include' })).json();
      setItems(j.items || []);
    }catch{ setErr('تعذر الجلب'); }
    finally{ setLoading(false); }
  })(); }, []);

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel" style={{ fontWeight:700 }}>المستودع</div>
      <div className="panel">
        <div style={{ fontWeight:700, marginBottom:8 }}>إجراءات سريعة</div>
        <div className="grid" style={{ gridTemplateColumns:'1fr', gap:8 }}>
          <div style={{ display:'grid', gap:6 }}>
            <div style={{ fontWeight:700, fontSize:12, color:'var(--sub)' }}>تأكيد وصول شحنة</div>
            <input className="input" placeholder="معرّف الشحنة" value={confirmShipment} onChange={e=> setConfirmShipment(e.target.value)} />
            <button className="btn" onClick={async()=>{
              if(!confirmShipment) return;
              await fetch(`${resolveApiBase()}/api/admin/logistics/warehouse/inbound/confirm`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ shipmentId: confirmShipment }) });
              setConfirmShipment('');
            }}>تأكيد</button>
          </div>
          <div style={{ display:'grid', gap:6 }}>
            <div style={{ fontWeight:700, fontSize:12, color:'var(--sub)' }}>نتيجة الفرز</div>
            <input className="input" placeholder="معرّف الطرد" value={sortPackage} onChange={e=> setSortPackage(e.target.value)} />
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-outline" onClick={async()=>{ if(!sortPackage) return; await fetch(`${resolveApiBase()}/api/admin/logistics/warehouse/sorting/result`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ packageId: sortPackage, match:true }) }); setSortPackage(''); }}>مطابق</button>
              <button className="btn btn-outline" onClick={async()=>{ if(!sortPackage) return; await fetch(`${resolveApiBase()}/api/admin/logistics/warehouse/sorting/result`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ packageId: sortPackage, match:false }) }); setSortPackage(''); }}>غير مطابق</button>
            </div>
          </div>
          <div style={{ display:'grid', gap:6 }}>
            <div style={{ fontWeight:700, fontSize:12, color:'var(--sub)' }}>إسناد جاهز للتسليم</div>
            <input className="input" placeholder="معرّف الطرد" value={assignReady.pkg} onChange={e=> setAssignReady(s=> ({...s, pkg:e.target.value}))} />
            <input className="input" placeholder="معرّف السائق" value={assignReady.driver} onChange={e=> setAssignReady(s=> ({...s, driver:e.target.value}))} />
            <button className="btn" onClick={async()=>{
              if(!assignReady.pkg || !assignReady.driver) return;
              await fetch(`${resolveApiBase()}/api/admin/logistics/warehouse/ready/assign`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ packageId: assignReady.pkg, driverId: assignReady.driver }) });
              setAssignReady({ pkg:'', driver:'' });
            }}>إسناد</button>
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

