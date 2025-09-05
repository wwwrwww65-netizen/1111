"use client";
import React from 'react';

export default function DriverDetail({ params }: { params: { id: string } }): JSX.Element {
  const { id } = params;
  const [data, setData] = React.useState<any>(null);
  const apiBase = React.useMemo(()=> (process.env.NEXT_PUBLIC_API_BASE_URL as string) || (typeof window !== 'undefined' ? (window.location.origin.replace('jeeey-manger','jeeeyai')) : 'http://localhost:4000'), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
  }, []);
  React.useEffect(()=>{ (async ()=>{ try{ const j = await (await fetch(`${apiBase}/api/admin/drivers/${id}/overview`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' })).json(); setData(j); } catch{} })(); }, [apiBase, id]);
  const d = data?.driver;
  const k = data?.kpis || {};
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
        </>
      )}
    </main>
  );
}