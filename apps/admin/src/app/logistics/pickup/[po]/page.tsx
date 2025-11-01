"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { resolveApiBase } from '../../../lib/apiBase';

export default function PickupDetailPage(): JSX.Element {
  const params = useParams();
  const poRaw = String(params?.po || '');
  const po = React.useMemo(()=>{ try{ return decodeURIComponent(poRaw); }catch{ return poRaw; } }, [poRaw]); // expected vendorId:orderId
  const [vendorId, orderId] = React.useMemo(()=>{ const idx=po.indexOf(':'); return idx>0? [po.slice(0,idx), po.slice(idx+1)] : ['', po]; }, [po]);
  const apiBase = resolveApiBase();
  const [lines, setLines] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>('');
  const [approved, setApproved] = React.useState<boolean|undefined>(undefined);
  const [leg, setLeg] = React.useState<any>(null);

  React.useEffect(()=>{ (async()=>{
    try{
      setLoading(true);
      const url = new URL(`/api/admin/vendors/${encodeURIComponent(vendorId)}/orders/detail`, apiBase);
      url.searchParams.set('orderId', orderId);
      const j = await (await fetch(url.toString(), { credentials:'include' })).json();
      setLines(j.lines||[]);
      // load pickup leg meta (driver name, acceptance)
      let legObj: any = null;
      try{
        const legRes = await (await fetch(`${apiBase}/api/admin/logistics/pickup/leg?poId=${encodeURIComponent(po)}`, { credentials:'include' })).json();
        legObj = legRes?.leg||null;
      }catch{}
      if (!legObj) {
        // fallback: fetch list and find by po
        try { const list = await (await fetch(`${apiBase}/api/admin/logistics/pickup/list`, { credentials:'include' })).json(); legObj = (list?.pickups||[]).find((x:any)=> String(x.poId)===po) || null; } catch {}
      }
      setLeg(legObj);
    }catch{ setError('تعذر تحميل تفاصيل الطلب'); }
    finally{ setLoading(false); }
  })(); }, [apiBase, vendorId, orderId]);

  async function approve(v: boolean){
    setApproved(v);
    // record audit only (UI acknowledgment); real status flows can be wired later
    try{ await fetch(`/api/admin/vendors/${vendorId}/notifications`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ message: v? `PO ${po} approved by vendor` : `PO ${po} rejected by vendor` }) }); }catch{}
  }

  async function driverDecision(decision: 'accept'|'reject'){
    try{
      await fetch(`${apiBase}/api/admin/logistics/pickup/driver-accept`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ poId: po, decision }) });
      const legRes = await (await fetch(`${apiBase}/api/admin/logistics/pickup/leg?poId=${encodeURIComponent(po)}`, { credentials:'include' })).json();
      setLeg(legRes?.leg||null);
    }catch{}
  }

  return (
    <main className="panel" style={{ padding:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <button className="icon-btn" onClick={()=> history.length>1? history.back() : location.assign('/logistics/pickup')}>رجوع</button>
        <h1 style={{ margin:0 }}>تفاصيل استلام المورد · {po}</h1>
      </div>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {error && <div className="panel" style={{ color:'var(--err)' }}>{error}</div>}
      {!loading && !error && (
        <>
          <div className="panel" style={{ marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ color:'var(--sub)' }}>حالة موافقة المورد</div>
                <div>
                  <span className={`badge ${approved===true? 'ok' : approved===false? 'err':'warn'}`}>{approved===true? 'موافق' : approved===false? 'غير موافق' : 'معلّق'}</span>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-sm" onClick={()=> approve(true)}>موافقة</button>
                <button className="btn btn-sm btn-outline" onClick={()=> approve(false)}>عدم موافقة</button>
              </div>
            </div>
          </div>
          <div className="panel" style={{ marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ color:'var(--sub)' }}>السائق</div>
                <div>{leg?.driverName || '—'}</div>
                <div style={{ color:'var(--sub)', marginTop:6 }}>حالة موافقة السائق</div>
                <div><span className={`badge ${String(leg?.driverAcceptance||'PENDING')==='ACCEPTED'?'ok': (String(leg?.driverAcceptance||'PENDING')==='REJECTED'?'err':'warn')}`}>{leg?.driverAcceptance||'PENDING'}</span></div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-sm" onClick={()=> driverDecision('accept')}>قبول</button>
                <button className="btn btn-sm btn-outline" onClick={()=> driverDecision('reject')}>عدم قبول</button>
              </div>
            </div>
          </div>
          <div className="panel">
            <h3 style={{ marginTop:0 }}>تفاصيل المنتجات</h3>
            <div style={{ overflowX:'auto' }}>
              <table className="table">
                <thead><tr><th>رقم الطلب</th><th>المنتج</th><th>الصورة</th><th>المقاس</th><th>اللون</th><th>الكمية</th></tr></thead>
                <tbody>
                  {lines.map((l:any, idx:number)=> (
                    <tr key={l.productId||idx}>
                      <td>{orderId.slice(0,6)}</td>
                      <td>{l.name}</td>
                      <td><div style={{ width:42, height:42, background:'#0b0e14', borderRadius:6 }} /></td>
                      <td>{l.size||'-'}</td>
                      <td>{l.color||'-'}</td>
                      <td>{l.requestedQty||l.quantity||0}</td>
                    </tr>
                  ))}
                  {!lines.length && (<tr><td colSpan={6} style={{ color:'var(--sub)' }}>لا توجد بيانات</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}


