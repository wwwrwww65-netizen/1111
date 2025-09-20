"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";

export default function DriverDetail({ params }: { params: { id: string } }): JSX.Element {
  const { id } = params;
  const [data, setData] = React.useState<any>(null);
  const [delivered, setDelivered] = React.useState<Array<{id:string;status:string;total:number;createdAt:string}>>([]);
  const [statusSel, setStatusSel] = React.useState<'AVAILABLE'|'BUSY'|'OFFLINE'>('AVAILABLE');
  const [active, setActive] = React.useState<boolean>(true);
  const [assignOrder, setAssignOrder] = React.useState('');
  const mapRef = React.useRef<HTMLDivElement|null>(null);
  const mapObjRef = React.useRef<any>(null);
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);
  React.useEffect(()=>{ (async ()=>{ try{ const j = await (await fetch(`${apiBase}/api/admin/drivers/${id}/overview`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' })).json(); setData(j); setStatusSel((j?.driver?.status||'AVAILABLE')); setActive(!(j?.driver?.isActive===false)); } catch{} })(); }, [apiBase, id]);
  React.useEffect(()=>{ (async ()=>{ try{ const url = new URL(`${apiBase}/api/admin/orders/list`); url.searchParams.set('driverId', id); url.searchParams.set('status', 'DELIVERED'); url.searchParams.set('limit','10'); const j = await (await fetch(url.toString(), { credentials:'include', headers:{ ...authHeaders() }, cache:'no-store' })).json(); setDelivered((j?.orders||[]).map((o:any)=> ({ id:o.id, status:o.status, total:o.total||0, createdAt:o.createdAt })) ); } catch{} })(); }, [apiBase, id]);
  React.useEffect(()=>{
    if (!mapRef.current) return;
    const hasLib = (window as any).maplibregl;
    async function ensure(){
      if (!(window as any).maplibregl) {
        const link = document.createElement('link'); link.rel='stylesheet'; link.href='https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.css'; document.head.appendChild(link);
        await new Promise<void>((resolve)=>{ const s=document.createElement('script'); s.src='https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.js'; s.onload=()=> resolve(); document.body.appendChild(s); });
      }
      if (!mapObjRef.current && (window as any).maplibregl) {
        const maplibregl = (window as any).maplibregl;
        mapObjRef.current = new maplibregl.Map({ container: mapRef.current!, style: 'https://demotiles.maplibre.org/style.json', center: [46.6753,24.7136], zoom: 6 });
      }
      const d = data?.driver; if (d && typeof d.lng==='number' && typeof d.lat==='number' && mapObjRef.current) {
        try {
          const maplibregl = (window as any).maplibregl;
          new maplibregl.Marker().setLngLat([d.lng, d.lat]).addTo(mapObjRef.current);
          mapObjRef.current.easeTo({ center:[d.lng,d.lat], zoom: 11 });
        } catch {}
      }
    }
    ensure();
  }, [data]);
  const d = data?.driver;
  const k = data?.kpis || {};
  const orders: Array<{id:string;status:string;total:number;createdAt:string}> = data?.orders || [];
  async function saveStatus(){
    await fetch(`${apiBase}/api/admin/drivers/${id}`, { method:'PATCH', headers:{ 'content-type': 'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ status: statusSel, isActive: active }) });
    const j = await (await fetch(`${apiBase}/api/admin/drivers/${id}/overview`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' })).json(); setData(j);
  }
  async function assign(){
    if (!assignOrder.trim()) return;
    await fetch(`${apiBase}/api/admin/orders/assign-driver`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ orderId: assignOrder.trim(), driverId: id }) });
    setAssignOrder('');
  }
  return (
    <main className="panel">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <h1 style={{ margin:0 }}>بيانات السائق</h1>
        <a href="/drivers" className="btn btn-outline">رجوع</a>
      </div>
      {!d && (<div style={{ color:'var(--sub)' }}>جارٍ التحميل…</div>)}
      {d && (
        <>
          <div className="grid" style={{ gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
            <div className="panel"><div style={{ color:'var(--sub)' }}>الطلبات المسندة</div><div style={{ fontSize:22 }}>{k.assigned||0}</div></div>
            <div className="panel"><div style={{ color:'var(--sub)' }}>تم التسليم</div><div style={{ fontSize:22 }}>{k.delivered||0}</div></div>
            <div className="panel"><div style={{ color:'var(--sub)' }}>معلّق</div><div style={{ fontSize:22 }}>{k.pending||0}</div></div>
            <div className="panel"><div style={{ color:'var(--sub)' }}>إجمالي المقبوض</div><div style={{ fontSize:22 }}>{k.totalEarned||0}</div></div>
          </div>
          <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="panel">
              <h3 style={{ marginTop:0 }}>معلومات</h3>
              <div style={{ display:'grid', gap:8 }}>
                <div><b>الاسم:</b> {d.name}</div>
                <div><b>الهاتف:</b> {d.phone||'-'}</div>
                <div><b>العنوان:</b> {d.address||'-'}</div>
                <div><b>البطاقة:</b> {d.nationalId||'-'}</div>
                <div><b>نوع المركبة:</b> {d.vehicleType||'-'}</div>
                <div><b>الملكية:</b> {d.ownership==='company'?'ملك الشركة': d.ownership==='driver'?'ملك السائق':'-'}</div>
                <div><b>ملاحظات:</b> {d.notes||'-'}</div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <b>الحالة:</b>
                  <select className="select" value={statusSel} onChange={(e)=> setStatusSel(e.target.value as any)}>
                    <option value="AVAILABLE">متاح</option>
                    <option value="BUSY">قيد التوصيل</option>
                    <option value="OFFLINE">غير متصل</option>
                  </select>
                  <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <input type="checkbox" checked={active} onChange={(e)=> setActive(e.currentTarget.checked)} /> فعّال
                  </label>
                  <button className="btn btn-sm" onClick={saveStatus}>حفظ</button>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input className="input" placeholder="تعيين طلب (رقم)" value={assignOrder} onChange={(e)=> setAssignOrder(e.target.value)} />
                  <button className="btn btn-sm" onClick={assign}>تعيين للسائق</button>
                </div>
              </div>
            </div>
            <div className="panel">
              <h3 style={{ marginTop:0 }}>الموقع</h3>
              <div ref={mapRef} style={{ height:300, background:'#0b0f1a', border:'1px solid var(--muted)', borderRadius:8 }} />
            </div>
          </div>
        <div className="panel" style={{ marginTop:12 }}>
          <h3 style={{ marginTop:0 }}>الطلبات المسندة (أحدث 10)</h3>
          <table className="table">
            <thead><tr><th>المعرف</th><th>الحالة</th><th>الإجمالي</th><th>التاريخ</th><th></th></tr></thead>
            <tbody>
              {orders.length ? orders.map(o => (
                <tr key={o.id}><td>{o.id}</td><td>{o.status}</td><td>${Number(o.total||0).toFixed(2)}</td><td>{String(o.createdAt).slice(0,10)}</td><td><a className="btn btn-sm" href={`/orders/${o.id}`}>عرض</a></td></tr>
              )) : (<tr><td colSpan={5}>لا توجد طلبات</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="panel" style={{ marginTop:12 }}>
          <h3 style={{ marginTop:0 }}>مكتمل مؤخراً</h3>
          <table className="table">
            <thead><tr><th>المعرف</th><th>الإجمالي</th><th>التاريخ</th><th></th></tr></thead>
            <tbody>
              {delivered.length ? delivered.map(o => (
                <tr key={o.id}><td>{o.id}</td><td>${Number(o.total||0).toFixed(2)}</td><td>{String(o.createdAt).slice(0,10)}</td><td><a className="btn btn-sm" href={`/orders/${o.id}`}>عرض</a></td></tr>
              )) : (<tr><td colSpan={4}>لا توجد عمليات تسليم مكتملة</td></tr>)}
            </tbody>
          </table>
        </div>
        </>
      )}
    </main>
  );
}