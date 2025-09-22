"use client";
import React from 'react';
import { resolveApiBase } from "../lib/apiBase";
import { downloadCsv } from "../lib/csv";
import { exportToXlsx, exportToPdf } from "../lib/export";

export default function ReviewsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<string>("");
  const [search, setSearch] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  async function load(){
    const url = new URL(`${apiBase}/api/admin/reviews/list`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', '20');
    if (status) url.searchParams.set('status', status);
    if (search) url.searchParams.set('search', search);
    setBusy(true);
    const j = await (await fetch(url.toString(), { credentials:'include', headers:{ ...authHeaders() }, cache:'no-store' })).json();
    setBusy(false);
    setRows(j.reviews||[]);
  }
  React.useEffect(()=>{ load(); }, [apiBase, page]);

  async function approve(id:string){ await fetch(`${apiBase}/api/admin/reviews/${id}/approve`, { method:'POST', headers:{ ...authHeaders() }, credentials:'include' }); await load(); }
  async function reject(id:string){ await fetch(`${apiBase}/api/admin/reviews/${id}/reject`, { method:'POST', headers:{ ...authHeaders() }, credentials:'include' }); await load(); }
  async function remove(id:string){ await fetch(`${apiBase}/api/admin/reviews/${id}`, { method:'DELETE', headers:{ ...authHeaders() }, credentials:'include' }); await load(); }

  return (
    <main className="panel">
      <h1>المراجعات</h1>
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        <select value={status} onChange={(e)=>setStatus(e.target.value)} style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
          <option value="">الكل</option>
          <option value="approved">مقبول</option>
          <option value="pending">معلق</option>
        </select>
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث في التعليق" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={()=>{ setPage(1); load(); }} className="btn">بحث</button>
        <button className="btn btn-outline" onClick={()=> downloadCsv(`reviews_${new Date().toISOString().slice(0,10)}.csv`, [
          ['product','user','rating','comment','status'],
          ...rows.map((r:any)=> [r.product?.name||'', r.user?.email||r.user?.name||'', r.rating, (r.comment||'').replace(/\n/g,' '), r.isApproved? 'approved':'pending'])
        ])}>CSV</button>
        <button className="btn btn-outline" onClick={()=> exportToXlsx(`reviews_${new Date().toISOString().slice(0,10)}.xlsx`, ['product','user','rating','comment','status'], rows.map((r:any)=> [r.product?.name||'', r.user?.email||r.user?.name||'', r.rating, r.comment||'', r.isApproved? 'approved':'pending']))}>Excel</button>
        <button className="btn btn-outline" onClick={()=> exportToPdf(`reviews_${new Date().toISOString().slice(0,10)}.pdf`, ['product','user','rating','comment','status'], rows.map((r:any)=> [r.product?.name||'', r.user?.email||r.user?.name||'', r.rating, r.comment||'', r.isApproved? 'approved':'pending']))}>PDF</button>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
          <thead>
            <tr>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>المنتج</th>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>المستخدم</th>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>التقييم</th>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>التعليق</th>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>الحالة</th>
              <th style={{ textAlign:'right', padding:10, borderBottom:'1px solid var(--muted)' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r:any, idx:number)=> (
              <tr key={r.id} style={{ background: idx%2? '#0a0e17':'transparent' }}>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{r.product?.name||'-'}</td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{r.user?.email||r.user?.name||'-'}</td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{r.rating}</td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{r.comment||'-'}</td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>{r.isApproved? 'مقبول':'معلق'}</td>
                <td style={{ padding:10, borderBottom:'1px solid var(--muted)' }}>
                  <button className="btn" onClick={()=>approve(r.id)} disabled={r.isApproved}>قبول</button>
                  <button className="btn" onClick={()=>reject(r.id)} style={{ marginInlineStart:6 }} disabled={!r.isApproved}>تعليق</button>
                  <button className="btn" onClick={()=>remove(r.id)} style={{ marginInlineStart:6, background:'#7c2d12', color:'#fff' }}>حذف</button>
                </td>
              </tr>
            ))}
            {!rows.length && (<tr><td colSpan={6} style={{ padding:12, color:'var(--sub)' }}>{busy? 'جارٍ التحميل…' : 'لا توجد مراجعات'}</td></tr>)}
          </tbody>
        </table>
      </div>
    </main>
  );
}

