"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { useSearchParams } from 'next/navigation';

export default function WarehousePage(): JSX.Element {
  const apiBase = resolveApiBase();
  const searchParams = useSearchParams();
  const [tab, setTab] = React.useState<'inbound'|'sorting'|'ready'>('inbound');
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [sortingOrders, setSortingOrders] = React.useState<any[]>([]);
  const [sortingLoading, setSortingLoading] = React.useState(false);
  const [sortingSelected, setSortingSelected] = React.useState<Record<string, boolean>>({});
  const sortingSelectedIds = React.useMemo(()=> Object.keys(sortingSelected).filter(k=> sortingSelected[k]), [sortingSelected]);
  const [readyMap, setReadyMap] = React.useState<Record<string, { ready: boolean; items: number; received: number; matched: number }>>({});
  const [orderInfoMap, setOrderInfoMap] = React.useState<Record<string, { recipient: string; address: string; phone: string; payment: string; shipping: string; state?: string; city?: string; street?: string }>>({});
  async function load(){
    if (tab === 'sorting' || tab === 'ready') {
      setSortingLoading(true);
      try {
        const j = await (await fetch(`${apiBase}/api/admin/logistics/warehouse/sorting/orders`, { credentials:'include' })).json();
        const orders = Array.isArray(j.orders)? j.orders : [];
        setSortingOrders(orders);
        setSortingSelected({});
        // Build info directly from backend rows to avoid extra requests
        const info: Record<string, any> = {};
        for (const o of orders) {
          const id = String(o.orderId);
          info[id] = {
            recipient: o.recipient || '-',
            address: o.address || '-',
            phone: o.phone || '-',
            payment: o.paymentDisplay || o.paymentMethod || '-',
            shipping: o.shippingTitle || String(o.shippingMethodId || '-') ,
            state: o.state || '',
            city: o.city || '',
            street: o.street || '',
          };
        }
        setOrderInfoMap(info);
        // Readiness aggregation in one call (chunk to avoid long URLs)
        const ids = orders.map((o:any)=> String(o.orderId));
        const chunks: string[][] = [];
        for (let i=0;i<ids.length;i+=40) chunks.push(ids.slice(i,i+40));
        const map: Record<string, { ready: boolean; items: number; received: number; matched: number }> = {};
        for (const ch of chunks) {
          const url = new URL(`${apiBase}/api/admin/logistics/warehouse/sorting/readiness`);
          url.searchParams.set('ids', ch.join(','));
          const r = await (await fetch(url.toString(), { credentials:'include' })).json();
          const m = r.map||{};
          for (const k of Object.keys(m)){
            const it = m[k]||{};
            const items = Number(it.items||0);
            const received = Number(it.received||0);
            const matched = Number(it.matched||0);
            map[k] = { items, received, matched, ready: items>0 && matched===items };
          }
        }
        setReadyMap(map);
      } finally { setSortingLoading(false); }
    } else {
      setLoading(true);
      try {
        const url = new URL(`/api/admin/logistics/warehouse/list`, apiBase);
        url.searchParams.set('tab', tab);
        const j = await (await fetch(url.toString(), { credentials:'include' })).json();
        setItems(j.items||[]);
      } finally { setLoading(false); }
    }
  }
  React.useEffect(()=>{ const t = String((searchParams && (searchParams as any).get? (searchParams as any).get('tab'): '')||''); if (t==='sorting'||t==='ready'||t==='inbound') setTab(t as any); }, [searchParams]);
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase, tab]);

  function colorMeta(hex: string): { bg: string; shadow: string }{
    switch (hex) {
      case '#ef4444': return { bg: 'rgba(239,68,68,0.12)', shadow: '0 0 0 1px #ef4444 inset, 0 0 8px #ef444466' };
      case '#f59e0b': return { bg: 'rgba(245,158,11,0.12)', shadow: '0 0 0 1px #f59e0b inset, 0 0 8px #f59e0b66' };
      case '#fbbf24': return { bg: 'rgba(251,191,36,0.12)', shadow: '0 0 0 1px #fbbf24 inset, 0 0 8px #fbbf2466' };
      case '#10b981': return { bg: 'rgba(16,185,129,0.12)', shadow: '0 0 0 1px #10b981 inset, 0 0 8px #10b98166' };
      case '#2563eb': return { bg: 'rgba(37,99,235,0.12)', shadow: '0 0 0 1px #2563eb inset, 0 0 8px #2563eb66' };
      default: return { bg: 'rgba(99,102,241,0.12)', shadow: '0 0 0 1px #6366f1 inset, 0 0 8px #6366f166' };
    }
  }

  async function confirmInbound(shipmentId: string){
    if (!shipmentId) return;
    await fetch(`${apiBase}/api/admin/logistics/warehouse/inbound/confirm`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ shipmentId }) });
    await load();
  }
  async function addSortingResult(packageId: string, match:boolean){
    await fetch(`${apiBase}/api/admin/logistics/warehouse/sorting/result`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ packageId, match }) });
    await load();
  }
  async function assignReady(packageId: string){
    const driverId = prompt('معرّف السائق للتسليم:') || '';
    if (!driverId) return;
    await fetch(`${apiBase}/api/admin/logistics/warehouse/ready/assign`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ packageId, driverId }) });
    await load();
  }
  return (
    <div className="panel" style={{ padding:16 }}>
      <h1 className="text-xl font-bold mb-3">المستودع: المعالجة والاستلام</h1>
      <div className="toolbar" style={{ display:'flex', gap:8, position:'sticky', top:0, background:'var(--panel)', zIndex:10, padding:'6px 0' }}>
        <button className={`btn btn-sm ${tab==='inbound'?'':'btn-outline'}`} onClick={()=> setTab('inbound')}>الاستلام من السائق</button>
        <button className={`btn btn-sm ${tab==='sorting'?'':'btn-outline'}`} onClick={()=> setTab('sorting')}>الفرز والجرد</button>
        <button className={`btn btn-sm ${tab==='ready'?'':'btn-outline'}`} onClick={()=> setTab('ready')}>جاهز للتسليم</button>
        <a className="btn btn-sm" href={`/api/admin/logistics/warehouse/export/csv?tab=${tab}`}>تصدير CSV</a>
        <a className="btn btn-sm btn-outline" href={`/api/admin/logistics/warehouse/export/xls?tab=${tab}`}>تصدير Excel</a>
      </div>

      {tab==='inbound' && (
        <div className="mt-4">
          {loading && (<div className="panel"><div style={{ height:48, background:'var(--muted2)', borderRadius:8, marginBottom:8 }} /><div style={{ height:48, background:'var(--muted2)', borderRadius:8 }} /></div>)}
          {!loading && items.length===0 && (<div className="panel" style={{ display:'grid', placeItems:'center', padding:24, color:'var(--sub)' }}>لا عناصر</div>)}
          <table className="table">
            <thead><tr><th>السائق</th><th>وقت آخر وصول</th><th>الحالة</th><th>إجراءات</th></tr></thead>
            <tbody>{items.map((r:any, idx:number)=> (
              <tr key={(r.driverId||'driver')+':'+idx} style={{ cursor:'pointer' }} onClick={()=>{ if (r?.driverId) location.assign(`/logistics/warehouse/driver/${r.driverId}`) }}>
                <td>{r.driverName||'-'}</td>
                <td>{new Date(r.arrivedAt||Date.now()).toLocaleString()}</td>
                <td><span className="badge warn">وارد حديثاً</span></td>
                <td style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-sm" onClick={(e)=>{ e.stopPropagation(); if(r?.driverId) location.assign(`/logistics/warehouse/driver/${r.driverId}`) }}>عرض التفاصيل</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab==='sorting' && (
        <div className="mt-4">
          {sortingLoading && (<div className="panel"><div style={{ height:48, background:'var(--muted2)', borderRadius:8, marginBottom:8 }} /><div style={{ height:48, background:'var(--muted2)', borderRadius:8 }} /></div>)}
          {!sortingLoading && sortingOrders.length===0 && (<div className="panel" style={{ display:'grid', placeItems:'center', padding:24, color:'var(--sub)' }}>لا توجد طلبات للفرز</div>)}
          {sortingOrders.length>0 && (
            <div className="panel">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <input type="checkbox" aria-label="تحديد الكل" checked={sortingOrders.length>0 && sortingOrders.every(o=> sortingSelected[String(o.orderId)])}
                      onChange={e=>{ const checked=e.currentTarget.checked; const next:Record<string,boolean>={}; for(const o of sortingOrders) next[String(o.orderId)]=checked; setSortingSelected(next); }} />
                    <span>تحديد الكل</span>
                  </label>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-sm" disabled={sortingSelectedIds.length===0} onClick={async()=>{
                    for (const oid of sortingSelectedIds){
                      try{
                        const qq = new URL(`${apiBase}/api/admin/logistics/warehouse/sorting/items`);
                        qq.searchParams.set('orderId', String(oid));
                        const jj = await (await fetch(qq.toString(), { credentials:'include' })).json();
                        const itemsArr: any[] = jj.items||[];
                        await Promise.all(itemsArr.map((it:any)=> fetch(`${apiBase}/api/admin/logistics/warehouse/sorting/item`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderItemId: it.orderItemId, result: 'MATCH' }) }))); 
                      }catch{}
                    }
                    setMessage('تم الترحيل');
                  }}>تم التجهيز وقم بالترحيل (للمحدد)</button>
                </div>
              </div>
              <table className="table">
                <thead><tr><th></th><th>رقم الطلب</th><th>عدد المنتجات</th><th>الحالة</th><th>إجراء</th></tr></thead>
                <tbody>{sortingOrders.map((o:any)=> {
                  const state = readyMap[String(o.orderId)]||{ ready:false, items:o.items||0, received:0, matched:0 };
                  let statusLabel = '' as string; let badgeColor = '#f59e0b';
                  if ((state as any).received === 0) { statusLabel = 'لم يتم الاستلام بعد'; badgeColor = '#ef4444'; }
                  else if ((state as any).received < (state as any).items) { statusLabel = `تم استلام ${(state as any).received} تبقى ${(state as any).items - (state as any).received}`; badgeColor = '#f59e0b'; }
                  else if ((state as any).received === (state as any).items && (state as any).matched < (state as any).items) { statusLabel = 'قيد التجهيز'; badgeColor = '#fbbf24'; }
                  else if ((state as any).matched === (state as any).items && (state as any).items>0) { statusLabel = 'جاهز'; badgeColor = '#10b981'; }
                  return (
                    <tr key={o.orderId}>
                      <td><input type="checkbox" checked={!!sortingSelected[String(o.orderId)]} onChange={e=> { const c=e.currentTarget.checked; setSortingSelected(prev=> ({ ...prev, [String(o.orderId)]: c })); }} /></td>
                      <td style={{ cursor:'pointer' }} onClick={()=> location.assign(`/logistics/warehouse/sorting/${o.orderId}`)}>{o.orderCode? `#${o.orderCode}`: o.orderId}</td>
                      <td>{o.items||0}</td>
                      <td><span className="badge" style={{ background: colorMeta(badgeColor).bg, color: badgeColor, border:`1px solid ${badgeColor}`, boxShadow: colorMeta(badgeColor).shadow, display:'inline-flex', alignItems:'center', gap:6, paddingInline:10 }}>
                        <span style={{ width:8, height:8, borderRadius:999, background: badgeColor, boxShadow:`0 0 8px ${badgeColor}AA` }} />
                        <span>{statusLabel}</span>
                      </span></td>
                      <td><button className="btn btn-sm" onClick={async()=>{
                        try{
                          const qq = new URL(`${apiBase}/api/admin/logistics/warehouse/sorting/items`);
                          qq.searchParams.set('orderId', String(o.orderId));
                          const jj = await (await fetch(qq.toString(), { credentials:'include' })).json();
                          const itemsArr: any[] = jj.items||[];
                          await Promise.all(itemsArr.map((it:any)=> fetch(`${apiBase}/api/admin/logistics/warehouse/sorting/item`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderItemId: it.orderItemId, result: 'MATCH' }) }))); 
                          setMessage('تم الترحيل');
                          setSortingOrders(prev=> prev.filter((x:any)=> String(x.orderId)!==String(o.orderId)));
                        }catch{}
                      }}>تم الترحيل</button></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab==='ready' && (
        <div className="mt-4">
          {sortingLoading && (<div className="panel"><div style={{ height:48, background:'var(--muted2)', borderRadius:8, marginBottom:8 }} /><div style={{ height:48, background:'var(--muted2)', borderRadius:8 }} /></div>)}
          {!sortingLoading && sortingOrders.filter((o:any)=> (readyMap[String(o.orderId)]||{}).ready).length===0 && (
            <div className="panel" style={{ display:'grid', placeItems:'center', padding:24, color:'var(--sub)' }}>لا توجد طلبات جاهزة</div>
          )}
          {sortingOrders.filter((o:any)=> (readyMap[String(o.orderId)]||{}).ready).length>0 && (
            <div className="panel">
              <table className="table">
                <thead><tr><th>رقم الطلب</th><th>اسم المستلم</th><th>الهاتف</th><th>العنوان</th><th>المبلغ</th><th>عدد المنتجات</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                <tbody>{sortingOrders.filter((o:any)=> (readyMap[String(o.orderId)]||{}).ready).map((o:any)=> {
                  const meta = orderInfoMap[String(o.orderId)]||{ recipient:'-', phone:'-', state:'', city:'', street:'' } as any;
                  const addressCompact = [meta.state, meta.city, meta.street].filter(Boolean).join(' ');
                  return (
                  <tr key={o.orderId}>
                    <td style={{ cursor:'pointer' }} onClick={()=> location.assign(`/logistics/warehouse/sorting/${o.orderId}?readonly=1`)}>{o.orderCode? `#${o.orderCode}`: o.orderId}</td>
                    <td>{meta.recipient}</td>
                    <td>{meta.phone}</td>
                    <td style={{ maxWidth:260, whiteSpace:'normal', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2 as any, WebkitBoxOrient:'vertical' as any }}>{addressCompact}</td>
                    <td>{Number(o.total||0).toFixed(2)}</td>
                    <td>{o.items||0}</td>
                    <td><span className="badge ok" style={{ background:'rgba(16,185,129,0.12)', color:'#10b981', border:'1px solid #10b981', boxShadow:'0 0 0 1px #10b981 inset, 0 0 8px #10b98166', display:'inline-flex', alignItems:'center', gap:6, paddingInline:10 }}>
                      <span style={{ width:8, height:8, borderRadius:999, background:'#10b981', boxShadow:'0 0 8px #10b981AA' }} />
                      <span>جاهز</span>
                    </span></td>
                    <td style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-sm btn-outline" onClick={async()=>{
                        try{
                          const resp = await fetch(`${apiBase}/api/admin/orders/${encodeURIComponent(String(o.orderId))}/invoice`, { credentials:'include' });
                          const html = await resp.text();
                          const w = window.open('', '_blank', 'width=900,height=700');
                          if(!w) return;
                          w.document.open();
                          w.document.write(html.replace('</body>', '<script>window.addEventListener("load",()=>setTimeout(()=>window.print(),100));</script></body>'));
                          w.document.close();
                        }catch{}
                      }}>طباعة فاتورة</button>
                      <button className="btn btn-sm btn-outline" onClick={()=>{
                        const w = window.open('', '_blank', 'width=600,height=400');
                        if(!w) return;
                        const html = `<!doctype html><html dir=\"rtl\" lang=\"ar\"><head><meta charset=\"utf-8\"/><title>لاصق طرد</title><style>@page{size:100mm 150mm;margin:0}body{margin:0;font-family:system-ui,Segoe UI,Roboto,Arial} .label{width:100mm;height:150mm;box-sizing:border-box;padding:10mm;display:flex;flex-direction:column;justify-content:space-between} .row{display:flex;justify-content:space-between;align-items:center} .big{font-size:20px;font-weight:700} .barcode{height:32px;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;letter-spacing:2px}</style></head><body><div class=\"label\"><div class=\"row big\">${meta.recipient||''}</div><div>${addressCompact.slice(0,120)}</div><div class=\"row\"><div>طلب: ${o.orderCode||o.orderId}</div><div>قطع: ${o.items||0}</div></div><div class=\"barcode\">*${o.orderCode||o.orderId}*</div></div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),50));</script></body></html>`;
                        w.document.open(); w.document.write(html); w.document.close();
                      }}>لاصق طرد</button>
                    </td>
                  </tr>
                )})}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {message && <div className="text-sm" style={{ color:'#9ae6b4' }}>{message}</div>}
    </div>
  );
}

