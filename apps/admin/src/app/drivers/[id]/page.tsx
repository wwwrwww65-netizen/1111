"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";

export default function DriverDetail({ params }: { params: { id: string } }): JSX.Element {
  const { id } = params;
  const [data, setData] = React.useState<any>(null);
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);
  React.useEffect(()=>{ (async ()=>{ try{ const j = await (await fetch(`${apiBase}/api/admin/drivers/${id}/overview`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' })).json(); setData(j); } catch{} })(); }, [apiBase, id]);
  const d = data?.driver;
  const k = data?.kpis || {};
  const orders: Array<{id:string;status:string;total:number;createdAt:string}> = data?.orders || [];
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
                <div><b>الحالة:</b> <span className="badge">{d.status}</span></div>
              </div>
            </div>
            <div className="panel">
              <h3 style={{ marginTop:0 }}>الموقع</h3>
              <div style={{ height:300, background:'#0b0f1a', border:'1px solid var(--muted)', borderRadius:8, display:'grid', placeItems:'center', color:'var(--sub)' }}>
                {d.lat && d.lng ? (
                  <div>الخريطة: ({d.lat}, {d.lng})</div>
                ) : (
                  <div>لا توجد إحداثيات متاحة</div>
                )}
              </div>
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
        </>
      )}
    </main>
  );
}