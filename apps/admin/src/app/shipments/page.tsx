"use client";
import React from 'react';

export default function ShipmentsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const apiBase = React.useMemo(()=>{
    return (process.env.NEXT_PUBLIC_API_BASE_URL as string) || (typeof window !== 'undefined' ? (window.location.origin.replace('jeeey-manger','jeeeyai')) : 'http://localhost:4000');
  }, []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
  }, []);

  React.useEffect(()=>{ (async ()=>{ setBusy(true); const j = await (await fetch(`${apiBase}/api/admin/shipments?page=${page}&limit=20`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' })).json(); setBusy(false); setRows(j.shipments||[]); setTotal(j.pagination?.total||0); })(); },[apiBase, page]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <main className="panel">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <h1 style={{ margin:0 }}>الشحنات</h1>
        <div style={{ display:'flex', gap:8 }}>
          <a className="btn" href={`${apiBase}/api/admin/shipments/export/csv`}>تصدير CSV</a>
        </div>
      </div>

      <div style={{ overflowX:'auto' }}>
        <table className="table">
          <thead><tr>
            <th>Shipment ID</th>
            <th>Order ID</th>
            <th>Carrier/Driver</th>
            <th>Tracking</th>
            <th>Status</th>
            <th>Weight</th>
            <th>Cost</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>
            {rows.map((s:any)=> (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td><a href={`/orders/${s.orderId}`}>{s.orderId}</a></td>
                <td>{s.carrier?.name||s.driver?.name||'-'}</td>
                <td>{s.trackingNumber||'-'}</td>
                <td><span className="badge">{s.status}</span></td>
                <td>{s.weight||'-'}</td>
                <td>{s.cost||'-'}</td>
                <td>
                  <a className="btn" href={`${apiBase}/api/admin/shipments/${s.id}/track`}>Track</a>
                  <a className="btn" href={`${apiBase}/api/admin/shipments/${s.id}/label`} style={{ marginInlineStart:6 }}>Label</a>
                </td>
              </tr>
            ))}
            {!rows.length && (<tr><td colSpan={8} style={{ padding:12, color:'var(--sub)' }}>{busy?'جارٍ التحميل…':'لا توجد نتائج'}</td></tr>)}
          </tbody>
        </table>
      </div>

      <div className="pagination" style={{ marginTop:12 }}>
        <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1,p-1))} className="icon-btn">السابق</button>
        <span style={{ color:'var(--sub)' }}>{page} / {totalPages}</span>
        <button disabled={page>=totalPages} onClick={()=> setPage(p=> Math.min(totalPages,p+1))} className="icon-btn">التالي</button>
      </div>
    </main>
  );
}

