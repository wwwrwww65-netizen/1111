"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { resolveApiBase } from '../../../lib/apiBase';

export default function MobileOrderDetail(): JSX.Element {
  const params = useParams();
  const id = String(params?.id || '');
  const [order, setOrder] = React.useState<any>(null);
  const [timeline, setTimeline] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(()=>{
    let alive = true;
    (async()=>{
      try{
        const res = await fetch(`${resolveApiBase()}/api/admin/orders/${id}`, { headers:{ 'accept':'application/json' }, credentials:'include' });
        if(!res.ok) throw new Error('HTTP '+res.status);
        const j = await res.json();
        if(alive) { setOrder(j.order||null); setTimeline(j.timeline||[]); }
      }catch(e){ if(alive) setError('تعذر جلب البيانات'); }
      finally{ if(alive) setLoading(false); }
    })();
    return ()=>{ alive=false; };
  }, [id]);

  const recName = order?.shippingAddress?.fullName || order?.address?.fullName || order?.user?.name || '-';
  const recPhone = order?.shippingAddress?.phone || order?.address?.phone || order?.user?.phone || '-';
  const recLine = [order?.shippingAddress?.country || order?.address?.country, order?.shippingAddress?.state || order?.address?.state, order?.shippingAddress?.city || order?.address?.city, order?.shippingAddress?.street || order?.address?.street, order?.shippingAddress?.details || order?.address?.details].filter(Boolean).join(' / ');
  const paymentDisplay = (()=>{ const pm = (order as any)?.paymentDisplay || (order?.paymentMethod || order?.payment?.method || '-'); return String(pm).toLowerCase()==='cod' ? 'الدفع عند الاستلام' : String(pm); })();

  return (
    <div className="grid" style={{ gap:12 }}>
      <button className="icon-btn" onClick={()=> history.length>1 ? history.back() : location.assign('/mobile/orders')}>رجوع</button>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {error && <div className="panel" style={{ color:'var(--err)' }}>{error}</div>}
      {!loading && !error && order && (
        <>
          <div className="panel">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:800, marginBottom:4 }}>#{order.id}</div>
                <div style={{ color:'var(--sub)', fontSize:12 }}>{new Date(order.createdAt).toLocaleString('ar')}</div>
              </div>
              <div style={{ textAlign:'end' }}>
                <div style={{ fontWeight:800 }}>{Math.round(order.total||0)} ر.س</div>
                <span className="badge" style={{ marginInlineStart:8 }}>{order.status}</span>
              </div>
            </div>
          </div>
          <div className="panel">
            <h3 style={{ marginTop:0 }}>العميل والتوصيل</h3>
            <div style={{ display:'grid', gap:6 }}>
              <div><b>العميل:</b> {order.user?.name||'-'} — {order.user?.email||'-'} — {order.user?.phone||'-'}</div>
              <div><b>اسم المستلم:</b> {recName}</div>
              <div><b>الهاتف:</b> {recPhone}</div>
              <div><b>العنوان:</b> {recLine||'-'}</div>
              <div><b>الدفع:</b> {paymentDisplay}</div>
              <div><b>طريقة الشحن:</b> {order.shippingMethod? (order.shippingMethod.offerTitle||order.shippingMethod.id) : (order.shippingMethodId||'-')}</div>
            </div>
          </div>
          <div className="panel">
            <h3 style={{ marginTop:0 }}>الأصناف</h3>
            <div style={{ display:'grid', gap:8 }}>
              {(order.items||[]).map((it:any)=>{
                const m = (it as any).meta || (it as any).variant || {};
                const attrs = (m as any).attributes || {};
                const normalize = (u?: string)=>{ const s=String(u||'').trim(); if(!s) return ''; if(/^https?:\/\//i.test(s)) return s; if (s.startsWith('/uploads')) return `${resolveApiBase()}${s}`; if (s.startsWith('uploads/')) return `${resolveApiBase()}/${s}`; return s; };
                const rawImg = attrs.image || it.product?.images?.[0];
                const img = normalize(rawImg);
                const varTxt = [ m.color?`اللون: ${m.color}`:'', attrs.size_letters?`مقاسات بالأحرف: ${attrs.size_letters}`:'', attrs.size_numbers?`مقاسات بالأرقام: ${attrs.size_numbers}`:''].filter(Boolean).join(' | ') || (m.size||'-');
                return (
                  <div key={it.id} style={{ display:'grid', gridTemplateColumns:'64px 1fr', gap:8, alignItems:'center' }}>
                    <div>{img? <img src={img} alt={it.product?.name||''} style={{ width:64, height:64, objectFit:'cover', borderRadius:8 }} /> : <div style={{ width:64, height:64, background:'#111', borderRadius:8 }} />}</div>
                    <div>
                      <div style={{ fontWeight:600 }}>{it.product?.name||'-'}</div>
                      <div style={{ color:'var(--sub)', fontSize:12 }}>{varTxt}</div>
                      <div style={{ fontSize:12 }}>{it.price} × {it.quantity} = {Number(it.price||0)*Number(it.quantity||1)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {!!timeline?.length && (
            <div className="panel">
              <h3 style={{ marginTop:0 }}>الأحداث</h3>
              <ul style={{ listStyle:'none', margin:0, padding:0, display:'grid', gap:6 }}>
                {timeline.map((ev:any)=>(<li key={ev.id} style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:8 }}><div style={{ color:'var(--sub)' }}>{new Date(ev.createdAt).toLocaleString()}</div><div><div style={{ fontWeight:700 }}>{ev.type}</div>{ev.message && <div style={{ color:'var(--sub)' }}>{ev.message}</div>}</div></li>))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

