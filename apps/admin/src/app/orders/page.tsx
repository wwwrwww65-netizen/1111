"use client";
import React from "react";

export default function OrdersPage(): JSX.Element {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<string>("");
  const [search, setSearch] = React.useState<string>("");
  const [rows, setRows] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);

  async function load() {
    const url = new URL(window.location.origin + "/api/admin/orders/list");
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", "20");
    if (status) url.searchParams.set("status", status);
    if (search) url.searchParams.set("search", search);
    const res = await fetch(url.toString());
    const json = await res.json();
    setRows(json.orders || []);
    setTotal(json.pagination?.total || 0);
  }

  React.useEffect(() => { load(); }, [page]);

  async function ship(orderId: string) {
    await fetch("/api/admin/orders/ship", { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ orderId }) });
    await load();
  }
  async function refund(orderId: string) {
    await fetch("/api/admin/payments/refund", { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ orderId }) });
    await load();
  }

  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>الطلبات</h1>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <select value={status} onChange={(e)=>setStatus(e.target.value)} style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
          <option value="">الكل</option>
          <option value="PENDING">قيد الانتظار</option>
          <option value="PAID">مدفوع</option>
          <option value="SHIPPED">تم الشحن</option>
          <option value="DELIVERED">تم التسليم</option>
          <option value="CANCELLED">ملغي</option>
        </select>
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالمعرف/البريد" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={()=>{ setPage(1); load(); }} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>بحث</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>#</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الحالة</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>المستخدم</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الإجمالي</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o)=> (
            <tr key={o.id}>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{o.id}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{o.status}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{o.user?.email}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{o.total}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                <button onClick={()=>ship(o.id)} style={{ padding:'6px 10px', background:'#064e3b', color:'#e5e7eb', borderRadius:6, marginInlineEnd:6 }}>شحن</button>
                <button onClick={()=>refund(o.id)} style={{ padding:'6px 10px', background:'#7c2d12', color:'#fff', borderRadius:6 }}>استرداد</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

// legacy placeholder removed

