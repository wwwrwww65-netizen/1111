"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";

type PoRow = { id:string; vendorId?:string|null; vendorName?:string|null; status:string; total:number; createdAt:string };

export default function PurchaseOrdersPage(): JSX.Element {
  const [query, setQuery] = React.useState("");
  const [rows, setRows] = React.useState<PoRow[]>([]);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [vendorId, setVendorId] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");
  const [vendors, setVendors] = React.useState<Array<{id:string;name:string}>>([]);

  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  async function load() {
    const url = new URL(`${apiBase}/api/admin/pos/list`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));
    setBusy(true);
    const res = await fetch(url.toString(), { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' });
    const json = await res.json();
    setBusy(false);
    setRows(json.pos || []);
    setTotal(json.pagination?.total || 0);
  }

  React.useEffect(()=>{ load(); }, [page, limit]);
  React.useEffect(()=>{ (async ()=>{ try{ const j = await (await fetch(`${apiBase}/api/admin/vendors/list`, { credentials:'include', headers: { ...authHeaders() } })).json(); setVendors(j.vendors||[]);} catch{} })(); }, [apiBase]);

  async function createPo(){
    setCreating(true);
    try{
      const res = await fetch(`${apiBase}/api/admin/pos`, { method:'POST', headers: { 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ vendorId: vendorId||null, notes }) });
      if (res.ok) { setVendorId(''); setNotes(''); await load(); }
    } finally { setCreating(false); }
  }

  return (
    <main className="panel">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <h1 style={{ margin:0 }}>أوامر الشراء (POs)</h1>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={createPo} disabled={creating}>{creating? 'جارٍ الإنشاء…':'إنشاء PO'}</button>
        </div>
      </div>

      <div className="toolbar" style={{ justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div className="search"><input className="input" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="بحث بالرقم/المورد/الحالة" /></div>
          <select className="select" value={vendorId} onChange={(e)=>setVendorId(e.target.value)}>
            <option value="">المورّد (اختياري)</option>
            {vendors.map(v=> (<option key={v.id} value={v.id}>{v.name}</option>))}
          </select>
          <input className="input" placeholder="ملاحظات (اختياري)" value={notes} onChange={(e)=>setNotes(e.target.value)} />
          <button className="btn btn-outline" onClick={()=>{ setPage(1); load(); }}>تطبيق</button>
        </div>
      </div>

      <div style={{ overflowX:'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>رقم PO</th>
              <th>المورّد</th>
              <th>الحالة</th>
              <th>الإجمالي</th>
              <th>تاريخ</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=> (
              <tr key={r.id}>
                <td><a href={`#`}>{r.id}</a></td>
                <td>{r.vendorName||'-'}</td>
                <td><span className={`badge ${r.status==='RECEIVED'?'ok':r.status==='SUBMITTED'?'warn':''}`}>{r.status}</span></td>
                <td>{r.total||0}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <button className="btn btn-md" onClick={async()=>{
                      // Demo add item: first vendor product if any
                      const products = await (await fetch(`${apiBase}/api/admin/products?limit=1`, { credentials:'include', headers: { ...authHeaders() } })).json();
                      const prod = products.products?.[0];
                      await fetch(`${apiBase}/api/admin/pos/${r.id}/items`, { method:'POST', headers: { 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ productId: prod?.id||null, quantity: 1, unitCost: prod?.price||10 }) });
                      await load();
                    }}>إضافة صنف</button>
                    <button className="btn btn-md" onClick={async()=>{ await fetch(`${apiBase}/api/admin/pos/${r.id}/submit`, { method:'POST', headers: { ...authHeaders() }, credentials:'include' }); await load(); }}>إرسال</button>
                    <button className="btn btn-md" onClick={async()=>{ await fetch(`${apiBase}/api/admin/pos/${r.id}/receive`, { method:'POST', headers: { ...authHeaders() }, credentials:'include' }); await load(); }}>استلام</button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={6} style={{ padding:12, color:'var(--sub)' }}>{busy?'جارٍ التحميل…':'لا توجد أوامر شراء'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination" style={{ marginTop:12 }}>
        <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="icon-btn">السابق</button>
        <div style={{ color:'var(--sub)' }}>صفحة {page} من {Math.max(1, Math.ceil(total / limit))}</div>
        <button disabled={(page*limit)>=total} onClick={()=>setPage(p=>p+1)} className="icon-btn">التالي</button>
        <select value={limit} onChange={(e)=>{ setLimit(Number(e.target.value)); setPage(1); }} className="select per-page">
          {[10,20,50].map(n=> (<option key={n} value={n}>{n} / صفحة</option>))}
        </select>
      </div>
    </main>
  );
}

