"use client";
import React from 'react';
import { BackButton } from '../../components/Mobile';
import { resolveApiBase } from "../../lib/apiBase";

export default function OrderDetailPage({ params }: { params: { id: string } }): JSX.Element {
  const { id } = params;
  const [order, setOrder] = React.useState<any>(null);
  const [timeline, setTimeline] = React.useState<Array<{id:string;type:string;message?:string;meta?:any;createdAt:string}>>([]);
  const [showModal, setShowModal] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [driverId, setDriverId] = React.useState('');
  const [carrierId, setCarrierId] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [dimensions, setDimensions] = React.useState('');
  const [drivers, setDrivers] = React.useState<any[]>([]);
  const [carriers, setCarriers] = React.useState<any[]>([]);

  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  React.useEffect(()=>{ (async ()=>{
    try{
      const [od, dr, cr] = await Promise.all([
        fetch(`${apiBase}/api/admin/orders/${id}`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' }).then(r=>r.json()),
        fetch(`${apiBase}/api/admin/drivers`, { credentials:'include', headers: { ...authHeaders() } }).then(r=>r.json()),
        fetch(`${apiBase}/api/admin/carriers`, { credentials:'include', headers: { ...authHeaders() } }).then(r=>r.json()),
      ]);
      setOrder(od.order||null); setTimeline(od.timeline||[]); setDrivers(dr.drivers||[]); setCarriers(cr.carriers||[]);
    } catch{}
  })(); },[apiBase, id]);

  async function createShipment(){
    if (!order?.id) return;
    setCreating(true);
    try{
      const res = await fetch(`${apiBase}/api/admin/shipments`, { method:'POST', headers: { 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ orderId: order.id, driverId: driverId||undefined, carrierId: carrierId||undefined, weight: weight||undefined, dimensions: dimensions||undefined }) });
      if (res.ok) {
        const j = await res.json();
        setShowModal(false);
        const od = await (await fetch(`${apiBase}/api/admin/orders/${id}`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' })).json();
        setOrder(od.order||null); setTimeline(od.timeline||[]);
      }
    } finally { setCreating(false); }
  }

  if (!order) return <main className="panel">جارٍ التحميل…</main>;
  return (
    <main className="grid" style={{ gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <BackButton />
        <nav className="breadcrumb" aria-label="Breadcrumb" style={{ marginInlineStart:'auto', display:'none' }}>
          {/* يظهر على الشاشات العريضة عبر CSS (يمكن تحسينه لاحقًا) */}
          <a href="/orders" style={{ color:'var(--sub)', textDecoration:'none' }}>الطلبات</a>
          <span style={{ margin:'0 6px', color:'var(--sub)' }}>/</span>
          <span style={{ color:'var(--text)' }}>#{id}</span>
        </nav>
      </div>
      <div className="panel">
        <h2 style={{ marginTop:0 }}>الطلب #{order.id}</h2>
        <div className="grid cols-2">
          <div>
            <div style={{ color:'var(--sub)' }}>العميل</div>
            <div>{order.user?.name||'-'} — {order.user?.email||'-'} — {order.user?.phone||'-'}</div>
            <div style={{ color:'var(--sub)', marginTop:8 }}>العنوان</div>
            <div>{order.shippingAddress?.street||'-'}</div>
            <div style={{ color:'var(--sub)', marginTop:8 }}>ملاحظات</div>
            <div>-</div>
          </div>
          <div>
            <div style={{ color:'var(--sub)' }}>ملخص المبلغ</div>
            <div>Subtotal: {order.items?.reduce((s:number,i:any)=>s+(i.price*i.quantity),0) || 0}</div>
            <div>Shipping: 0</div>
            <div>Tax: 0</div>
            <div>Total: {order.total}</div>
          </div>
        </div>
      </div>
      <div className="panel">
        <h3 style={{ marginTop:0 }}>الأصناف</h3>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead><tr>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>الصورة</th>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>الاسم</th>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>الكمية</th>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>السعر</th>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>المجموع</th>
            </tr></thead>
            <tbody>
              {order.items?.map((it:any, idx:number)=> (
                <tr key={it.id} style={{ background: idx%2? '#0a0e17':'transparent' }}>
                  <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}><div style={{ width:64, height:64, background:'#111', borderRadius:8 }} /></td>
                  <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{it.product?.name||'-'}</td>
                  <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{it.quantity}</td>
                  <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{it.price}</td>
                  <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{it.price*it.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="panel">
        <h3 style={{ marginTop:0 }}>الشحن</h3>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            {order.shipments?.map((s:any)=> (
              <div key={s.id} style={{ marginBottom:6 }}>#{s.id} — {s.status} — {s.trackingNumber || '-'} <a href={`${apiBase}/api/admin/shipments/${s.id}/label`} style={{ marginInlineStart:8 }}>الملصق</a></div>
            ))}
          </div>
          <button className="btn" onClick={()=>setShowModal(true)}>إنشاء شحنة</button>
        </div>
      </div>
      <div className="panel">
        <h3 style={{ marginTop:0 }}>Timeline</h3>
        {!timeline.length ? (
          <div style={{ color:'var(--sub)' }}>لا توجد أحداث</div>
        ) : (
          <ul style={{ listStyle:'none', margin:0, padding:0, display:'grid', gap:8 }}>
            {timeline.map(ev => (
              <li key={ev.id} style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:12 }}>
                <div style={{ color:'var(--sub)' }}>{new Date(ev.createdAt).toLocaleString()}</div>
                <div>
                  <div style={{ fontWeight:700 }}>{ev.type}</div>
                  {ev.message && <div style={{ color:'var(--sub)' }}>{ev.message}</div>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'grid', placeItems:'center', zIndex:60 }}>
          <div className="panel" style={{ width:720 }}>
            <h3 style={{ marginTop:0 }}>Create Shipment</h3>
            <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <select value={driverId} onChange={(e)=>setDriverId(e.target.value)} className="select">
                <option value="">اختيار سائق (اختياري)</option>
                {drivers.map(d=> (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
              <select value={carrierId} onChange={(e)=>setCarrierId(e.target.value)} className="select">
                <option value="">اختيار مزود (اختياري)</option>
                {carriers.map(c=> (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <input placeholder="الوزن (كجم)" value={weight} onChange={(e)=>setWeight(e.target.value)} className="input" />
              <input placeholder="الأبعاد (LxWxH)" value={dimensions} onChange={(e)=>setDimensions(e.target.value)} className="input" />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
              <button className="icon-btn" onClick={()=>setShowModal(false)}>إلغاء</button>
              <button className="btn" disabled={creating} onClick={createShipment}>{creating?'جارٍ الإنشاء…':'تأكيد'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

