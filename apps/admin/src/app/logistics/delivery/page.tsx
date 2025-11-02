"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function DeliveryPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [tab, setTab] = React.useState<'ready'|'in_delivery'|'completed'|'returns'|'drivers'>('ready');
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [assignOrder, setAssignOrder] = React.useState('');
  const [assignDriver, setAssignDriver] = React.useState('');
  const [suggested, setSuggested] = React.useState<Array<{id:string;name:string;load:number}>>([]);
  const [drivers, setDrivers] = React.useState<Array<{id:string;name:string}>>([]);
  const [driversLive, setDriversLive] = React.useState<Array<{id:string;name:string;lat:number;lng:number;status:string}>>([]);
  const [proofOrder, setProofOrder] = React.useState('');
  const [signature, setSignature] = React.useState('');
  const [photo, setPhoto] = React.useState('');
  const [readySelected, setReadySelected] = React.useState<Record<string, boolean>>({});
  const readySelectedIds = React.useMemo(()=> Object.keys(readySelected).filter(k=> readySelected[k]), [readySelected]);
  const [driverView, setDriverView] = React.useState<string>('');
  const [driverOrders, setDriverOrders] = React.useState<any[]>([]);
  const mapRef = React.useRef<HTMLDivElement|null>(null);
  const mapObjRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);

  async function load(){
    setLoading(true);
    try {
      if (tab==='ready'){
        const j = await (await fetch(`${apiBase}/api/admin/logistics/warehouse/ready/orders`, { credentials:'include' })).json();
        setItems(j.orders||[]);
      } else if (tab==='drivers'){
        if (driverView){ const j = await (await fetch(`${apiBase}/api/admin/logistics/delivery/driver/${encodeURIComponent(driverView)}/orders`, { credentials:'include' })).json(); setDriverOrders(j.orders||[]); }
        else setDriverOrders([]);
      } else {
        const url = new URL(`/api/admin/logistics/delivery/list`, apiBase);
        url.searchParams.set('tab', tab);
        const j = await (await fetch(url.toString(), { credentials:'include' })).json();
        setItems(j.items||[]);
      }
    } finally { setLoading(false); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase, tab, driverView]);
  React.useEffect(()=>{ (async()=>{ try{ const j = await (await fetch(`${apiBase}/api/admin/logistics/delivery/suggest-drivers`, { credentials:'include' })).json(); setSuggested(j.drivers||[]);}catch{ setSuggested([]);} })(); }, [apiBase]);
  React.useEffect(()=>{ (async()=>{ try{ const j = await (await fetch(`${apiBase}/api/admin/drivers`, { credentials:'include' })).json(); setDrivers(j.drivers||[]);}catch{ setDrivers([]);} })(); }, [apiBase]);
  React.useEffect(()=>{ const t = setInterval(async()=>{ try{ const j = await (await fetch(`${apiBase}/api/admin/logistics/drivers/locations`, { credentials:'include' })).json(); setDriversLive(j.drivers||[]);}catch{} }, 5000); return ()=> clearInterval(t); }, [apiBase]);

  // Lazy-load MapLibre from CDN and render base map
  React.useEffect(()=>{
    let cancelled = false;
    async function ensureMap(){
      if (!mapRef.current) return;
      if (!(window as any).maplibregl) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.css';
        document.head.appendChild(link);
        await new Promise<void>((resolve)=>{
          const s = document.createElement('script');
          s.src = 'https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.js';
          s.onload = ()=> resolve();
          document.body.appendChild(s);
        });
      }
      if (cancelled) return;
      if (!mapObjRef.current && (window as any).maplibregl && mapRef.current) {
        const maplibregl = (window as any).maplibregl;
        mapObjRef.current = new maplibregl.Map({
          container: mapRef.current,
          style: 'https://demotiles.maplibre.org/style.json',
          center: [46.6753, 24.7136],
          zoom: 6
        });
      }
    }
    ensureMap();
    return ()=> { cancelled = true; };
  }, []);

  // Update driver markers when live locations change (clustered)
  React.useEffect(()=>{
    if (!mapObjRef.current || !(window as any).maplibregl) return;
    for (const m of markersRef.current) { try { m.remove(); } catch {} }
    markersRef.current = [];
    const maplibregl = (window as any).maplibregl;
    // naive grid clustering
    const cell = 0.1; // ~11km grid
    const grid = new Map<string, Array<any>>();
    for (const d of driversLive) {
      if (typeof d.lng !== 'number' || typeof d.lat !== 'number') continue;
      const gx = Math.floor(d.lng / cell); const gy = Math.floor(d.lat / cell);
      const key = `${gx}:${gy}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push(d);
    }
    for (const [_, group] of grid) {
      const lng = group.reduce((a,c)=> a + c.lng, 0)/group.length;
      const lat = group.reduce((a,c)=> a + c.lat, 0)/group.length;
      const el = document.createElement('div');
      el.style.width = '22px'; el.style.height = '22px'; el.style.borderRadius = '50%'; el.style.display='grid'; el.style.placeItems='center';
      el.style.background = '#1e293b'; el.style.color='#e2e8f0'; el.style.fontSize='12px'; el.style.border='1px solid #334155';
      el.textContent = String(group.length);
      const mk = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapObjRef.current);
      markersRef.current.push(mk);
    }
  }, [driversLive]);

  async function assign(){
    setMessage('');
    if (!assignOrder || !assignDriver) { setMessage('ادخل الطلب والسائق'); return; }
    const r = await fetch(`${apiBase}/api/admin/logistics/delivery/assign`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderId: assignOrder, driverId: assignDriver }) });
    if (!r.ok) { setMessage('تعذر التوزيع'); return; }
    setMessage('تم التوزيع'); setAssignOrder(''); setAssignDriver(''); await load();
  }
  async function submitProof(){
    setMessage('');
    if (!proofOrder) { setMessage('ادخل رقم الطلب'); return; }
    const r = await fetch(`${apiBase}/api/admin/logistics/delivery/proof`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderId: proofOrder, signatureBase64: signature||undefined, photoBase64: photo||undefined }) });
    if (!r.ok) { setMessage('تعذر حفظ الإثبات'); return; }
    setMessage('تم حفظ إثبات التسليم وتحديث الحالة'); setProofOrder(''); setSignature(''); setPhoto(''); await load();
  }

  return (
    <div className="panel" style={{ padding:16 }}>
      <h1 className="text-xl font-bold mb-3">التوصيل إلى العميل</h1>
      <div className="toolbar" style={{ display:'flex', gap:8, position:'sticky', top:0, background:'var(--panel)', zIndex:10, padding:'6px 0' }}>
        <button className={`btn btn-sm ${tab==='ready'?'':'btn-outline'}`} onClick={()=> setTab('ready')}>الطلبات الجاهزة</button>
        <button className={`btn btn-sm ${tab==='in_delivery'?'':'btn-outline'}`} onClick={()=> setTab('in_delivery')}>قيد التوصيل</button>
        <button className={`btn btn-sm ${tab==='completed'?'':'btn-outline'}`} onClick={()=> setTab('completed')}>مكتمل</button>
        <button className={`btn btn-sm ${tab==='returns'?'':'btn-outline'}`} onClick={()=> setTab('returns')}>مرتجعات</button>
        <button className={`btn btn-sm ${tab==='drivers'?'':'btn-outline'}`} onClick={()=> setTab('drivers')}>السائقون</button>
        <a className="btn btn-sm" href={`/api/admin/logistics/delivery/export/csv?tab=${tab}`}>تصدير CSV</a>
        <a className="btn btn-sm btn-outline" href={`/api/admin/logistics/delivery/export/xls?tab=${tab}`}>تصدير Excel</a>
        <a className="btn btn_sm btn-outline" href={`/api/admin/logistics/delivery/export/pdf?tab=${tab}`}>تصدير PDF</a>
      </div>

      {tab==='ready' && (
        <div className="mt-4">
          {loading && (<div className="panel"><div style={{ height:48, background:'var(--muted2)', borderRadius:8, marginBottom:8 }} /><div style={{ height:48, background:'var(--muted2)', borderRadius:8 }} /></div>)}
          {!loading && items.length===0 && (<div className="panel" style={{ display:'grid', placeItems:'center', padding:24, color:'var(--sub)' }}>لا عناصر</div>)}
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8, flexWrap:'wrap' }}>
            <select className="select" onChange={e=> setAssignDriver(e.target.value)} value={assignDriver}>
              <option value="">سائق مقترح</option>
              {suggested.map(d=> (<option key={d.id} value={d.id}>{d.name} (نشط: {d.load})</option>))}
            </select>
            <select className="select" onChange={e=> setAssignDriver(e.target.value)} value={assignDriver}>
              <option value="">كل السائقين</option>
              {drivers.map(d=> (<option key={d.id} value={d.id}>{d.name}</option>))}
            </select>
            <button className="btn" disabled={readySelectedIds.length===0 || !assignDriver} onClick={async()=>{
              setMessage('');
              if (!assignDriver) { setMessage('اختر سائق'); return; }
              for (const oid of readySelectedIds){ try { await fetch(`${apiBase}/api/admin/logistics/delivery/assign`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderId: oid, driverId: assignDriver }) }); } catch{} }
              setItems(prev=> prev.filter((o:any)=> !readySelectedIds.includes(String(o.orderId))));
              setMessage('تم الإسناد'); setReadySelected({});
            }}>إسناد</button>
            {message && <div className="text-sm" style={{ color:'#9ae6b4' }}>{message}</div>}
          </div>
          {items.length>0 && (
          <table className="table">
            <thead><tr><th><input type="checkbox" checked={items.length>0 && items.every((o:any)=> readySelected[String(o.orderId)])} onChange={e=>{ const c=e.currentTarget.checked; const next:Record<string,boolean>={}; for(const o of items) next[String(o.orderId)]=c; setReadySelected(next); }} /></th><th>رقم الطلب</th><th>اسم المستلم</th><th>الهاتف</th><th>العنوان</th><th>طريقة الشحن</th><th>طريقة الدفع</th><th>القيمة</th></tr></thead>
            <tbody>{items.map((o:any)=> {
              const address = [o.state, o.city, o.street].filter(Boolean).join(' ');
              return (
              <tr key={o.orderId}>
                <td><input type="checkbox" checked={!!readySelected[String(o.orderId)]} onChange={e=>{ const c=e.currentTarget.checked; setReadySelected(prev=> ({ ...prev, [String(o.orderId)]: c })); }} /></td>
                <td>{o.orderCode? `#${o.orderCode}`: o.orderId}</td>
                <td>{o.recipient||'-'}</td>
                <td>{o.phone||'-'}</td>
                <td>{address||'-'}</td>
                <td>{o.shippingTitle||'-'}</td>
                <td>{o.paymentDisplay||'-'}</td>
                <td>{Number(o.total||0).toFixed(2)}</td>
              </tr>
            )})}</tbody>
          </table>)}
          <div className="panel" style={{ marginTop:12 }}>
            <div style={{ marginBottom:8 }}>الخريطة الحية — السائقون: {driversLive.length}</div>
            <div ref={mapRef} style={{ width:'100%', height: 360, border:'1px solid var(--muted)' }} />
          </div>
        </div>
      )}

      {tab==='in_delivery' && (
        <div className="mt-4">
          {loading && (<div className="panel"><div style={{ height:48, background:'var(--muted2)', borderRadius:8, marginBottom:8 }} /><div style={{ height:48, background:'var(--muted2)', borderRadius:8 }} /></div>)}
          {!loading && items.length===0 && (<div className="panel" style={{ display:'grid', placeItems:'center', padding:24, color:'var(--sub)' }}>لا عناصر</div>)}
          {items.length>0 && (
          <table className="table">
            <thead><tr><th>رقم الطلب</th><th>السائق</th><th>الحالة</th><th>آخر تحديث</th><th>مؤشر</th></tr></thead>
            <tbody>{items.map((o:any)=> (
              <tr key={o.orderId}><td>{o.orderCode? `#${o.orderCode}`: o.orderId}</td><td>{o.driver||'-'}</td><td>{o.status}</td><td>{new Date(o.updatedAt||Date.now()).toLocaleString()}</td><td><span className="badge warn">في الطريق</span></td></tr>
            ))}</tbody>
          </table>)}
          <div className="panel" style={{ marginTop:12 }}>خريطة حية (placeholder)</div>
        </div>
      )}

      {tab==='completed' && (
        <div className="mt-4">
          {loading && (<div className="panel"><div style={{ height:48, background:'var(--muted2)', borderRadius:8, marginBottom:8 }} /><div style={{ height:48, background:'var(--muted2)', borderRadius:8 }} /></div>)}
          {!loading && items.length===0 && (<div className="panel" style={{ display:'grid', placeItems:'center', padding:24, color:'var(--sub)' }}>لا عناصر</div>)}
          {items.length>0 && (
          <table className="table">
            <thead><tr><th>رقم الطلب</th><th>وقت التسليم</th><th>الدفع</th><th>إجراءات</th></tr></thead>
            <tbody>{items.map((o:any)=> (
              <tr key={o.orderId}><td>{o.orderId}</td><td>{new Date(o.deliveredAt||Date.now()).toLocaleString()}</td><td>{o.paymentStatus||'-'}</td><td style={{ display:'flex', gap:6 }}><button className="btn btn-sm btn-outline">عرض التقييم</button><button className="btn btn-sm btn-outline">تفاصيل التسليم</button><button className="btn btn-sm btn-outline">إشعار شكر</button></td></tr>
            ))}</tbody>
          </table>)}
          <div className="panel" style={{ marginTop:12, display:'grid', gap:8, maxWidth:520 }}>
            <h3 style={{ margin:0 }}>إثبات التسليم</h3>
            <input className="input" placeholder="رقم الطلب" value={proofOrder} onChange={e=> setProofOrder(e.target.value)} />
            <SignaturePad value={signature} onChange={setSignature} />
            <PhotoInput value={photo} onChange={setPhoto} />
            <button className="btn" onClick={submitProof}>حفظ الإثبات وتحديث الحالة</button>
          </div>
        </div>
      )}

      {tab==='returns' && (
        <div className="mt-4">
          {loading && (<div className="panel"><div style={{ height:48, background:'var(--muted2)', borderRadius:8, marginBottom:8 }} /><div style={{ height:48, background:'var(--muted2)', borderRadius:8 }} /></div>)}
          {!loading && items.length===0 && (<div className="panel" style={{ display:'grid', placeItems:'center', padding:24, color:'var(--sub)' }}>لا عناصر</div>)}
          {items.length>0 && (
          <table className="table">
            <thead><tr><th>رقم الإرجاع</th><th>التاريخ</th><th>السبب</th><th>إجراءات</th></tr></thead>
            <tbody>{items.map((r:any)=> (
              <tr key={r.returnId}><td>{r.returnId}</td><td>{new Date(r.createdAt||Date.now()).toLocaleString()}</td><td>{r.reason||'-'}</td><td style={{ display:'flex', gap:6 }}><button className="btn btn-sm">إعادة المحاولة</button><button className="btn btn-sm btn-outline">الاتصال</button><button className="btn btn-sm btn-outline">تحديث العنوان</button><button className="btn btn-sm btn-outline">إرجاع للمستودع</button></td></tr>
            ))}</tbody>
          </table>)}
        </div>
      )}

      {tab==='drivers' && (
        <div className="mt-4">
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8, flexWrap:'wrap' }}>
            <select className="select" value={driverView} onChange={e=> setDriverView(e.currentTarget.value)}>
              <option value="">اختر سائقاً</option>
              {drivers.map(d=> (<option key={d.id} value={d.id}>{d.name}</option>))}
            </select>
            {message && <div className="text-sm" style={{ color:'#9ae6b4' }}>{message}</div>}
          </div>
          {driverView && (
            <table className="table">
              <thead><tr><th>اسم العميل</th><th>رقم الطلب</th><th>الهاتف</th><th>المحافظة</th><th>المنطقة</th><th>اسم الشارع</th><th>طريقة الشحن</th><th>طريقة الدفع</th><th>الحالة</th><th>إجراءات</th></tr></thead>
              <tbody>{driverOrders.map((o:any)=> (
                <tr key={o.orderId}>
                  <td>{o.recipient||'-'}</td>
                  <td>{o.orderCode? `#${o.orderCode}`: o.orderId}</td>
                  <td>{o.phone||'-'}</td>
                  <td>{o.state||'-'}</td>
                  <td>{o.city||'-'}</td>
                  <td>{o.street||'-'}</td>
                  <td>{o.shippingTitle||'-'}</td>
                  <td>{o.paymentDisplay||'-'}</td>
                  <td>
                    <span className="badge" style={{ background:o.warehouseToDriverAt? 'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)', color:o.warehouseToDriverAt? '#10b981':'#ef4444', border:`1px solid ${o.warehouseToDriverAt? '#10b981':'#ef4444'}`, marginInlineEnd:6 }}>{o.warehouseToDriverAt? 'سُلّم للسائق' : 'بلا تسليم'}</span>
                    <span className="badge" style={{ background:o.driverConfirmedAt? 'rgba(37,99,235,0.12)':'rgba(239,68,68,0.12)', color:o.driverConfirmedAt? '#2563eb':'#ef4444', border:`1px solid ${o.driverConfirmedAt? '#2563eb':'#ef4444'}` }}>{o.driverConfirmedAt? 'تأكيد السائق' : 'بلا تأكيد'}</span>
                  </td>
                  <td style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-sm" onClick={async()=>{ try{ await fetch(`${apiBase}/api/admin/logistics/delivery/handover`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderId: o.orderId, driverId: driverView, type:'WAREHOUSE_TO_DRIVER' }) }); setMessage('تم تسجيل تسليم للسائق'); await load(); }catch{} }}>استلام السائق من المستودع</button>
                    <button className="btn btn-sm btn-outline" onClick={async()=>{ try{ await fetch(`${apiBase}/api/admin/logistics/delivery/handover`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderId: o.orderId, driverId: driverView, type:'DRIVER_CONFIRMED' }) }); setMessage('تم تأكيد السائق'); await load(); }catch{} }}>تسليم للسائق</button>
                    <button className="btn btn-sm btn-outline" onClick={async()=>{ try{ await fetch(`${apiBase}/api/admin/logistics/delivery/proof`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderId: o.orderId }) }); setMessage('تم التسليم للعميل'); await load(); }catch{} }}>تم التسليم للعميل</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {driverView && driverOrders.length>0 && (
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
              <button className="btn btn-sm btn-outline" onClick={()=>{
                const rows = driverOrders.map((o:any)=> `<tr><td>${o.orderCode?('#'+o.orderCode):o.orderId}</td><td>${o.recipient||''}</td><td>${o.phone||''}</td><td>${o.state||''}</td><td>${o.city||''}</td><td>${o.street||''}</td></tr>`).join('');
                const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>تسليم للسائق</title><style>body{font-family:system-ui,Segoe UI,Roboto,Arial;padding:16px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:6px;font-size:12px;text-align:right} th{background:#f5f5f7}</style></head><body><h1>تسليم طلبات للسائق</h1><table><thead><tr><th>رقم الطلب</th><th>المستلم</th><th>الهاتف</th><th>المحافظة</th><th>المنطقة</th><th>الشارع</th></tr></thead><tbody>${rows}</tbody></table><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),50));</script></body></html>`;
                const w = window.open('', '_blank', 'width=900,height=700'); if(!w) return; w.document.open(); w.document.write(html); w.document.close();
              }}>طباعة تسليم (الكل)</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SignaturePad({ value, onChange }: { value: string; onChange: (v:string)=>void }): JSX.Element {
  const canvasRef = React.useRef<HTMLCanvasElement|null>(null);
  const drawingRef = React.useRef<boolean>(false);
  function getPos(e: any){
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.touches? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
  }
  function start(e:any){ drawingRef.current = true; const ctx = canvasRef.current!.getContext('2d')!; const {x,y} = getPos(e); ctx.beginPath(); ctx.moveTo(x,y); }
  function move(e:any){ if (!drawingRef.current) return; const ctx = canvasRef.current!.getContext('2d')!; const {x,y} = getPos(e); ctx.lineTo(x,y); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
  function end(){ drawingRef.current = false; }
  function clear(){ const ctx = canvasRef.current!.getContext('2d')!; ctx.clearRect(0,0,canvasRef.current!.width, canvasRef.current!.height); onChange(''); }
  function save(){ const data = canvasRef.current!.toDataURL('image/png'); onChange(data); }
  return (
    <div>
      <label>توقيع العميل:</label>
      <div style={{ border:'1px solid var(--muted)', borderRadius:8, background:'#0b0e14', width:'100%', maxWidth:520 }}>
        <canvas ref={canvasRef} width={520} height={160}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        />
      </div>
      <div style={{ display:'flex', gap:8, marginTop:6 }}>
        <button className="btn btn-sm" onClick={save}>حفظ التوقيع</button>
        <button className="btn btn-sm btn-outline" onClick={clear}>مسح</button>
        {value && <span className="badge ok">تم الحفظ</span>}
      </div>
    </div>
  );
}

function PhotoInput({ value, onChange }: { value: string; onChange: (v:string)=>void }): JSX.Element {
  async function onFile(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ()=> { onChange(String(reader.result||'')); };
    reader.readAsDataURL(f);
  }
  return (
    <div>
      <label>صورة إثبات:</label>
      <input type="file" accept="image/*" onChange={onFile} />
      {value && <span className="badge ok" style={{ marginInlineStart:8 }}>تم التحميل</span>}
    </div>
  );
}
