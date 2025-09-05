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

  return (
    <main className="panel">
      <h1>الشحنات</h1>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <a className="btn" href={`${apiBase}/api/admin/shipments/export/csv`}>تصدير CSV</a>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
          <thead><tr>
            <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>Shipment ID</th>
            <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>Order ID</th>
            <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>Carrier/Driver</th>
            <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>Tracking</th>
            <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>Status</th>
            <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>Weight</th>
            <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>Cost</th>
            <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>Actions</th>
          </tr></thead>
          <tbody>
            {rows.map((s:any, idx:number)=> (
              <tr key={s.id} style={{ background: idx%2? '#0a0e17':'transparent' }}>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{s.id}</td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}><a href={`/orders/${s.orderId}`}>{s.orderId}</a></td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{s.carrier?.name||s.driver?.name||'-'}</td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{s.trackingNumber||'-'}</td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{s.status}</td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{s.weight||'-'}</td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{s.cost||'-'}</td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>
                  <a className="btn" href={`${apiBase}/api/admin/shipments/${s.id}/track`}>Track</a>
                  <a className="btn" href={`${apiBase}/api/admin/shipments/${s.id}/label`} style={{ marginInlineStart:6 }}>Label</a>
                </td>
              </tr>
            ))}
            {!rows.length && (<tr><td colSpan={8} style={{ padding:12, color:'var(--sub)' }}>{busy?'جارٍ التحميل…':'لا توجد نتائج'}</td></tr>)}
          </tbody>
        </table>
      </div>
    </main>
  );
}

