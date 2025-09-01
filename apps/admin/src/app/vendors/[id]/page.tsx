"use client";
import React from "react";

export default function VendorOverviewPage({ params }: { params: { id: string } }): JSX.Element {
  const { id } = params;
  const [data, setData] = React.useState<any>(null);
  React.useEffect(()=>{ fetch(`/api/admin/vendors/${id}/overview`).then(r=>r.json()).then(setData); },[id]);
  if (!data) return <main>Loading…</main>;
  const { vendor, products, orders, stock } = data;
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>المورد: {vendor.name}</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16 }}>
        <div style={{ padding:12, border:'1px solid #1c2333', borderRadius:8 }}>الكود: {vendor.vendorCode||'-'}</div>
        <div style={{ padding:12, border:'1px solid #1c2333', borderRadius:8 }}>الهاتف: {vendor.phone||'-'}</div>
        <div style={{ padding:12, border:'1px solid #1c2333', borderRadius:8 }}>المخزون الإجمالي: {stock}</div>
        <div style={{ padding:12, border:'1px solid #1c2333', borderRadius:8 }}>الطلبات: {orders.length}</div>
      </div>
      <h2 style={{ margin:'12px 0' }}>منتجات المورد</h2>
      <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:16 }}>
        <thead><tr><th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>#</th><th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>الاسم</th><th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>SKU</th><th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>المخزون</th></tr></thead>
        <tbody>
          {products.map((p:any)=> (
            <tr key={p.id}><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{p.id.slice(0,6)}</td><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{p.name}</td><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{p.sku||'-'}</td><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{p.stockQuantity}</td></tr>
          ))}
        </tbody>
      </table>
      <h2 style={{ margin:'12px 0' }}>طلبات المورد</h2>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>#</th><th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>الحالة</th><th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>الإجمالي</th><th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>التاريخ</th></tr></thead>
        <tbody>
          {orders.map((o:any)=> (
            <tr key={o.id}><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{o.id.slice(0,6)}</td><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{o.status}</td><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{o.total}</td><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{new Date(o.createdAt).toLocaleString()}</td></tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

