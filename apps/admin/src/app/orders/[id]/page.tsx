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
  const [notes, setNotes] = React.useState<Array<{id:string;body:string;author?:string;createdAt:string}>>([]);
  const [noteBody, setNoteBody] = React.useState('');

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
      setOrder(od.order||null); setTimeline(od.timeline||[]); setNotes(od.notes||[]); setDrivers(dr.drivers||[]); setCarriers(cr.carriers||[]);
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
        setOrder(od.order||null); setTimeline(od.timeline||[]); setNotes(od.notes||[]);
      }
    } finally { setCreating(false); }
  }

  if (!order) return <main className="panel">جارٍ التحميل…</main>;
  const recName = order.shippingAddress?.fullName || order.address?.fullName || order.user?.name || '-';
  const recPhone = order.shippingAddress?.phone || order.address?.phone || order.user?.phone || '-';
  const recLine = [
    order.shippingAddress?.country || order.address?.country,
    order.shippingAddress?.state || order.address?.state,
    order.shippingAddress?.city || order.address?.city,
    order.shippingAddress?.street || order.address?.street,
    order.shippingAddress?.details || order.address?.details,
  ].filter(Boolean).join(' / ');
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
            <div style={{ color:'var(--sub)', marginTop:8 }}>اسم المستلم</div>
            <div>{recName}</div>
            <div style={{ color:'var(--sub)', marginTop:8 }}>رقم الهاتف</div>
            <div>{recPhone}</div>
            <div style={{ color:'var(--sub)', marginTop:8 }}>عنوان التوصيل</div>
            <div>{recLine || '-'}</div>
            <div style={{ color:'var(--sub)', marginTop:8 }}>الدفع</div>
            <div>{(()=>{ const pm = (order as any).paymentDisplay || (order.paymentMethod || order.payment?.method || '-'); const pms = String(pm).toLowerCase()==='cod' ? 'الدفع عند الاستلام' : String(pm); return pms; })()}</div>
            <div style={{ color:'var(--sub)', marginTop:8 }}>طريقة الشحن</div>
            <div>
              {!order.shippingMethod ? (
                <span>{order.shippingMethodId || '-'}</span>
              ) : (
                <div>
                  <div><b>{order.shippingMethod.offerTitle||order.shippingMethod.id}</b></div>
                  <div style={{ color:'var(--sub)' }}>
                    السعر: {Number(order.shippingMethod.price||0).toFixed(2)} • المدة: {order.shippingMethod.etaMinHours||'-'}-{order.shippingMethod.etaMaxHours||'-'} ساعة
                  </div>
                  {order.shippingMethod.carrier && <div style={{ color:'var(--sub)' }}>الناقل: {order.shippingMethod.carrier}</div>}
                </div>
              )}
            </div>
            <div style={{ color:'var(--sub)', marginTop:8 }}>ملاحظات</div>
            <div>-</div>
          </div>
          <div>
            <div style={{ color:'var(--sub)' }}>ملخص المبلغ</div>
            {(()=>{ const subtotal = (order.items||[]).reduce((s:number,i:any)=> s + Number(i.price||0)*Number(i.quantity||1), 0); const ship = Number(order.shippingAmount||order.shippingMethod?.price||0); const disc = Number(order.discountAmount||0); const total = Math.max(0, subtotal + ship - disc); return (
              <>
                <div>المجموع: {subtotal}</div>
                <div>الشحن: {ship}</div>
                <div>الخصم: {disc}</div>
                <div>الإجمالي: {total}</div>
              </>
            )})()}
          </div>
        </div>
      </div>
      <div className="panel">
        <h3 style={{ marginTop:0 }}>الأصناف</h3>
        <div style={{ textAlign:'left', marginBottom:8 }}>
          <a className="btn btn-sm" href={`${apiBase}/api/admin/orders/${id}/invoice`} target="_blank" rel="noreferrer">إنشاء فاتورة</a>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead><tr>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>الصورة</th>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>الاسم</th>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>المتغير</th>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>المورد</th>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>الكمية</th>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>السعر</th>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>المجموع</th>
            </tr></thead>
            <tbody>
              {order.items?.map((it:any, idx:number)=> (
                <tr key={it.id} style={{ background: idx%2? '#0a0e17':'transparent' }}>
                  <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>
                    {(()=>{ const m = (it as any).meta; const raw = m?.attributes?.image || it.product?.images?.[0]; const normalize = (u?: string)=>{ const s = String(u||'').trim(); if (!s) return ''; if (/^https?:\/\//i.test(s)) return s; if (s.startsWith('/uploads')) return `${apiBase}${s}`; if (s.startsWith('uploads/')) return `${apiBase}/${s}`; return s; }; const sel = normalize(raw); return sel ? (
                      <img src={sel} alt={it.product?.name||''} style={{ width:64, height:64, objectFit:'cover', borderRadius:8 }} />
                    ) : (<div style={{ width:64, height:64, background:'#111', borderRadius:8 }} />) })()}
                  </td>
                  <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{it.product?.name||'-'}</td>
                  <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>
                    {(()=>{
                      const m = (it as any).meta || (it as any).variant || {}
                      const attrs = (m as any).attributes || {}
                      const parts:string[] = []
                      if ((m as any).color) parts.push(`اللون: ${(m as any).color}`)
                      if (attrs.size_letters) parts.push(`مقاسات بالأحرف: ${attrs.size_letters}`)
                      if (attrs.size_numbers) parts.push(`مقاسات بالأرقام: ${attrs.size_numbers}`)
                      if (!attrs.size_letters && !attrs.size_numbers && (m as any).size) parts.push(String((m as any).size))
                      return parts.length? parts.join(' | ') : '-'
                    })()}
                  </td>
                  <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{it.product?.vendor?.name || '-'}</td>
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
      <div className="panel">
        <h3 style={{ marginTop:0 }}>ملاحظات داخلية</h3>
        <div style={{ display:'grid', gap:8 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 120px', gap:8 }}>
            <input className="input" placeholder="أضف ملاحظة..." value={noteBody} onChange={(e)=> setNoteBody(e.target.value)} />
            <button className="btn" disabled={!noteBody.trim()} onClick={async()=>{
              const r = await fetch(`${apiBase}/api/admin/orders/${id}/notes`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ body: noteBody }) });
              if (r.ok) { const j = await r.json(); setNotes(j.notes||[]); setNoteBody(''); }
            }}>حفظ</button>
          </div>
          <div>
            {!notes.length ? (<div style={{ color:'var(--sub)' }}>لا توجد ملاحظات</div>) : (
              <ul style={{ listStyle:'none', margin:0, padding:0, display:'grid', gap:8 }}>
                {notes.map(n => (
                  <li key={n.id} style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:12 }}>
                    <div style={{ color:'var(--sub)' }}>{new Date(n.createdAt).toLocaleString()}</div>
                    <div>{n.body}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
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

