"use client";
import React from 'react';
import { resolveApiBase } from '../../../lib/apiBase';

export default function DriverInboundPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const params = (typeof window !== 'undefined') ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const idFromPath = ((): string => {
    try{
      const parts = (window.location.pathname||'').split('/');
      return decodeURIComponent(parts[parts.length-1]||'');
    }catch{ return '' }
  })();
  const driverId = idFromPath;
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState('');

  React.useEffect(()=>{ (async()=>{
    setLoading(true);
    try{
      const j = await (await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/${encodeURIComponent(driverId)}/items`, { credentials:'include' })).json();
      setRows(j.items||[]);
    } finally { setLoading(false); }
  })(); }, [apiBase, driverId]);

  async function deliverOne(orderItemId: string){
    setMsg('');
    await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/item/deliver`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderItemId, driverId }) });
    const j = await (await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/${encodeURIComponent(driverId)}/items`, { credentials:'include' })).json();
    setRows(j.items||[]); setMsg('تم تسجيل تسليم السائق');
  }
  async function receiveOne(orderItemId: string){
    setMsg('');
    await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/item/receive`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderItemId }) });
    const j = await (await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/${encodeURIComponent(driverId)}/items`, { credentials:'include' })).json();
    setRows(j.items||[]); setMsg('تم تأكيد الاستلام');
  }
  function normalizeImage(u?: string){ try{ const s=String(u||''); if(!s) return ''; if(/^https?:\/\//i.test(s)) return s; const base=(window as any).API_BASE||''; if(s.startsWith('/uploads')) return `${base}${s}`; if(s.startsWith('uploads/')) return `${base}/${s}`; return s; }catch{ return '' } }

  return (
    <main className="panel" style={{ padding:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <button className="icon-btn" onClick={()=> history.length>1? history.back() : location.assign('/logistics/warehouse')}>رجوع</button>
        <h1 style={{ margin:0 }}>استلامات السائق · {driverId.slice(0,6)}</h1>
      </div>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {!loading && (
        <div className="panel">
          <table className="table">
            <thead><tr><th>رقم الطلب</th><th>المنتج</th><th>الصورة</th><th>المقاس</th><th>اللون</th><th>الكمية</th><th>SKU</th><th>إجراءات</th></tr></thead>
            <tbody>
              {rows.length? rows.map((r:any)=> (
                <tr key={r.orderItemId}>
                  <td>{r.orderCode? `#${r.orderCode}`: r.orderId}</td>
                  <td>{r.name||'-'}</td>
                  <td>{r.image? (<img src={normalizeImage(r.image)} style={{ width:42, height:42, objectFit:'cover', borderRadius:6 }} />): (<div style={{ width:42, height:42, background:'#0b0e14', borderRadius:6 }} />)}</td>
                  <td>{r.size||'-'}</td>
                  <td>{r.color||'-'}</td>
                  <td>{r.quantity||0}</td>
                  <td>{r.sku||'-'}</td>
                  <td style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-sm" onClick={()=> deliverOne(r.orderItemId)}>تسليم السائق</button>
                    <button className="btn btn-sm btn-outline" onClick={()=> receiveOne(r.orderItemId)}>تأكيد الاستلام</button>
                  </td>
                </tr>
              )) : (<tr><td colSpan={8} style={{ color:'var(--sub)' }}>لا توجد عناصر</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
      {msg && <div className="text-sm" style={{ color:'#9ae6b4', marginTop:8 }}>{msg}</div>}
    </main>
  );
}
